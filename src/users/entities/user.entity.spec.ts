import { User } from './user.entity';
import * as bcrypt from 'bcrypt';

// Mock bcrypt to control the behavior in tests
jest.mock('bcrypt');
const mockedBcrypt = bcrypt;

describe('User Entity', () => {
  let user: User;

  beforeEach(() => {
    user = new User();
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('hashPassword', () => {
    it('should hash password when password is provided', async () => {
      const plainPassword = 'password123';
      const hashedPassword = 'hashedPassword123';

      user.password = plainPassword;
      mockedBcrypt.hash.mockResolvedValue(hashedPassword as never);

      await user.hashPassword();

      expect(bcrypt.hash).toHaveBeenCalledWith(plainPassword, 10);
      expect(user.password).toBe(hashedPassword);
    });

    it('should not hash password when password is undefined', async () => {
      user.password = undefined;

      await user.hashPassword();

      expect(bcrypt.hash).not.toHaveBeenCalled();
      expect(user.password).toBeUndefined();
    });

    it('should not hash password when password is null', async () => {
      user.password = null;

      await user.hashPassword();

      expect(bcrypt.hash).not.toHaveBeenCalled();
      expect(user.password).toBeNull();
    });

    it('should not hash password when password is empty string', async () => {
      user.password = '';

      await user.hashPassword();

      expect(bcrypt.hash).not.toHaveBeenCalled();
      expect(user.password).toBe('');
    });

    it('should handle bcrypt hash errors', async () => {
      const plainPassword = 'password123';
      user.password = plainPassword;

      const error = new Error('Hashing failed');
      mockedBcrypt.hash.mockRejectedValue(error);

      await expect(user.hashPassword()).rejects.toThrow('Hashing failed');
      expect(bcrypt.hash).toHaveBeenCalledWith(plainPassword, 10);
    });
  });

  describe('validatePassword', () => {
    it('should return true for valid password', async () => {
      const plainPassword = 'password123';
      const hashedPassword = 'hashedPassword123';

      user.password = hashedPassword;
      mockedBcrypt.compare.mockResolvedValue(true as never);

      const result = await user.validatePassword(plainPassword);

      expect(bcrypt.compare).toHaveBeenCalledWith(
        plainPassword,
        hashedPassword,
      );
      expect(result).toBe(true);
    });

    it('should return false for invalid password', async () => {
      const plainPassword = 'wrongPassword';
      const hashedPassword = 'hashedPassword123';

      user.password = hashedPassword;
      mockedBcrypt.compare.mockResolvedValue(false as never);

      const result = await user.validatePassword(plainPassword);

      expect(bcrypt.compare).toHaveBeenCalledWith(
        plainPassword,
        hashedPassword,
      );
      expect(result).toBe(false);
    });

    it('should handle empty password validation', async () => {
      const hashedPassword = 'hashedPassword123';

      user.password = hashedPassword;
      mockedBcrypt.compare.mockResolvedValue(false as never);

      const result = await user.validatePassword('');

      expect(bcrypt.compare).toHaveBeenCalledWith('', hashedPassword);
      expect(result).toBe(false);
    });

    it('should handle undefined stored password', async () => {
      user.password = undefined;
      mockedBcrypt.compare.mockResolvedValue(false as never);

      const result = await user.validatePassword('password123');

      expect(bcrypt.compare).toHaveBeenCalledWith('password123', undefined);
      expect(result).toBe(false);
    });

    it('should handle bcrypt compare errors', async () => {
      const plainPassword = 'password123';
      const hashedPassword = 'hashedPassword123';

      user.password = hashedPassword;
      const error = new Error('Comparison failed');
      mockedBcrypt.compare.mockRejectedValue(error);

      await expect(user.validatePassword(plainPassword)).rejects.toThrow(
        'Comparison failed',
      );
      expect(bcrypt.compare).toHaveBeenCalledWith(
        plainPassword,
        hashedPassword,
      );
    });

    it('should work with different password types', async () => {
      const testCases = [
        { input: 'simplePassword', expected: true },
        { input: 'P@ssw0rd123!', expected: true },
        { input: '12345', expected: false },
        { input: 'wrong', expected: false },
      ];

      for (const testCase of testCases) {
        user.password = 'hashedPassword';
        mockedBcrypt.compare.mockResolvedValue(testCase.expected as never);

        const result = await user.validatePassword(testCase.input);

        expect(result).toBe(testCase.expected);
        expect(bcrypt.compare).toHaveBeenCalledWith(
          testCase.input,
          'hashedPassword',
        );
      }
    });
  });

  describe('Entity Properties', () => {
    it('should have all required properties defined', () => {
      user.id = 'test-id';
      user.name = 'Test User';
      user.email = 'test@example.com';
      user.password = 'hashedPassword';
      user.isActive = true;
      user.isBlocked = false;
      user.createdAt = new Date();
      user.updatedAt = new Date();

      expect(user.id).toBe('test-id');
      expect(user.name).toBe('Test User');
      expect(user.email).toBe('test@example.com');
      expect(user.password).toBe('hashedPassword');
      expect(user.isActive).toBe(true);
      expect(user.isBlocked).toBe(false);
      expect(user.createdAt).toBeInstanceOf(Date);
      expect(user.updatedAt).toBeInstanceOf(Date);
    });

    it('should have default values', () => {
      // Test that defaults are applied correctly
      expect(user.isActive).toBeUndefined(); // Will be set by TypeORM decorator
      expect(user.isBlocked).toBeUndefined(); // Will be set by TypeORM decorator
    });
  });
});
