import { ApiProperty } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export class DepositDto {
  @IsNumber()
  @IsNotEmpty()
  @Min(0.01)
  @ApiProperty({
    description: 'Valor do depósito',
    example: 100.0,
    minimum: 0.01,
  })
  amount: number;

  @IsString()
  @IsOptional()
  @ApiProperty({
    description: 'Descrição do depósito',
    example: 'Depósito mensal',
    required: false,
  })
  description?: string;
}
