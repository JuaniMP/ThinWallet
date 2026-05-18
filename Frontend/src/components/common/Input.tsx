import { useState, type InputHTMLAttributes } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: string;
}

export function Input({
  label,
  error,
  icon,
  className = "",
  id,
  type,
  ...props
}: InputProps) {
  const inputId = id || props.name;
  const isPassword = type === "password";
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className={`input-group ${className}`}>
      {label && <label htmlFor={inputId}>{label}</label>}
      <div className={`input-wrapper${isPassword ? " input-wrapper--password" : ""}`}>
        {icon && <span className="material-symbols-outlined">{icon}</span>}
        <input
          id={inputId}
          type={isPassword ? (showPassword ? "text" : "password") : type}
          className={error ? "input-error" : ""}
          style={!icon ? { paddingLeft: "16px" } : undefined}
          {...props}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            style={{
              flexShrink: 0,
              marginLeft: "auto",
              background: "none",
              border: "none",
              cursor: "pointer",
              padding: "0 10px",
              display: "flex",
              alignItems: "center",
              color: "var(--primary)",
            }}
            tabIndex={-1}
            aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
          >
            <span className="material-symbols-outlined" style={{ fontSize: "20px" }}>
              {showPassword ? "visibility_off" : "visibility"}
            </span>
          </button>
        )}
      </div>
      {error && <span className="error-message">{error}</span>}
    </div>
  );
}
