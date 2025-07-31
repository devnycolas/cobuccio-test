import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { User } from '../users/entities/user.entity';
import { LoginDto } from './dto/login.dto';
import { CreateUserDto } from '../users/dto/create-user.dto';

describe('AuthService', () => {
  let service: AuthService;
  let usersService: UsersService;
  let jwtService: JwtService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: UsersService,
          useValue: {
            findByEmail: jest.fn(),
            create: jest.fn(),
          },
        },
        {
          provide: JwtService,
          useValue: {
            sign: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    usersService = module.get<UsersService>(UsersService);
    jwtService = module.get<JwtService>(JwtService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('validateUser', () => {
    it('should return user object when credentials are valid', async () => {
      const user = new User();
      user.id = 'user-id';
      user.email = 'test@example.com';
      user.name = 'Test User';
      user.password = 'hashedPassword';
      user.isActive = true;
      user.isBlocked = false;
      user.validatePassword = jest.fn().mockResolvedValue(true);

      jest.spyOn(usersService, 'findByEmail').mockResolvedValue(user);

      const result = await service.validateUser('test@example.com', 'password');

      expect(usersService.findByEmail).toHaveBeenCalledWith('test@example.com');
      expect(user.validatePassword).toHaveBeenCalledWith('password');
      expect(result).toEqual({
        id: user.id,
        email: user.email,
        name: user.name,
        isActive: user.isActive,
        isBlocked: user.isBlocked,
      });
    });

    it('should return null when user is not found', async () => {
      jest.spyOn(usersService, 'findByEmail').mockRejectedValue(new Error());

      const result = await service.validateUser(
        'nonexistent@example.com',
        'password',
      );

      expect(usersService.findByEmail).toHaveBeenCalledWith(
        'nonexistent@example.com',
      );
      expect(result).toBeNull();
    });

    it('should return null when password is invalid', async () => {
      const user = new User();
      user.email = 'test@example.com';
      user.validatePassword = jest.fn().mockResolvedValue(false);

      jest.spyOn(usersService, 'findByEmail').mockResolvedValue(user);

      const result = await service.validateUser(
        'test@example.com',
        'wrongpassword',
      );

      expect(usersService.findByEmail).toHaveBeenCalledWith('test@example.com');
      expect(user.validatePassword).toHaveBeenCalledWith('wrongpassword');
      expect(result).toBeNull();
    });

    it('should return null when user is inactive', async () => {
      const user = new User();
      user.email = 'test@example.com';
      user.isActive = false;
      user.validatePassword = jest.fn().mockResolvedValue(true);

      jest.spyOn(usersService, 'findByEmail').mockResolvedValue(user);

      const result = await service.validateUser('test@example.com', 'password');

      expect(usersService.findByEmail).toHaveBeenCalledWith('test@example.com');
      expect(user.validatePassword).toHaveBeenCalledWith('password');
      expect(result).toBeNull();
    });

    it('should return null when user is blocked', async () => {
      const user = new User();
      user.email = 'test@example.com';
      user.isActive = true;
      user.isBlocked = true;
      user.validatePassword = jest.fn().mockResolvedValue(true);

      jest.spyOn(usersService, 'findByEmail').mockResolvedValue(user);

      const result = await service.validateUser('test@example.com', 'password');

      expect(usersService.findByEmail).toHaveBeenCalledWith('test@example.com');
      expect(user.validatePassword).toHaveBeenCalledWith('password');
      expect(result).toBeNull();
    });
  });

  describe('login', () => {
    it('should return access token when credentials are valid', async () => {
      const loginDto: LoginDto = {
        email: 'test@example.com',
        password: 'password',
      };

      const user = {
        id: 'user-id',
        email: 'test@example.com',
        name: 'Test User',
      };

      const token = 'jwt-token';

      jest.spyOn(service, 'validateUser').mockResolvedValue(user);
      jest.spyOn(jwtService, 'sign').mockReturnValue(token);

      const result = await service.login(loginDto);

      expect(service.validateUser).toHaveBeenCalledWith(
        loginDto.email,
        loginDto.password,
      );
      expect(jwtService.sign).toHaveBeenCalledWith({
        email: user.email,
        sub: user.id,
      });
      expect(result).toEqual({
        user,
        access_token: token,
      });
    });

    it('should throw UnauthorizedException when credentials are invalid', async () => {
      const loginDto: LoginDto = {
        email: 'test@example.com',
        password: 'wrongpassword',
      };

      jest.spyOn(service, 'validateUser').mockResolvedValue(null);

      await expect(service.login(loginDto)).rejects.toThrow(
        UnauthorizedException,
      );
      expect(service.validateUser).toHaveBeenCalledWith(
        loginDto.email,
        loginDto.password,
      );
    });
  });

  describe('register', () => {
    it('should create a new user and return access token', async () => {
      const createUserDto: CreateUserDto = {
        name: 'Test User',
        email: 'test@example.com',
        password: 'password',
      };

      const user = new User();
      user.id = 'user-id';
      user.name = createUserDto.name;
      user.email = createUserDto.email;

      const token = 'jwt-token';

      jest.spyOn(usersService, 'create').mockResolvedValue(user);
      jest.spyOn(jwtService, 'sign').mockReturnValue(token);

      const result = await service.register(createUserDto);

      expect(usersService.create).toHaveBeenCalledWith(createUserDto);
      expect(jwtService.sign).toHaveBeenCalledWith({
        email: user.email,
        sub: user.id,
      });
      expect(result).toEqual({
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
        },
        access_token: token,
      });
    });
  });
});
