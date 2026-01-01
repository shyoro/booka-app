import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Test } from '@nestjs/testing';
import { NotFoundException, ConflictException } from '@nestjs/common';
import { UsersService } from '../../src/users/users.service';
import { eq, and, ne } from 'drizzle-orm';

vi.mock('bcrypt', () => ({
  default: {
    hash: vi.fn(),
    compare: vi.fn(),
  },
  hash: vi.fn(),
  compare: vi.fn(),
}));

import * as bcrypt from 'bcrypt';

describe('UsersService', () => {
  let service: UsersService;
  let mockDb: any;

  const mockUser = {
    id: 1,
    email: 'test@example.com',
    name: 'Test User',
    password: 'hashedPassword',
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

  beforeEach(() => {
    const createQueryBuilder = () => {
      const builder: any = {
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        limit: vi.fn(),
        offset: vi.fn().mockReturnThis(),
        orderBy: vi.fn().mockReturnThis(),
        innerJoin: vi.fn().mockReturnThis(),
        values: vi.fn().mockReturnThis(),
        set: vi.fn().mockReturnThis(),
        returning: vi.fn(),
      };
      return builder;
    };

    mockDb = {
      select: vi.fn(() => createQueryBuilder()),
      insert: vi.fn(() => createQueryBuilder()),
      update: vi.fn(() => createQueryBuilder()),
    };

    service = new UsersService(mockDb);
  });

  describe('findById', () => {
    it('should find user by ID', async () => {
      // Set up the mock to return a builder that resolves to an array when limit() is called
      const queryBuilder = {
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue([mockUser]),
      };
      mockDb.select.mockReturnValue(queryBuilder);

      const result = await service.findById(1);

      expect(result).toEqual(mockUserWithoutPassword);
      expect(result).not.toHaveProperty('password');
      expect(mockDb.select).toHaveBeenCalled();
    });

    it('should return null if user not found', async () => {
      const queryBuilder = {
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue([]),
      };
      mockDb.select.mockReturnValue(queryBuilder);

      const result = await service.findById(999);

      expect(result).toBeNull();
    });
  });

  describe('findByEmail', () => {
    it('should find user by email', async () => {
      const queryBuilder = {
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue([mockUser]),
      };
      mockDb.select.mockReturnValue(queryBuilder);

      const result = await service.findByEmail('test@example.com');

      expect(result).toEqual(mockUser);
      expect(mockDb.select).toHaveBeenCalled();
    });

    it('should return null if user not found', async () => {
      const queryBuilder = {
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue([]),
      };
      mockDb.select.mockReturnValue(queryBuilder);

      const result = await service.findByEmail('notfound@example.com');

      expect(result).toBeNull();
    });
  });

  describe('create', () => {
    it('should create a new user', async () => {
      const userData = {
        email: 'new@example.com',
        name: 'New User',
        password: 'hashedPassword',
      };

      const queryBuilder = {
        values: vi.fn().mockReturnThis(),
        returning: vi.fn().mockResolvedValue([mockUser]),
      };
      mockDb.insert.mockReturnValue(queryBuilder);

      const result = await service.create(userData);

      expect(result).not.toHaveProperty('password');
      expect(mockDb.insert).toHaveBeenCalled();
    });
  });

  describe('createWithPassword', () => {
    it('should create user with password hashing', async () => {
      const userData = {
        email: 'new@example.com',
        name: 'New User',
        password: 'plainPassword',
      };

      vi.spyOn(service, 'findByEmail').mockResolvedValue(null);
      vi.mocked(bcrypt.hash).mockResolvedValue('hashedPassword' as never);
      vi.spyOn(service, 'create').mockResolvedValue(mockUserWithoutPassword);

      const result = await service.createWithPassword(userData);

      expect(result).toEqual(mockUserWithoutPassword);
      expect(bcrypt.hash).toHaveBeenCalledWith(userData.password, 12);
    });

    it('should throw ConflictException if user already exists', async () => {
      const userData = {
        email: 'existing@example.com',
        name: 'Existing User',
        password: 'password',
      };

      vi.spyOn(service, 'findByEmail').mockResolvedValue(mockUser);

      await expect(service.createWithPassword(userData)).rejects.toThrow(ConflictException);
    });
  });

  describe('update', () => {
    it('should update user', async () => {
      const updateData = { name: 'Updated Name' };
      const updatedUser = { ...mockUser, name: 'Updated Name' };

      // Mock the select query (for email check) - returns empty since no email update
      const selectBuilder = {
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue([]),
      };
      mockDb.select.mockReturnValueOnce(selectBuilder);
      
      // Mock the update query
      const updateBuilder = {
        set: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        returning: vi.fn().mockResolvedValue([updatedUser]),
      };
      mockDb.update.mockReturnValue(updateBuilder);

      const result = await service.update(1, updateData);

      expect(result.name).toBe('Updated Name');
      expect(result).not.toHaveProperty('password');
    });

    it('should throw ConflictException if email already in use', async () => {
      const updateData = { email: 'existing@example.com' };
      const existingUser = { ...mockUser, id: 2 };

      const selectBuilder = {
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue([existingUser]),
      };
      mockDb.select.mockReturnValue(selectBuilder);

      await expect(service.update(1, updateData)).rejects.toThrow(ConflictException);
    });

    it('should throw NotFoundException if user not found', async () => {
      const updateData = { name: 'Updated Name' };

      const selectBuilder = {
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue([]),
      };
      mockDb.select.mockReturnValueOnce(selectBuilder);

      const updateBuilder = {
        set: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        returning: vi.fn().mockResolvedValue([]),
      };
      mockDb.update.mockReturnValue(updateBuilder);

      await expect(service.update(999, updateData)).rejects.toThrow(NotFoundException);
    });
  });
});

