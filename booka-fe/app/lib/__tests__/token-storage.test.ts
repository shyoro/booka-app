import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  setAccessToken,
  getAccessToken,
  setRefreshToken,
  getRefreshToken,
  removeAccessToken,
  removeRefreshToken,
  clearTokens,
} from '../token-storage';

/**
 * Unit tests for token storage utility functions
 * Tests secure token storage and retrieval
 */
describe('token-storage', () => {
  beforeEach(() => {
    // Create a proper Storage-like object that passes isSessionStorageAvailable check
    // Use a Proxy to handle both bracket notation and method calls
    const storageData: Record<string, string> = {};
    
    const storage = new Proxy({} as Storage, {
      get(target, prop: string | symbol) {
        if (prop === 'getItem') {
          return (key: string) => storageData[key] || null;
        }
        if (prop === 'setItem') {
          return (key: string, value: string) => {
            storageData[key] = value;
          };
        }
        if (prop === 'removeItem') {
          return (key: string) => {
            delete storageData[key];
          };
        }
        if (prop === 'clear') {
          return () => {
            Object.keys(storageData).forEach((key) => delete storageData[key]);
          };
        }
        if (prop === 'length') {
          return Object.keys(storageData).length;
        }
        if (prop === 'key') {
          return (index: number) => Object.keys(storageData)[index] || null;
        }
        // Handle bracket notation access
        if (typeof prop === 'string') {
          return storageData[prop] || undefined;
        }
        return undefined;
      },
      set(target, prop: string | symbol, value: string) {
        if (typeof prop === 'string') {
          storageData[prop] = value;
          return true;
        }
        return false;
      },
      deleteProperty(target, prop: string | symbol) {
        if (typeof prop === 'string') {
          delete storageData[prop];
          return true;
        }
        return false;
      },
    });
    
    // Mock sessionStorage to be available and pass the availability check
    Object.defineProperty(window, 'sessionStorage', {
      value: storage,
      writable: true,
      configurable: true,
    });
  });

  describe('access token operations', () => {
    it('should store and retrieve access token', () => {
      const token = 'test-access-token';
      setAccessToken(token);
      const retrieved = getAccessToken();
      expect(retrieved).toBe(token);
    });

    it('should return null when access token is not set', () => {
      const retrieved = getAccessToken();
      expect(retrieved).toBeNull();
    });

    it('should remove access token', () => {
      setAccessToken('test-token');
      removeAccessToken();
      const retrieved = getAccessToken();
      expect(retrieved).toBeNull();
    });

    it('should overwrite existing access token', () => {
      setAccessToken('old-token');
      setAccessToken('new-token');
      const retrieved = getAccessToken();
      expect(retrieved).toBe('new-token');
    });
  });

  describe('refresh token operations', () => {
    it('should store and retrieve refresh token', () => {
      const token = 'test-refresh-token';
      setRefreshToken(token);
      const retrieved = getRefreshToken();
      expect(retrieved).toBe(token);
    });

    it('should return null when refresh token is not set', () => {
      const retrieved = getRefreshToken();
      expect(retrieved).toBeNull();
    });

    it('should remove refresh token', () => {
      setRefreshToken('test-token');
      removeRefreshToken();
      const retrieved = getRefreshToken();
      expect(retrieved).toBeNull();
    });

    it('should overwrite existing refresh token', () => {
      setRefreshToken('old-token');
      setRefreshToken('new-token');
      const retrieved = getRefreshToken();
      expect(retrieved).toBe('new-token');
    });
  });

  describe('clearTokens', () => {
    it('should clear both access and refresh tokens', () => {
      setAccessToken('access-token');
      setRefreshToken('refresh-token');
      clearTokens();
      expect(getAccessToken()).toBeNull();
      expect(getRefreshToken()).toBeNull();
    });

    it('should handle clearing when no tokens are set', () => {
      clearTokens();
      expect(getAccessToken()).toBeNull();
      expect(getRefreshToken()).toBeNull();
    });
  });
});

