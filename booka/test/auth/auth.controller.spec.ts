import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Test } from '@nestjs/testing';
import { AuthController } from '../../src/auth/auth.controller';
import { AuthService } from '../../src/auth/auth.service';
import { injectMockService } from '../utils/test-helpers';

describe('AuthController', () => {
  let controller: AuthController;
  let authService: AuthService;

  const mockTokens = {
    accessToken: 'access-token',
    refreshToken: 'refresh-token',
  };

  const mockUser = {
    id: 1,
    email: 'test@example.com',
    name: 'Test User',
  };

  beforeEach(async () => {
    const mockAuthService = {
      register: vi.fn(),
      login: vi.fn(),
      refreshToken: vi.fn(),
      logout: vi.fn(),
    };

    const module = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: mockAuthService,
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    authService = mockAuthService as any;
    
    // Manual injection workaround if DI failed
    injectMockService(controller, 'authService', mockAuthService);
  });

  describe('register', () => {
    it('should register a new user', async () => {
      const registerDto = {
        email: 'new@example.com',
        password: 'password123',
        name: 'New User',
      };

      const expectedResult = {
        user: mockUser,
        tokens: mockTokens,
      };

      authService.register.mockResolvedValue(expectedResult);

      const result = await controller.register(registerDto);

      expect(result).toEqual(expectedResult);
      expect(authService.register).toHaveBeenCalledWith(registerDto);
    });
  });

  describe('login', () => {
    it('should login user', async () => {
      const loginDto = {
        email: 'test@example.com',
        password: 'password123',
      };

      const expectedResult = {
        user: mockUser,
        tokens: mockTokens,
      };

      authService.login.mockResolvedValue(expectedResult);

      const result = await controller.login(loginDto);

      expect(result).toEqual(expectedResult);
      expect(authService.login).toHaveBeenCalledWith(loginDto);
    });
  });

  describe('refresh', () => {
    it('should refresh access token', async () => {
      const refreshTokenDto = {
        refreshToken: 'refresh-token',
      };

      authService.refreshToken.mockResolvedValue(mockTokens);

      const result = await controller.refresh(refreshTokenDto);

      expect(result).toEqual(mockTokens);
      expect(authService.refreshToken).toHaveBeenCalledWith(refreshTokenDto.refreshToken);
    });
  });

  describe('logout', () => {
    it('should logout user', async () => {
      const user = { id: 1 };

      authService.logout.mockResolvedValue(undefined);

      const result = await controller.logout(user);

      expect(result).toEqual({
        success: true,
        data: {},
        message: 'Logged out successfully',
      });
      expect(authService.logout).toHaveBeenCalledWith(user.id);
    });
  });
});

