import { createContext, useContext, useState, type ReactNode } from 'react';
import type { Transaction, CreateTransactionRequest, Balance, TransactionFilters, PaginatedResponse } from '../types';
import { api } from '../services/api';

interface TransactionContextType {
  transactions: Transaction[];
  balance: Balance | null;
  isLoading: boolean;
  error: string | null;
  fetchTransactions: (filters?: TransactionFilters) => Promise<void>;
  createTransaction: (data: CreateTransactionRequest) => Promise<void>;
  deleteTransaction: (id: string) => Promise<void>;
  fetchBalance: () => Promise<void>;
}

const TransactionContext = createContext<TransactionContextType | undefined>(undefined);

export function TransactionProvider({ children }: { children: ReactNode }) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [balance, setBalance] = useState<Balance | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTransactions = async (filters?: TransactionFilters) => {
    setIsLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (filters?.type) params.append('type', filters.type);
      if (filters?.categoryId) params.append('categoryId', filters.categoryId);
      if (filters?.page) params.append('page', String(filters.page));
      if (filters?.limit) params.append('limit', String(filters.limit));

      const query = params.toString();
      const endpoint = query ? `/transactions?${query}` : '/transactions';
      
      const response = await api.get<PaginatedResponse<Transaction>>(endpoint);
      setTransactions(response.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch transactions');
    } finally {
      setIsLoading(false);
    }
  };

  const createTransaction = async (data: CreateTransactionRequest) => {
    setIsLoading(true);
    setError(null);
    try {
      await api.post<Transaction>('/transactions', data);
      await fetchTransactions();
      await fetchBalance();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create transaction');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const deleteTransaction = async (id: string) => {
    setIsLoading(true);
    setError(null);
    try {
      await api.delete(`/transactions/${id}`);
      await fetchTransactions();
      await fetchBalance();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete transaction');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const fetchBalance = async () => {
    try {
      const response = await api.get<Balance>('/transactions/balance');
      setBalance(response);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch balance');
    }
  };

  return (
    <TransactionContext.Provider
      value={{
        transactions,
        balance,
        isLoading,
        error,
        fetchTransactions,
        createTransaction,
        deleteTransaction,
        fetchBalance,
      }}
    >
      {children}
    </TransactionContext.Provider>
  );
}

export function useTransactions() {
  const context = useContext(TransactionContext);
  if (context === undefined) {
    throw new Error('useTransactions must be used within a TransactionProvider');
  }
  return context;
}