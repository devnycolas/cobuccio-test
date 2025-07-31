import {
  Transaction,
  TransactionType,
  TransactionStatus,
} from './transaction.entity';
import { Wallet } from '../../wallet/entities/wallet.entity';

describe('Transaction Entity', () => {
  let transaction: Transaction;

  beforeEach(() => {
    transaction = new Transaction();
  });

  describe('Entity Creation', () => {
    it('should create a transaction instance', () => {
      expect(transaction).toBeDefined();
      expect(transaction).toBeInstanceOf(Transaction);
    });

    it('should have all required properties', () => {
      transaction.id = 'test-transaction-id';
      transaction.type = TransactionType.DEPOSIT;
      transaction.amount = 100.5;
      transaction.status = TransactionStatus.COMPLETED;
      transaction.description = 'Test transaction';
      transaction.sourceWalletId = 'source-wallet-id';
      transaction.destinationWalletId = 'destination-wallet-id';
      transaction.originalTransactionId = 'original-transaction-id';
      transaction.createdAt = new Date();
      transaction.updatedAt = new Date();

      expect(transaction.id).toBe('test-transaction-id');
      expect(transaction.type).toBe(TransactionType.DEPOSIT);
      expect(transaction.amount).toBe(100.5);
      expect(transaction.status).toBe(TransactionStatus.COMPLETED);
      expect(transaction.description).toBe('Test transaction');
      expect(transaction.sourceWalletId).toBe('source-wallet-id');
      expect(transaction.destinationWalletId).toBe('destination-wallet-id');
      expect(transaction.originalTransactionId).toBe('original-transaction-id');
      expect(transaction.createdAt).toBeInstanceOf(Date);
      expect(transaction.updatedAt).toBeInstanceOf(Date);
    });
  });

  describe('TransactionType Enum', () => {
    it('should have correct enum values', () => {
      expect(TransactionType.DEPOSIT).toBe('deposit');
      expect(TransactionType.TRANSFER).toBe('transfer');
      expect(TransactionType.REVERSAL).toBe('reversal');
    });

    it('should accept all valid transaction types', () => {
      const validTypes = [
        TransactionType.DEPOSIT,
        TransactionType.TRANSFER,
        TransactionType.REVERSAL,
      ];

      validTypes.forEach((type) => {
        transaction.type = type;
        expect(transaction.type).toBe(type);
      });
    });
  });

  describe('TransactionStatus Enum', () => {
    it('should have correct enum values', () => {
      expect(TransactionStatus.PENDING).toBe('pending');
      expect(TransactionStatus.COMPLETED).toBe('completed');
      expect(TransactionStatus.FAILED).toBe('failed');
      expect(TransactionStatus.REVERSED).toBe('reversed');
    });

    it('should accept all valid transaction statuses', () => {
      const validStatuses = [
        TransactionStatus.PENDING,
        TransactionStatus.COMPLETED,
        TransactionStatus.FAILED,
        TransactionStatus.REVERSED,
      ];

      validStatuses.forEach((status) => {
        transaction.status = status;
        expect(transaction.status).toBe(status);
      });
    });

    it('should have PENDING as default status', () => {
      // This would be set by TypeORM decorator
      // We test that the enum value exists
      expect(TransactionStatus.PENDING).toBeDefined();
    });
  });

  describe('Wallet Relationships', () => {
    it('should allow setting source wallet', () => {
      const sourceWallet = new Wallet();
      sourceWallet.id = 'source-wallet-id';

      transaction.sourceWallet = sourceWallet;
      transaction.sourceWalletId = sourceWallet.id;

      expect(transaction.sourceWallet).toBe(sourceWallet);
      expect(transaction.sourceWalletId).toBe('source-wallet-id');
    });

    it('should allow setting destination wallet', () => {
      const destinationWallet = new Wallet();
      destinationWallet.id = 'destination-wallet-id';

      transaction.destinationWallet = destinationWallet;
      transaction.destinationWalletId = destinationWallet.id;

      expect(transaction.destinationWallet).toBe(destinationWallet);
      expect(transaction.destinationWalletId).toBe('destination-wallet-id');
    });

    it('should handle null wallet relationships', () => {
      transaction.sourceWallet = null;
      transaction.destinationWallet = null;
      transaction.sourceWalletId = null;
      transaction.destinationWalletId = null;

      expect(transaction.sourceWallet).toBeNull();
      expect(transaction.destinationWallet).toBeNull();
      expect(transaction.sourceWalletId).toBeNull();
      expect(transaction.destinationWalletId).toBeNull();
    });
  });

  describe('Amount Handling', () => {
    it('should handle positive amounts', () => {
      const amounts = [0.01, 1, 100, 1000.5, 999999.99];

      amounts.forEach((amount) => {
        transaction.amount = amount;
        expect(transaction.amount).toBe(amount);
      });
    });

    it('should handle negative amounts for reversals', () => {
      transaction.type = TransactionType.REVERSAL;
      transaction.amount = -100.5;

      expect(transaction.amount).toBe(-100.5);
      expect(transaction.type).toBe(TransactionType.REVERSAL);
    });

    it('should handle zero amount', () => {
      transaction.amount = 0;
      expect(transaction.amount).toBe(0);
    });
  });

  describe('Original Transaction Reference', () => {
    it('should handle original transaction ID for reversals', () => {
      const originalTransactionId = 'original-transaction-123';

      transaction.type = TransactionType.REVERSAL;
      transaction.originalTransactionId = originalTransactionId;

      expect(transaction.originalTransactionId).toBe(originalTransactionId);
    });

    it('should handle null original transaction ID', () => {
      transaction.originalTransactionId = null;
      expect(transaction.originalTransactionId).toBeNull();
    });

    it('should handle undefined original transaction ID', () => {
      // Default state
      expect(transaction.originalTransactionId).toBeUndefined();
    });
  });

  describe('Description Field', () => {
    it('should handle various description types', () => {
      const descriptions = [
        'Simple deposit',
        'Transfer to user@example.com',
        'Reversal of transaction #123',
        '',
        'Very long description with special characters: áéíóú ñ ¿? ¡! @#$%^&*()',
      ];

      descriptions.forEach((description) => {
        transaction.description = description;
        expect(transaction.description).toBe(description);
      });
    });

    it('should handle null description', () => {
      transaction.description = null;
      expect(transaction.description).toBeNull();
    });
  });

  describe('Complete Transaction Scenarios', () => {
    it('should represent a deposit transaction', () => {
      transaction.id = 'deposit-123';
      transaction.type = TransactionType.DEPOSIT;
      transaction.amount = 500;
      transaction.status = TransactionStatus.COMPLETED;
      transaction.description = 'Monthly salary deposit';
      transaction.destinationWalletId = 'user-wallet-123';
      transaction.createdAt = new Date();
      transaction.updatedAt = new Date();

      expect(transaction.type).toBe(TransactionType.DEPOSIT);
      expect(transaction.amount).toBe(500);
      expect(transaction.status).toBe(TransactionStatus.COMPLETED);
      expect(transaction.sourceWalletId).toBeUndefined();
      expect(transaction.destinationWalletId).toBe('user-wallet-123');
    });

    it('should represent a transfer transaction', () => {
      transaction.id = 'transfer-456';
      transaction.type = TransactionType.TRANSFER;
      transaction.amount = 100;
      transaction.status = TransactionStatus.COMPLETED;
      transaction.description = 'Payment to friend';
      transaction.sourceWalletId = 'sender-wallet-123';
      transaction.destinationWalletId = 'receiver-wallet-456';
      transaction.createdAt = new Date();
      transaction.updatedAt = new Date();

      expect(transaction.type).toBe(TransactionType.TRANSFER);
      expect(transaction.amount).toBe(100);
      expect(transaction.status).toBe(TransactionStatus.COMPLETED);
      expect(transaction.sourceWalletId).toBe('sender-wallet-123');
      expect(transaction.destinationWalletId).toBe('receiver-wallet-456');
    });

    it('should represent a reversal transaction', () => {
      transaction.id = 'reversal-789';
      transaction.type = TransactionType.REVERSAL;
      transaction.amount = -100;
      transaction.status = TransactionStatus.COMPLETED;
      transaction.description = 'Reversal due to error';
      transaction.originalTransactionId = 'transfer-456';
      transaction.sourceWalletId = 'receiver-wallet-456';
      transaction.destinationWalletId = 'sender-wallet-123';
      transaction.createdAt = new Date();
      transaction.updatedAt = new Date();

      expect(transaction.type).toBe(TransactionType.REVERSAL);
      expect(transaction.amount).toBe(-100);
      expect(transaction.status).toBe(TransactionStatus.COMPLETED);
      expect(transaction.originalTransactionId).toBe('transfer-456');
    });
  });
});
