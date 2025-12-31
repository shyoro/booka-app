import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

/**
 * Role-based authorization guard
 * Checks if user has required roles to access a route
 * Usage: @Roles('admin', 'user')
 */
@Injectable()
export class RolesGuard implements CanActivate {
  /**
   * Create roles guard
   * @param reflector - Reflector service for metadata
   */
  constructor(private reflector: Reflector) {}

  /**
   * Check if user has required roles
   * @param context - Execution context
   * @returns True if user has required roles
   */
  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>('roles', [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles) {
      return true;
    }

    const { user } = context.switchToHttp().getRequest();

    if (!user) {
      return false;
    }

    // For now, all users have 'user' role
    // This can be extended when admin roles are implemented
    return requiredRoles.some((role) => user.role === role || role === 'user');
  }
}

