import { api } from "./api";
import type { UsuarioBusqueda } from "../types";

export const usuarioService = {
  buscarUsuarios: (q: string, excludeId?: number) => {
    const params = new URLSearchParams({ q });
    if (excludeId != null) params.set("excludeId", String(excludeId));
    return api.get<UsuarioBusqueda[]>(`/usuarios/buscar?${params.toString()}`);
  },

  registrarFcmToken: (idUsuario: number, fcmToken: string) =>
    api.put<void>(`/usuarios/${idUsuario}/fcm-token`, { fcmToken }),
};
