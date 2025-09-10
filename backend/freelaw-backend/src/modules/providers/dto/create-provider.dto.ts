import { IsString, IsEmail, IsArray, IsOptional, IsNumber, IsBoolean, Min, Max } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateProviderDto {
  @ApiProperty({ description: 'Nome completo do prestador' })
  @IsString()
  fullName: string;

  @ApiProperty({ description: 'Email do prestador' })
  @IsEmail()
  email: string;

  @ApiProperty({ description: 'Número da OAB' })
  @IsString()
  oabNumber: string;

  @ApiProperty({ description: 'Estado da OAB (UF)' })
  @IsString()
  oabState: string;

  @ApiProperty({ description: 'Anos de experiência', minimum: 0, maximum: 50 })
  @IsNumber()
  @Min(0)
  @Max(50)
  yearsExperience: number;

  @ApiProperty({ description: 'Especialidades jurídicas', type: [String] })
  @IsArray()
  @IsString({ each: true })
  specialties: string[];

  @ApiProperty({ description: 'Resumo da experiência profissional', required: false })
  @IsOptional()
  @IsString()
  summary?: string;

  @ApiProperty({ description: 'Universidade de formação', required: false })
  @IsOptional()
  @IsString()
  university?: string;

  @ApiProperty({ description: 'Ano de conclusão', required: false })
  @IsOptional()
  @IsNumber()
  @Min(1950)
  @Max(new Date().getFullYear())
  completionYear?: number;

  @ApiProperty({ description: 'Disponibilidade semanal em horas', minimum: 5, maximum: 60 })
  @IsNumber()
  @Min(5)
  @Max(60)
  weeklyAvailability: number;

  @ApiProperty({ description: 'Dias da semana disponíveis', type: [String] })
  @IsArray()
  @IsString({ each: true })
  availabilityDays: string[];

  @ApiProperty({ description: 'Disponível para trabalhar em feriados', required: false })
  @IsOptional()
  @IsBoolean()
  workOnHolidays?: boolean;

  @ApiProperty({ description: 'Interesse em alto volume', required: false })
  @IsOptional()
  @IsBoolean()
  highVolume?: boolean;
}

