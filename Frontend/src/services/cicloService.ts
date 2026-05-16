import { api } from "./api";

export interface CierreCicloRequest {
  idCirculo: number;
  mes: number;
  anio: number;
}

export interface CierreCicloResponse {
  resultado: number;
  mensaje: string;
  idCirculo: number;
  mes: number;
  anio: number;
}

export const cicloService = {
  async cerrarMensual(req: CierreCicloRequest): Promise<CierreCicloResponse> {
    return api.post<CierreCicloResponse>("/ciclos/cerrar-mensual", req);
  },
};
