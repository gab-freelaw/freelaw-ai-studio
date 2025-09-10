import { IsString, IsOptional, IsArray } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RequestRevisionDto {
  @ApiProperty({ description: 'Motivo da correção' })
  @IsString()
  reason: string;

  @ApiProperty({ description: 'Feedback detalhado sobre o que precisa ser corrigido' })
  @IsString()
  detailedFeedback: string;

  @ApiProperty({ description: 'Documentos de referência', type: [String], required: false })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  attachments?: string[];
}

