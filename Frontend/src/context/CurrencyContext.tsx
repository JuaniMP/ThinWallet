import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import {
  RATES_TO_USD,
  isCurrencyCode,
  type CurrencyCode,
} from "../utils/currency";

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
    if (raw && isCurrencyCode(raw)) {
      return raw;
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
        if (isCurrencyCode(e.newValue)) setCurrencyState(e.newValue);
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

// eslint-disable-next-line react-refresh/only-export-components
export function useCurrency() {
  const ctx = useContext(CurrencyContext);
  if (!ctx) {
    throw new Error("useCurrency must be used within a CurrencyProvider");
  }
  return ctx;
}
