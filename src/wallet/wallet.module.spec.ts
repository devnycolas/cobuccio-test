import { Test, TestingModule } from '@nestjs/testing';
import { WalletService } from './wallet.service';
import { WalletController } from './wallet.controller';
import { Wallet } from './entities/wallet.entity';
import { Transaction } from '../transactions/entities/transaction.entity';
import { UsersService } from '../users/users.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

describe('WalletModule', () => {
  let module: TestingModule;

  beforeEach(async () => {
    module = await Test.createTestingModule({
      controllers: [WalletController],
      providers: [
        WalletService,
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
          provide: getRepositoryToken(Transaction),
          useValue: {
            findOne: jest.fn(),
            find: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
          },
        },
        {
          provide: UsersService,
          useValue: {
            findOne: jest.fn(),
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

  it('should have WalletService defined', () => {
    const walletService = module.get<WalletService>(WalletService);
    expect(walletService).toBeDefined();
  });

  it('should have WalletController defined', () => {
    const walletController = module.get<WalletController>(WalletController);
    expect(walletController).toBeDefined();
  });

  it('should export WalletService', () => {
    const walletService = module.get<WalletService>(WalletService);
    expect(walletService).toBeDefined();
    expect(walletService).toBeInstanceOf(WalletService);
  });

  it('should have Wallet repository mock', () => {
    const walletRepository = module.get(getRepositoryToken(Wallet));
    expect(walletRepository).toBeDefined();
    expect(walletRepository.findOne).toBeDefined();
  });

  it('should have Transaction repository mock', () => {
    const transactionRepository = module.get(getRepositoryToken(Transaction));
    expect(transactionRepository).toBeDefined();
    expect(transactionRepository.findOne).toBeDefined();
  });

  it('should have UsersService mock', () => {
    const usersService = module.get<UsersService>(UsersService);
    expect(usersService).toBeDefined();
    expect(usersService.findOne).toBeDefined();
  });

  it('should have DataSource mock', () => {
    const dataSource = module.get<DataSource>(DataSource);
    expect(dataSource).toBeDefined();
    expect(dataSource.createQueryRunner).toBeDefined();
  });

  it('should compile module successfully', async () => {
    const app = module.createNestApplication();
    expect(app).toBeDefined();
    await app.close();
  });
});
