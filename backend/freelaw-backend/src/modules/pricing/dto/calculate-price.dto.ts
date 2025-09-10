import { IsEnum, IsOptional, IsNumber, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import {
  ServiceType,
  LegalArea,
  UrgencyLevel,
  ContractorPlan,
  ProviderProfile,
} from '../../../shared/enums';

export class CalculatePriceDto {
  @ApiProperty({ enum: ServiceType, description: 'Tipo do serviço' })
  @IsEnum(ServiceType)
  serviceType: ServiceType;

  @ApiProperty({ enum: LegalArea, description: 'Área do direito' })
  @IsEnum(LegalArea)
  legalArea: LegalArea;

  @ApiProperty({ enum: UrgencyLevel, description: 'Nível de urgência' })
  @IsEnum(UrgencyLevel)
  urgencyLevel: UrgencyLevel;

  @ApiProperty({ enum: ContractorPlan, description: 'Plano do contratante' })
  @IsEnum(ContractorPlan)
  contractorPlan: ContractorPlan;

  @ApiProperty({ enum: ProviderProfile, description: 'Perfil do prestador' })
  @IsEnum(ProviderProfile)
  providerProfile: ProviderProfile;

  @ApiProperty({ description: 'Multiplicador de complexidade', required: false, minimum: 0.5 })
  @IsOptional()
  @IsNumber()
  @Min(0.5)
  complexityMultiplier?: number;

  @ApiProperty({ description: 'Horas estimadas para o serviço', required: false })
  @IsOptional()
  @IsNumber()
  @Min(1)
  estimatedHours?: number;
}

