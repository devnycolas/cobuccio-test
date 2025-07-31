import { Test, TestingModule } from '@nestjs/testing';
import { WalletController } from './wallet.controller';
import { WalletService } from './wallet.service';
import { DepositDto } from './dto/deposit.dto';
import { TransferDto } from './dto/transfer.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import {
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';

describe('WalletController', () => {
  let controller: WalletController;
  let service: WalletService;

  const mockWalletService = {
    getBalance: jest.fn(),
    getTransactions: jest.fn(),
    deposit: jest.fn(),
    transfer: jest.fn(),
  };

  const mockRequest = {
    user: {
      id: 'user-id-123',
      email: 'test@example.com',
      name: 'Test User',
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [WalletController],
      providers: [
        {
          provide: WalletService,
          useValue: mockWalletService,
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: jest.fn(() => true) })
      .compile();

    controller = module.get<WalletController>(WalletController);
    service = module.get<WalletService>(WalletService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getBalance', () => {
    it('should return wallet balance', async () => {
      const expectedBalance = {
        userId: mockRequest.user.id,
        balance: 1000.5,
        walletId: 'wallet-123',
      };

      mockWalletService.getBalance.mockResolvedValue(expectedBalance);

      const result = await controller.getBalance(mockRequest);

      expect(service.getBalance).toHaveBeenCalledWith(mockRequest.user.id);
      expect(result).toEqual(expectedBalance);
    });

    it('should throw NotFoundException when wallet not found', async () => {
      mockWalletService.getBalance.mockRejectedValue(
        new NotFoundException('Carteira não encontrada'),
      );

      await expect(controller.getBalance(mockRequest)).rejects.toThrow(
        NotFoundException,
      );
      expect(service.getBalance).toHaveBeenCalledWith(mockRequest.user.id);
    });
  });

  describe('getTransactions', () => {
    it('should return wallet transactions', async () => {
      const expectedTransactions = [
        {
          id: 'transaction-1',
          amount: 100,
          type: 'DEPOSIT',
          description: 'Test deposit',
          createdAt: new Date(),
        },
        {
          id: 'transaction-2',
          amount: -50,
          type: 'TRANSFER',
          description: 'Test transfer',
          createdAt: new Date(),
        },
      ];

      mockWalletService.getTransactions.mockResolvedValue(expectedTransactions);

      const result = await controller.getTransactions(mockRequest);

      expect(service.getTransactions).toHaveBeenCalledWith(mockRequest.user.id);
      expect(result).toEqual(expectedTransactions);
    });

    it('should throw NotFoundException when wallet not found', async () => {
      mockWalletService.getTransactions.mockRejectedValue(
        new NotFoundException('Carteira não encontrada'),
      );

      await expect(controller.getTransactions(mockRequest)).rejects.toThrow(
        NotFoundException,
      );
      expect(service.getTransactions).toHaveBeenCalledWith(mockRequest.user.id);
    });
  });

  describe('deposit', () => {
    it('should deposit money successfully', async () => {
      const depositDto: DepositDto = {
        amount: 100.5,
        description: 'Test deposit',
      };

      const expectedResult = {
        success: true,
        message: 'Depósito realizado com sucesso',
        transaction: {
          id: 'transaction-123',
          amount: 100.5,
          type: 'DEPOSIT',
          description: 'Test deposit',
        },
        newBalance: 1100.5,
      };

      mockWalletService.deposit.mockResolvedValue(expectedResult);

      const result = await controller.deposit(mockRequest, depositDto);

      expect(service.deposit).toHaveBeenCalledWith(
        mockRequest.user.id,
        depositDto,
      );
      expect(result).toEqual(expectedResult);
    });

    it('should throw NotFoundException when wallet not found', async () => {
      const depositDto: DepositDto = {
        amount: 100,
        description: 'Test deposit',
      };

      mockWalletService.deposit.mockRejectedValue(
        new NotFoundException('Carteira não encontrada'),
      );

      await expect(controller.deposit(mockRequest, depositDto)).rejects.toThrow(
        NotFoundException,
      );
      expect(service.deposit).toHaveBeenCalledWith(
        mockRequest.user.id,
        depositDto,
      );
    });

    it('should throw BadRequestException for invalid data', async () => {
      const depositDto: DepositDto = {
        amount: -100,
        description: 'Invalid deposit',
      };

      mockWalletService.deposit.mockRejectedValue(
        new BadRequestException('Dados inválidos'),
      );

      await expect(controller.deposit(mockRequest, depositDto)).rejects.toThrow(
        BadRequestException,
      );
      expect(service.deposit).toHaveBeenCalledWith(
        mockRequest.user.id,
        depositDto,
      );
    });

    it('should throw ConflictException for wallet inconsistencies', async () => {
      const depositDto: DepositDto = {
        amount: 100,
        description: 'Test deposit',
      };

      mockWalletService.deposit.mockRejectedValue(
        new ConflictException('Carteira com inconsistências'),
      );

      await expect(controller.deposit(mockRequest, depositDto)).rejects.toThrow(
        ConflictException,
      );
      expect(service.deposit).toHaveBeenCalledWith(
        mockRequest.user.id,
        depositDto,
      );
    });
  });

  describe('transfer', () => {
    it('should transfer money successfully', async () => {
      const transferDto: TransferDto = {
        toUserId: 'recipient-user-id',
        amount: 50.25,
        description: 'Test transfer',
      };

      const expectedResult = {
        success: true,
        message: 'Transferência realizada com sucesso',
        transaction: {
          id: 'transaction-456',
          amount: -50.25,
          type: 'TRANSFER',
          description: 'Test transfer',
          toUserId: 'recipient-user-id',
        },
        newBalance: 949.75,
      };

      mockWalletService.transfer.mockResolvedValue(expectedResult);

      const result = await controller.transfer(mockRequest, transferDto);

      expect(service.transfer).toHaveBeenCalledWith(
        mockRequest.user.id,
        transferDto,
      );
      expect(result).toEqual(expectedResult);
    });

    it('should throw NotFoundException when wallet not found', async () => {
      const transferDto: TransferDto = {
        toUserId: 'recipient-user-id',
        amount: 100,
        description: 'Test transfer',
      };

      mockWalletService.transfer.mockRejectedValue(
        new NotFoundException('Carteira não encontrada'),
      );

      await expect(
        controller.transfer(mockRequest, transferDto),
      ).rejects.toThrow(NotFoundException);
      expect(service.transfer).toHaveBeenCalledWith(
        mockRequest.user.id,
        transferDto,
      );
    });

    it('should throw BadRequestException for insufficient balance', async () => {
      const transferDto: TransferDto = {
        toUserId: 'recipient-user-id',
        amount: 10000,
        description: 'Test transfer',
      };

      mockWalletService.transfer.mockRejectedValue(
        new BadRequestException('Saldo insuficiente'),
      );

      await expect(
        controller.transfer(mockRequest, transferDto),
      ).rejects.toThrow(BadRequestException);
      expect(service.transfer).toHaveBeenCalledWith(
        mockRequest.user.id,
        transferDto,
      );
    });

    it('should throw ConflictException for wallet inconsistencies', async () => {
      const transferDto: TransferDto = {
        toUserId: 'recipient-user-id',
        amount: 100,
        description: 'Test transfer',
      };

      mockWalletService.transfer.mockRejectedValue(
        new ConflictException('Carteira com inconsistências'),
      );

      await expect(
        controller.transfer(mockRequest, transferDto),
      ).rejects.toThrow(ConflictException);
      expect(service.transfer).toHaveBeenCalledWith(
        mockRequest.user.id,
        transferDto,
      );
    });
  });
});
