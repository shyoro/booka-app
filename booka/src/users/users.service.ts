import { Injectable, Inject, NotFoundException, ConflictException } from '@nestjs/common';
import { eq, and, ne } from 'drizzle-orm';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as bcrypt from 'bcrypt';
import { users } from '../database/schema';

/**
 * Users service
 * Handles user-related database operations
 */
@Injectable()
export class UsersService {
  /**
   * Create users service
   * @param db - Database instance
   */
  constructor(
    @Inject('DRIZZLE_DB')
    private readonly db: NodePgDatabase<typeof import('../database/schema')>,
  ) {}

  /**
   * Find user by ID
   * @param id - User ID
   * @returns User or null if not found
   */
  async findById(id: number) {
    const [user] = await this.db.select().from(users).where(eq(users.id, id)).limit(1);

    if (!user) {
      return null;
    }

    // Remove password from response
    const { password, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  /**
   * Find user by email
   * @param email - User email
   * @returns User or null if not found
   */
  async findByEmail(email: string) {
    const [user] = await this.db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    return user || null;
  }

  /**
   * Create a new user
   * @param userData - User data (email, name, password)
   * @returns Created user (without password)
   */
  async create(userData: { email: string; name: string; password: string }) {
    const [user] = await this.db
      .insert(users)
      .values({
        email: userData.email,
        name: userData.name,
        password: userData.password,
      })
      .returning();

    // Remove password from response
    const { password, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  /**
   * Create a new user with password hashing
   * @param userData - User data (email, name, password - plain text)
   * @returns Created user (without password)
   */
  async createWithPassword(userData: { email: string; name: string; password: string }) {
    // Check if user already exists
    const existingUser = await this.findByEmail(userData.email);

    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(userData.password, 12);

    // Create user
    return this.create({
      email: userData.email,
      name: userData.name,
      password: hashedPassword,
    });
  }

  /**
   * Update user by ID
   * @param id - User ID
   * @param updateData - User data to update (name, email)
   * @returns Updated user (without password)
   */
  async update(id: number, updateData: { name?: string; email?: string }) {
    // Check if email is being updated and if it's already taken
    if (updateData.email) {
      const existingUser = await this.db
        .select()
        .from(users)
        .where(and(eq(users.email, updateData.email), ne(users.id, id)))
        .limit(1);

      if (existingUser.length > 0) {
        throw new ConflictException('Email already in use');
      }
    }

    const updateValues: { name?: string; email?: string; updatedAt?: Date } = {
      ...updateData,
      updatedAt: new Date(),
    };

    const [updatedUser] = await this.db
      .update(users)
      .set(updateValues)
      .where(eq(users.id, id))
      .returning();

    if (!updatedUser) {
      throw new NotFoundException('User not found');
    }

    // Remove password from response
    const { password, ...userWithoutPassword } = updatedUser;
    return userWithoutPassword;
  }
}

