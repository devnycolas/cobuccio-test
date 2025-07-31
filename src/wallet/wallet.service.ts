import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Wallet } from './entities/wallet.entity';
import { UsersService } from '../users/users.service';
import { DepositDto } from './dto/deposit.dto';
import { TransferDto } from './dto/transfer.dto';
import {
  Transaction,
  TransactionStatus,
  TransactionType,
} from '../transactions/entities/transaction.entity';

@Injectable()
export class WalletService {
  constructor(
    @InjectRepository(Wallet)
    private walletRepository: Repository<Wallet>,
    @InjectRepository(Transaction)
    private transactionRepository: Repository<Transaction>,
    private usersService: UsersService,
    private dataSource: DataSource,
  ) {}

  async findOne(id: string): Promise<Wallet> {
    const wallet = await this.walletRepository.findOne({
      where: { id },
      relations: ['user'],
    });

    if (!wallet) {
      throw new NotFoundException(`Carteira com ID ${id} não encontrada`);
    }

    return wallet;
  }

  async findByUserId(userId: string): Promise<Wallet> {
    const wallet = await this.walletRepository.findOne({
      where: { userId },
      relations: ['user'],
    });

    if (!wallet) {
      throw new NotFoundException(
        `Carteira para o usuário com ID ${userId} não encontrada`,
      );
    }

    return wallet;
  }

  async deposit(userId: string, depositDto: DepositDto): Promise<Transaction> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const wallet = await this.walletRepository.findOne({ where: { userId } });

      if (!wallet) {
        throw new NotFoundException(
          `Carteira para o usuário com ID ${userId} não encontrada`,
        );
      }

      if (wallet.hasInconsistency) {
        throw new ConflictException(
          'Não é possível realizar depósitos. A carteira possui inconsistências.',
        );
      }

      // Criar transação de depósito
      const transaction = this.transactionRepository.create({
        type: TransactionType.DEPOSIT,
        amount: depositDto.amount,
        description: depositDto.description || 'Depósito',
        destinationWalletId: wallet.id,
        status: TransactionStatus.COMPLETED,
      });

      // Atualizar saldo da carteira
      wallet.balance = Number(wallet.balance) + Number(depositDto.amount);

      // Salvar alterações
      await queryRunner.manager.save(wallet);
      await queryRunner.manager.save(transaction);

      await queryRunner.commitTransaction();

      return transaction;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async transfer(
    userId: string,
    transferDto: TransferDto,
  ): Promise<Transaction> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Buscar carteira de origem
      const sourceWallet = await this.walletRepository.findOne({
        where: { userId },
      });

      if (!sourceWallet) {
        throw new NotFoundException(
          `Carteira para o usuário com ID ${userId} não encontrada`,
        );
      }

      if (sourceWallet.hasInconsistency) {
        throw new ConflictException(
          'Não é possível realizar transferências. A carteira possui inconsistências.',
        );
      }

      // Verificar se não é uma transferência para si mesmo
      if (userId === transferDto.destinationUserId) {
        throw new BadRequestException(
          'Não é possível realizar transferência para você mesmo',
        );
      }

      // Verificar saldo suficiente
      if (Number(sourceWallet.balance) < Number(transferDto.amount)) {
        throw new BadRequestException(
          'Saldo insuficiente para realizar a transferência',
        );
      }

      // Buscar carteira de destino
      const destinationUser = await this.usersService.findOne(
        transferDto.destinationUserId,
      );
      const destinationWallet = await this.walletRepository.findOne({
        where: { userId: destinationUser.id },
      });

      if (!destinationWallet) {
        throw new NotFoundException(
          `Carteira para o usuário destinatário não encontrada`,
        );
      }

      // Criar transação de transferência
      const transaction = this.transactionRepository.create({
        type: TransactionType.TRANSFER,
        amount: transferDto.amount,
        description: transferDto.description || 'Transferência',
        sourceWalletId: sourceWallet.id,
        destinationWalletId: destinationWallet.id,
        status: TransactionStatus.COMPLETED,
      });

      // Atualizar saldos das carteiras
      sourceWallet.balance =
        Number(sourceWallet.balance) - Number(transferDto.amount);
      destinationWallet.balance =
        Number(destinationWallet.balance) + Number(transferDto.amount);

      // Salvar alterações
      await queryRunner.manager.save(sourceWallet);
      await queryRunner.manager.save(destinationWallet);
      await queryRunner.manager.save(transaction);

      await queryRunner.commitTransaction();

      return transaction;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async getBalance(userId: string): Promise<{ balance: number }> {
    const wallet = await this.findByUserId(userId);
    return { balance: Number(wallet.balance) };
  }

  async getTransactions(userId: string): Promise<Transaction[]> {
    const wallet = await this.findByUserId(userId);

    return this.transactionRepository.find({
      where: [
        { sourceWalletId: wallet.id },
        { destinationWalletId: wallet.id },
      ],
      order: { createdAt: 'DESC' },
    });
  }
}
