import { api } from "./api";
import type { Transaccion } from "../types";

export interface GastosHormigaResponse {
  idUsuario: number;
  umbralMonto: number;
  dias: number;
  cantidad: number;
  totalGastado: number;
  transacciones: Transaccion[];
}

export const gastosHormigaService = {
  async getByUsuario(
    idUsuario: number,
    umbral?: number,
    dias?: number,
  ): Promise<GastosHormigaResponse> {
    const params = new URLSearchParams();
    if (umbral != null) params.set("umbral", String(umbral));
    if (dias != null) params.set("dias", String(dias));
    const qs = params.toString();
    return api.get<GastosHormigaResponse>(
      `/transacciones/gastos-hormiga/${idUsuario}${qs ? "?" + qs : ""}`,
    );
  },
};
