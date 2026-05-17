import { api } from "./api";
import type { Gasto, GastoRequest, UsuarioGasto } from "../types";

export const gastoService = {
  getMetas: (idUsuario: number) =>
    api.get<Gasto[]>(`/gastos/metas/usuario/${idUsuario}`),

  getProgramados: (idUsuario: number) =>
    api.get<Gasto[]>(`/gastos/programados/usuario/${idUsuario}`),

  getByCirculo: (idCirculo: number) =>
    api.get<Gasto[]>(`/gastos/circulo/${idCirculo}`),

  create: (data: GastoRequest) => api.post<Gasto>("/gastos", data),

  update: (id: number, data: GastoRequest) =>
    api.put<Gasto>(`/gastos/${id}`, data),

  delete: (id: number) => api.delete<void>(`/gastos/${id}`),

  // usuario_gasto
  asignarUsuario: (idUsuario: number, idGasto: number) =>
    api.post<UsuarioGasto>("/usuarios-gastos", { idUsuario, idGasto }),

  getAsignacionesByUsuario: (idUsuario: number) =>
    api.get<UsuarioGasto[]>(`/usuarios-gastos/usuario/${idUsuario}`),

  eliminarAsignacion: (id: number) =>
    api.delete<void>(`/usuarios-gastos/${id}`),
};
