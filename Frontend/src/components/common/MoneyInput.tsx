import { useEffect, useState, type InputHTMLAttributes } from "react";

interface MoneyInputProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, "value" | "onChange" | "type"> {
  value: number | "" | undefined;
  onChange: (value: number) => void;
  label?: string;
  error?: string;
  prefix?: string;
}

function formatWithSeparators(raw: string): string {
  if (!raw) return "";
  const cleaned = raw.replace(/[^\d.]/g, "");
  const [intPart, decPart] = cleaned.split(".");
  const intFormatted = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return decPart !== undefined ? `${intFormatted}.${decPart}` : intFormatted;
}

function parseRaw(formatted: string): number {
  const cleaned = formatted.replace(/,/g, "");
  const n = Number(cleaned);
  return isNaN(n) ? 0 : n;
}

export function MoneyInput({
  value,
  onChange,
  label,
  error,
  prefix,
  className = "",
  id,
  name,
  ...rest
}: MoneyInputProps) {
  const inputId = id || name;
  const [display, setDisplay] = useState<string>(() =>
    value && value !== 0 ? formatWithSeparators(String(value)) : "",
  );

  useEffect(() => {
    const numeric = parseRaw(display);
    const incoming = typeof value === "number" ? value : 0;
    if (incoming !== numeric) {
      setDisplay(incoming ? formatWithSeparators(String(incoming)) : "");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatWithSeparators(e.target.value);
    setDisplay(formatted);
    onChange(parseRaw(formatted));
  };

  return (
    <div className={`input-group ${className}`}>
      {label && <label htmlFor={inputId}>{label}</label>}
      <div className="input-wrapper money-input-wrapper">
        {prefix && <span className="money-input-prefix">{prefix}</span>}
        <input
          {...rest}
          id={inputId}
          name={name}
          type="text"
          inputMode="decimal"
          autoComplete="off"
          value={display}
          onChange={handleChange}
          className={error ? "input-error" : ""}
        />
      </div>
      {error && <span className="error-message">{error}</span>}
    </div>
  );
}
