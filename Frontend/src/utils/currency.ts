/** Monedas soportadas y tasas de referencia, compartidas por toda la app. */
export const SUPPORTED_CURRENCIES = ["COP", "USD", "EUR", "MXN", "ARS"] as const;
export type CurrencyCode = (typeof SUPPORTED_CURRENCIES)[number];

export const RATES_TO_USD: Record<CurrencyCode, number> = {
  COP: 1 / 4000,
  USD: 1,
  EUR: 1.08,
  MXN: 1 / 18,
  ARS: 1 / 1000,
};

export function isCurrencyCode(value: string): value is CurrencyCode {
  return (SUPPORTED_CURRENCIES as readonly string[]).includes(value);
}

/**
 * Devuelve la tasa de cambio desde la moneda indicada hacia COP (moneda base).
 * Esta tasa se envía al backend, que la pasa a fn_convertir_moneda(monto, tasa)
 * para registrar el equivalente en COP. Si moneda == COP, devuelve 1.
 *
 * Centralizado aquí para que todas las creaciones de transacciones
 * (gastos, mesadas, pagos de deuda, etc.) usen la MISMA lógica de tasa.
 */
export function tasaCambioACOP(moneda?: string | null): number {
  const m = (moneda ?? "COP") as CurrencyCode;
  const rateOrigen = RATES_TO_USD[m] ?? 1;
  const rateCop = RATES_TO_USD["COP"] ?? 1 / 4000;
  return rateOrigen / rateCop;
}
