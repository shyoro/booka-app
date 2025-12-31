import { SetMetadata } from '@nestjs/common';

/**
 * Roles decorator
 * Specifies which roles are required to access a route
 * Usage: @Roles('admin', 'user')
 * @param roles - Array of role names
 */
export const Roles = (...roles: string[]) => SetMetadata('roles', roles);

