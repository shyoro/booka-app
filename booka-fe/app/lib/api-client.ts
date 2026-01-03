import createClient from 'openapi-fetch';

/**
 * Type import for OpenAPI paths
 * This will be available after running: npm run generate:api-types
 */
import type { paths } from '~/types/api-types';
import { getAccessToken, getRefreshToken, setAccessToken, setRefreshToken, clearTokens } from './token-storage';
import { isTokenExpired } from './token-utils';

type OpenAPIPaths = paths;

/**
 * API client configuration
 * Base URL from environment variable, defaults to local development server
 * Note: Paths in OpenAPI spec already include /api/v1, so baseURL should not include it
 */
const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

/**
 * Creates and configures the OpenAPI fetch client with authentication interceptors.
 * 
 * Features:
 * - Type-safe API requests using OpenAPI types
 * - Automatic JWT token injection via Authorization header
 * - Automatic token refresh on 401 errors
 * - Infinite loop protection for token refresh
 * - Base URL configuration from environment variables
 * 
 * @returns Configured OpenAPI fetch client instance
 */
const apiClient = createClient<OpenAPIPaths>({
  baseUrl: BASE_URL,
});

// Track if we're currently refreshing to prevent infinite loops
let isRefreshing = false;
let refreshPromise: Promise<string | null> | null = null;

/**
 * Refresh access token using refresh token
 * @returns New access token or null if refresh failed
 */
async function refreshAccessToken(): Promise<string | null> {
  // If already refreshing, return the existing promise
  if (isRefreshing && refreshPromise) {
    return refreshPromise;
  }

  isRefreshing = true;
  refreshPromise = (async () => {
    try {
      const refreshToken = getRefreshToken();
      if (!refreshToken) {
        return null;
      }

      const { data, error } = await apiClient.POST('/api/v1/auth/refresh', {
        body: { refreshToken },
      });

      if (error || !data?.success || !data.data) {
        // Refresh failed, clear tokens
        clearTokens();
        return null;
      }

      const { accessToken, refreshToken: newRefreshToken } = data.data;

      // Store new tokens
      if (accessToken) {
        setAccessToken(accessToken);
      }
      if (newRefreshToken) {
        setRefreshToken(newRefreshToken);
      }

      return accessToken || null;
    } catch (error) {
      console.error('Token refresh error:', error);
      clearTokens();
      return null;
    } finally {
      isRefreshing = false;
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}

/**
 * Request interceptor for authentication
 * Automatically adds JWT token from secure storage to Authorization header
 */
apiClient.use({
  onRequest({ request }) {
    const token = getAccessToken();
    if (!token) {
      return request;
    }
    
    request.headers.set('Authorization', `Bearer ${token}`);
    return request;
  },
});

/**
 * Response interceptor for error handling and automatic token refresh
 * Handles 401 errors by attempting token refresh and retrying the request
 */
apiClient.use({
  async onResponse({ response, request }) {
    // Handle 401 Unauthorized errors
    if (response.status === 401) {
      const url = new URL(response.url);
      const isAuthEndpoint = url.pathname.includes('/auth/');
      
      // Don't try to refresh on auth endpoints (login, register, refresh)
      if (isAuthEndpoint) {
        return response;
      }

      // Attempt to refresh token
      const newAccessToken = await refreshAccessToken();
      
      if (newAccessToken) {
        // Retry the original request with new token
        const clonedRequest = request.clone();
        clonedRequest.headers.set('Authorization', `Bearer ${newAccessToken}`);
        
        try {
          const retryResponse = await fetch(clonedRequest);
          return retryResponse;
        } catch (error) {
          console.error('Request retry after token refresh failed:', error);
        }
      } else {
        // Refresh failed, clear tokens
        clearTokens();
        
        // Dispatch custom event for auth context to handle
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('auth:token-expired'));
        }
      }
    }

    // Log other errors
    if (!response.ok) {
      const contentType = response.headers.get('content-type');
      const isJson = contentType?.includes('application/json');
      
      if (isJson) {
        const errorData = await response.clone().json().catch(() => null);
        if (errorData && typeof errorData === 'object' && 'error' in errorData) {
          const error = errorData.error as { code: string; message: string; details?: Record<string, unknown> };
          console.error(`API Error [${error.code}]:`, error.message, error.details || '');
        }
      }
    }
    
    return response;
  },
});

export default apiClient;
