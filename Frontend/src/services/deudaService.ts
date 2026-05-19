import { api } from "./api";
import type { Deuda } from "../types";

const BASE = "/deudas";

export const deudaService = {
  getByDeudor: (idUsuario: number) =>
    api.get<Deuda[]>(`${BASE}/deudor/${idUsuario}`),

  getByAcreedor: (idUsuario: number) =>
    api.get<Deuda[]>(`${BASE}/acreedor/${idUsuario}`),

  create: (data: {
    monto: number;
    idUsuarioDeudor: number;
    idUsuarioAcreedor: number;
    metodoPagoSugerido?: string;
    estadoPago?: string;
  }) => api.post<Deuda>(BASE, data),

  /** RQ-08 paso 1: el deudor registra que pagó. Invoca sp_pagar_deuda. */
  pagar: (idDeuda: number, metodoPago?: string) =>
    api.post<{ resultado: number; mensaje: string }>(
      `${BASE}/${idDeuda}/pagar`,
      metodoPago ? { metodoPago } : {},
    ),

  /** RQ-08 paso 2: el acreedor confirma recepción. Invoca sp_confirmar_pago_deuda. */
  confirmar: (idDeuda: number, idTransaccion?: number) =>
    api.put<Deuda>(
      `${BASE}/${idDeuda}/confirmar`,
      idTransaccion ? { idTransaccion } : {},
    ),

  rechazar: (idDeuda: number, motivo?: string) =>
    api.put<Deuda>(`${BASE}/${idDeuda}/rechazar`, motivo ? { motivo } : {}),

  /** RQ-07: balance de deudas pendientes (PENDIENTE + CONFIRMADA_PENDIENTE) de un
   *  usuario en un círculo. Invoca fn_calcular_deuda_usuario. */
  getBalanceByCircle: (idUsuario: number, idCirculo: number) =>
    api.get<number>(`${BASE}/balance/${idUsuario}/circulo/${idCirculo}`),
};
