import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Test } from '@nestjs/testing';
import { UnauthorizedException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { AuthService } from '../../src/auth/auth.service';
import { UsersService } from '../../src/users/users.service';
import { EmailsService } from '../../src/emails/emails.service';
import { injectMockService } from '../utils/test-helpers';

vi.mock('bcrypt', () => ({
  default: {
    hash: vi.fn(),
    compare: vi.fn(),
  },
  hash: vi.fn(),
  compare: vi.fn(),
}));

import * as bcrypt from 'bcrypt';
import { injectMockService } from '../utils/test-helpers';

describe('AuthService', () => {
  let service: AuthService;
  let usersService: UsersService;
  let jwtService: JwtService;
  let configService: ConfigService;
  let emailsService: EmailsService;

  const mockUser = {
    id: 1,
    email: 'test@example.com',
    name: 'Test User',
    password: 'hashedPassword123',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockUserWithoutPassword = {
    id: 1,
    email: 'test@example.com',
    name: 'Test User',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    const mockUsersService = {
      findByEmail: vi.fn(),
      findById: vi.fn(),
      create: vi.fn(),
    };

    const mockJwtService = {
      sign: vi.fn(),
      verify: vi.fn(),
    };

    const mockConfigService = {
      get: vi.fn((key: string) => {
        const config: Record<string, string> = {
          JWT_EXPIRES_IN: '15m',
          JWT_REFRESH_SECRET: 'refresh-secret',
          JWT_REFRESH_EXPIRES_IN: '7d',
        };
        return config[key];
      }),
    };

    const mockEmailsService = {
      sendWelcomeEmail: vi.fn(),
    };

    const module = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: UsersService,
          useValue: mockUsersService,
        },
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
        {
          provide: EmailsService,
          useValue: mockEmailsService,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    usersService = mockUsersService as any;
    jwtService = mockJwtService as any;
    configService = mockConfigService as any;
    emailsService = mockEmailsService as any;
    
    // Manual injection workaround if DI failed
    injectMockService(service, 'usersService', mockUsersService);
    injectMockService(service, 'jwtService', mockJwtService);
    injectMockService(service, 'configService', mockConfigService);
    injectMockService(service, 'emailsService', mockEmailsService);
  });

  describe('register', () => {
    it('should register a new user successfully', async () => {
      const registerData = {
        email: 'new@example.com',
        password: 'password123',
        name: 'New User',
      };

      usersService.findByEmail.mockResolvedValue(null);
      vi.mocked(bcrypt.hash).mockResolvedValue('hashedPassword' as never);
      usersService.create.mockResolvedValue(mockUserWithoutPassword);
      jwtService.sign.mockReturnValue('token');
      emailsService.sendWelcomeEmail.mockResolvedValue(undefined);

      const result = await service.register(registerData);

      expect(result).toHaveProperty('user');
      expect(result).toHaveProperty('tokens');
      expect(result.tokens).toHaveProperty('accessToken');
      expect(result.tokens).toHaveProperty('refreshToken');
      expect(usersService.findByEmail).toHaveBeenCalledWith(registerData.email);
      expect(bcrypt.hash).toHaveBeenCalledWith(registerData.password, 12);
    });

    it('should throw ConflictException if user already exists', async () => {
      const registerData = {
        email: 'existing@example.com',
        password: 'password123',
        name: 'Existing User',
      };

      usersService.findByEmail.mockResolvedValue(mockUser);

      await expect(service.register(registerData)).rejects.toThrow(ConflictException);
      expect(usersService.findByEmail).toHaveBeenCalledWith(registerData.email);
    });

    it('should not fail registration if welcome email fails', async () => {
      const registerData = {
        email: 'new@example.com',
        password: 'password123',
        name: 'New User',
      };

      usersService.findByEmail.mockResolvedValue(null);
      vi.mocked(bcrypt.hash).mockResolvedValue('hashedPassword' as never);
      usersService.create.mockResolvedValue(mockUserWithoutPassword);
      jwtService.sign.mockReturnValue('token');
      emailsService.sendWelcomeEmail.mockRejectedValue(new Error('Email failed'));

      const result = await service.register(registerData);

      expect(result).toHaveProperty('user');
      expect(result).toHaveProperty('tokens');
    });
  });

  describe('login', () => {
    it('should login user successfully with valid credentials', async () => {
      const loginData = {
        email: 'test@example.com',
        password: 'password123',
      };

      usersService.findByEmail.mockResolvedValue(mockUser);
      vi.mocked(bcrypt.compare).mockResolvedValue(true as never);
      usersService.findById.mockResolvedValue(mockUserWithoutPassword);
      jwtService.sign.mockReturnValue('token');

      const result = await service.login(loginData);

      expect(result).toHaveProperty('user');
      expect(result).toHaveProperty('tokens');
      expect(result.user).not.toHaveProperty('password');
    });

    it('should throw UnauthorizedException for invalid email', async () => {
      const loginData = {
        email: 'wrong@example.com',
        password: 'password123',
      };

      usersService.findByEmail.mockResolvedValue(null);

      await expect(service.login(loginData)).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException for invalid password', async () => {
      const loginData = {
        email: 'test@example.com',
        password: 'wrongpassword',
      };

      vi.spyOn(usersService, 'findByEmail').mockResolvedValue(mockUser);
      vi.spyOn(bcrypt, 'compare').mockResolvedValue(false as never);

      await expect(service.login(loginData)).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('refreshToken', () => {
    it('should refresh token successfully', async () => {
      const refreshToken = 'valid-refresh-token';
      const payload = { sub: 1, email: 'test@example.com' };

      jwtService.verify.mockReturnValue(payload as any);
      usersService.findById.mockResolvedValue(mockUserWithoutPassword);
      jwtService.sign.mockReturnValue('new-token');

      const result = await service.refreshToken(refreshToken);

      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
      expect(jwtService.verify).toHaveBeenCalled();
    });

    it('should throw UnauthorizedException for invalid refresh token', async () => {
      const refreshToken = 'invalid-token';

      jwtService.verify.mockImplementation(() => {
        throw new Error('Invalid token');
      });

      await expect(service.refreshToken(refreshToken)).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException if user not found', async () => {
      const refreshToken = 'valid-refresh-token';
      const payload = { sub: 1, email: 'test@example.com' };

      jwtService.verify.mockReturnValue(payload as any);
      usersService.findById.mockResolvedValue(null);

      await expect(service.refreshToken(refreshToken)).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('validateUser', () => {
    it('should return user for valid credentials', async () => {
      usersService.findByEmail.mockResolvedValue(mockUser);
      vi.mocked(bcrypt.compare).mockResolvedValue(true as never);

      const result = await service.validateUser('test@example.com', 'password123');

      expect(result).toEqual(mockUser);
    });

    it('should return null for invalid email', async () => {
      usersService.findByEmail.mockResolvedValue(null);

      const result = await service.validateUser('wrong@example.com', 'password123');

      expect(result).toBeNull();
    });

    it('should return null for invalid password', async () => {
      vi.spyOn(usersService, 'findByEmail').mockResolvedValue(mockUser);
      vi.spyOn(bcrypt, 'compare').mockResolvedValue(false as never);

      const result = await service.validateUser('test@example.com', 'wrongpassword');

      expect(result).toBeNull();
    });
  });

  describe('logout', () => {
    it('should logout user successfully', async () => {
      await expect(service.logout(1)).resolves.toBeUndefined();
    });
  });
});

