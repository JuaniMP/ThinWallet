import { api } from "./api";

export interface CoachRecomendacionResponse {
  idUsuario: number;
  ingresoMensual: number;

  necesidadesMax: number;
  deseosMax: number;
  ahorroObjetivo: number;

  gastoNecesidades: number;
  gastoDeseos: number;
  gastoTotal: number;

  porcentajeNecesidades: number;
  porcentajeDeseos: number;
  cumplimientoAhorro: number;

  recomendaciones: string[];
  gastoPorCategoria: Record<string, number>;
}

export const coachService = {
  async getRecomendacion(
    idUsuario: number,
    ingresoMensual?: number,
  ): Promise<CoachRecomendacionResponse> {
    const qs = ingresoMensual ? `?ingresoMensual=${ingresoMensual}` : "";
    return api.get<CoachRecomendacionResponse>(
      `/coach/recomendacion/${idUsuario}${qs}`,
    );
  },

  async getReglas(): Promise<string[]> {
    return api.get<string[]>("/coach/reglas");
  },
};
