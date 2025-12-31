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
import { UsersService } from '../users/users.service';
import { EmailsService } from '../emails/emails.service';
import { JwtPayload } from './strategies/jwt.strategy';

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
   */
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private configService: ConfigService,
    private emailsService: EmailsService,
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
    // Validate user
    const user = await this.validateUser(loginData.email, loginData.password);

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Get user without password
    const userWithoutPassword = await this.usersService.findById(user.id);

    // Generate tokens
    const tokens = await this.generateTokens(user.id, user.email);

    return { user: userWithoutPassword, tokens };
  }

  /**
   * Refresh access token
   * @param refreshToken - Refresh token
   * @returns New tokens
   */
  async refreshToken(refreshToken: string): Promise<TokenResponse> {
    try {
      const refreshSecret = this.configService.get<string>('JWT_REFRESH_SECRET') || 'default-refresh-secret-change-in-production';
      const payload = this.jwtService.verify(refreshToken, {
        secret: refreshSecret,
      });

      // Verify user still exists
      const user = await this.usersService.findById(payload.sub);

      if (!user) {
        throw new UnauthorizedException('User not found');
      }

      // Generate new tokens
      return await this.generateTokens(payload.sub, payload.email);
    } catch (error) {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  /**
   * Logout user (placeholder for future token blacklist implementation)
   * @param userId - User ID
   */
  async logout(userId: number): Promise<void> {
    // In future, implement token blacklist here
    // For now, client-side token removal is sufficient
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

    const refreshSecret = this.configService.get<string>('JWT_REFRESH_SECRET') || 'default-refresh-secret-change-in-production';
    const refreshToken = this.jwtService.sign(payload, {
      secret: refreshSecret,
      expiresIn: (this.configService.get<string>('JWT_REFRESH_EXPIRES_IN') || '7d') as StringValue,
    });

    return { accessToken, refreshToken };
  }
}

