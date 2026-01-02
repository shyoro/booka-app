import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import type { paths } from '~/types/api-types';

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
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      setIsLoading(false);
    } else {
      setIsLoading(false);
    }
  }, []);

  const login = async (email: string, password: string): Promise<void> => {
    // This will be handled by useLogin hook in useAuthMutations
    // Keeping this for backward compatibility but it's not used
    throw new Error('Use useLogin hook instead');
  };

  const register = async (email: string, password: string, name: string): Promise<void> => {
    // This will be handled by useRegister hook in useAuthMutations
    // Keeping this for backward compatibility but it's not used
    throw new Error('Use useRegister hook instead');
  };

  const logout = () => {
    localStorage.removeItem('accessToken');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, register, logout, setUser }}>
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

