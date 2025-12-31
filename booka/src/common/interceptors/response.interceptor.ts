import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

/**
 * Response interceptor to standardize API responses
 * Wraps all successful responses in { success: true, data: ... } format
 */
@Injectable()
export class ResponseInterceptor implements NestInterceptor {
  /**
   * Intercept and transform the response
   * @param context - Execution context
   * @param next - Call handler
   * @returns Transformed response
   */
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    return next.handle().pipe(
      map((data) => {
        // If response already has success field, return as-is
        if (data && typeof data === 'object' && 'success' in data) {
          return data;
        }

        // Wrap in standard response format
        return {
          success: true,
          data,
        };
      }),
    );
  }
}

