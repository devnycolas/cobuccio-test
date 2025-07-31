import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { TransactionsService } from './transactions.service';
import {
  Transaction,
  TransactionStatus,
  TransactionType,
} from './entities/transaction.entity';
import { Wallet } from '../wallet/entities/wallet.entity';
import { ReverseTransactionDto } from './dto/reverse-transaction.dto';

const mockQueryRunner = {
  connect: jest.fn(),
  startTransaction: jest.fn(),
  commitTransaction: jest.fn(),
  rollbackTransaction: jest.fn(),
  release: jest.fn(),
  manager: {
    save: jest.fn(),
  },
};

const mockDataSource = {
  createQueryRunner: jest.fn().mockReturnValue(mockQueryRunner),
};

describe('TransactionsService', () => {
  let service: TransactionsService;
  let transactionRepository: Repository<Transaction>;
  let walletRepository: Repository<Wallet>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TransactionsService,
        {
          provide: getRepositoryToken(Transaction),
          useClass: Repository,
        },
        {
          provide: getRepositoryToken(Wallet),
          useClass: Repository,
        },
        {
          provide: DataSource,
          useValue: mockDataSource,
        },
      ],
    }).compile();

    service = module.get<TransactionsService>(TransactionsService);
    transactionRepository = module.get<Repository<Transaction>>(
      getRepositoryToken(Transaction),
    );
    walletRepository = module.get<Repository<Wallet>>(
      getRepositoryToken(Wallet),
    );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('reverseTransaction', () => {
    it('should successfully reverse a deposit transaction', async () => {
      const userId = 'user-id';
      const reverseTransactionDto: ReverseTransactionDto = {
        transactionId: 'transaction-id',
        reason: 'Test reversal',
      };

      const userWallet = new Wallet();
      userWallet.id = 'wallet-id';
      userWallet.userId = userId;
      userWallet.balance = 100;

      const originalTransaction = new Transaction();
      originalTransaction.id = reverseTransactionDto.transactionId;
      originalTransaction.type = TransactionType.DEPOSIT;
      originalTransaction.amount = 50;
      originalTransaction.status = TransactionStatus.COMPLETED;
      originalTransaction.destinationWalletId = userWallet.id;

      const reversalTransaction = new Transaction();
      reversalTransaction.id = 'reversal-transaction-id';
      reversalTransaction.type = TransactionType.REVERSAL;
      reversalTransaction.amount = originalTransaction.amount;
      reversalTransaction.status = TransactionStatus.COMPLETED;

      jest
        .spyOn(transactionRepository, 'findOne')
        .mockResolvedValue(originalTransaction);
      jest.spyOn(walletRepository, 'findOne').mockResolvedValueOnce(userWallet);
      jest.spyOn(walletRepository, 'findOne').mockResolvedValueOnce(userWallet);
      jest
        .spyOn(transactionRepository, 'create')
        .mockReturnValue(reversalTransaction);

      const result = await service.reverseTransaction(
        userId,
        reverseTransactionDto,
      );

      expect(transactionRepository.findOne).toHaveBeenCalledWith({
        where: { id: reverseTransactionDto.transactionId },
        relations: ['sourceWallet', 'destinationWallet'],
      });
      expect(walletRepository.findOne).toHaveBeenCalledWith({
        where: { userId },
      });
      expect(walletRepository.findOne).toHaveBeenCalledWith({
        where: { id: originalTransaction.destinationWalletId },
      });
      expect(transactionRepository.create).toHaveBeenCalledWith({
        type: TransactionType.REVERSAL,
        amount: originalTransaction.amount,
        description: reverseTransactionDto.reason,
        sourceWalletId: userWallet.id,
        status: TransactionStatus.COMPLETED,
        originalTransactionId: originalTransaction.id,
      });
      expect(mockQueryRunner.manager.save).toHaveBeenCalledWith(userWallet);
      expect(mockQueryRunner.manager.save).toHaveBeenCalledWith(
        originalTransaction,
      );
      expect(mockQueryRunner.manager.save).toHaveBeenCalledWith(
        reversalTransaction,
      );
      expect(mockQueryRunner.commitTransaction).toHaveBeenCalled();
      expect(result).toEqual(reversalTransaction);
      expect(userWallet.balance).toBe(50);
      expect(originalTransaction.status).toBe(TransactionStatus.REVERSED);
    });

    it('should throw NotFoundException if transaction is not found', async () => {
      const userId = 'user-id';
      const reverseTransactionDto: ReverseTransactionDto = {
        transactionId: 'transaction-id',
        reason: 'Test reversal',
      };

      jest.spyOn(transactionRepository, 'findOne').mockResolvedValue(null);

      await expect(
        service.reverseTransaction(userId, reverseTransactionDto),
      ).rejects.toThrow(NotFoundException);
      expect(transactionRepository.findOne).toHaveBeenCalledWith({
        where: { id: reverseTransactionDto.transactionId },
        relations: ['sourceWallet', 'destinationWallet'],
      });
    });

    it('should throw ConflictException if transaction is already reversed', async () => {
      const userId = 'user-id';
      const reverseTransactionDto: ReverseTransactionDto = {
        transactionId: 'transaction-id',
        reason: 'Test reversal',
      };

      const userWallet = new Wallet();
      userWallet.id = 'wallet-id';
      userWallet.userId = userId;

      const originalTransaction = new Transaction();
      originalTransaction.id = reverseTransactionDto.transactionId;
      originalTransaction.type = TransactionType.DEPOSIT;
      originalTransaction.status = TransactionStatus.REVERSED;
      originalTransaction.destinationWalletId = userWallet.id;

      jest
        .spyOn(transactionRepository, 'findOne')
        .mockResolvedValue(originalTransaction);
      jest.spyOn(walletRepository, 'findOne').mockResolvedValue(userWallet);

      await expect(
        service.reverseTransaction(userId, reverseTransactionDto),
      ).rejects.toThrow(ConflictException);
      expect(transactionRepository.findOne).toHaveBeenCalledWith({
        where: { id: reverseTransactionDto.transactionId },
        relations: ['sourceWallet', 'destinationWallet'],
      });
    });

    it('should throw BadRequestException if user has no permission to reverse the transaction', async () => {
      const userId = 'user-id';
      const reverseTransactionDto: ReverseTransactionDto = {
        transactionId: 'transaction-id',
        reason: 'Test reversal',
      };

      const userWallet = new Wallet();
      userWallet.id = 'wallet-id';
      userWallet.userId = userId;

      const originalTransaction = new Transaction();
      originalTransaction.id = reverseTransactionDto.transactionId;
      originalTransaction.type = TransactionType.DEPOSIT;
      originalTransaction.status = TransactionStatus.COMPLETED;
      originalTransaction.sourceWalletId = 'other-wallet-id';
      originalTransaction.destinationWalletId = 'other-wallet-id';

      jest
        .spyOn(transactionRepository, 'findOne')
        .mockResolvedValue(originalTransaction);
      jest.spyOn(walletRepository, 'findOne').mockResolvedValue(userWallet);

      await expect(
        service.reverseTransaction(userId, reverseTransactionDto),
      ).rejects.toThrow(BadRequestException);
      expect(transactionRepository.findOne).toHaveBeenCalledWith({
        where: { id: reverseTransactionDto.transactionId },
        relations: ['sourceWallet', 'destinationWallet'],
      });
      expect(walletRepository.findOne).toHaveBeenCalledWith({
        where: { userId },
      });
    });

    it('should throw BadRequestException if destination wallet has insufficient balance for reversal', async () => {
      const userId = 'user-id';
      const reverseTransactionDto: ReverseTransactionDto = {
        transactionId: 'transaction-id',
        reason: 'Test reversal',
      };

      const userWallet = new Wallet();
      userWallet.id = 'wallet-id';
      userWallet.userId = userId;
      userWallet.balance = 20;

      const originalTransaction = new Transaction();
      originalTransaction.id = reverseTransactionDto.transactionId;
      originalTransaction.type = TransactionType.DEPOSIT;
      originalTransaction.amount = 50;
      originalTransaction.status = TransactionStatus.COMPLETED;
      originalTransaction.destinationWalletId = userWallet.id;

      jest
        .spyOn(transactionRepository, 'findOne')
        .mockResolvedValue(originalTransaction);
      jest.spyOn(walletRepository, 'findOne').mockResolvedValueOnce(userWallet);
      jest.spyOn(walletRepository, 'findOne').mockResolvedValueOnce(userWallet);

      await expect(
        service.reverseTransaction(userId, reverseTransactionDto),
      ).rejects.toThrow(BadRequestException);
      expect(transactionRepository.findOne).toHaveBeenCalledWith({
        where: { id: reverseTransactionDto.transactionId },
        relations: ['sourceWallet', 'destinationWallet'],
      });
      expect(walletRepository.findOne).toHaveBeenCalledWith({
        where: { userId },
      });
      expect(walletRepository.findOne).toHaveBeenCalledWith({
        where: { id: originalTransaction.destinationWalletId },
      });
    });
  });

  describe('findOne', () => {
    it('should return a transaction by id', async () => {
      const transactionId = 'transaction-123';
      const mockTransaction = {
        id: transactionId,
        type: TransactionType.DEPOSIT,
        amount: 100,
        status: TransactionStatus.COMPLETED,
        sourceWallet: null,
        destinationWallet: { id: 'wallet-123' },
      };

      jest
        .spyOn(transactionRepository, 'findOne')
        .mockResolvedValue(mockTransaction as any);

      const result = await service.findOne(transactionId);

      expect(result).toEqual(mockTransaction);
      expect(transactionRepository.findOne).toHaveBeenCalledWith({
        where: { id: transactionId },
        relations: ['sourceWallet', 'destinationWallet'],
      });
    });

    it('should throw NotFoundException when transaction not found', async () => {
      const transactionId = 'non-existent-transaction';

      jest.spyOn(transactionRepository, 'findOne').mockResolvedValue(null);

      await expect(service.findOne(transactionId)).rejects.toThrow(
        NotFoundException,
      );
      expect(transactionRepository.findOne).toHaveBeenCalledWith({
        where: { id: transactionId },
        relations: ['sourceWallet', 'destinationWallet'],
      });
    });
  });

  describe('findTransactionsByUserId', () => {
    it('should return transactions for a user', async () => {
      const userId = 'user-123';
      const mockWallet = { id: 'wallet-123', userId };
      const mockTransactions = [
        {
          id: 'transaction-1',
          type: TransactionType.DEPOSIT,
          amount: 100,
          sourceWalletId: null,
          destinationWalletId: 'wallet-123',
        },
        {
          id: 'transaction-2',
          type: TransactionType.TRANSFER,
          amount: 50,
          sourceWalletId: 'wallet-123',
          destinationWalletId: 'wallet-456',
        },
      ];

      jest
        .spyOn(walletRepository, 'findOne')
        .mockResolvedValue(mockWallet as any);
      jest
        .spyOn(transactionRepository, 'find')
        .mockResolvedValue(mockTransactions as any);

      const result = await service.findTransactionsByUserId(userId);

      expect(result).toEqual(mockTransactions);
      expect(walletRepository.findOne).toHaveBeenCalledWith({
        where: { userId },
      });
      expect(transactionRepository.find).toHaveBeenCalledWith({
        where: [
          { sourceWalletId: 'wallet-123' },
          { destinationWalletId: 'wallet-123' },
        ],
        order: { createdAt: 'DESC' },
      });
    });

    it('should throw NotFoundException when wallet not found', async () => {
      const userId = 'non-existent-user';

      jest.spyOn(walletRepository, 'findOne').mockResolvedValue(null);

      await expect(service.findTransactionsByUserId(userId)).rejects.toThrow(
        NotFoundException,
      );
      expect(walletRepository.findOne).toHaveBeenCalledWith({
        where: { userId },
      });
    });
  });

  describe('findTransactionById', () => {
    it('should call findOne method', async () => {
      const transactionId = 'transaction-123';
      const mockTransaction = {
        id: transactionId,
        type: TransactionType.DEPOSIT,
        amount: 100,
      };

      jest.spyOn(service, 'findOne').mockResolvedValue(mockTransaction as any);

      const result = await service.findTransactionById(transactionId);

      expect(result).toEqual(mockTransaction);
      expect(service.findOne).toHaveBeenCalledWith(transactionId);
    });
  });

  describe('reverseTransaction - additional edge cases', () => {
    it('should throw NotFoundException when user wallet not found', async () => {
      const userId = 'user-123';
      const reverseTransactionDto: ReverseTransactionDto = {
        transactionId: 'transaction-123',
        reason: 'Test reversal',
      };

      const mockOriginalTransaction = {
        id: 'transaction-123',
        type: TransactionType.TRANSFER,
        status: TransactionStatus.COMPLETED,
        sourceWalletId: 'wallet-123',
        destinationWalletId: 'wallet-456',
      };

      jest
        .spyOn(transactionRepository, 'findOne')
        .mockResolvedValue(mockOriginalTransaction as any);
      jest.spyOn(walletRepository, 'findOne').mockResolvedValue(null);

      await expect(
        service.reverseTransaction(userId, reverseTransactionDto),
      ).rejects.toThrow(NotFoundException);

      expect(walletRepository.findOne).toHaveBeenCalledWith({
        where: { userId },
      });
    });

    it('should throw BadRequestException when user has no permission', async () => {
      const userId = 'user-123';
      const reverseTransactionDto: ReverseTransactionDto = {
        transactionId: 'transaction-123',
        reason: 'Test reversal',
      };

      const mockOriginalTransaction = {
        id: 'transaction-123',
        type: TransactionType.TRANSFER,
        status: TransactionStatus.COMPLETED,
        sourceWalletId: 'wallet-456',
        destinationWalletId: 'wallet-789',
      };

      const mockUserWallet = {
        id: 'wallet-123',
        userId: 'user-123',
      };

      jest
        .spyOn(transactionRepository, 'findOne')
        .mockResolvedValue(mockOriginalTransaction as any);
      jest
        .spyOn(walletRepository, 'findOne')
        .mockResolvedValue(mockUserWallet as any);

      await expect(
        service.reverseTransaction(userId, reverseTransactionDto),
      ).rejects.toThrow(BadRequestException);

      expect(transactionRepository.findOne).toHaveBeenCalledWith({
        where: { id: reverseTransactionDto.transactionId },
        relations: ['sourceWallet', 'destinationWallet'],
      });
      expect(walletRepository.findOne).toHaveBeenCalledWith({
        where: { userId },
      });
    });
  });
});
