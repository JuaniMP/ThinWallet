export interface User {
  id: string;
  name: string;
  email: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
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
}

export interface CreateTransactionRequest {
  amount: number;
  description: string;
  type: 'income' | 'expense';
  categoryId: string;
  date: string;
}

export interface Category {
  id: string;
  name: string;
  type: 'income' | 'expense' | 'both';
  icon?: string;
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

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
  };
}