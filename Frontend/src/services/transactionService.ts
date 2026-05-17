import { api } from "./api";
import type {
  CreateTransactionRequest,
  SaldoResponse,
  Transaccion,
  TipoMovimiento,
} from "../types";

const FALLBACK_TIPOS: TipoMovimiento[] = [
  { idTipoMovimiento: 1, nombre: "DEPOSITO" },
  { idTipoMovimiento: 2, nombre: "RETIRO" },
];

export const transactionService = {
  async getSaldo(idUsuario: number): Promise<SaldoResponse> {
    return api.get<SaldoResponse>(`/usuarios/${idUsuario}/saldo`);
  },

  async getByCirculo(idCirculo: number): Promise<Transaccion[]> {
    return api.get<Transaccion[]>(`/transacciones/circulo/${idCirculo}`);
  },

  async getTiposMovimiento(): Promise<TipoMovimiento[]> {
    try {
      const tipos = await api.get<TipoMovimiento[]>("/tipos-movimiento");
      if (Array.isArray(tipos) && tipos.length > 0) return tipos;
    } catch {
      // fallback
    }
    return FALLBACK_TIPOS;
  },

  async create(data: CreateTransactionRequest): Promise<Transaccion> {
    return api.post<Transaccion>("/transacciones", data);
  },

  async delete(id: string): Promise<void> {
    await api.delete(`/transacciones/${id}`);
  },
};
