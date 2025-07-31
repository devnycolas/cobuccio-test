import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { UnauthorizedException } from '@nestjs/common';
import { JwtStrategy } from './jwt.strategy';
import { UsersService } from '../../users/users.service';
import { User } from '../../users/entities/user.entity';

describe('JwtStrategy', () => {
  let strategy: JwtStrategy;
  let usersService: UsersService;
  let configService: ConfigService;

  const mockConfigService = {
    get: jest.fn(),
  };

  const mockUsersService = {
    findOne: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JwtStrategy,
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
        {
          provide: UsersService,
          useValue: mockUsersService,
        },
      ],
    }).compile();

    strategy = module.get<JwtStrategy>(JwtStrategy);
    usersService = module.get<UsersService>(UsersService);
    configService = module.get<ConfigService>(ConfigService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(strategy).toBeDefined();
  });

  describe('validate', () => {
    it('should return user data for valid active user', async () => {
      const payload = { sub: 'user-id-123' };
      const mockUser: Partial<User> = {
        id: 'user-id-123',
        email: 'test@example.com',
        name: 'Test User',
        isActive: true,
        isBlocked: false,
      };

      mockUsersService.findOne.mockResolvedValue(mockUser);

      const result = await strategy.validate(payload);

      expect(usersService.findOne).toHaveBeenCalledWith(payload.sub);
      expect(result).toEqual({
        id: mockUser.id,
        email: mockUser.email,
        name: mockUser.name,
      });
    });

    it('should throw UnauthorizedException for inactive user', async () => {
      const payload = { sub: 'user-id-123' };
      const mockUser: Partial<User> = {
        id: 'user-id-123',
        email: 'test@example.com',
        name: 'Test User',
        isActive: false,
        isBlocked: false,
      };

      mockUsersService.findOne.mockResolvedValue(mockUser);

      await expect(strategy.validate(payload)).rejects.toThrow(
        new UnauthorizedException('Usuário inativo ou bloqueado'),
      );
      expect(usersService.findOne).toHaveBeenCalledWith(payload.sub);
    });

    it('should throw UnauthorizedException for blocked user', async () => {
      const payload = { sub: 'user-id-123' };
      const mockUser: Partial<User> = {
        id: 'user-id-123',
        email: 'test@example.com',
        name: 'Test User',
        isActive: true,
        isBlocked: true,
      };

      mockUsersService.findOne.mockResolvedValue(mockUser);

      await expect(strategy.validate(payload)).rejects.toThrow(
        new UnauthorizedException('Usuário inativo ou bloqueado'),
      );
      expect(usersService.findOne).toHaveBeenCalledWith(payload.sub);
    });

    it('should throw UnauthorizedException when user not found', async () => {
      const payload = { sub: 'non-existent-user' };

      mockUsersService.findOne.mockRejectedValue(new Error('User not found'));

      await expect(strategy.validate(payload)).rejects.toThrow(
        new UnauthorizedException('Token inválido ou expirado'),
      );
      expect(usersService.findOne).toHaveBeenCalledWith(payload.sub);
    });

    it('should throw UnauthorizedException when usersService throws any error', async () => {
      const payload = { sub: 'user-id-123' };

      mockUsersService.findOne.mockRejectedValue(
        new Error('Database connection error'),
      );

      await expect(strategy.validate(payload)).rejects.toThrow(
        new UnauthorizedException('Token inválido ou expirado'),
      );
      expect(usersService.findOne).toHaveBeenCalledWith(payload.sub);
    });

    it('should handle user that is both inactive and blocked', async () => {
      const payload = { sub: 'user-id-123' };
      const mockUser: Partial<User> = {
        id: 'user-id-123',
        email: 'test@example.com',
        name: 'Test User',
        isActive: false,
        isBlocked: true,
      };

      mockUsersService.findOne.mockResolvedValue(mockUser);

      await expect(strategy.validate(payload)).rejects.toThrow(
        new UnauthorizedException('Usuário inativo ou bloqueado'),
      );
      expect(usersService.findOne).toHaveBeenCalledWith(payload.sub);
    });
  });

  describe('constructor', () => {
    it('should use JWT_SECRET from config service', () => {
      mockConfigService.get.mockReturnValue('test-secret-key');

      // Create a new instance to test constructor
      const newStrategy = new JwtStrategy(configService, usersService);

      expect(configService.get).toHaveBeenCalledWith('JWT_SECRET');
      expect(newStrategy).toBeDefined();
    });

    it('should use default secret when JWT_SECRET is not configured', () => {
      mockConfigService.get.mockReturnValue(null);

      // Create a new instance to test constructor
      const newStrategy = new JwtStrategy(configService, usersService);

      expect(configService.get).toHaveBeenCalledWith('JWT_SECRET');
      expect(newStrategy).toBeDefined();
    });
  });
});
