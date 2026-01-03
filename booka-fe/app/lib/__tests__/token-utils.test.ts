import { describe, it, expect } from 'vitest';
import { decodeToken, isTokenExpired } from '../token-utils';

/**
 * Unit tests for token utility functions
 * Tests JWT token decoding and expiration checking
 */
describe('token-utils', () => {
  describe('decodeToken', () => {
    it('should decode a valid JWT token', () => {
      // Create a valid JWT token (header.payload.signature)
      const payload = {
        sub: 1,
        email: 'test@example.com',
        exp: Math.floor(Date.now() / 1000) + 3600,
        iat: Math.floor(Date.now() / 1000),
      };
      const encodedPayload = btoa(JSON.stringify(payload))
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=/g, '');
      const token = `header.${encodedPayload}.signature`;

      const result = decodeToken(token);
      expect(result).not.toBeNull();
      expect(result?.sub).toBe(1);
      expect(result?.email).toBe('test@example.com');
    });

    it('should return null for invalid token format', () => {
      const result = decodeToken('invalid-token');
      expect(result).toBeNull();
    });

    it('should return null for token with wrong number of parts', () => {
      const result = decodeToken('header.payload');
      expect(result).toBeNull();
    });

    it('should return null for token with invalid base64 payload', () => {
      const token = 'header.invalid-base64!.signature';
      const result = decodeToken(token);
      expect(result).toBeNull();
    });

    it('should return null for token with invalid JSON payload', () => {
      const invalidJson = btoa('invalid json')
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=/g, '');
      const token = `header.${invalidJson}.signature`;
      const result = decodeToken(token);
      expect(result).toBeNull();
    });
  });

  describe('isTokenExpired', () => {
    it('should return true for expired token', () => {
      const expiredPayload = {
        sub: 1,
        email: 'test@example.com',
        exp: Math.floor(Date.now() / 1000) - 3600, // Expired 1 hour ago
      };
      const encodedPayload = btoa(JSON.stringify(expiredPayload))
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=/g, '');
      const token = `header.${encodedPayload}.signature`;

      const result = isTokenExpired(token);
      expect(result).toBe(true);
    });

    it('should return false for valid token with future expiration', () => {
      const validPayload = {
        sub: 1,
        email: 'test@example.com',
        exp: Math.floor(Date.now() / 1000) + 7200, // Expires in 2 hours
      };
      const encodedPayload = btoa(JSON.stringify(validPayload))
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=/g, '');
      const token = `header.${encodedPayload}.signature`;

      const result = isTokenExpired(token);
      expect(result).toBe(false);
    });

    it('should return true for token expiring within 60 seconds (buffer)', () => {
      const soonToExpirePayload = {
        sub: 1,
        email: 'test@example.com',
        exp: Math.floor(Date.now() / 1000) + 30, // Expires in 30 seconds
      };
      const encodedPayload = btoa(JSON.stringify(soonToExpirePayload))
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=/g, '');
      const token = `header.${encodedPayload}.signature`;

      const result = isTokenExpired(token);
      expect(result).toBe(true);
    });

    it('should return true for invalid token', () => {
      const result = isTokenExpired('invalid-token');
      expect(result).toBe(true);
    });

    it('should return true for token without exp field', () => {
      const payloadWithoutExp = {
        sub: 1,
        email: 'test@example.com',
      };
      const encodedPayload = btoa(JSON.stringify(payloadWithoutExp))
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=/g, '');
      const token = `header.${encodedPayload}.signature`;

      const result = isTokenExpired(token);
      expect(result).toBe(true);
    });
  });
});

