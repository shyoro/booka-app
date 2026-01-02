import { useMutation } from '@tanstack/react-query';
import apiClient from '~/lib/api-client';
import type { paths } from '~/types/api-types';
import { useAuth } from '~/contexts/AuthContext';

type LoginBody = paths['/api/v1/auth/login']['post']['requestBody']['content']['application/json'];
type RegisterBody = paths['/api/v1/auth/register']['post']['requestBody']['content']['application/json'];
type LoginResponse = paths['/api/v1/auth/login']['post']['responses'][200]['content']['application/json'];
type RegisterResponse = paths['/api/v1/auth/register']['post']['responses'][201]['content']['application/json'];

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
        throw new Error('Login failed');
      }

      if (!data?.success || !data.data) {
        throw new Error('Invalid response format');
      }

      if (data.data.tokens?.accessToken) {
        localStorage.setItem('accessToken', data.data.tokens.accessToken);
      }

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
        throw new Error('Registration failed');
      }

      if (!data?.success || !data.data) {
        throw new Error('Invalid response format');
      }

      if (data.data.tokens?.accessToken) {
        localStorage.setItem('accessToken', data.data.tokens.accessToken);
      }

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

      logout();
      return null;
    },
  });
}

