import { Controller, Get, Post, Body, UseGuards, Req } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { WalletService } from './wallet.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { DepositDto } from './dto/deposit.dto';
import { TransferDto } from './dto/transfer.dto';

@ApiTags('wallet')
@Controller('wallet')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class WalletController {
  constructor(private readonly walletService: WalletService) {}

  @Get('balance')
  @ApiOperation({ summary: 'Obter saldo da carteira' })
  @ApiResponse({ status: 200, description: 'Saldo obtido com sucesso' })
  @ApiResponse({ status: 401, description: 'Não autorizado' })
  @ApiResponse({ status: 404, description: 'Carteira não encontrada' })
  getBalance(@Req() req) {
    return this.walletService.getBalance(req.user.id);
  }

  @Get('transactions')
  @ApiOperation({ summary: 'Listar transações da carteira' })
  @ApiResponse({ status: 200, description: 'Transações listadas com sucesso' })
  @ApiResponse({ status: 401, description: 'Não autorizado' })
  @ApiResponse({ status: 404, description: 'Carteira não encontrada' })
  getTransactions(@Req() req) {
    return this.walletService.getTransactions(req.user.id);
  }

  @Post('deposit')
  @ApiOperation({ summary: 'Realizar depósito na carteira' })
  @ApiResponse({ status: 201, description: 'Depósito realizado com sucesso' })
  @ApiResponse({ status: 400, description: 'Dados inválidos' })
  @ApiResponse({ status: 401, description: 'Não autorizado' })
  @ApiResponse({ status: 404, description: 'Carteira não encontrada' })
  @ApiResponse({ status: 409, description: 'Carteira com inconsistências' })
  deposit(@Req() req, @Body() depositDto: DepositDto) {
    return this.walletService.deposit(req.user.id, depositDto);
  }

  @Post('transfer')
  @ApiOperation({ summary: 'Realizar transferência para outro usuário' })
  @ApiResponse({
    status: 201,
    description: 'Transferência realizada com sucesso',
  })
  @ApiResponse({
    status: 400,
    description: 'Dados inválidos ou saldo insuficiente',
  })
  @ApiResponse({ status: 401, description: 'Não autorizado' })
  @ApiResponse({ status: 404, description: 'Carteira não encontrada' })
  @ApiResponse({ status: 409, description: 'Carteira com inconsistências' })
  transfer(@Req() req, @Body() transferDto: TransferDto) {
    return this.walletService.transfer(req.user.id, transferDto);
  }
}
