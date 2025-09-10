import { IsString, IsEnum, IsOptional, IsNotEmpty, Length, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { AccountType } from '../../../shared/enums';

export class CreateBankAccountDto {
  @ApiProperty({ description: 'Código do banco (3 dígitos)' })
  @IsString()
  @IsNotEmpty()
  @Length(3, 3)
  @Matches(/^\d{3}$/, { message: 'Código do banco deve ter 3 dígitos' })
  bankCode: string;

  @ApiProperty({ description: 'Nome do banco' })
  @IsString()
  @IsNotEmpty()
  bankName: string;

  @ApiProperty({ description: 'Agência' })
  @IsString()
  @IsNotEmpty()
  @Length(4, 5)
  agency: string;

  @ApiProperty({ description: 'Número da conta' })
  @IsString()
  @IsNotEmpty()
  accountNumber: string;

  @ApiProperty({ description: 'Dígito da conta' })
  @IsString()
  @IsNotEmpty()
  @Length(1, 2)
  accountDigit: string;

  @ApiProperty({ enum: AccountType, description: 'Tipo da conta' })
  @IsEnum(AccountType)
  accountType: AccountType;

  @ApiProperty({ description: 'Nome do titular da conta' })
  @IsString()
  @IsNotEmpty()
  accountHolderName: string;

  @ApiProperty({ description: 'CPF/CNPJ do titular' })
  @IsString()
  @IsNotEmpty()
  @Matches(/^\d{11}$|^\d{14}$/, { message: 'Documento deve ter 11 (CPF) ou 14 (CNPJ) dígitos' })
  accountHolderDocument: string;

  @ApiProperty({ description: 'Chave PIX', required: false })
  @IsOptional()
  @IsString()
  pixKey?: string;

  @ApiProperty({ description: 'Tipo da chave PIX', required: false })
  @IsOptional()
  @IsString()
  pixKeyType?: string;
}

