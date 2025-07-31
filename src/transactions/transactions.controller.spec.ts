import { Test, TestingModule } from '@nestjs/testing';
import { TransactionsController } from './transactions.controller';
import { TransactionsService } from './transactions.service';
import { ReverseTransactionDto } from './dto/reverse-transaction.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import {
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';

describe('TransactionsController', () => {
  let controller: TransactionsController;
  let service: TransactionsService;

  const mockTransactionsService = {
    findTransactionsByUserId: jest.fn(),
    findTransactionById: jest.fn(),
    reverseTransaction: jest.fn(),
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
      controllers: [TransactionsController],
      providers: [
        {
          provide: TransactionsService,
          useValue: mockTransactionsService,
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: jest.fn(() => true) })
      .compile();

    controller = module.get<TransactionsController>(TransactionsController);
    service = module.get<TransactionsService>(TransactionsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('findAll', () => {
    it('should return all transactions for the user', async () => {
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
          amount: 50,
          type: 'TRANSFER',
          description: 'Test transfer',
          createdAt: new Date(),
        },
      ];

      mockTransactionsService.findTransactionsByUserId.mockResolvedValue(
        expectedTransactions,
      );

      const result = await controller.findAll(mockRequest);

      expect(service.findTransactionsByUserId).toHaveBeenCalledWith(
        mockRequest.user.id,
      );
      expect(result).toEqual(expectedTransactions);
    });

    it('should throw NotFoundException when wallet not found', async () => {
      mockTransactionsService.findTransactionsByUserId.mockRejectedValue(
        new NotFoundException('Carteira não encontrada'),
      );

      await expect(controller.findAll(mockRequest)).rejects.toThrow(
        NotFoundException,
      );
      expect(service.findTransactionsByUserId).toHaveBeenCalledWith(
        mockRequest.user.id,
      );
    });
  });

  describe('findOne', () => {
    it('should return a specific transaction', async () => {
      const transactionId = 'transaction-123';
      const expectedTransaction = {
        id: transactionId,
        amount: 100,
        type: 'DEPOSIT',
        description: 'Test deposit',
        createdAt: new Date(),
      };

      mockTransactionsService.findTransactionById.mockResolvedValue(
        expectedTransaction,
      );

      const result = await controller.findOne(transactionId);

      expect(service.findTransactionById).toHaveBeenCalledWith(transactionId);
      expect(result).toEqual(expectedTransaction);
    });

    it('should throw NotFoundException when transaction not found', async () => {
      const transactionId = 'non-existent-transaction';

      mockTransactionsService.findTransactionById.mockRejectedValue(
        new NotFoundException('Transação não encontrada'),
      );

      await expect(controller.findOne(transactionId)).rejects.toThrow(
        NotFoundException,
      );
      expect(service.findTransactionById).toHaveBeenCalledWith(transactionId);
    });
  });

  describe('reverse', () => {
    it('should reverse a transaction successfully', async () => {
      const reverseTransactionDto: ReverseTransactionDto = {
        transactionId: 'transaction-123',
        reason: 'Erro no valor',
      };

      const expectedResult = {
        success: true,
        message: 'Transação revertida com sucesso',
        originalTransaction: {
          id: 'transaction-123',
          amount: 100,
          type: 'DEPOSIT',
        },
        reversalTransaction: {
          id: 'reversal-456',
          amount: -100,
          type: 'REVERSAL',
        },
      };

      mockTransactionsService.reverseTransaction.mockResolvedValue(
        expectedResult,
      );

      const result = await controller.reverse(
        mockRequest,
        reverseTransactionDto,
      );

      expect(service.reverseTransaction).toHaveBeenCalledWith(
        mockRequest.user.id,
        reverseTransactionDto,
      );
      expect(result).toEqual(expectedResult);
    });

    it('should throw NotFoundException when transaction not found', async () => {
      const reverseTransactionDto: ReverseTransactionDto = {
        transactionId: 'non-existent-transaction',
        reason: 'Test reason',
      };

      mockTransactionsService.reverseTransaction.mockRejectedValue(
        new NotFoundException('Transação não encontrada'),
      );

      await expect(
        controller.reverse(mockRequest, reverseTransactionDto),
      ).rejects.toThrow(NotFoundException);
      expect(service.reverseTransaction).toHaveBeenCalledWith(
        mockRequest.user.id,
        reverseTransactionDto,
      );
    });

    it('should throw ConflictException when transaction already reversed', async () => {
      const reverseTransactionDto: ReverseTransactionDto = {
        transactionId: 'already-reversed-transaction',
        reason: 'Test reason',
      };

      mockTransactionsService.reverseTransaction.mockRejectedValue(
        new ConflictException('Transação já revertida'),
      );

      await expect(
        controller.reverse(mockRequest, reverseTransactionDto),
      ).rejects.toThrow(ConflictException);
      expect(service.reverseTransaction).toHaveBeenCalledWith(
        mockRequest.user.id,
        reverseTransactionDto,
      );
    });

    it('should throw BadRequestException for insufficient balance', async () => {
      const reverseTransactionDto: ReverseTransactionDto = {
        transactionId: 'transaction-123',
        reason: 'Test reason',
      };

      mockTransactionsService.reverseTransaction.mockRejectedValue(
        new BadRequestException('Saldo insuficiente'),
      );

      await expect(
        controller.reverse(mockRequest, reverseTransactionDto),
      ).rejects.toThrow(BadRequestException);
      expect(service.reverseTransaction).toHaveBeenCalledWith(
        mockRequest.user.id,
        reverseTransactionDto,
      );
    });
  });
});
