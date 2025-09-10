import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { PricingRule } from './entities/pricing-rule.entity';
import { CalculatePriceDto } from './dto/calculate-price.dto';
import {
  ServiceType,
  LegalArea,
  UrgencyLevel,
  ContractorPlan,
  ProviderProfile,
} from '../../shared/enums';

export interface PricingResult {
  basePrice: number;
  finalPrice: number;
  providerAmount: number; // Prestador recebe 100% do valor calculado
  appliedRule: {
    id: string;
    name: string;
    description?: string;
  };
  breakdown: {
    urgencyMultiplier: number;
    complexityMultiplier: number;
    providerMultiplier: number;
    planMultiplier: number;
  };
}

@Injectable()
export class PricingService {
  constructor(
    @InjectRepository(PricingRule)
    private pricingRuleRepository: Repository<PricingRule>,
  ) {}

  async calculatePrice(calculateDto: CalculatePriceDto): Promise<PricingResult> {
    // Buscar regra mais específica que se aplica
    const rule = await this.findBestMatchingRule(calculateDto);

    if (!rule) {
      throw new NotFoundException('Nenhuma regra de precificação encontrada para os critérios informados');
    }

    // Obter multiplicadores baseados nos fatores
    const breakdown = this.getMultipliers(calculateDto);

    // Calcular preço usando a regra
    const pricing = rule.calculatePrice(breakdown);

    return {
      ...pricing,
      appliedRule: {
        id: rule.id,
        name: rule.name,
        description: rule.description,
      },
      breakdown,
    };
  }

  private async findBestMatchingRule(criteria: CalculatePriceDto): Promise<PricingRule | null> {
    // Buscar regras que se aplicam aos critérios, ordenadas por prioridade e especificidade
    const query = this.pricingRuleRepository.createQueryBuilder('rule')
      .where('rule.isActive = :isActive', { isActive: true });

    // Adicionar condições opcionais (null = aplica a todos)
    query.andWhere('(rule.serviceType IS NULL OR rule.serviceType = :serviceType)', 
      { serviceType: criteria.serviceType });
    
    query.andWhere('(rule.legalArea IS NULL OR rule.legalArea = :legalArea)', 
      { legalArea: criteria.legalArea });
    
    query.andWhere('(rule.urgencyLevel IS NULL OR rule.urgencyLevel = :urgencyLevel)', 
      { urgencyLevel: criteria.urgencyLevel });
    
    query.andWhere('(rule.contractorPlan IS NULL OR rule.contractorPlan = :contractorPlan)', 
      { contractorPlan: criteria.contractorPlan });
    
    query.andWhere('(rule.providerProfile IS NULL OR rule.providerProfile = :providerProfile)', 
      { providerProfile: criteria.providerProfile });

    // Ordenar por especificidade (regras mais específicas primeiro) e prioridade
    query.orderBy('rule.priority', 'DESC')
      .addOrderBy('rule.createdAt', 'DESC');

    const rules = await query.getMany();

    // Retornar a regra mais específica
    return rules.length > 0 ? rules[0] : null;
  }

  private getMultipliers(criteria: CalculatePriceDto) {
    // Multiplicadores de urgência
    const urgencyMultipliers = {
      [UrgencyLevel.NORMAL]: 1.0,
      [UrgencyLevel.URGENT]: 1.5,
      [UrgencyLevel.SUPER_URGENT]: 2.0,
    };

    // Multiplicadores de perfil do prestador
    const providerMultipliers = {
      [ProviderProfile.CALIBRATION]: 0.8,
      [ProviderProfile.RESTRICTED]: 0.9,
      [ProviderProfile.ADJUSTMENT]: 1.0,
      [ProviderProfile.ELITE]: 1.2,
    };

    // Multiplicadores de plano do contratante
    const planMultipliers = {
      [ContractorPlan.STARTER]: 1.0,
      [ContractorPlan.PROFESSIONAL]: 1.1,
      [ContractorPlan.ENTERPRISE]: 1.3,
    };

    return {
      urgencyMultiplier: urgencyMultipliers[criteria.urgencyLevel] || 1.0,
      complexityMultiplier: criteria.complexityMultiplier || 1.0,
      providerMultiplier: providerMultipliers[criteria.providerProfile] || 1.0,
      planMultiplier: planMultipliers[criteria.contractorPlan] || 1.0,
    };
  }

  // Métodos administrativos para gerenciar regras
  async createPricingRule(ruleData: Partial<PricingRule>): Promise<PricingRule> {
    const rule = this.pricingRuleRepository.create(ruleData);
    return this.pricingRuleRepository.save(rule);
  }

  async updatePricingRule(id: string, updates: Partial<PricingRule>): Promise<PricingRule> {
    await this.pricingRuleRepository.update(id, updates);
    const rule = await this.pricingRuleRepository.findOne({ where: { id } });
    
    if (!rule) {
      throw new NotFoundException('Regra de precificação não encontrada');
    }
    
    return rule;
  }

  async getAllPricingRules(): Promise<PricingRule[]> {
    return this.pricingRuleRepository.find({
      order: { priority: 'DESC', createdAt: 'DESC' },
    });
  }

  async deletePricingRule(id: string): Promise<void> {
    const result = await this.pricingRuleRepository.delete(id);
    
    if (result.affected === 0) {
      throw new NotFoundException('Regra de precificação não encontrada');
    }
  }

  // Método para inicializar regras padrão
  async seedDefaultRules(): Promise<void> {
    const existingRules = await this.pricingRuleRepository.count();
    
    if (existingRules > 0) {
      return; // Já existem regras
    }

    const defaultRules = [
      // Petições
      {
        name: 'Petição Simples - Cível',
        serviceType: ServiceType.PETITION,
        legalArea: LegalArea.CIVIL,
        basePrice: 200,
        urgencyMultiplier: 1.0,
        complexityMultiplier: 1.0,
        priority: 10,
      },
      {
        name: 'Petição Complexa - Trabalhista',
        serviceType: ServiceType.PETITION,
        legalArea: LegalArea.LABOR,
        basePrice: 400,
        urgencyMultiplier: 1.0,
        complexityMultiplier: 1.5,
        priority: 10,
      },
      // Contratos
      {
        name: 'Contrato Padrão',
        serviceType: ServiceType.CONTRACT,
        basePrice: 300,
        urgencyMultiplier: 1.0,
        complexityMultiplier: 1.0,
        priority: 5,
      },
      // Pareceres
      {
        name: 'Parecer Jurídico',
        serviceType: ServiceType.OPINION,
        basePrice: 500,
        urgencyMultiplier: 1.0,
        complexityMultiplier: 1.2,
        priority: 5,
      },
      // Audiências
      {
        name: 'Audiência Presencial',
        serviceType: ServiceType.HEARING,
        basePrice: 800,
        urgencyMultiplier: 1.0,
        complexityMultiplier: 1.0,
        priority: 10,
      },
    ];

    for (const ruleData of defaultRules) {
      await this.createPricingRule(ruleData);
    }
  }
}
