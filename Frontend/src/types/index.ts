export interface User {
  id?: string;
  idUsuario: number;
  nombres: string;
  apellidos: string;
  correo: string;
  nombreUsuario: string;
  descripcion?: string;
  fechaRegistro?: string;
  estado?: number;
  idTipoUsuario?: number;
  tipoUsuario?: number;
  tokenReclamo?: string;
  name?: string;
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
  type: "income" | "expense";
  categoryId: string;
  date: string;
  createdAt: string;
  idTipoMovimiento?: number;
}

export interface CreateTransactionRequest {
  nombre: string;
  montoOriginal: number;
  tipoMovimiento?: string;
  idUsuario: number;
  idCategoria?: number;
  idTipoMovimiento?: number;
  idCirculoGasto?: number;
  monedaOriginal?: string;
  contexto?: string;
}

export interface Transaccion {
  idTransaccion: number;
  nombre: string;
  montoOriginal: number;
  monedaOriginal?: string;
  tasaCambio?: number;
  tipoMovimiento?: string;
  tipoCategoria?: string;
  modalidadDivision?: string;
  contexto?: string;
  idUsuario?: number;
  idCirculoGasto?: number;
  idCategoria?: number;
  idTipoMovimiento?: number;
}

export interface TipoMovimiento {
  idTipoMovimiento: number;
  nombre: string;
}

export interface Balance {
  totalIncome: number;
  totalExpense: number;
  balance: number;
}

export interface TransactionFilters {
  type?: "income" | "expense";
  categoryId?: string;
  page?: number;
  limit?: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}

export interface SaldoResponse {
  saldoTotal: number;
}

export interface Category {
  idCategoria: number;
  nombre: string;
  tipoCategoria?: string;
  descripcion?: string;
  estado?: number;
}

export interface TipoCirculo {
  idTipoCirculo: number;
  nombre: string;
}

export interface CirculoGasto {
  idCirculoGasto: number;
  nombre: string;
  monedaBase?: string;
  tokenInvitacion?: string;
  tipoCirculo?: string;
  idTipoCirculo?: number;
  presupuestoGrupal?: number;
  permiteMesadas?: boolean;
  permiteSimplificacionDeudas?: boolean;
  idUsuarioCreador?: number;
  fechaCreacion?: string;
  estado?: string;
  nombresInvitados?: string[];
}

export interface CirculoInvitado {
  idUsuario: number;
  nombreCompleto: string;
  correo?: string;
  tipoUsuario?: string;
  rolUsuario?: string;
  tokenInvitacionPersonal?: string;
}

export interface CirculoDetalle {
  idCirculoGasto: number;
  nombre: string;
  tipoCirculo?: string;
  monedaBase?: string;
  tokenInvitacion?: string;
  presupuestoGrupal?: number;
  permiteMesadas?: boolean;
  permiteSimplificacionDeudas?: boolean;
  idUsuarioCreador?: number;
  nombreCreador?: string;
  correoCreador?: string;
  fechaCreacion?: string;
  estado?: string | number;
  totalMiembros: number;
  totalInvitados: number;
  invitados: CirculoInvitado[];
}

export interface Notificacion {
  id: string;
  idUsuarioDestino: number;
  titulo: string;
  mensaje: string;
  tipo: string;
  idCirculoGasto?: number;
  nombreCirculo?: string;
  leida: boolean;
  fechaCreacion: string;
}

export interface UsuarioCirculo {
  idUsuarioCirculo: number;
  idUsuario: number;
  idCirculoGasto: number;
  rolUsuario?: string;
  fechaIngreso?: string;
}

export interface UsuarioBusqueda {
  idUsuario: number;
  nombreCompleto: string;
  correo: string;
  nombreUsuario: string;
}

export interface Deuda {
  idDeuda: number;
  monto: number;
  metodoPagoSugerido?: string;
  porcentajeDivision?: number;
  estadoPago?: string;
  fechaCreacion?: string;
  fechaConfirmada?: string;
  fechaPago?: string;
  idTransaccion?: number;
  idUsuarioDeudor?: number;
  idUsuarioAcreedor?: number;
}

export interface Gasto {
  idGasto: number;
  nombre: string;
  valor: number;
  periodicidad?: string;
  fechaInicio?: string;
  fechaFin?: string;
  idUsuarioCreador?: number;
  idCirculoGasto?: number;
  idCategoria?: number;
}

export interface GastoRequest {
  nombre: string;
  valor: number;
  periodicidad?: string;
  fechaInicio?: string;
  fechaFin?: string;
  idUsuarioCreador: number;
  idCirculoGasto?: number;
  idCategoria?: number;
}

export interface UsuarioGasto {
  idUsuarioGasto: number;
  idUsuario: number;
  idGasto: number;
}
