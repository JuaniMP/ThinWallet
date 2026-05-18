import { api } from "./api";
import type { Notificacion } from "../types";

export const notificacionService = {
  getByUsuario: (idUsuario: number) =>
    api.get<Notificacion[]>(`/notificaciones/usuario/${idUsuario}`),

  countNoLeidas: (idUsuario: number) =>
    api.get<{ count: number }>(
      `/notificaciones/usuario/${idUsuario}/no-leidas-count`,
    ),

  marcarLeida: (id: number) =>
    api.put<Notificacion>(`/notificaciones/${id}/leer`, {}),

  marcarTodasLeidas: (idUsuario: number) =>
    api.put<void>(`/notificaciones/usuario/${idUsuario}/leer-todas`, {}),

  eliminar: (id: number) => api.delete<void>(`/notificaciones/${id}`),
};
