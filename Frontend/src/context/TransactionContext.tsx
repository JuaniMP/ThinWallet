import { createContext, useContext, useState, type ReactNode } from "react";
import type { Transaction, TransactionFilters } from "../types";
import { api } from "../services/api";

interface BackendTransaccion {
  idTransaccion: number;
  nombre: string;
  montoOriginal: number;
  monedaOriginal: string | null;
  tasaCambio: number | null;
  tipoMovimiento: string | null;
  tipoCategoria: string | null;
  modalidadDivision: string | null;
  contexto: string | null;
  idUsuario: number;
  idCirculoGasto: number | null;
  idCategoria: number | null;
  idGasto: number | null;
  idTipoMovimiento: number | null;
}

function mapToFrontend(t: BackendTransaccion): Transaction {
  return {
    id: String(t.idTransaccion),
    userId: String(t.idUsuario),
    amount: t.montoOriginal * (t.tasaCambio ?? 1),
    description: t.nombre,
    type: t.tipoCategoria === "DEPOSITO" ? "income" : "expense",
    categoryId: t.idCategoria ? String(t.idCategoria) : "",
    date: new Date().toISOString(),
    createdAt: new Date().toISOString(),
    idTipoMovimiento: t.idTipoMovimiento ?? 1,
  };
}

function getStoredUserId(): number | null {
  try {
    const stored = localStorage.getItem("user");
    if (!stored) return null;
    const user = JSON.parse(stored);
    return user.idUsuario ?? null;
  } catch {
    return null;
  }
}

interface TransactionContextType {
  transactions: Transaction[];
  saldoTotal: number;
  isLoading: boolean;
  error: string | null;
  fetchTransactions: (filters?: TransactionFilters) => Promise<void>;
  fetchSaldo: () => Promise<void>;
  createTransaction: (data: {
    nombre: string;
    montoOriginal: number;
    tipoMovimiento: string;
    idUsuario: number;
    idCategoria?: number;
    idTipoMovimiento: number;
  }) => Promise<void>;
  deleteTransaction: (id: string) => Promise<void>;
}

const TransactionContext = createContext<TransactionContextType | undefined>(
  undefined,
);

export function TransactionProvider({ children }: { children: ReactNode }) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [saldoTotal, setSaldoTotal] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSaldo = async () => {
    const idUsuario = getStoredUserId();
    if (!idUsuario) return;
    try {
      const response = await api.get<{ saldoTotal: number }>(
        `/usuarios/${idUsuario}/saldo`,
      );
      setSaldoTotal(response.saldoTotal ?? 0);
    } catch {
      // keep existing value on error
    }
  };

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const fetchTransactions = async (_filters?: TransactionFilters) => {
    setIsLoading(true);
    setError(null);
    try {
      const idUsuario = getStoredUserId();
      const endpoint = idUsuario
        ? `/transacciones/usuario/${idUsuario}`
        : "/transacciones";

      const response = await api.get<BackendTransaccion[]>(endpoint);
      const mapped = (Array.isArray(response) ? response : []).map(
        mapToFrontend,
      );
      setTransactions(mapped);
    } catch (err) {
      console.error("Error fetching transactions:", err);
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
      await api.post<BackendTransaccion>("/transacciones", data);
      await fetchTransactions();
      await fetchSaldo();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Error al crear transacción",
      );
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
      await fetchSaldo();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Error al eliminar transacción",
      );
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <TransactionContext.Provider
      value={{
        transactions,
        saldoTotal,
        isLoading,
        error,
        fetchTransactions,
        fetchSaldo,
        createTransaction,
        deleteTransaction,
      }}
    >
      {children}
    </TransactionContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useTransactions() {
  const context = useContext(TransactionContext);
  if (context === undefined) {
    throw new Error(
      "useTransactions must be used within a TransactionProvider",
    );
  }
  return context;
}
