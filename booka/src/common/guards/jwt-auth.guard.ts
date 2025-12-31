import { Injectable, ExecutionContext } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Reflector } from '@nestjs/core';

/**
 * JWT authentication guard
 * Extends Passport's AuthGuard to work with JWT strategy
 */
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  /**
   * Create JWT auth guard
   * @param reflector - Reflector service for metadata
   */
  constructor(private reflector: Reflector) {
    super();
  }

  /**
   * Check if route is public (no authentication required)
   * @param context - Execution context
   * @returns True if route is public
   */
  canActivate(context: ExecutionContext) {
    // Check for @Public() decorator
    const isPublic = this.reflector.getAllAndOverride<boolean>('isPublic', [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    return super.canActivate(context);
  }
}

