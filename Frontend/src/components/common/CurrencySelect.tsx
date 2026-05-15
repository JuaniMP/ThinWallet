export const SUPPORTED_CURRENCIES = ["COP", "USD", "EUR", "MXN", "ARS"] as const;
export type CurrencyCode = (typeof SUPPORTED_CURRENCIES)[number];

interface CurrencySelectProps {
  value: string;
  onChange: (currency: CurrencyCode) => void;
  label?: string;
  id?: string;
  required?: boolean;
}

export function CurrencySelect({
  value,
  onChange,
  label = "Moneda",
  id = "moneda",
  required = true,
}: CurrencySelectProps) {
  return (
    <div className="input-group">
      <label htmlFor={id}>{label}</label>
      <select
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value as CurrencyCode)}
        required={required}
      >
        {SUPPORTED_CURRENCIES.map((code) => (
          <option key={code} value={code}>
            {code}
          </option>
        ))}
      </select>
    </div>
  );
}
