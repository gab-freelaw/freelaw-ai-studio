import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Provider } from '../../shared/entities/provider.entity';
import { PerformanceMetrics } from '../../shared/entities/performance-metrics.entity';
import { ServiceOrder } from '../../shared/entities/service-order.entity';
import { CreateProviderDto } from './dto/create-provider.dto';
import { UpdateProviderDto } from './dto/update-provider.dto';
import { ProviderProfile, ServiceStatus } from '../../shared/enums';

@Injectable()
export class ProvidersService {
  constructor(
    @InjectRepository(Provider)
    private providerRepository: Repository<Provider>,
    
    @InjectRepository(PerformanceMetrics)
    private performanceRepository: Repository<PerformanceMetrics>,
    
    @InjectRepository(ServiceOrder)
    private serviceOrderRepository: Repository<ServiceOrder>,
  ) {}

  async apply(userId: string, createProviderDto: CreateProviderDto) {
    // Verificar se já existe
    const existingProvider = await this.providerRepository.findOne({
      where: { userId },
    });

    if (existingProvider) {
      throw new BadRequestException('Prestador já cadastrado para este usuário');
    }

    // Criar prestador
    const provider = this.providerRepository.create({
      userId,
      ...createProviderDto,
      profile: ProviderProfile.CALIBRATION,
      isActive: true,
    });

    const savedProvider = await this.providerRepository.save(provider);

    // Criar métricas de performance
    const performanceMetrics = this.performanceRepository.create({
      providerId: savedProvider.id,
      lastCalculatedAt: new Date(),
    });
    await this.performanceRepository.save(performanceMetrics);

    return {
      message: 'Aplicação enviada com sucesso',
      providerId: savedProvider.id,
      status: 'pending_evaluation',
    };
  }

  async getProfile(userId: string) {
    const provider = await this.providerRepository.findOne({
      where: { userId },
      relations: ['performanceMetrics', 'wallet'],
    });

    if (!provider) {
      throw new NotFoundException('Prestador não encontrado');
    }

    return {
      id: provider.id,
      fullName: provider.fullName,
      email: provider.email,
      oabNumber: provider.oabNumber,
      oabState: provider.oabState,
      profile: provider.profile,
      yearsExperience: provider.yearsExperience,
      specialties: provider.specialties,
      summary: provider.summary,
      university: provider.university,
      completionYear: provider.completionYear,
      isVerified: provider.isVerified,
      isPartner: provider.isPartner,
      highVolume: provider.highVolume,
      averageRating: Number(provider.averageRating),
      totalServices: provider.totalServices,
      servicesCompleted: provider.servicesCompleted,
      weeklyAvailability: provider.weeklyAvailability,
      availabilityDays: provider.availabilityDays,
      workOnHolidays: provider.workOnHolidays,
      maxConcurrentServices: provider.maxConcurrentServices,
      canAcceptNewService: provider.canAcceptNewService,
      createdAt: provider.createdAt,
    };
  }

  async updateProfile(userId: string, updateProviderDto: UpdateProviderDto) {
    const provider = await this.providerRepository.findOne({
      where: { userId },
    });

    if (!provider) {
      throw new NotFoundException('Prestador não encontrado');
    }

    Object.assign(provider, updateProviderDto);
    const updatedProvider = await this.providerRepository.save(provider);

    return {
      message: 'Perfil atualizado com sucesso',
      provider: updatedProvider,
    };
  }

  async getDashboard(userId: string) {
    const provider = await this.providerRepository.findOne({
      where: { userId },
      relations: ['performanceMetrics', 'wallet'],
    });

    if (!provider) {
      throw new NotFoundException('Prestador não encontrado');
    }

    // Buscar serviços ativos
    const activeServices = await this.serviceOrderRepository.count({
      where: {
        providerId: provider.id,
        status: ServiceStatus.IN_PROGRESS,
      },
    });

    // Buscar serviços do mês
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const monthlyServices = await this.serviceOrderRepository.count({
      where: {
        providerId: provider.id,
        status: ServiceStatus.COMPLETED,
        completedAt: new Date() >= startOfMonth ? undefined : startOfMonth,
      },
    });

    // Calcular ganhos do mês
    const monthlyEarnings = await this.serviceOrderRepository
      .createQueryBuilder('order')
      .select('SUM(order.providerAmount)', 'total')
      .where('order.providerId = :providerId', { providerId: provider.id })
      .andWhere('order.status = :status', { status: ServiceStatus.COMPLETED })
      .andWhere('order.completedAt >= :startOfMonth', { startOfMonth })
      .getRawOne();

    return {
      provider: {
        id: provider.id,
        name: provider.fullName,
        profile: provider.profile,
        averageRating: Number(provider.averageRating),
        isVerified: provider.isVerified,
        maxConcurrentServices: provider.maxConcurrentServices,
      },
      performance: provider.performanceMetrics ? {
        classification: provider.performanceMetrics.classification,
        performanceRate: Number(provider.performanceMetrics.performanceRate),
        isSuperLawyer: provider.performanceMetrics.isSuperLawyer,
        needsRecovery: provider.performanceMetrics.needsRecovery,
        servicesCompleted30d: provider.performanceMetrics.servicesCompleted30d,
      } : null,
      currentMonth: {
        servicesActive: activeServices,
        servicesCompleted: monthlyServices,
        earnings: Number(monthlyEarnings?.total || 0),
      },
      wallet: provider.wallet ? {
        balance: Number(provider.wallet.balance),
        totalEarned: Number(provider.wallet.totalEarned),
      } : null,
    };
  }

  async startEvaluation(userId: string) {
    const provider = await this.providerRepository.findOne({
      where: { userId },
    });

    if (!provider) {
      throw new NotFoundException('Prestador não encontrado');
    }

    // Simular criação de avaliação
    const evaluationId = `eval_${Date.now()}`;
    
    return {
      evaluationId,
      testPieces: [
        {
          id: 'piece_1',
          title: 'Petição Inicial - Ação de Cobrança',
          description: 'Elabore uma petição inicial para ação de cobrança',
          context: 'Cliente possui crédito em aberto de R$ 15.000,00',
          requirements: ['Fundamentação jurídica', 'Pedidos claros', 'Valor da causa'],
          expectedLength: 3,
          legalArea: 'civil',
        },
        {
          id: 'piece_2',
          title: 'Recurso de Apelação',
          description: 'Elabore recurso contra sentença desfavorável',
          context: 'Sentença julgou improcedente pedido de indenização',
          requirements: ['Razões recursais', 'Jurisprudência', 'Pedido de reforma'],
          expectedLength: 5,
          legalArea: 'civil',
        },
      ],
    };
  }

  async submitEvaluation(userId: string, evaluationId: string, pieces: any[]) {
    const provider = await this.providerRepository.findOne({
      where: { userId },
    });

    if (!provider) {
      throw new NotFoundException('Prestador não encontrado');
    }

    // Simular avaliação por IA
    const mockEvaluation = {
      scores: {
        technical_score: 85,
        argumentation_score: 78,
        formatting_score: 92,
        overall_score: 85,
      },
      feedback: 'Excelente trabalho técnico. Argumentação sólida e formatação impecável.',
      suggestions: {
        strengths: ['Fundamentação jurídica consistente', 'Formatação profissional'],
        improvements: ['Ampliar jurisprudência citada'],
        recommendations: ['Revisar aspectos processuais'],
      },
      approved: true,
    };

    // Atualizar status do prestador se aprovado
    if (mockEvaluation.approved) {
      provider.profile = ProviderProfile.ADJUSTMENT;
      await this.providerRepository.save(provider);
    }

    return {
      evaluationId,
      result: mockEvaluation,
      message: mockEvaluation.approved ? 
        'Parabéns! Você foi aprovado na avaliação.' : 
        'Avaliação não aprovada. Revise os pontos de melhoria.',
    };
  }

  async getAvailableWork(providerId: string, limit: number, offset: number) {
    // Buscar serviços disponíveis para o prestador
    const orders = await this.serviceOrderRepository.find({
      where: {
        status: ServiceStatus.PENDING_MATCH,
        providerId: undefined, // Sem prestador atribuído
      },
      order: { createdAt: 'DESC' },
      take: limit,
      skip: offset,
    });

    return {
      orders: orders.map(order => ({
        id: order.id,
        title: order.title,
        description: order.description,
        type: order.type,
        legalArea: order.legalArea,
        urgency: order.urgency,
        estimatedDelivery: order.estimatedDelivery,
        providerAmount: Number(order.providerAmount),
        createdAt: order.createdAt,
      })),
      total: orders.length,
      hasMore: orders.length === limit,
    };
  }

  async acceptWork(providerId: string, orderId: string) {
    const order = await this.serviceOrderRepository.findOne({
      where: { id: orderId, status: ServiceStatus.PENDING_MATCH },
    });

    if (!order) {
      throw new NotFoundException('Ordem de serviço não encontrada ou já atribuída');
    }

    const provider = await this.providerRepository.findOne({
      where: { id: providerId },
    });

    if (!provider) {
      throw new NotFoundException('Prestador não encontrado');
    }

    // Verificar se pode aceitar mais serviços
    const activeServices = await this.serviceOrderRepository.count({
      where: {
        providerId,
        status: ServiceStatus.IN_PROGRESS,
      },
    });

    if (activeServices >= provider.maxConcurrentServices) {
      throw new BadRequestException(
        `Você atingiu o limite de ${provider.maxConcurrentServices} serviços simultâneos`
      );
    }

    // Atribuir serviço
    order.providerId = providerId;
    order.status = ServiceStatus.MATCHED;
    order.matchedAt = new Date();
    
    await this.serviceOrderRepository.save(order);

    return {
      message: 'Trabalho aceito com sucesso',
      order: {
        id: order.id,
        title: order.title,
        providerAmount: Number(order.providerAmount),
        estimatedDelivery: order.estimatedDelivery,
      },
    };
  }

  async submitWork(providerId: string, orderId: string, document: string, notes?: string) {
    const order = await this.serviceOrderRepository.findOne({
      where: { 
        id: orderId, 
        providerId,
        status: ServiceStatus.IN_PROGRESS,
      },
    });

    if (!order) {
      throw new NotFoundException('Ordem de serviço não encontrada ou não está em progresso');
    }

    // Submeter trabalho
    order.finalDocument = document;
    order.status = ServiceStatus.DELIVERED;
    order.deliveredAt = new Date();
    
    if (notes) {
      order.description += `\n\nObservações do prestador: ${notes}`;
    }

    await this.serviceOrderRepository.save(order);

    return {
      message: 'Trabalho submetido com sucesso',
      order: {
        id: order.id,
        title: order.title,
        deliveredAt: order.deliveredAt,
        status: order.status,
      },
    };
  }
}
