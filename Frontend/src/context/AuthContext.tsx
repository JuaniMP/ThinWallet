import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import type { User, AuthResponse, LoginRequest, RegisterRequest } from '../types';
import { api } from '../services/api';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: LoginRequest) => Promise<void>;
  register: (data: RegisterRequest) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');

    if (storedToken && storedUser) {
      setToken(storedToken);
      setUser(JSON.parse(storedUser));
    }
    setIsLoading(false);
  }, []);

  const login = async (credentials: LoginRequest) => {
    if (credentials.email === 'usuario@hotmail.com' && credentials.password === '123') {
      const mockUser = {
        id: 'mock-123',
        name: 'Usuario Quemado',
        email: 'usuario@hotmail.com'
      } as User;
      const mockToken = 'mock-token-xyz';

      localStorage.setItem('token', mockToken);
      localStorage.setItem('user', JSON.stringify(mockUser));
      setToken(mockToken);
      setUser(mockUser);
      return;
    }

    const response = await api.post<AuthResponse>('/auth/login', credentials);
    const { user: userData, token: authToken } = response;

    localStorage.setItem('token', authToken);
    localStorage.setItem('user', JSON.stringify(userData));

    setToken(authToken);
    setUser(userData);
  };

  const register = async (data: RegisterRequest) => {
    const response = await api.post<AuthResponse>('/auth/register', data);
    const { user: userData, token: authToken } = response;

    localStorage.setItem('token', authToken);
    localStorage.setItem('user', JSON.stringify(userData));

    setToken(authToken);
    setUser(userData);
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!token,
        isLoading,
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}