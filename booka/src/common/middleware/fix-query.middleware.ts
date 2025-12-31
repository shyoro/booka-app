import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

/**
 * Middleware to fix malformed query strings
 * Handles cases where query parameters are double-encoded or sent incorrectly
 */
@Injectable()
export class FixQueryMiddleware implements NestMiddleware {
  /**
   * Fix query string if malformed
   * @param req - Express request
   * @param res - Express response
   * @param next - Next function
   */
  use(req: Request, res: Response, next: NextFunction): void {
    if (this.isMalformedQuery(req.query)) {
      this.fixQueryString(req);
    }

    next();
  }

  /**
   * Check if query string is malformed
   * @param query - Request query object
   * @returns True if query appears malformed
   */
  private isMalformedQuery(query: Request['query']): boolean {
    if (!query || Object.keys(query).length !== 1) {
      return false;
    }

    const singleKey = Object.keys(query)[0];
    return singleKey.includes('=') && singleKey.includes('&');
  }

  /**
   * Fix malformed query string by parsing it
   * @param req - Express request
   */
  private fixQueryString(req: Request): void {
    const singleKey = Object.keys(req.query)[0];
    
    try {
      const parsed = new URLSearchParams(singleKey);
      const fixedQuery: Record<string, string> = {};
      parsed.forEach((value, key) => {
        fixedQuery[key] = value;
      });
      req.query = fixedQuery;
    } catch (error) {
      // Silently fail if parsing fails - let the request continue
    }
  }
}

