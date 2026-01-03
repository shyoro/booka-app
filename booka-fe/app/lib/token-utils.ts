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


