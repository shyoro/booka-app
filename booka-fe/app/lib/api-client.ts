import createClient from 'openapi-fetch';

/**
 * Type import for OpenAPI paths
 * This will be available after running: npm run generate:api-types
 */
import type { paths } from '~/types/api-types';
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
 * - Base URL configuration from environment variables
 * 
 * @returns Configured OpenAPI fetch client instance
 */
const apiClient = createClient<OpenAPIPaths>({
  baseUrl: BASE_URL,
});

/**
 * Request interceptor for authentication
 * Automatically adds JWT token from localStorage to Authorization header
 */
apiClient.use({
  onRequest({ request }) {
    const token = localStorage.getItem('accessToken');
    if (!token) {
      return request;
    }
    
    request.headers.set('Authorization', `Bearer ${token}`);
    return request;
  },
});

/**
 * Response interceptor for error handling
 * Logs errors and provides consistent error information
 * Note: openapi-fetch handles errors at the call site, this interceptor
 * provides additional logging and error context
 */
apiClient.use({
  async onResponse({ response }) {
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
