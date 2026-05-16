import { api } from "./api";
import type { User } from "../types";

export interface ReclamarPerfilRequest {
  tokenReclamo: string;
  nombres: string;
  apellidos: string;
  nombreUsuario: string;
  correo: string;
  contrasena: string;
}

export const reclamarPerfilService = {
  async reclamar(req: ReclamarPerfilRequest): Promise<User> {
    return api.post<User>("/usuarios/reclamar-perfil", req);
  },
};
