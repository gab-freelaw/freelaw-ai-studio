import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';

import { ServiceOrder } from '../../shared/entities/service-order.entity';
import { RevisionRequest } from '../../shared/entities/revision-request.entity';
import { Provider } from '../../shared/entities/provider.entity';
import { CreateServiceOrderDto } from './dto/create-service-order.dto';
import { RequestRevisionDto } from './dto/request-revision.dto';
import { ServiceStatus, UrgencyLevel, ProviderProfile } from '../../shared/enums';
import { PricingService } from '../pricing/pricing.service';
import { WalletService } from '../wallet/wallet.service';

@Injectable()
export class ServiceOrdersService {
  constructor(
    @InjectRepository(ServiceOrder)
    private serviceOrderRepository: Repository<ServiceOrder>,
    
    @InjectRepository(RevisionRequest)
    private revisionRepository: Repository<RevisionRequest>,
    
    @InjectRepository(Provider)
    private providerRepository: Repository<Provider>,
    
    private pricingService: PricingService,
    private walletService: WalletService,
    private eventEmitter: EventEmitter2,
  ) {}

  async create(contractorId: string, createOrderDto: CreateServiceOrderDto) {
    // Calcular preço baseado nos fatores
    const pricing = await this.pricingService.calculatePrice({
      serviceType: createOrderDto.type,
      legalArea: createOrderDto.legalArea,
      urgencyLevel: createOrderDto.urgency || UrgencyLevel.NORMAL,
      contractorPlan: createOrderDto.contractorPlan,
      providerProfile: ProviderProfile.ADJUSTMENT, // Perfil médio para cálculo inicial
      complexityMultiplier: createOrderDto.complexityMultiplier,
    });

    // Calcular deadline baseado na urgência
    const estimatedDelivery = this.calculateDeadline(createOrderDto.urgency || UrgencyLevel.NORMAL);

    // Criar ordem
    const order = this.serviceOrderRepository.create({
      ...createOrderDto,
      contractorId,
      urgency: createOrderDto.urgency || UrgencyLevel.NORMAL,
      status: ServiceStatus.PENDING_MATCH,
      basePrice: pricing.basePrice,
      finalPrice: pricing.finalPrice,
      providerAmount: pricing.providerAmount,
      estimatedDelivery,
    });

    const savedOrder = await this.serviceOrderRepository.save(order);

    // Emitir evento para matching
    this.eventEmitter.emit('service-order.created', savedOrder);

    return {
      message: 'Ordem de serviço criada com sucesso',
      order: {
        id: savedOrder.id,
        title: savedOrder.title,
        type: savedOrder.type,
        legalArea: savedOrder.legalArea,
        urgency: savedOrder.urgency,
        status: savedOrder.status,
        providerAmount: Number(savedOrder.providerAmount),
        estimatedDelivery: savedOrder.estimatedDelivery,
      },
      pricing: {
        breakdown: pricing.breakdown,
        appliedRule: pricing.appliedRule,
      },
    };
  }

  async findAll(contractorId: string, filters: {
    status?: string;
    limit: number;
    offset: number;
  }) {
    const queryBuilder = this.serviceOrderRepository
      .createQueryBuilder('order')
      .leftJoinAndSelect('order.provider', 'provider')
      .where('order.contractorId = :contractorId', { contractorId });

    if (filters.status) {
      queryBuilder.andWhere('order.status = :status', { status: filters.status });
    }

    const [orders, total] = await queryBuilder
      .orderBy('order.createdAt', 'DESC')
      .take(filters.limit)
      .skip(filters.offset)
      .getManyAndCount();

    return {
      orders: orders.map(order => ({
        id: order.id,
        title: order.title,
        type: order.type,
        legalArea: order.legalArea,
        urgency: order.urgency,
        status: order.status,
        providerAmount: Number(order.providerAmount),
        estimatedDelivery: order.estimatedDelivery,
        deliveredAt: order.deliveredAt,
        provider: order.provider ? {
          id: order.provider.id,
          fullName: order.provider.fullName,
          profile: order.provider.profile,
          averageRating: Number(order.provider.averageRating),
        } : null,
        createdAt: order.createdAt,
        isOverdue: order.isOverdue,
        daysSinceCreated: order.daysSinceCreated,
      })),
      total,
      hasMore: filters.offset + filters.limit < total,
    };
  }

  async findOne(id: string, contractorId: string) {
    const order = await this.serviceOrderRepository.findOne({
      where: { id, contractorId },
      relations: ['provider', 'revisionRequests'],
    });

    if (!order) {
      throw new NotFoundException('Ordem de serviço não encontrada');
    }

    return {
      id: order.id,
      title: order.title,
      description: order.description,
      type: order.type,
      legalArea: order.legalArea,
      urgency: order.urgency,
      status: order.status,
      basePrice: Number(order.basePrice),
      finalPrice: Number(order.finalPrice),
      providerAmount: Number(order.providerAmount),
      estimatedDelivery: order.estimatedDelivery,
      deliveredAt: order.deliveredAt,
      completedAt: order.completedAt,
      attachments: order.attachments,
      finalDocument: order.finalDocument,
      rating: order.rating,
      ratingFeedback: order.ratingFeedback,
      revisionCount: order.revisionCount,
      provider: order.provider ? {
        id: order.provider.id,
        fullName: order.provider.fullName,
        profile: order.provider.profile,
        averageRating: Number(order.provider.averageRating),
        isVerified: order.provider.isVerified,
      } : null,
      revisions: order.revisionRequests?.map(rev => ({
        id: rev.id,
        revisionNumber: rev.revisionNumber,
        reason: rev.reason,
        detailedFeedback: rev.detailedFeedback,
        deadline: rev.deadline,
        isCompleted: rev.isCompleted,
        completedAt: rev.completedAt,
        createdAt: rev.createdAt,
        isOverdue: rev.isOverdue,
        hoursRemaining: rev.hoursRemaining,
      })) || [],
      canRequestRevision: order.canRequestRevision,
      isOverdue: order.isOverdue,
      createdAt: order.createdAt,
    };
  }

  async approve(id: string, contractorId: string, rating?: number, feedback?: string) {
    const order = await this.serviceOrderRepository.findOne({
      where: { id, contractorId, status: ServiceStatus.DELIVERED },
      relations: ['provider'],
    });

    if (!order) {
      throw new NotFoundException('Ordem não encontrada ou não está entregue');
    }

    // Atualizar ordem
    order.status = ServiceStatus.COMPLETED;
    order.completedAt = new Date();
    if (rating) order.rating = rating;
    if (feedback) order.ratingFeedback = feedback;

    await this.serviceOrderRepository.save(order);

    // Adicionar crédito na carteira do prestador
    if (order.providerId) {
      await this.walletService.addCredit(
        order.providerId,
        Number(order.providerAmount),
        order.id,
        `Pagamento por serviço: ${order.title}`,
      );
    }

    // Atualizar estatísticas do prestador
    if (order.provider) {
      order.provider.servicesCompleted += 1;
      order.provider.totalServices += 1;
      
      // Recalcular média de avaliações
      if (rating) {
        const totalRating = (Number(order.provider.averageRating) * (order.provider.servicesCompleted - 1)) + rating;
        order.provider.averageRating = Number((totalRating / order.provider.servicesCompleted).toFixed(2));
      }
      
      await this.providerRepository.save(order.provider);
    }

    // Emitir evento
    this.eventEmitter.emit('service-order.completed', order);

    return {
      message: 'Trabalho aprovado com sucesso',
      order: {
        id: order.id,
        status: order.status,
        completedAt: order.completedAt,
        providerAmount: Number(order.providerAmount),
      },
    };
  }

  async requestRevision(id: string, contractorId: string, revisionDto: RequestRevisionDto) {
    const order = await this.serviceOrderRepository.findOne({
      where: { id, contractorId },
      relations: ['revisionRequests'],
    });

    if (!order) {
      throw new NotFoundException('Ordem de serviço não encontrada');
    }

    if (!order.canRequestRevision) {
      throw new BadRequestException('Não é possível solicitar mais correções para esta ordem');
    }

    // Criar solicitação de correção
    const revisionNumber = order.revisionCount + 1;
    const deadline = RevisionRequest.calculateDeadline();

    const revision = this.revisionRepository.create({
      serviceOrderId: order.id,
      requestedBy: contractorId,
      revisionNumber,
      reason: revisionDto.reason,
      detailedFeedback: revisionDto.detailedFeedback,
      attachments: revisionDto.attachments || [],
      deadline,
    });

    await this.revisionRepository.save(revision);

    // Atualizar ordem
    order.status = ServiceStatus.REVISION_REQUESTED;
    order.revisionCount = revisionNumber;
    await this.serviceOrderRepository.save(order);

    // Emitir evento para notificar prestador
    this.eventEmitter.emit('revision.requested', { order, revision });

    return {
      message: 'Correção solicitada com sucesso',
      revision: {
        id: revision.id,
        revisionNumber: revision.revisionNumber,
        deadline: revision.deadline,
        hoursRemaining: revision.hoursRemaining,
      },
    };
  }

  async cancel(id: string, contractorId: string, reason: string) {
    const order = await this.serviceOrderRepository.findOne({
      where: { id, contractorId },
    });

    if (!order) {
      throw new NotFoundException('Ordem de serviço não encontrada');
    }

    if ([ServiceStatus.COMPLETED, ServiceStatus.CANCELLED].includes(order.status)) {
      throw new BadRequestException('Não é possível cancelar esta ordem');
    }

    order.status = ServiceStatus.CANCELLED;
    order.description += `\n\nCancelado em ${new Date().toLocaleString('pt-BR')}: ${reason}`;
    
    await this.serviceOrderRepository.save(order);

    // Emitir evento
    this.eventEmitter.emit('service-order.cancelled', { order, reason });

    return {
      message: 'Ordem cancelada com sucesso',
      order: {
        id: order.id,
        status: order.status,
      },
    };
  }

  async getRevisions(id: string, contractorId: string) {
    const order = await this.serviceOrderRepository.findOne({
      where: { id, contractorId },
      relations: ['revisionRequests'],
    });

    if (!order) {
      throw new NotFoundException('Ordem de serviço não encontrada');
    }

    return {
      orderId: order.id,
      revisions: order.revisionRequests?.map(rev => ({
        id: rev.id,
        revisionNumber: rev.revisionNumber,
        reason: rev.reason,
        detailedFeedback: rev.detailedFeedback,
        attachments: rev.attachments,
        deadline: rev.deadline,
        isCompleted: rev.isCompleted,
        completedAt: rev.completedAt,
        providerResponse: rev.providerResponse,
        changesMade: rev.changesMade,
        createdAt: rev.createdAt,
        isOverdue: rev.isOverdue,
        hoursRemaining: rev.hoursRemaining,
      })) || [],
    };
  }

  private calculateDeadline(urgency: UrgencyLevel): Date {
    const deadline = new Date();
    
    switch (urgency) {
      case UrgencyLevel.SUPER_URGENT:
        deadline.setHours(deadline.getHours() + 24);
        break;
      case UrgencyLevel.URGENT:
        deadline.setDate(deadline.getDate() + 3);
        break;
      case UrgencyLevel.NORMAL:
      default:
        deadline.setDate(deadline.getDate() + 7);
        break;
    }
    
    return deadline;
  }
}
