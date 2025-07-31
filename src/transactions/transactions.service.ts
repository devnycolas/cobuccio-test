import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import {
  Transaction,
  TransactionStatus,
  TransactionType,
} from './entities/transaction.entity';
import { ReverseTransactionDto } from './dto/reverse-transaction.dto';
import { Wallet } from '../wallet/entities/wallet.entity';

@Injectable()
export class TransactionsService {
  constructor(
    @InjectRepository(Transaction)
    private transactionRepository: Repository<Transaction>,
    @InjectRepository(Wallet)
    private walletRepository: Repository<Wallet>,
    private dataSource: DataSource,
  ) {}

  async findOne(id: string): Promise<Transaction> {
    const transaction = await this.transactionRepository.findOne({
      where: { id },
      relations: ['sourceWallet', 'destinationWallet'],
    });

    if (!transaction) {
      throw new NotFoundException(`Transação com ID ${id} não encontrada`);
    }

    return transaction;
  }

  async reverseTransaction(
    userId: string,
    reverseTransactionDto: ReverseTransactionDto,
  ): Promise<Transaction> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Buscar a transação original
      const originalTransaction = await this.transactionRepository.findOne({
        where: { id: reverseTransactionDto.transactionId },
        relations: ['sourceWallet', 'destinationWallet'],
      });

      if (!originalTransaction) {
        throw new NotFoundException(
          `Transação com ID ${reverseTransactionDto.transactionId} não encontrada`,
        );
      }

      // Verificar se a transação já foi revertida
      if (originalTransaction.status === TransactionStatus.REVERSED) {
        throw new ConflictException('Esta transação já foi revertida');
      }

      // Verificar se o usuário tem permissão para reverter a transação
      // (deve ser o remetente ou o destinatário da transação)
      const userWallet = await this.walletRepository.findOne({
        where: { userId },
      });

      if (!userWallet) {
        throw new NotFoundException(
          `Carteira para o usuário com ID ${userId} não encontrada`,
        );
      }

      const isSourceWallet =
        originalTransaction.sourceWalletId === userWallet.id;
      const isDestinationWallet =
        originalTransaction.destinationWalletId === userWallet.id;

      if (!isSourceWallet && !isDestinationWallet) {
        throw new BadRequestException(
          'Você não tem permissão para reverter esta transação',
        );
      }

      // Verificar o tipo de transação e criar a transação de reversão
      let reversalTransaction;

      if (originalTransaction.type === TransactionType.DEPOSIT) {
        // Para depósitos, verificar se o destinatário tem saldo suficiente
        const destinationWallet = await this.walletRepository.findOne({
          where: { id: originalTransaction.destinationWalletId },
        });

        if (!destinationWallet) {
          throw new NotFoundException('Carteira de destino não encontrada');
        }

        if (
          Number(destinationWallet.balance) < Number(originalTransaction.amount)
        ) {
          throw new BadRequestException(
            'Saldo insuficiente para reverter o depósito',
          );
        }

        // Criar transação de reversão
        reversalTransaction = this.transactionRepository.create({
          type: TransactionType.REVERSAL,
          amount: originalTransaction.amount,
          description:
            reverseTransactionDto.reason ||
            `Reversão do depósito ${originalTransaction.id}`,
          sourceWalletId: destinationWallet.id,
          status: TransactionStatus.COMPLETED,
          originalTransactionId: originalTransaction.id,
        });

        // Atualizar saldo da carteira
        destinationWallet.balance =
          Number(destinationWallet.balance) -
          Number(originalTransaction.amount);
        await queryRunner.manager.save(destinationWallet);
      } else if (originalTransaction.type === TransactionType.TRANSFER) {
        // Para transferências, verificar se o destinatário tem saldo suficiente
        const sourceWallet = await this.walletRepository.findOne({
          where: { id: originalTransaction.sourceWalletId },
        });

        const destinationWallet = await this.walletRepository.findOne({
          where: { id: originalTransaction.destinationWalletId },
        });

        if (!sourceWallet || !destinationWallet) {
          throw new NotFoundException(
            'Carteira de origem ou destino não encontrada',
          );
        }

        if (
          Number(destinationWallet.balance) < Number(originalTransaction.amount)
        ) {
          throw new BadRequestException(
            'Saldo insuficiente para reverter a transferência',
          );
        }

        // Criar transação de reversão
        reversalTransaction = this.transactionRepository.create({
          type: TransactionType.REVERSAL,
          amount: originalTransaction.amount,
          description:
            reverseTransactionDto.reason ||
            `Reversão da transferência ${originalTransaction.id}`,
          sourceWalletId: destinationWallet.id,
          destinationWalletId: sourceWallet.id,
          status: TransactionStatus.COMPLETED,
          originalTransactionId: originalTransaction.id,
        });

        // Atualizar saldos das carteiras
        sourceWallet.balance =
          Number(sourceWallet.balance) + Number(originalTransaction.amount);
        destinationWallet.balance =
          Number(destinationWallet.balance) -
          Number(originalTransaction.amount);

        await queryRunner.manager.save(sourceWallet);
        await queryRunner.manager.save(destinationWallet);
      } else {
        throw new BadRequestException('Tipo de transação não suporta reversão');
      }

      // Atualizar status da transação original
      originalTransaction.status = TransactionStatus.REVERSED;

      // Salvar alterações
      await queryRunner.manager.save(originalTransaction);
      await queryRunner.manager.save(reversalTransaction);

      await queryRunner.commitTransaction();

      return reversalTransaction;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async findTransactionsByUserId(userId: string): Promise<Transaction[]> {
    const wallet = await this.walletRepository.findOne({ where: { userId } });

    if (!wallet) {
      throw new NotFoundException(
        `Carteira para o usuário com ID ${userId} não encontrada`,
      );
    }

    return this.transactionRepository.find({
      where: [
        { sourceWalletId: wallet.id },
        { destinationWalletId: wallet.id },
      ],
      order: { createdAt: 'DESC' },
    });
  }

  async findTransactionById(id: string): Promise<Transaction> {
    return this.findOne(id);
  }
}
