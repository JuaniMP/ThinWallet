import { createContext, useContext, useState, useRef, type ReactNode } from 'react';
import type { Transaction, Balance, TransactionFilters } from '../types';
import { api } from '../services/api';

// Backend entity shape (what the API actually returns)
interface BackendTransaccion {
  idTransaccion: number;
  nombre: string;
  montoOriginal: number;
  monedaOriginal: string | null;
  tasaCambio: number | null;
  tipoMovimiento: string;
  modalidadDivision: string | null;
  contexto: string | null;
  idUsuario: number;
  idCirculoGasto: number | null;
  idCategoria: number | null;
  idGasto: number | null;
  idTipoMovimiento: number | null;
}

// Map backend entity to frontend Transaction type
function mapToFrontend(t: BackendTransaccion): Transaction {
  return {
    id: String(t.idTransaccion),
    userId: String(t.idUsuario),
    amount: t.montoOriginal * (t.tasaCambio ?? 1),
    description: t.nombre,
    type: t.tipoMovimiento === 'DEPOSITO' ? 'income' : 'expense',
    categoryId: t.idCategoria ? String(t.idCategoria) : '',
    date: new Date().toISOString(), // backend doesn't have a date field on transaccion
    createdAt: new Date().toISOString(),
    idTipoMovimiento: t.idTipoMovimiento ?? 1,
  };
}
interface TransactionContextType {
  transactions: Transaction[];
  balance: Balance | null;
  isLoading: boolean;
  error: string | null;
  fetchTransactions: (filters?: TransactionFilters) => Promise<void>;
  createTransaction: (data: {
    nombre: string;
    montoOriginal: number;
    tipoMovimiento: string;
    idUsuario: number;
    idCategoria?: number;
    idTipoMovimiento: number;
  }) => Promise<void>;
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
      // Get user from localStorage to filter by user
      const storedUser = localStorage.getItem('user');
      let idUsuario: number | null = null;
      if (storedUser) {
        try {
          const user = JSON.parse(storedUser);
          idUsuario = user.idUsuario;
        } catch { /* ignore */ }
      }

      let endpoint = '/transacciones';
      if (idUsuario) {
        endpoint = `/transacciones/usuario/${idUsuario}`;
      }

      const response = await api.get<BackendTransaccion[]>(endpoint);
      const mapped = (Array.isArray(response) ? response : []).map(mapToFrontend);
      setTransactions(mapped);
    } catch (err) {
      // Don't set error for empty results — just show no transactions
      console.error('Error fetching transactions:', err);
      setTransactions([]);
    } finally {
      setIsLoading(false);
    }
  };

  const createTransaction = async (data: {
    nombre: string;
    montoOriginal: number;
    tipoMovimiento: string;
    idUsuario: number;
    idCategoria?: number;
    idTipoMovimiento: number;
  }) => {
    setIsLoading(true);
    setError(null);
    try {
      await api.post<BackendTransaccion>('/transacciones', data);
      await fetchTransactions();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al crear transacción');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const deleteTransaction = async (id: string) => {
    setIsLoading(true);
    setError(null);
    try {
      await api.delete(`/transacciones/${id}`);
      await fetchTransactions();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al eliminar transacción');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const fetchBalance = async () => {
    // Balance is now handled by the saldo endpoint in Dashboard directly
    // This is kept for compatibility but does nothing
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