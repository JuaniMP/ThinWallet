import { api } from "./api";
import type { LoginRequest, RegisterRequest, User } from "../types";

interface LoginResponse {
  token: string;
  usuario: User;
}

export const authService = {
  async login(credentials: LoginRequest): Promise<LoginResponse> {
    return api.post<LoginResponse>("/usuarios/login", credentials);
  },

  async loginWithToken(token: string): Promise<LoginResponse> {
    return api.post<LoginResponse>('/usuarios/login-token', { tokenInvitacion: token });
  },

  async register(data: RegisterRequest): Promise<User> {
    return api.post<User>("/usuarios/register", data);
  },

  async logout(): Promise<void> {
    return Promise.resolve();
  },

  async requestPasswordResetCode(correo: string): Promise<string> {
    return api.post<string>("/usuarios/recuperar-contrasena", { correo });
  },

  async verifyPasswordResetCode(
    correo: string,
    codigo: string,
  ): Promise<string> {
    return api.post<string>("/usuarios/verificar-codigo", { correo, codigo });
  },

  async verify(correo: string, codigo: string): Promise<string> {
    return api.post<string>("/usuarios/verify", { correo, codigo });
  },

  async changePassword(
    correo: string,
    codigo: string,
    nuevaContrasena: string,
  ): Promise<string> {
    return api.post<string>("/usuarios/cambiar-contrasena", {
      correo,
      codigo,
      nuevaContrasena,
    });
  },

  async getUserById(id: number): Promise<User> {
    return api.get<User>(`/usuarios/${id}`);
  },

  async updatePerfil(
    idUsuario: number,
    data: { nombres?: string; apellidos?: string; nombreUsuario?: string; descripcion?: string },
  ): Promise<User> {
    return api.patch<User>(`/usuarios/${idUsuario}/perfil`, data);
  },

  async cambiarContrasenaAutenticado(
    idUsuario: number,
    contrasenaActual: string,
    nuevaContrasena: string,
  ): Promise<string> {
    return api.put<string>(`/usuarios/${idUsuario}/cambiar-contrasena`, {
      contrasenaActual,
      nuevaContrasena,
    });
  },

  async reenviarVerificacion(correo: string): Promise<string> {
    return api.post<string>("/usuarios/reenviar-verificacion", { correo });
  },
};
