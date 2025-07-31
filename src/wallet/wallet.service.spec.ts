import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { WalletService } from './wallet.service';
import { Wallet } from './entities/wallet.entity';
import { UsersService } from '../users/users.service';
import {
  Transaction,
  TransactionStatus,
  TransactionType,
} from '../transactions/entities/transaction.entity';
import { User } from '../users/entities/user.entity';
import { DepositDto } from './dto/deposit.dto';
import { TransferDto } from './dto/transfer.dto';

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

describe('WalletService', () => {
  let service: WalletService;
  let walletRepository: Repository<Wallet>;
  let transactionRepository: Repository<Transaction>;
  let usersService: UsersService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WalletService,
        {
          provide: getRepositoryToken(Wallet),
          useClass: Repository,
        },
        {
          provide: getRepositoryToken(Transaction),
          useClass: Repository,
        },
        {
          provide: UsersService,
          useValue: {
            findOne: jest.fn(),
          },
        },
        {
          provide: DataSource,
          useValue: mockDataSource,
        },
      ],
    }).compile();

    service = module.get<WalletService>(WalletService);
    walletRepository = module.get<Repository<Wallet>>(
      getRepositoryToken(Wallet),
    );
    transactionRepository = module.get<Repository<Transaction>>(
      getRepositoryToken(Transaction),
    );
    usersService = module.get<UsersService>(UsersService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('deposit', () => {
    it('should successfully deposit money into wallet', async () => {
      const userId = 'user-id';
      const depositDto: DepositDto = {
        amount: 100,
        description: 'Test deposit',
      };

      const wallet = new Wallet();
      wallet.id = 'wallet-id';
      wallet.balance = 0;
      wallet.hasInconsistency = false;

      const transaction = new Transaction();
      transaction.id = 'transaction-id';
      transaction.type = TransactionType.DEPOSIT;
      transaction.amount = depositDto.amount;
      transaction.status = TransactionStatus.COMPLETED;

      jest.spyOn(walletRepository, 'findOne').mockResolvedValue(wallet);
      jest.spyOn(transactionRepository, 'create').mockReturnValue(transaction);

      const result = await service.deposit(userId, depositDto);

      expect(walletRepository.findOne).toHaveBeenCalledWith({
        where: { userId },
      });
      expect(transactionRepository.create).toHaveBeenCalledWith({
        type: TransactionType.DEPOSIT,
        amount: depositDto.amount,
        description: depositDto.description,
        destinationWalletId: wallet.id,
        status: TransactionStatus.COMPLETED,
      });
      expect(mockQueryRunner.manager.save).toHaveBeenCalledWith(wallet);
      expect(mockQueryRunner.manager.save).toHaveBeenCalledWith(transaction);
      expect(mockQueryRunner.commitTransaction).toHaveBeenCalled();
      expect(result).toEqual(transaction);
      expect(wallet.balance).toBe(depositDto.amount);
    });

    it('should throw NotFoundException if wallet is not found', async () => {
      const userId = 'user-id';
      const depositDto: DepositDto = {
        amount: 100,
        description: 'Test deposit',
      };

      jest.spyOn(walletRepository, 'findOne').mockResolvedValue(null);

      await expect(service.deposit(userId, depositDto)).rejects.toThrow(
        NotFoundException,
      );
      expect(walletRepository.findOne).toHaveBeenCalledWith({
        where: { userId },
      });
    });

    it('should throw ConflictException if wallet has inconsistency', async () => {
      const userId = 'user-id';
      const depositDto: DepositDto = {
        amount: 100,
        description: 'Test deposit',
      };

      const wallet = new Wallet();
      wallet.id = 'wallet-id';
      wallet.balance = 0;
      wallet.hasInconsistency = true;

      jest.spyOn(walletRepository, 'findOne').mockResolvedValue(wallet);

      await expect(service.deposit(userId, depositDto)).rejects.toThrow(
        ConflictException,
      );
      expect(walletRepository.findOne).toHaveBeenCalledWith({
        where: { userId },
      });
    });
  });

  describe('transfer', () => {
    it('should successfully transfer money between wallets', async () => {
      const userId = 'user-id';
      const transferDto: TransferDto = {
        destinationUserId: 'destination-user-id',
        amount: 50,
        description: 'Test transfer',
      };

      const sourceWallet = new Wallet();
      sourceWallet.id = 'source-wallet-id';
      sourceWallet.balance = 100;
      sourceWallet.hasInconsistency = false;

      const destinationUser = new User();
      destinationUser.id = transferDto.destinationUserId;

      const destinationWallet = new Wallet();
      destinationWallet.id = 'destination-wallet-id';
      destinationWallet.balance = 0;

      const transaction = new Transaction();
      transaction.id = 'transaction-id';
      transaction.type = TransactionType.TRANSFER;
      transaction.amount = transferDto.amount;
      transaction.status = TransactionStatus.COMPLETED;

      jest
        .spyOn(walletRepository, 'findOne')
        .mockResolvedValueOnce(sourceWallet);
      jest.spyOn(usersService, 'findOne').mockResolvedValue(destinationUser);
      jest
        .spyOn(walletRepository, 'findOne')
        .mockResolvedValueOnce(destinationWallet);
      jest.spyOn(transactionRepository, 'create').mockReturnValue(transaction);

      const result = await service.transfer(userId, transferDto);

      expect(walletRepository.findOne).toHaveBeenCalledWith({
        where: { userId },
      });
      expect(usersService.findOne).toHaveBeenCalledWith(
        transferDto.destinationUserId,
      );
      expect(walletRepository.findOne).toHaveBeenCalledWith({
        where: { userId: destinationUser.id },
      });
      expect(transactionRepository.create).toHaveBeenCalledWith({
        type: TransactionType.TRANSFER,
        amount: transferDto.amount,
        description: transferDto.description,
        sourceWalletId: sourceWallet.id,
        destinationWalletId: destinationWallet.id,
        status: TransactionStatus.COMPLETED,
      });
      expect(mockQueryRunner.manager.save).toHaveBeenCalledWith(sourceWallet);
      expect(mockQueryRunner.manager.save).toHaveBeenCalledWith(
        destinationWallet,
      );
      expect(mockQueryRunner.manager.save).toHaveBeenCalledWith(transaction);
      expect(mockQueryRunner.commitTransaction).toHaveBeenCalled();
      expect(result).toEqual(transaction);
      expect(sourceWallet.balance).toBe(50);
      expect(destinationWallet.balance).toBe(50);
    });

    it('should throw BadRequestException if source wallet has insufficient balance', async () => {
      const userId = 'user-id';
      const transferDto: TransferDto = {
        destinationUserId: 'destination-user-id',
        amount: 150,
        description: 'Test transfer',
      };

      const sourceWallet = new Wallet();
      sourceWallet.id = 'source-wallet-id';
      sourceWallet.balance = 100;
      sourceWallet.hasInconsistency = false;

      jest.spyOn(walletRepository, 'findOne').mockResolvedValue(sourceWallet);

      await expect(service.transfer(userId, transferDto)).rejects.toThrow(
        BadRequestException,
      );
      expect(walletRepository.findOne).toHaveBeenCalledWith({
        where: { userId },
      });
    });

    it('should throw ConflictException if source wallet has inconsistency', async () => {
      const userId = 'user-id';
      const transferDto: TransferDto = {
        destinationUserId: 'destination-user-id',
        amount: 50,
        description: 'Test transfer',
      };

      const sourceWallet = new Wallet();
      sourceWallet.id = 'source-wallet-id';
      sourceWallet.balance = 100;
      sourceWallet.hasInconsistency = true;

      jest.spyOn(walletRepository, 'findOne').mockResolvedValue(sourceWallet);

      await expect(service.transfer(userId, transferDto)).rejects.toThrow(
        ConflictException,
      );
      expect(walletRepository.findOne).toHaveBeenCalledWith({
        where: { userId },
      });
    });
  });

  describe('findOne', () => {
    it('should return a wallet by id', async () => {
      const walletId = 'wallet-123';
      const mockWallet = {
        id: walletId,
        balance: 100,
        userId: 'user-123',
        user: { id: 'user-123', name: 'Test User' },
      };

      jest
        .spyOn(walletRepository, 'findOne')
        .mockResolvedValue(mockWallet as any);

      const result = await service.findOne(walletId);

      expect(result).toEqual(mockWallet);
      expect(walletRepository.findOne).toHaveBeenCalledWith({
        where: { id: walletId },
        relations: ['user'],
      });
    });

    it('should throw NotFoundException when wallet not found', async () => {
      const walletId = 'non-existent-wallet';

      jest.spyOn(walletRepository, 'findOne').mockResolvedValue(null);

      await expect(service.findOne(walletId)).rejects.toThrow(
        NotFoundException,
      );
      expect(walletRepository.findOne).toHaveBeenCalledWith({
        where: { id: walletId },
        relations: ['user'],
      });
    });
  });

  describe('findByUserId', () => {
    it('should return a wallet by user id', async () => {
      const userId = 'user-123';
      const mockWallet = {
        id: 'wallet-123',
        balance: 100,
        userId,
        user: { id: userId, name: 'Test User' },
      };

      jest
        .spyOn(walletRepository, 'findOne')
        .mockResolvedValue(mockWallet as any);

      const result = await service.findByUserId(userId);

      expect(result).toEqual(mockWallet);
      expect(walletRepository.findOne).toHaveBeenCalledWith({
        where: { userId },
        relations: ['user'],
      });
    });

    it('should throw NotFoundException when wallet not found by user id', async () => {
      const userId = 'non-existent-user';

      jest.spyOn(walletRepository, 'findOne').mockResolvedValue(null);

      await expect(service.findByUserId(userId)).rejects.toThrow(
        NotFoundException,
      );
      expect(walletRepository.findOne).toHaveBeenCalledWith({
        where: { userId },
        relations: ['user'],
      });
    });
  });

  describe('getBalance', () => {
    it('should return user wallet balance', async () => {
      const userId = 'user-123';
      const mockWallet = {
        id: 'wallet-123',
        balance: 250.75,
        userId,
      };

      jest.spyOn(service, 'findByUserId').mockResolvedValue(mockWallet as any);

      const result = await service.getBalance(userId);

      expect(result).toEqual({ balance: 250.75 });
      expect(service.findByUserId).toHaveBeenCalledWith(userId);
    });
  });

  describe('getTransactions', () => {
    it('should return user wallet transactions', async () => {
      const userId = 'user-123';
      const mockWallet = {
        id: 'wallet-123',
        userId,
      };

      const mockTransactions = [
        { id: 'tx-1', type: TransactionType.TRANSFER, amount: 50 },
        { id: 'tx-2', type: TransactionType.DEPOSIT, amount: 100 },
      ];

      jest.spyOn(service, 'findByUserId').mockResolvedValue(mockWallet as any);
      jest
        .spyOn(transactionRepository, 'find')
        .mockResolvedValue(mockTransactions as any);

      const result = await service.getTransactions(userId);

      expect(result).toEqual(mockTransactions);
      expect(service.findByUserId).toHaveBeenCalledWith(userId);
      expect(transactionRepository.find).toHaveBeenCalledWith({
        where: [
          { sourceWalletId: 'wallet-123' },
          { destinationWalletId: 'wallet-123' },
        ],
        order: { createdAt: 'DESC' },
      });
    });

    it('should throw NotFoundException when wallet not found for transactions', async () => {
      const userId = 'non-existent-user';

      jest
        .spyOn(service, 'findByUserId')
        .mockRejectedValue(
          new NotFoundException(
            'Carteira para o usuário com ID non-existent-user não encontrada',
          ),
        );

      await expect(service.getTransactions(userId)).rejects.toThrow(
        NotFoundException,
      );
      expect(service.findByUserId).toHaveBeenCalledWith(userId);
    });
  });

  describe('transfer - additional edge cases', () => {
    it('should throw BadRequestException when trying to transfer to self', async () => {
      const userId = 'user-123';
      const transferDto: TransferDto = {
        destinationUserId: userId, // Same as userId - self transfer
        amount: 50,
        description: 'Self transfer attempt',
      };

      const mockSourceWallet = new Wallet();
      mockSourceWallet.id = 'wallet-123';
      mockSourceWallet.balance = 100;
      mockSourceWallet.userId = userId;
      mockSourceWallet.hasInconsistency = false;

      jest
        .spyOn(walletRepository, 'findOne')
        .mockResolvedValue(mockSourceWallet);

      await expect(service.transfer(userId, transferDto)).rejects.toThrow(
        'Não é possível realizar transferência para você mesmo',
      );
      expect(walletRepository.findOne).toHaveBeenCalledWith({
        where: { userId },
      });
    });

    it('should throw NotFoundException when source wallet not found', async () => {
      const userId = 'user-123';
      const transferDto: TransferDto = {
        destinationUserId: 'user-456',
        amount: 100,
        description: 'Test transfer',
      };

      jest.spyOn(walletRepository, 'findOne').mockResolvedValue(null);

      await expect(service.transfer(userId, transferDto)).rejects.toThrow(
        NotFoundException,
      );
      expect(walletRepository.findOne).toHaveBeenCalledWith({
        where: { userId },
      });
    });

    it('should throw ConflictException when source wallet has inconsistency', async () => {
      const userId = 'user-123';
      const transferDto: TransferDto = {
        destinationUserId: 'user-456',
        amount: 100,
        description: 'Test transfer',
      };

      const mockSourceWallet = {
        id: 'wallet-123',
        balance: 200,
        userId,
        hasInconsistency: true,
      };

      jest
        .spyOn(walletRepository, 'findOne')
        .mockResolvedValue(mockSourceWallet as any);

      await expect(service.transfer(userId, transferDto)).rejects.toThrow(
        ConflictException,
      );
    });

    it('should throw BadRequestException when insufficient balance', async () => {
      const userId = 'user-123';
      const transferDto: TransferDto = {
        destinationUserId: 'user-456',
        amount: 300,
        description: 'Test transfer',
      };

      const mockSourceWallet = {
        id: 'wallet-123',
        balance: 200,
        userId,
        hasInconsistency: false,
      };

      jest
        .spyOn(walletRepository, 'findOne')
        .mockResolvedValue(mockSourceWallet as any);

      await expect(service.transfer(userId, transferDto)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw NotFoundException when destination wallet not found', async () => {
      const userId = 'user-123';
      const transferDto: TransferDto = {
        destinationUserId: 'user-456',
        amount: 100,
        description: 'Test transfer',
      };

      const mockSourceWallet = {
        id: 'wallet-123',
        balance: 200,
        userId,
        hasInconsistency: false,
      };

      const mockDestinationUser = {
        id: 'user-456',
        name: 'Destination User',
      };

      jest
        .spyOn(walletRepository, 'findOne')
        .mockResolvedValueOnce(mockSourceWallet as any)
        .mockResolvedValueOnce(null);
      jest
        .spyOn(usersService, 'findOne')
        .mockResolvedValue(mockDestinationUser as any);

      await expect(service.transfer(userId, transferDto)).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
