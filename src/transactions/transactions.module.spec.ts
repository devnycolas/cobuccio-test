import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { TransactionsService } from './transactions.service';
import { TransactionsController } from './transactions.controller';
import { Transaction } from './entities/transaction.entity';
import { Wallet } from '../wallet/entities/wallet.entity';
import { WalletService } from '../wallet/wallet.service';

describe('TransactionsModule', () => {
  let module: TestingModule;

  beforeEach(async () => {
    module = await Test.createTestingModule({
      controllers: [TransactionsController],
      providers: [
        TransactionsService,
        {
          provide: getRepositoryToken(Transaction),
          useValue: {
            findOne: jest.fn(),
            find: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(Wallet),
          useValue: {
            findOne: jest.fn(),
            find: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
          },
        },
        {
          provide: DataSource,
          useValue: {
            createQueryRunner: jest.fn().mockReturnValue({
              connect: jest.fn(),
              startTransaction: jest.fn(),
              commitTransaction: jest.fn(),
              rollbackTransaction: jest.fn(),
              release: jest.fn(),
            }),
          },
        },
        {
          provide: WalletService,
          useValue: {
            findByUserId: jest.fn(),
            updateBalance: jest.fn(),
          },
        },
      ],
    }).compile();
  });

  afterEach(async () => {
    if (module) {
      await module.close();
    }
  });

  it('should be defined', () => {
    expect(module).toBeDefined();
  });

  it('should have TransactionsService defined', () => {
    const transactionsService =
      module.get<TransactionsService>(TransactionsService);
    expect(transactionsService).toBeDefined();
  });

  it('should have TransactionsController defined', () => {
    const transactionsController = module.get<TransactionsController>(
      TransactionsController,
    );
    expect(transactionsController).toBeDefined();
  });

  it('should export TransactionsService', () => {
    const transactionsService =
      module.get<TransactionsService>(TransactionsService);
    expect(transactionsService).toBeDefined();
    expect(transactionsService).toBeInstanceOf(TransactionsService);
  });

  it('should have Transaction repository mock', () => {
    const transactionRepository = module.get(getRepositoryToken(Transaction));
    expect(transactionRepository).toBeDefined();
    expect(transactionRepository.findOne).toBeDefined();
  });

  it('should have Wallet repository mock', () => {
    const walletRepository = module.get(getRepositoryToken(Wallet));
    expect(walletRepository).toBeDefined();
    expect(walletRepository.findOne).toBeDefined();
  });

  it('should have WalletService mock', () => {
    const walletService = module.get<WalletService>(WalletService);
    expect(walletService).toBeDefined();
    expect(walletService.findByUserId).toBeDefined();
  });

  it('should compile module successfully', async () => {
    const app = module.createNestApplication();
    expect(app).toBeDefined();
    await app.close();
  });
});
