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

describe('AuthService', () => {
  let service: AuthService;
  let usersService: UsersService;
  let jwtService: JwtService;
  let configService: ConfigService;
  let emailsService: EmailsService;
  let mockDb: any;

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

  const mockRefreshToken = {
    id: 1,
    userId: 1,
    token: 'valid-refresh-token',
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
    createdAt: new Date(),
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

    // Mock database with query builder pattern
    const createQueryBuilder = (result: any[] = []) => ({
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue(result),
      values: vi.fn().mockReturnThis(),
      returning: vi.fn().mockResolvedValue(result),
    });

    mockDb = {
      select: vi.fn().mockReturnValue(createQueryBuilder()),
      insert: vi.fn().mockReturnValue(createQueryBuilder()),
      delete: vi.fn().mockReturnValue(createQueryBuilder()),
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
        {
          provide: 'DRIZZLE_DB',
          useValue: mockDb,
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
    injectMockService(service, 'db', mockDb);
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

      // Mock database insert for refresh token
      const insertBuilder = {
        values: vi.fn().mockReturnThis(),
        returning: vi.fn().mockResolvedValue([mockRefreshToken]),
      };
      mockDb.insert.mockReturnValue(insertBuilder);

      const result = await service.register(registerData);

      expect(result).toHaveProperty('user');
      expect(result).toHaveProperty('tokens');
      expect(result.tokens).toHaveProperty('accessToken');
      expect(result.tokens).toHaveProperty('refreshToken');
      expect(usersService.findByEmail).toHaveBeenCalledWith(registerData.email);
      expect(bcrypt.hash).toHaveBeenCalledWith(registerData.password, 12);
      expect(mockDb.insert).toHaveBeenCalled(); // Verify refresh token was stored
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

      // Mock database insert for refresh token
      const insertBuilder = {
        values: vi.fn().mockReturnThis(),
        returning: vi.fn().mockResolvedValue([mockRefreshToken]),
      };
      mockDb.insert.mockReturnValue(insertBuilder);

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

      // Mock database insert for refresh token
      const insertBuilder = {
        values: vi.fn().mockReturnThis(),
        returning: vi.fn().mockResolvedValue([mockRefreshToken]),
      };
      mockDb.insert.mockReturnValue(insertBuilder);

      const result = await service.login(loginData);

      expect(result).toHaveProperty('user');
      expect(result).toHaveProperty('tokens');
      expect(result.user).not.toHaveProperty('password');
      expect(mockDb.insert).toHaveBeenCalled(); // Verify refresh token was stored
    });

    it('should throw UnauthorizedException for invalid email', async () => {
      const loginData = {
        email: 'wrong@example.com',
        password: 'password123',
      };

      usersService.findByEmail.mockResolvedValue(null);
      // Use dummy hash for timing attack prevention
      vi.mocked(bcrypt.compare).mockResolvedValue(false as never);

      await expect(service.login(loginData)).rejects.toThrow(UnauthorizedException);
      await expect(service.login(loginData)).rejects.toThrow('Invalid email or password');
    });

    it('should throw UnauthorizedException for invalid password', async () => {
      const loginData = {
        email: 'test@example.com',
        password: 'wrongpassword',
      };

      vi.spyOn(usersService, 'findByEmail').mockResolvedValue(mockUser);
      vi.spyOn(bcrypt, 'compare').mockResolvedValue(false as never);

      await expect(service.login(loginData)).rejects.toThrow(UnauthorizedException);
      await expect(service.login(loginData)).rejects.toThrow('Invalid email or password');
    });
  });

  describe('refreshToken', () => {
    it('should refresh token successfully', async () => {
      const refreshToken = 'valid-refresh-token';
      const payload = { sub: 1, email: 'test@example.com' };

      jwtService.verify.mockReturnValue(payload as any);
      usersService.findById.mockResolvedValue(mockUserWithoutPassword);
      jwtService.sign.mockReturnValue('new-token');

      // Mock database select to find refresh token
      const selectBuilder = {
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue([mockRefreshToken]),
      };
      mockDb.select.mockReturnValue(selectBuilder);

      // Mock database delete to remove old token
      const deleteBuilder = {
        where: vi.fn().mockResolvedValue(undefined),
      };
      mockDb.delete.mockReturnValue(deleteBuilder);

      // Mock database insert for new refresh token
      const insertBuilder = {
        values: vi.fn().mockReturnThis(),
        returning: vi.fn().mockResolvedValue([{ ...mockRefreshToken, id: 2 }]),
      };
      mockDb.insert.mockReturnValue(insertBuilder);

      const result = await service.refreshToken(refreshToken);

      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
      expect(jwtService.verify).toHaveBeenCalled();
      expect(mockDb.select).toHaveBeenCalled(); // Verify token lookup
      expect(mockDb.delete).toHaveBeenCalled(); // Verify old token deletion
      expect(mockDb.insert).toHaveBeenCalled(); // Verify new token storage
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

    it('should throw UnauthorizedException if refresh token not found in database', async () => {
      const refreshToken = 'valid-refresh-token';
      const payload = { sub: 1, email: 'test@example.com' };

      jwtService.verify.mockReturnValue(payload as any);
      usersService.findById.mockResolvedValue(mockUserWithoutPassword);

      // Mock database select to return empty (token not found)
      const selectBuilder = {
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue([]),
      };
      mockDb.select.mockReturnValue(selectBuilder);

      await expect(service.refreshToken(refreshToken)).rejects.toThrow(UnauthorizedException);
      await expect(service.refreshToken(refreshToken)).rejects.toThrow('Invalid or expired refresh token');
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
    it('should logout user successfully and delete refresh tokens', async () => {
      // Mock database delete to remove refresh tokens
      const deleteBuilder = {
        where: vi.fn().mockResolvedValue(undefined),
      };
      mockDb.delete.mockReturnValue(deleteBuilder);

      await expect(service.logout(1)).resolves.toBeUndefined();
      expect(mockDb.delete).toHaveBeenCalled(); // Verify refresh tokens were deleted
    });
  });
});

