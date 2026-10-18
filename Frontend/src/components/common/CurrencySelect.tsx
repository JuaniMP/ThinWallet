import type { CSSProperties } from "react";
import { SUPPORTED_CURRENCIES, type CurrencyCode } from "../../utils/currency";

interface CurrencySelectProps {
  value: string;
  onChange: (currency: CurrencyCode) => void;
  label?: string;
  id?: string;
  required?: boolean;
  style?: CSSProperties;
}

export function CurrencySelect({
  value,
  onChange,
  label = "Moneda",
  id = "moneda",
  required = false,
  style,
}: CurrencySelectProps) {
  return (
    <div className="input-group" style={style}>
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
