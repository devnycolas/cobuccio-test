import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { UsersService } from './users.service';
import { User } from './entities/user.entity';
import { Wallet } from '../wallet/entities/wallet.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

describe('UsersService', () => {
  let service: UsersService;
  let repository: Repository<User>;

  const mockRepository = {
    findOne: jest.fn(),
    find: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    remove: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: getRepositoryToken(User),
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    repository = module.get<Repository<User>>(getRepositoryToken(User));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a new user successfully', async () => {
      const createUserDto: CreateUserDto = {
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123',
      };

      const mockUser = {
        id: 'user-id',
        ...createUserDto,
        wallet: new Wallet(),
      };

      mockRepository.findOne.mockResolvedValue(null);
      mockRepository.create.mockReturnValue(mockUser);
      mockRepository.save.mockResolvedValue(mockUser);

      const result = await service.create(createUserDto);

      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { email: createUserDto.email },
      });
      expect(mockRepository.create).toHaveBeenCalledWith(createUserDto);
      expect(mockRepository.save).toHaveBeenCalledWith(mockUser);
      expect(result).toEqual(mockUser);
      expect(result.wallet).toBeInstanceOf(Wallet);
    });

    it('should throw ConflictException when email already exists', async () => {
      const createUserDto: CreateUserDto = {
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123',
      };

      const existingUser = { id: 'existing-id', email: createUserDto.email };
      mockRepository.findOne.mockResolvedValue(existingUser);

      await expect(service.create(createUserDto)).rejects.toThrow(
        ConflictException,
      );
      await expect(service.create(createUserDto)).rejects.toThrow(
        'Email já está em uso',
      );

      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { email: createUserDto.email },
      });
      expect(mockRepository.create).not.toHaveBeenCalled();
      expect(mockRepository.save).not.toHaveBeenCalled();
    });
  });

  describe('findAll', () => {
    it('should return all users', async () => {
      const mockUsers = [
        { id: '1', name: 'User 1', email: 'user1@example.com' },
        { id: '2', name: 'User 2', email: 'user2@example.com' },
      ];

      mockRepository.find.mockResolvedValue(mockUsers);

      const result = await service.findAll();

      expect(mockRepository.find).toHaveBeenCalled();
      expect(result).toEqual(mockUsers);
    });

    it('should return empty array when no users exist', async () => {
      mockRepository.find.mockResolvedValue([]);

      const result = await service.findAll();

      expect(mockRepository.find).toHaveBeenCalled();
      expect(result).toEqual([]);
    });
  });

  describe('findOne', () => {
    it('should return user when found', async () => {
      const userId = 'user-id';
      const mockUser = {
        id: userId,
        name: 'Test User',
        email: 'test@example.com',
        wallet: new Wallet(),
      };

      mockRepository.findOne.mockResolvedValue(mockUser);

      const result = await service.findOne(userId);

      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { id: userId },
        relations: ['wallet'],
      });
      expect(result).toEqual(mockUser);
    });

    it('should throw NotFoundException when user not found', async () => {
      const userId = 'non-existent-id';
      mockRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne(userId)).rejects.toThrow(NotFoundException);
      await expect(service.findOne(userId)).rejects.toThrow(
        `Usuário com ID ${userId} não encontrado`,
      );

      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { id: userId },
        relations: ['wallet'],
      });
    });
  });

  describe('findByEmail', () => {
    it('should return user when found by email', async () => {
      const email = 'test@example.com';
      const mockUser = {
        id: 'user-id',
        name: 'Test User',
        email,
        wallet: new Wallet(),
      };

      mockRepository.findOne.mockResolvedValue(mockUser);

      const result = await service.findByEmail(email);

      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { email },
        relations: ['wallet'],
      });
      expect(result).toEqual(mockUser);
    });

    it('should throw NotFoundException when user not found by email', async () => {
      const email = 'nonexistent@example.com';
      mockRepository.findOne.mockResolvedValue(null);

      await expect(service.findByEmail(email)).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.findByEmail(email)).rejects.toThrow(
        `Usuário com email ${email} não encontrado`,
      );

      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { email },
        relations: ['wallet'],
      });
    });
  });

  describe('update', () => {
    it('should update user successfully', async () => {
      const userId = 'user-id';
      const updateUserDto: UpdateUserDto = {
        name: 'Updated Name',
      };

      const existingUser = {
        id: userId,
        name: 'Old Name',
        email: 'test@example.com',
      };

      const updatedUser = {
        ...existingUser,
        ...updateUserDto,
      };

      jest.spyOn(service, 'findOne').mockResolvedValue(existingUser as User);
      mockRepository.save.mockResolvedValue(updatedUser);

      const result = await service.update(userId, updateUserDto);

      expect(service.findOne).toHaveBeenCalledWith(userId);
      expect(mockRepository.save).toHaveBeenCalledWith(updatedUser);
      expect(result).toEqual(updatedUser);
    });

    it('should update user email when new email is provided and not in use', async () => {
      const userId = 'user-id';
      const updateUserDto: UpdateUserDto = {
        email: 'newemail@example.com',
      };

      const existingUser = {
        id: userId,
        name: 'Test User',
        email: 'oldemail@example.com',
      };

      const updatedUser = {
        ...existingUser,
        ...updateUserDto,
      };

      jest.spyOn(service, 'findOne').mockResolvedValue(existingUser as User);
      mockRepository.findOne.mockResolvedValue(null); // No existing user with new email
      mockRepository.save.mockResolvedValue(updatedUser);

      const result = await service.update(userId, updateUserDto);

      expect(service.findOne).toHaveBeenCalledWith(userId);
      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { email: updateUserDto.email },
      });
      expect(mockRepository.save).toHaveBeenCalledWith(updatedUser);
      expect(result).toEqual(updatedUser);
    });

    it('should throw ConflictException when trying to update to existing email', async () => {
      const userId = 'user-id';
      const updateUserDto: UpdateUserDto = {
        email: 'existing@example.com',
      };

      const existingUser = {
        id: userId,
        name: 'Test User',
        email: 'current@example.com',
      };

      const userWithSameEmail = {
        id: 'other-user-id',
        email: updateUserDto.email,
      };

      jest.spyOn(service, 'findOne').mockResolvedValue(existingUser as User);
      mockRepository.findOne.mockResolvedValue(userWithSameEmail);

      await expect(service.update(userId, updateUserDto)).rejects.toThrow(
        ConflictException,
      );
      await expect(service.update(userId, updateUserDto)).rejects.toThrow(
        'Email já está em uso',
      );

      expect(service.findOne).toHaveBeenCalledWith(userId);
      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { email: updateUserDto.email },
      });
      expect(mockRepository.save).not.toHaveBeenCalled();
    });

    it('should allow updating to same email (no change)', async () => {
      const userId = 'user-id';
      const currentEmail = 'current@example.com';
      const updateUserDto: UpdateUserDto = {
        name: 'Updated Name',
        email: currentEmail, // Same email
      };

      const existingUser = {
        id: userId,
        name: 'Old Name',
        email: currentEmail,
      };

      const updatedUser = {
        ...existingUser,
        ...updateUserDto,
      };

      jest.spyOn(service, 'findOne').mockResolvedValue(existingUser as User);
      mockRepository.save.mockResolvedValue(updatedUser);

      const result = await service.update(userId, updateUserDto);

      expect(service.findOne).toHaveBeenCalledWith(userId);
      // Should not check for email conflict when email hasn't changed
      expect(mockRepository.findOne).not.toHaveBeenCalledWith({
        where: { email: updateUserDto.email },
      });
      expect(mockRepository.save).toHaveBeenCalledWith(updatedUser);
      expect(result).toEqual(updatedUser);
    });
  });

  describe('remove', () => {
    it('should remove user successfully', async () => {
      const userId = 'user-id';
      const existingUser = {
        id: userId,
        name: 'Test User',
        email: 'test@example.com',
      };

      jest.spyOn(service, 'findOne').mockResolvedValue(existingUser as User);
      mockRepository.remove.mockResolvedValue(existingUser);

      await service.remove(userId);

      expect(service.findOne).toHaveBeenCalledWith(userId);
      expect(mockRepository.remove).toHaveBeenCalledWith(existingUser);
    });

    it('should throw NotFoundException when trying to remove non-existent user', async () => {
      const userId = 'non-existent-id';

      jest
        .spyOn(service, 'findOne')
        .mockRejectedValue(
          new NotFoundException(`Usuário com ID ${userId} não encontrado`),
        );

      await expect(service.remove(userId)).rejects.toThrow(NotFoundException);
      await expect(service.remove(userId)).rejects.toThrow(
        `Usuário com ID ${userId} não encontrado`,
      );

      expect(service.findOne).toHaveBeenCalledWith(userId);
      expect(mockRepository.remove).not.toHaveBeenCalled();
    });
  });
});