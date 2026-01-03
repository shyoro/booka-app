/**
 * JWT token utility functions
 * Handles token decoding, expiration checking, and validation
 */

interface JwtPayload {
  sub: number;
  email: string;
  exp: number;
  iat?: number;
}

/**
 * Decode JWT token without verification
 * @param token - JWT token
 * @returns Decoded payload or null if invalid
 */
export function decodeToken(token: string): JwtPayload | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) {
      return null;
    }

    const payload = parts[1];
    const decoded = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
    return JSON.parse(decoded) as JwtPayload;
  } catch {
    return null;
  }
}

/**
 * Check if token is expired
 * @param token - JWT token
 * @returns True if token is expired or invalid
 */
export function isTokenExpired(token: string): boolean {
  const payload = decodeToken(token);
  if (!payload || !payload.exp) {
    return true;
  }

  // Check if token expires within the next 60 seconds (buffer for network delays)
  const expirationTime = payload.exp * 1000; // Convert to milliseconds
  const currentTime = Date.now();
  const bufferTime = 60 * 1000; // 60 seconds buffer

  return expirationTime <= currentTime + bufferTime;
}

/**
 * Get token expiration time
 * @param token - JWT token
 * @returns Expiration timestamp in milliseconds or null if invalid
 */
export function getTokenExpiration(token: string): number | null {
  const payload = decodeToken(token);
  if (!payload || !payload.exp) {
    return null;
  }

  return payload.exp * 1000; // Convert to milliseconds
}

/**
 * Get time until token expires
 * @param token - JWT token
 * @returns Milliseconds until expiration or null if invalid/expired
 */
export function getTimeUntilExpiration(token: string): number | null {
  const expiration = getTokenExpiration(token);
  if (!expiration) {
    return null;
  }

  const timeUntilExpiration = expiration - Date.now();
  return timeUntilExpiration > 0 ? timeUntilExpiration : null;
}

/**
 * Check if token should be refreshed (expires within threshold)
 * @param token - JWT token
 * @param thresholdMs - Threshold in milliseconds (default: 5 minutes)
 * @returns True if token should be refreshed
 */
export function shouldRefreshToken(token: string, thresholdMs: number = 5 * 60 * 1000): boolean {
  const timeUntilExpiration = getTimeUntilExpiration(token);
  if (timeUntilExpiration === null) {
    return true; // Token is expired or invalid, should refresh
  }

  return timeUntilExpiration <= thresholdMs;
}

/**
 * Validate token structure
 * @param token - JWT token
 * @returns True if token has valid structure
 */
export function isValidTokenStructure(token: string): boolean {
  if (!token || typeof token !== 'string') {
    return false;
  }

  const parts = token.split('.');
  return parts.length === 3;
}

