import { useMutation } from '@tanstack/react-query';
import apiClient from '~/lib/api-client';
import type { paths } from '~/types/api-types';
import { useAuth } from '~/contexts/AuthContext';
import { setAccessToken, setRefreshToken, clearTokens } from '~/lib/token-storage';

type LoginBody = paths['/api/v1/auth/login']['post']['requestBody']['content']['application/json'];
type RegisterBody = paths['/api/v1/auth/register']['post']['requestBody']['content']['application/json'];
type LoginResponse = paths['/api/v1/auth/login']['post']['responses'][200]['content']['application/json'];
type RegisterResponse = paths['/api/v1/auth/register']['post']['responses'][201]['content']['application/json'];

/**
 * Extract error message from API error response
 * @param error - API error response
 * @returns User-friendly error message
 */
function extractErrorMessage(error: unknown): string {
  if (error && typeof error === 'object' && 'error' in error) {
    const apiError = error.error as { code?: string; message?: string };
    if (apiError.message) {
      return apiError.message;
    }
    if (apiError.code) {
      // Map error codes to user-friendly messages
      switch (apiError.code) {
        case 'UNAUTHORIZED':
          return 'Invalid email or password';
        case 'VALIDATION_ERROR':
          return 'Please check your input and try again';
        case 'CONFLICT':
          return 'An account with this email already exists';
        default:
          return apiError.code;
      }
    }
  }
  return 'An unexpected error occurred';
}

/**
 * Hook to login a user
 * @returns Mutation function to login
 */
export function useLogin() {
  const { setUser } = useAuth();

  return useMutation({
    mutationFn: async (credentials: LoginBody) => {
      const { data, error } = await apiClient.POST('/api/v1/auth/login', {
        body: credentials,
      });

      if (error) {
        const errorMessage = extractErrorMessage(error);
        throw new Error(errorMessage);
      }

      if (!data?.success || !data.data) {
        throw new Error('Invalid response format. Please try again.');
      }

      // Store tokens securely
      if (data.data.tokens?.accessToken) {
        setAccessToken(data.data.tokens.accessToken);
      }
      if (data.data.tokens?.refreshToken) {
        setRefreshToken(data.data.tokens.refreshToken);
      }

      // Set user in context
      if (data.data.user) {
        setUser(data.data.user);
      }

      return data.data;
    },
  });
}

/**
 * Hook to register a new user
 * @returns Mutation function to register
 */
export function useRegister() {
  const { setUser } = useAuth();

  return useMutation({
    mutationFn: async (userData: RegisterBody) => {
      const { data, error } = await apiClient.POST('/api/v1/auth/register', {
        body: userData,
      });

      if (error) {
        const errorMessage = extractErrorMessage(error);
        throw new Error(errorMessage);
      }

      if (!data?.success || !data.data) {
        throw new Error('Invalid response format. Please try again.');
      }

      // Store tokens securely
      if (data.data.tokens?.accessToken) {
        setAccessToken(data.data.tokens.accessToken);
      }
      if (data.data.tokens?.refreshToken) {
        setRefreshToken(data.data.tokens.refreshToken);
      }

      // Set user in context
      if (data.data.user) {
        setUser(data.data.user);
      }

      return data.data;
    },
  });
}

/**
 * Hook to logout a user
 * @returns Mutation function to logout
 */
export function useLogout() {
  const { logout } = useAuth();

  return useMutation({
    mutationFn: async () => {
      const { error } = await apiClient.POST('/api/v1/auth/logout');

      if (error) {
        console.error('Logout API error:', error);
      }

      // Clear tokens from storage
      clearTokens();
      
      // Clear user from context
      logout();
      return null;
    },
  });
}

