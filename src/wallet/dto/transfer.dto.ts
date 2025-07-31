import { ApiProperty } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Min,
} from 'class-validator';

export class TransferDto {
  @IsUUID()
  @IsNotEmpty()
  @ApiProperty({
    description: 'ID do usuário destinatário',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  destinationUserId: string;

  @IsNumber()
  @IsNotEmpty()
  @Min(0.01)
  @ApiProperty({
    description: 'Valor da transferência',
    example: 50.0,
    minimum: 0.01,
  })
  amount: number;

  @IsString()
  @IsOptional()
  @ApiProperty({
    description: 'Descrição da transferência',
    example: 'Pagamento de empréstimo',
    required: false,
  })
  description?: string;
}
