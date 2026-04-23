export interface User {
  id?: string; // For some local mock maps
  idUsuario: number;
  nombres: string;
  apellidos: string;
  correo: string;
  nombreUsuario: string;
  name?: string; // For compatibility with some layouts
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

export interface SaldoResponse {
  saldoTotal: number;
}