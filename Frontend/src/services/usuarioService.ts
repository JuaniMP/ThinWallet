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

  /** RQ-13 — Balance neto del usuario en un rango de fechas.
   *  Backend invoca fn_balance_usuario_periodo en MySQL. */
  getBalancePeriodo: (idUsuario: number, inicio: string, fin: string) =>
    api.get<number>(
      `/usuarios/${idUsuario}/balance?inicio=${inicio}&fin=${fin}`,
    ),
};
