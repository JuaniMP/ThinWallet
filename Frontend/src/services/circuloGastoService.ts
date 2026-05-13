import { api } from "./api";
import type { CirculoDetalle, CirculoGasto, TipoCirculo } from "../types";

const CIRCULOS_GASTO_BASE = "/circulos-gasto";
const TIPOS_CIRCULO_BASE = "/tipos-circulo";
const FALLBACK_TIPOS_CIRCULO: TipoCirculo[] = [
  { idTipoCirculo: 1, nombre: "Familiar" },
  { idTipoCirculo: 3, nombre: "Amigos" },
  { idTipoCirculo: 4, nombre: "Pareja" },
];

export const circleService = {
  // Crear círculo con invitados fantasmas
  createCircle: async (data: {
    nombre: string;
    tipoCirculo: string;
    idUsuarioCreador: number;
    nombresInvitados: string[];
    monedaBase?: string;
  }) => {
    return api.post<CirculoGasto>(CIRCULOS_GASTO_BASE, data);
  },

  // Obtener todos los círculos
  getAllCircles: async () => {
    return api.get<CirculoGasto[]>(CIRCULOS_GASTO_BASE);
  },

  // Obtener círculos donde el usuario es invitado (miembro)
  getCirclesAsMember: async (idUsuario: number) => {
    return api.get<CirculoGasto[]>(
      `${CIRCULOS_GASTO_BASE}/miembro/${idUsuario}`,
    );
  },

  getCircleDetail: async (idCirculoGasto: number) => {
    return api.get<CirculoDetalle>(
      `${CIRCULOS_GASTO_BASE}/${idCirculoGasto}/detalle`,
    );
  },

  getCirclesByUser: async (idUsuario: number) => {
    return api.get<CirculoGasto[]>(
      `${CIRCULOS_GASTO_BASE}/usuario/${idUsuario}`,
    );
  },

  joinCircle: async (token: string, idUsuario: number) => {
    return api.post<CirculoGasto>(`${CIRCULOS_GASTO_BASE}/unirse`, {
      tokenInvitacion: token,
      idUsuario,
    });
  },

  getAllTipoCirculos: async () => {
    try {
      const tiposCirculo = await api.get<TipoCirculo[]>(TIPOS_CIRCULO_BASE);

      if (Array.isArray(tiposCirculo) && tiposCirculo.length > 0) {
        return tiposCirculo;
      }

      console.warn(
        `El endpoint ${TIPOS_CIRCULO_BASE} devolvió una lista vacía`,
      );
    } catch (error) {
      console.warn(
        `No se pudo cargar tipos de círculo desde ${TIPOS_CIRCULO_BASE}`,
        error,
      );
    }

    return FALLBACK_TIPOS_CIRCULO;
  },
};
