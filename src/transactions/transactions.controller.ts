import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  Req,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { TransactionsService } from './transactions.service';
import { ReverseTransactionDto } from './dto/reverse-transaction.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('transactions')
@Controller('transactions')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class TransactionsController {
  constructor(private readonly transactionsService: TransactionsService) {}

  @Get()
  @ApiOperation({ summary: 'Listar todas as transações do usuário' })
  @ApiResponse({ status: 200, description: 'Transações listadas com sucesso' })
  @ApiResponse({ status: 401, description: 'Não autorizado' })
  @ApiResponse({ status: 404, description: 'Carteira não encontrada' })
  findAll(@Req() req) {
    return this.transactionsService.findTransactionsByUserId(req.user.id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Buscar uma transação pelo ID' })
  @ApiResponse({ status: 200, description: 'Transação encontrada com sucesso' })
  @ApiResponse({ status: 401, description: 'Não autorizado' })
  @ApiResponse({ status: 404, description: 'Transação não encontrada' })
  findOne(@Param('id') id: string) {
    return this.transactionsService.findTransactionById(id);
  }

  @Post('reverse')
  @ApiOperation({ summary: 'Reverter uma transação' })
  @ApiResponse({ status: 201, description: 'Transação revertida com sucesso' })
  @ApiResponse({
    status: 400,
    description: 'Dados inválidos ou saldo insuficiente',
  })
  @ApiResponse({ status: 401, description: 'Não autorizado' })
  @ApiResponse({ status: 404, description: 'Transação não encontrada' })
  @ApiResponse({ status: 409, description: 'Transação já revertida' })
  reverse(@Req() req, @Body() reverseTransactionDto: ReverseTransactionDto) {
    return this.transactionsService.reverseTransaction(
      req.user.id,
      reverseTransactionDto,
    );
  }
}
