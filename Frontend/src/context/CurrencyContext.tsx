import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export const SUPPORTED_CURRENCIES = [
  "COP",
  "USD",
  "EUR",
  "MXN",
  "ARS",
] as const;
export type CurrencyCode = (typeof SUPPORTED_CURRENCIES)[number];

export const RATES_TO_USD: Record<CurrencyCode, number> = {
  COP: 1 / 4000,
  USD: 1,
  EUR: 1.08,
  MXN: 1 / 18,
  ARS: 1 / 1000,
};

const STORAGE_KEY = "preferredCurrency";

interface CurrencyContextType {
  currency: CurrencyCode;
  setCurrency: (c: CurrencyCode) => void;
  convert: (amount: number, from?: CurrencyCode) => number;
  format: (amount: number, from?: CurrencyCode) => string;
  symbolOf: (c?: CurrencyCode) => string;
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(
  undefined,
);

function readStored(): CurrencyCode {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw && SUPPORTED_CURRENCIES.includes(raw as CurrencyCode)) {
      return raw as CurrencyCode;
    }
  } catch {
    /* ignore */
  }
  return "COP";
}

export function CurrencyProvider({ children }: { children: ReactNode }) {
  const [currency, setCurrencyState] = useState<CurrencyCode>(() => readStored());

  const setCurrency = useCallback((c: CurrencyCode) => {
    setCurrencyState(c);
    try {
      localStorage.setItem(STORAGE_KEY, c);
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    const handler = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY && e.newValue) {
        const next = e.newValue as CurrencyCode;
        if (SUPPORTED_CURRENCIES.includes(next)) setCurrencyState(next);
      }
    };
    window.addEventListener("storage", handler);
    return () => window.removeEventListener("storage", handler);
  }, []);

  const convert = useCallback(
    (amount: number, from: CurrencyCode = "COP") => {
      if (!amount || isNaN(amount)) return 0;
      if (from === currency) return amount;
      const usd = amount * (RATES_TO_USD[from] ?? 1);
      const toRate = RATES_TO_USD[currency] ?? 1;
      return usd / toRate;
    },
    [currency],
  );

  const format = useCallback(
    (amount: number, from: CurrencyCode = "COP") => {
      const value = convert(amount, from);
      const decimals = currency === "COP" || currency === "ARS" ? 0 : 2;
      return value.toLocaleString("es-CO", {
        style: "currency",
        currency,
        maximumFractionDigits: decimals,
        minimumFractionDigits: decimals,
      });
    },
    [convert, currency],
  );

  const symbolOf = useCallback(
    (c: CurrencyCode = currency) => {
      const sample = (0).toLocaleString("es-CO", {
        style: "currency",
        currency: c,
        maximumFractionDigits: 0,
      });
      return sample.replace(/[\d\s.,]/g, "") || c;
    },
    [currency],
  );

  const value = useMemo(
    () => ({ currency, setCurrency, convert, format, symbolOf }),
    [currency, setCurrency, convert, format, symbolOf],
  );

  return (
    <CurrencyContext.Provider value={value}>{children}</CurrencyContext.Provider>
  );
}

/**
 * Devuelve la tasa de cambio desde la moneda indicada hacia COP (moneda base).
 * Esta tasa se envía al backend, que la pasa a fn_convertir_moneda(monto, tasa)
 * para registrar el equivalente en COP. Si moneda == COP, devuelve 1.
 *
 * Centralizado aquí para que todas las creaciones de transacciones
 * (gastos, mesadas, pagos de deuda, etc.) usen la MISMA lógica de tasa.
 */
// eslint-disable-next-line react-refresh/only-export-components
export function tasaCambioACOP(moneda?: string | null): number {
  const m = (moneda ?? "COP") as CurrencyCode;
  const rateOrigen = RATES_TO_USD[m] ?? 1;
  const rateCop = RATES_TO_USD["COP"] ?? 1 / 4000;
  return rateOrigen / rateCop;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useCurrency() {
  const ctx = useContext(CurrencyContext);
  if (!ctx) {
    throw new Error("useCurrency must be used within a CurrencyProvider");
  }
  return ctx;
}
