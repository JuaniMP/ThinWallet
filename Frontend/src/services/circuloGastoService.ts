import { api } from "./api";
import type { CirculoGasto, CirculoDetalle, TipoCirculo } from "../types";

const BASE = "/circulos-gasto";
const TIPOS_BASE = "/tipos-circulo";

const FALLBACK_TIPOS: TipoCirculo[] = [
  { idTipoCirculo: 1, nombre: "PERSONAL" },
  { idTipoCirculo: 2, nombre: "GRUPAL" },
  { idTipoCirculo: 3, nombre: "EMPRESARIAL" },
];

export const circleService = {
  getAllCircles: () => api.get<CirculoGasto[]>(BASE),

  getCirclesByUser: (idUsuario: number) =>
    api.get<CirculoGasto[]>(`${BASE}/usuario/${idUsuario}`),

  getCirclesAsMember: (idUsuario: number) =>
    api.get<CirculoGasto[]>(`${BASE}/miembro/${idUsuario}`),

  getCircleDetail: (idCirculoGasto: number) =>
    api.get<CirculoDetalle>(`${BASE}/${idCirculoGasto}/detalle`),

  getCircleById: (id: number) => api.get<CirculoGasto>(`${BASE}/${id}`),

  createCircle: (data: {
    nombre: string;
    tipoCirculo?: string;
    idTipoCirculo?: number;
    idUsuarioCreador: number;
    monedaBase?: string;
    presupuestoGrupal?: number | null;
    nombresInvitados?: string[];
    permiteMesadas?: boolean;
    permiteSimplificacionDeudas?: boolean;
  }) => api.post<Record<string, unknown>>(BASE, data),

  joinCircle: (token: string, idUsuario: number) =>
    api.post<CirculoGasto>(`${BASE}/unirse`, { token, idUsuario }),

  getCircleByToken: (token: string) =>
    api.get<CirculoGasto>(`${BASE}/invitacion/${token}`),

  inviteRegisteredUser: (circleId: number, idUsuario: number) =>
    api.post<CirculoDetalle>(`${BASE}/${circleId}/invitar-registrado`, {
      idUsuario,
    }),

  deleteCircle: (id: number) => api.delete<void>(`${BASE}/${id}`),

  getAllTipoCirculos: async (): Promise<TipoCirculo[]> => {
    try {
      const tipos = await api.get<TipoCirculo[]>(TIPOS_BASE);
      if (Array.isArray(tipos) && tipos.length > 0) return tipos;
    } catch {
      // fall through to fallback
    }
    return FALLBACK_TIPOS;
  },
};
