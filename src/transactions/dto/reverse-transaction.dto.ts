import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';

export class ReverseTransactionDto {
  @IsUUID()
  @IsNotEmpty()
  @ApiProperty({
    description: 'ID da transação a ser revertida',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  transactionId: string;

  @IsString()
  @IsOptional()
  @ApiProperty({
    description: 'Motivo da reversão',
    example: 'Transação realizada por engano',
    required: false,
  })
  reason?: string;
}
