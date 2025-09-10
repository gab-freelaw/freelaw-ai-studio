import { IsNumber, IsEnum, IsOptional, IsString, Min, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { PaymentMethod } from '../../../shared/enums';

export class WithdrawalRequestDto {
  @ApiProperty({ description: 'Valor a ser sacado', minimum: 1 })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(1, { message: 'Valor mínimo para saque é R$ 1,00' })
  amount: number;

  @ApiProperty({ enum: PaymentMethod, description: 'Método de pagamento' })
  @IsEnum(PaymentMethod)
  paymentMethod: PaymentMethod;

  @ApiProperty({ description: 'ID da conta bancária', required: false })
  @IsOptional()
  @IsUUID()
  bankAccountId?: string;

  @ApiProperty({ description: 'Observações', required: false })
  @IsOptional()
  @IsString()
  notes?: string;
}

