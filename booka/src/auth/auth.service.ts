import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  Inject,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import type { StringValue } from 'ms';
import * as bcrypt from 'bcrypt';
import { eq, and, gt } from 'drizzle-orm';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { UsersService } from '../users/users.service';
import { EmailsService } from '../emails/emails.service';
import { JwtPayload } from './strategies/jwt.strategy';
import { refreshTokens } from '../database/schema';

/**
 * Token response interface
 */
export interface TokenResponse {
  accessToken: string;
  refreshToken: string;
}

/**
 * Auth service
 * Handles authentication and authorization logic
 */
@Injectable()
export class AuthService {
  /**
   * Create auth service
   * @param usersService - Users service
   * @param jwtService - JWT service
   * @param configService - Configuration service
   * @param emailsService - Emails service
   * @param db - Database instance
   */
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private configService: ConfigService,
    private emailsService: EmailsService,
    @Inject('DRIZZLE_DB')
    private readonly db: NodePgDatabase<typeof import('../database/schema')>,
  ) {}

  /**
   * Register a new user
   * @param registerData - Registration data
   * @returns User and tokens
   */
  async register(registerData: {
    email: string;
    password: string;
    name: string;
  }): Promise<{ user: unknown; tokens: TokenResponse }> {
    // Check if user already exists
    const existingUser = await this.usersService.findByEmail(registerData.email);

    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(registerData.password, 12);

    // Create user
    const user = await this.usersService.create({
      email: registerData.email,
      name: registerData.name,
      password: hashedPassword,
    });

    // Generate tokens
    const tokens = await this.generateTokens(user.id, user.email);
    
    // Store refresh token in database
    await this.storeRefreshToken(user.id, tokens.refreshToken);

    // Send welcome email (non-blocking)
    try {
      await this.emailsService.sendWelcomeEmail(user.email, user.name);
    } catch (error) {
      // Log error but don't fail registration
      console.error('Failed to send welcome email:', error);
    }

    return { user, tokens };
  }

  /**
   * Login user
   * @param loginData - Login credentials
   * @returns User and tokens
   */
  async login(loginData: {
    email: string;
    password: string;
  }): Promise<{ user: unknown; tokens: TokenResponse }> {
    // Always perform password comparison to prevent timing attacks
    // Use consistent error message to prevent user enumeration
    const user = await this.usersService.findByEmail(loginData.email);
    
    // Use a dummy hash comparison if user doesn't exist to prevent timing attacks
    const dummyHash = '$2b$12$dummy.hash.to.prevent.timing.attacks.and.user.enumeration';
    const passwordToCompare = user?.password || dummyHash;
    
    // Always perform bcrypt comparison (takes ~same time regardless of user existence)
    const isPasswordValid = await bcrypt.compare(loginData.password, passwordToCompare);
    
    // Use consistent error message regardless of user existence or password validity
    if (!user || !isPasswordValid) {
      throw new UnauthorizedException('Invalid email or password');
    }

    // Get user without password
    const userWithoutPassword = await this.usersService.findById(user.id);

    // Generate tokens
    const tokens = await this.generateTokens(user.id, user.email);
    
    // Store refresh token in database
    await this.storeRefreshToken(user.id, tokens.refreshToken);

    return { user: userWithoutPassword, tokens };
  }

  /**
   * Refresh access token with rotation
   * @param refreshToken - Refresh token
   * @returns New tokens
   */
  async refreshToken(refreshToken: string): Promise<TokenResponse> {
    try {
      const refreshSecret = this.configService.get<string>('JWT_REFRESH_SECRET');
      if (!refreshSecret) {
        throw new Error('JWT_REFRESH_SECRET is not configured');
      }
      
      // Verify token signature and expiration
      const payload = this.jwtService.verify(refreshToken, {
        secret: refreshSecret,
      });

      // Verify user still exists
      const user = await this.usersService.findById(payload.sub);
      if (!user) {
        throw new UnauthorizedException('User not found');
      }

      // Check if refresh token exists in database and is valid
      const [storedToken] = await this.db
        .select()
        .from(refreshTokens)
        .where(
          and(
            eq(refreshTokens.token, refreshToken),
            eq(refreshTokens.userId, payload.sub),
            gt(refreshTokens.expiresAt, new Date()),
          ),
        )
        .limit(1);

      if (!storedToken) {
        throw new UnauthorizedException('Invalid or expired refresh token');
      }

      // Delete the old refresh token (rotation)
      await this.db
        .delete(refreshTokens)
        .where(eq(refreshTokens.id, storedToken.id));

      // Generate new tokens and store the new refresh token
      const tokens = await this.generateTokens(payload.sub, payload.email);
      
      // Store new refresh token in database
      await this.storeRefreshToken(payload.sub, tokens.refreshToken);

      return tokens;
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  /**
   * Logout user - invalidates all refresh tokens for the user
   * @param userId - User ID
   */
  async logout(userId: number): Promise<void> {
    // Delete all refresh tokens for this user
    await this.db
      .delete(refreshTokens)
      .where(eq(refreshTokens.userId, userId));
  }

  /**
   * Validate user credentials
   * @param email - User email
   * @param password - User password
   * @returns User if valid, null otherwise
   */
  async validateUser(email: string, password: string) {
    const user = await this.usersService.findByEmail(email);

    if (!user) {
      return null;
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return null;
    }

    return user;
  }

  /**
   * Generate access and refresh tokens
   * @param userId - User ID
   * @param email - User email
   * @returns Token pair
   */
  private async generateTokens(userId: number, email: string): Promise<TokenResponse> {
    const payload: JwtPayload = { sub: userId, email };

    const accessToken = this.jwtService.sign(payload, {
      expiresIn: (this.configService.get<string>('JWT_EXPIRES_IN') || '15m') as StringValue,
    });

    const refreshSecret = this.configService.get<string>('JWT_REFRESH_SECRET');
    if (!refreshSecret) {
      throw new Error('JWT_REFRESH_SECRET is not configured');
    }
    
    const refreshExpiresIn = (this.configService.get<string>('JWT_REFRESH_EXPIRES_IN') || '7d') as StringValue;
    const refreshToken = this.jwtService.sign(payload, {
      secret: refreshSecret,
      expiresIn: refreshExpiresIn,
    });

    return { accessToken, refreshToken };
  }

  /**
   * Store refresh token in database
   * @param userId - User ID
   * @param token - Refresh token
   */
  private async storeRefreshToken(userId: number, token: string): Promise<void> {
    const refreshExpiresIn = this.configService.get<string>('JWT_REFRESH_EXPIRES_IN') || '7d';
    
    // Calculate expiration date
    const expiresAt = new Date();
    const expiresInMs = this.parseExpiresIn(refreshExpiresIn);
    expiresAt.setTime(expiresAt.getTime() + expiresInMs);

    await this.db.insert(refreshTokens).values({
      userId,
      token,
      expiresAt,
    });
  }

  /**
   * Parse expires in string to milliseconds
   * @param expiresIn - Expires in string (e.g., '7d', '15m')
   * @returns Milliseconds
   */
  private parseExpiresIn(expiresIn: string): number {
    const unit = expiresIn.slice(-1);
    const value = parseInt(expiresIn.slice(0, -1), 10);

    switch (unit) {
      case 's':
        return value * 1000;
      case 'm':
        return value * 60 * 1000;
      case 'h':
        return value * 60 * 60 * 1000;
      case 'd':
        return value * 24 * 60 * 60 * 1000;
      default:
        return 7 * 24 * 60 * 60 * 1000; // Default to 7 days
    }
  }

  /**
   * Check if refresh token is blacklisted
   * @param token - Refresh token
   * @returns True if token is blacklisted
   */
  async isRefreshTokenBlacklisted(token: string): Promise<boolean> {
    const [storedToken] = await this.db
      .select()
      .from(refreshTokens)
      .where(eq(refreshTokens.token, token))
      .limit(1);

    return !storedToken;
  }
}

