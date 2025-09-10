import { IsString, IsEnum, IsOptional, IsArray, IsDateString, IsNumber, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { ServiceType, LegalArea, UrgencyLevel, ContractorPlan } from '../../../shared/enums';

export class CreateServiceOrderDto {
  @ApiProperty({ description: 'Título da ordem de serviço' })
  @IsString()
  title: string;

  @ApiProperty({ description: 'Descrição detalhada do serviço' })
  @IsString()
  description: string;

  @ApiProperty({ enum: ServiceType, description: 'Tipo do serviço' })
  @IsEnum(ServiceType)
  type: ServiceType;

  @ApiProperty({ enum: LegalArea, description: 'Área do direito' })
  @IsEnum(LegalArea)
  legalArea: LegalArea;

  @ApiProperty({ enum: UrgencyLevel, description: 'Nível de urgência', required: false })
  @IsOptional()
  @IsEnum(UrgencyLevel)
  urgency?: UrgencyLevel;

  @ApiProperty({ enum: ContractorPlan, description: 'Plano do contratante' })
  @IsEnum(ContractorPlan)
  contractorPlan: ContractorPlan;

  @ApiProperty({ description: 'Data limite para entrega', required: false })
  @IsOptional()
  @IsDateString()
  estimatedDelivery?: string;

  @ApiProperty({ description: 'Anexos/documentos', type: [String], required: false })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  attachments?: string[];

  @ApiProperty({ description: 'Multiplicador de complexidade', required: false, minimum: 0.5, maximum: 3 })
  @IsOptional()
  @IsNumber()
  @Min(0.5)
  complexityMultiplier?: number;

  @ApiProperty({ description: 'Horas estimadas', required: false, minimum: 1 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  estimatedHours?: number;
}

