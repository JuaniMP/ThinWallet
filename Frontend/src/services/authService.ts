import { api } from './api';
import type { LoginRequest, RegisterRequest, User } from '../types';

export const authService = {
  async login(credentials: LoginRequest): Promise<User> {
    return api.post<User>('/usuarios/login', credentials);
  },

  async register(data: RegisterRequest): Promise<User> {
    return api.post<User>('/usuarios/register', data);
  },

  async logout(): Promise<void> {
    return Promise.resolve();
  },

  async requestPasswordResetCode(correo: string): Promise<string> {
    return api.post<string>('/usuarios/recuperar-contrasena', { correo });
  },

  async verifyPasswordResetCode(correo: string, codigo: string): Promise<string> {
    return api.post<string>('/usuarios/verificar-codigo', { correo, codigo });
  },

  async changePassword(correo: string, codigo: string, nuevaContrasena: string): Promise<string> {
    return api.post<string>('/usuarios/cambiar-contrasena', { correo, codigo, nuevaContrasena });
  },
};