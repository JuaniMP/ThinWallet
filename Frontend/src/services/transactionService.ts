import { api } from './api';
import type { Transaction, CreateTransactionRequest, Balance, TransactionFilters, PaginatedResponse, SaldoResponse } from '../types';

export const transactionService = {
  async getAll(filters?: TransactionFilters): Promise<PaginatedResponse<Transaction>> {
    const params = new URLSearchParams();
    if (filters?.type) params.append('type', filters.type);
    if (filters?.categoryId) params.append('categoryId', filters.categoryId);
    if (filters?.page) params.append('page', String(filters.page));
    if (filters?.limit) params.append('limit', String(filters.limit));

    const query = params.toString();
    const endpoint = query ? `/transactions?${query}` : '/transactions';
    
    return api.get<PaginatedResponse<Transaction>>(endpoint);
  },

  async getById(id: string): Promise<Transaction> {
    return api.get<Transaction>(`/transactions/${id}`);
  },

  async create(data: CreateTransactionRequest): Promise<Transaction> {
    return api.post<Transaction>('/transactions', data);
  },

  async delete(id: string): Promise<void> {
    await api.delete(`/transactions/${id}`);
  },

  async getBalance(): Promise<Balance> {
    return api.get<Balance>('/transactions/balance');
  },
  async getSaldo(idUsuario: number): Promise<SaldoResponse> {
    return api.get<SaldoResponse>(`/usuarios/${idUsuario}/saldo`);
  },
};