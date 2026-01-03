/**
 * Secure token storage utility
 * Uses sessionStorage for better XSS protection than localStorage
 * Falls back to in-memory storage if sessionStorage is unavailable
 */

const TOKEN_KEYS = {
  ACCESS_TOKEN: 'accessToken',
  REFRESH_TOKEN: 'refreshToken',
} as const;

// In-memory fallback storage
const memoryStorage: Record<string, string> = {};

/**
 * Check if sessionStorage is available
 * @returns True if sessionStorage is available
 */
function isSessionStorageAvailable(): boolean {
  try {
    const test = '__sessionStorage_test__';
    sessionStorage.setItem(test, test);
    sessionStorage.removeItem(test);
    return true;
  } catch {
    return false;
  }
}

/**
 * Get storage implementation
 * @returns Storage implementation (sessionStorage or memory fallback)
 */
function getStorage(): Storage | typeof memoryStorage {
  if (isSessionStorageAvailable()) {
    return sessionStorage;
  }
  return memoryStorage;
}

/**
 * Store access token securely
 * @param token - Access token
 */
export function setAccessToken(token: string): void {
  const storage = getStorage();
  storage[TOKEN_KEYS.ACCESS_TOKEN] = token;
}

/**
 * Get access token
 * @returns Access token or null
 */
export function getAccessToken(): string | null {
  const storage = getStorage();
  return storage[TOKEN_KEYS.ACCESS_TOKEN] || null;
}

/**
 * Store refresh token securely
 * @param token - Refresh token
 */
export function setRefreshToken(token: string): void {
  const storage = getStorage();
  storage[TOKEN_KEYS.REFRESH_TOKEN] = token;
}

/**
 * Get refresh token
 * @returns Refresh token or null
 */
export function getRefreshToken(): string | null {
  const storage = getStorage();
  return storage[TOKEN_KEYS.REFRESH_TOKEN] || null;
}

/**
 * Remove access token
 */
export function removeAccessToken(): void {
  const storage = getStorage();
  if (storage === sessionStorage) {
    storage.removeItem(TOKEN_KEYS.ACCESS_TOKEN);
  } else {
    delete memoryStorage[TOKEN_KEYS.ACCESS_TOKEN];
  }
}

/**
 * Remove refresh token
 */
export function removeRefreshToken(): void {
  const storage = getStorage();
  if (storage === sessionStorage) {
    storage.removeItem(TOKEN_KEYS.REFRESH_TOKEN);
  } else {
    delete memoryStorage[TOKEN_KEYS.REFRESH_TOKEN];
  }
}

/**
 * Clear all tokens
 */
export function clearTokens(): void {
  removeAccessToken();
  removeRefreshToken();
}
