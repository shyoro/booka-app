import { createContext, useContext, useState, useEffect, useRef, useMemo, useCallback } from 'react';
import type { ReactNode } from 'react';
import type { paths } from '~/types/api-types';
import { getAccessToken, getRefreshToken, clearTokens } from '~/lib/token-storage';
import { isTokenExpired } from '~/lib/token-utils';
import { useCurrentUser } from '~/hooks/api/useCurrentUser';
import apiClient from '~/lib/api-client';

type LoginResponse = paths['/api/v1/auth/login']['post']['responses'][200]['content']['application/json'];
type RegisterResponse = paths['/api/v1/auth/register']['post']['responses'][201]['content']['application/json'];
type User = NonNullable<LoginResponse['data']>['user'];

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>;
  logout: () => void;
  setUser: (user: User | null) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

/**
 * AuthContext provider component
 * Manages authentication state and provides auth methods
 * Restores user session on mount and handles token expiration
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const isRestoringRef = useRef(false);
  const restoreAttemptedRef = useRef(false);

  // Fetch current user if token exists
  // Only enable the query if we have a token to avoid unnecessary requests
  const hasToken = getAccessToken() !== null;
  const { data: currentUser, isLoading: isFetchingUser, error: userError } = useCurrentUser({
    enabled: hasToken && !isRestoringRef.current,
  });

  /**
   * Restore user session on mount
   */
  useEffect(() => {
    // Prevent multiple restoration attempts
    if (restoreAttemptedRef.current || isRestoringRef.current) {
      return;
    }

    const restoreUserSession = async () => {
      isRestoringRef.current = true;
      restoreAttemptedRef.current = true;

      try {
        const accessToken = getAccessToken();
        const refreshToken = getRefreshToken();

        // No tokens, user is not logged in
        if (!accessToken && !refreshToken) {
          setIsLoading(false);
          isRestoringRef.current = false;
          return;
        }

        // If access token exists and is valid, user will be fetched by useCurrentUser
        if (accessToken && !isTokenExpired(accessToken)) {
          // Wait for useCurrentUser to fetch user
          setIsLoading(false);
          isRestoringRef.current = false;
          return;
        }

        // Access token expired but refresh token exists - attempt silent refresh
        if (refreshToken && !accessToken) {
          try {
            const { data, error } = await apiClient.POST('/api/v1/auth/refresh', {
              body: { refreshToken },
            });

            if (error || !data?.success || !data.data) {
              // Refresh failed, clear tokens
              clearTokens();
              setUser(null);
              setIsLoading(false);
              isRestoringRef.current = false;
              return;
            }

            // Store new tokens (handled by api-client interceptor, but ensure they're stored)
            const { accessToken: newAccessToken, refreshToken: newRefreshToken } = data.data;
            if (newAccessToken) {
              // Token storage is handled by the interceptor, but we need to wait for user fetch
              // The useCurrentUser hook will fetch the user now that we have a valid token
            }
          } catch (error) {
            console.error('Silent refresh failed:', error);
            clearTokens();
            setUser(null);
          }
        } else if (accessToken && isTokenExpired(accessToken) && refreshToken) {
          // Access token expired, try to refresh
          try {
            const { data, error } = await apiClient.POST('/api/v1/auth/refresh', {
              body: { refreshToken },
            });

            if (error || !data?.success || !data.data) {
              clearTokens();
              setUser(null);
              setIsLoading(false);
              isRestoringRef.current = false;
              return;
            }
          } catch (error) {
            console.error('Silent refresh failed:', error);
            clearTokens();
            setUser(null);
          }
        } else {
          // No valid tokens
          clearTokens();
          setUser(null);
        }

        setIsLoading(false);
        isRestoringRef.current = false;
      } catch (error) {
        console.error('Error restoring user session:', error);
        clearTokens();
        setUser(null);
        setIsLoading(false);
        isRestoringRef.current = false;
      }
    };

    restoreUserSession();
  }, []);

  // Update user state when currentUser is fetched
  useEffect(() => {
    if (currentUser) {
      setUser(currentUser);
      setIsLoading(false);
    } else if (userError && !isFetchingUser) {
      // User fetch failed (likely 401), clear user
      setUser(null);
      setIsLoading(false);
    } else if (!isFetchingUser && !currentUser && !userError) {
      // No user data and not loading - check if we have tokens
      const accessToken = getAccessToken();
      if (!accessToken) {
        setUser(null);
        setIsLoading(false);
      }
    }
  }, [currentUser, userError, isFetchingUser]);

  // Listen for token expiration events from api-client
  useEffect(() => {
    const handleTokenExpired = () => {
      clearTokens();
      setUser(null);
    };

    window.addEventListener('auth:token-expired', handleTokenExpired);
    return () => {
      window.removeEventListener('auth:token-expired', handleTokenExpired);
    };
  }, []);

  const login = useCallback(async (email: string, password: string): Promise<void> => {
    // This will be handled by useLogin hook in useAuthMutations
    // Keeping this for backward compatibility but it's not used
    throw new Error('Use useLogin hook instead');
  }, []);

  const register = useCallback(async (email: string, password: string, name: string): Promise<void> => {
    // This will be handled by useRegister hook in useAuthMutations
    // Keeping this for backward compatibility but it's not used
    throw new Error('Use useRegister hook instead');
  }, []);

  const logout = useCallback(() => {
    clearTokens();
    setUser(null);
  }, []);

  // Determine loading state
  const loadingState = isLoading || (isFetchingUser && !user && getAccessToken() !== null);

  // Memoize context value to prevent unnecessary re-renders
  const contextValue = useMemo(
    () => ({
      user,
      isLoading: loadingState,
      login,
      register,
      logout,
      setUser,
    }),
    [user, loadingState, login, register, logout]
  );

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}

/**
 * Hook to access auth context
 * @returns Auth context value
 * @throws Error if used outside AuthProvider
 */
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

