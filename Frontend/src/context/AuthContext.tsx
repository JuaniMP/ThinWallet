import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import type { User, AuthResponse, LoginRequest, RegisterRequest } from '../types';
< dev-frontend
import { authService } from '../services/authService';

import { api } from '../services/api';
 main

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: LoginRequest) => Promise<void>;
  register: (data: RegisterRequest) => Promise<void>;
< dev-frontend
  verify: (correo: string, codigo: string) => Promise<void>;
  logout: () => void;
  registrationEmail: string | null;
  setRegistrationEmail: (email: string | null) => void;

  logout: () => void;
 main
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
dev-frontend
  const [registrationEmail, setRegistrationEmail] = useState<string | null>(null);

 main

  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');

dev-frontend
    if (storedToken && storedUser && storedUser !== 'undefined') {
      try {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
      } catch (err) {
        console.error('Error parsing stored user:', err);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }

    if (storedToken && storedUser) {
      setToken(storedToken);
      setUser(JSON.parse(storedUser));
 main
    }
    setIsLoading(false);
  }, []);

  const login = async (credentials: LoginRequest) => {
 dev-frontend
    // Keep mock for local testing
    if (credentials.correo === 'usuario@hotmail.com' && credentials.contrasena === '123') {
      const mockUser = {
        idUsuario: 123,
        nombres: 'Usuario',
        apellidos: 'Quemado',
        correo: 'usuario@hotmail.com',
        nombreUsuario: 'usuario_mock'

    if (credentials.email === 'usuario@hotmail.com' && credentials.password === '123') {
      const mockUser = {
        id: 'mock-123',
        name: 'Usuario Quemado',
        email: 'usuario@hotmail.com'
 main
      } as User;
      const mockToken = 'mock-token-xyz';

      localStorage.setItem('token', mockToken);
      localStorage.setItem('user', JSON.stringify(mockUser));
      setToken(mockToken);
      setUser(mockUser);
      return;
    }

dev-frontend
    const response = await authService.login(credentials);

    const response = await api.post<AuthResponse>('/auth/login', credentials);
 main
    const { user: userData, token: authToken } = response;

    localStorage.setItem('token', authToken);
    localStorage.setItem('user', JSON.stringify(userData));

    setToken(authToken);
    setUser(userData);
  };

  const register = async (data: RegisterRequest) => {
 dev-frontend
    await authService.register(data);
    // After update, register might not return token/user as it's "Pending"
    // We store the email to use in verification screen
    setRegistrationEmail(data.correo);
  };

  const verify = async (correo: string, codigo: string) => {
    await authService.verify(correo, codigo);

    const response = await api.post<AuthResponse>('/auth/register', data);
    const { user: userData, token: authToken } = response;

    localStorage.setItem('token', authToken);
    localStorage.setItem('user', JSON.stringify(userData));

    setToken(authToken);
    setUser(userData);
 main
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
dev-frontend
        verify,
        logout,
        registrationEmail,
        setRegistrationEmail,

        logout,
 main
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