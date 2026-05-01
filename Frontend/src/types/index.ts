export interface User {
  id?: string; // For some local mock maps
  idUsuario: number;
  nombres: string;
  apellidos: string;
  correo?: string; // Optional para usuarios fantasma
  email?: string;
  nombreUsuario?: string;
  name?: string; // For compatibility with some layouts
  tipoUsuario?: number; // 1=Admin, 2=User, 3=Fantasma (invitado)
}

export interface LoginRequest {
  correo: string;
  contrasena: string;
}

export interface RegisterRequest {
  nombres: string;
  apellidos: string;
  nombreUsuario: string;
  correo: string;
  contrasena: string;
}

export interface Transaction {
  id: string;
  userId: string;
  amount: number;
  description: string;
  type: 'income' | 'expense';
  categoryId: string;
  date: string;
  createdAt: string;
  idTipoMovimiento?: number;
}

export interface Balance {
  totalIncome: number;
  totalExpense: number;
  balance: number;
}

export interface TransactionFilters {
  type?: 'income' | 'expense';
  categoryId?: string;
  page?: number;
  limit?: number;
}

export interface CreateTransactionRequest {
  nombre: string;
  montoOriginal: number;
  tipoMovimiento: string;
  idUsuario: number;
  idCategoria?: number;
  idTipoMovimiento: number;
}

export type PaginatedResponse<T> = T[];

export interface Category {
  idCategoria: number;
  nombre: string;
  tipoCategoria?: string | null;
}

export interface SaldoResponse {
  saldoTotal: number;
}

export interface CirculoGasto {
  idCirculoGasto: number;
  nombre: string;
  tipoCirculo: string;
  idUsuarioCreador: number;
  nombresInvitados?: string[];
  monedaBase?: string;
}

export interface CirculoInvitadoDetalle {
  idUsuario: number;
  nombreCompleto: string;
  tipoUsuario?: string | null;
  tokenInvitacionPersonal?: string | null;
  correo?: string | null;
}

export interface CirculoDetalle {
  idCirculoGasto: number;
  nombre: string;
  tipoCirculo?: string | null;
  monedaBase?: string | null;
  tokenInvitacion?: string | null;
  presupuestoGrupal?: number | null;
  permiteMesadas?: boolean | null;
  permiteSimplificacionDeudas?: boolean | null;
  idUsuarioCreador: number;
  fechaCreacion?: string | null;
  estado?: number | null;
  totalMiembros: number;
  totalInvitados: number;
  invitados: CirculoInvitadoDetalle[];
}

export interface TipoCirculo {
  idTipoCirculo: number;
  nombre: string;
}