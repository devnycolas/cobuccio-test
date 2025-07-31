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
});
