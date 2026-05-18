interface PasswordStrengthIndicatorProps {
  password: string;
}

export function PasswordStrengthIndicator({ password }: PasswordStrengthIndicatorProps) {
  const requirements = [
    { test: password.length >= 8, label: "Al menos 8 caracteres" },
    { test: /[a-z]/.test(password), label: "Una letra minúscula" },
    { test: /[A-Z]/.test(password), label: "Una letra mayúscula" },
    { test: /\d/.test(password), label: "Un número" },
    { test: /[@$!%*?&]/.test(password), label: "Carácter especial (@$!%*?&)" },
  ];

  const metCount = requirements.filter((r) => r.test).length;
  const strength =
    metCount === 0 ? "none"
    : metCount <= 2 ? "weak"
    : metCount <= 3 ? "fair"
    : "strong";

  const strengthMeta = {
    none:  { label: "Sin definir", color: "var(--outline)" },
    weak:  { label: "Débil",       color: "var(--error)" },
    fair:  { label: "Aceptable",   color: "#d4a017" },
    strong:{ label: "Fuerte",      color: "var(--secondary)" },
  } as const;

  const { label: strengthLabel, color: barColor } = strengthMeta[strength];
  const pct = (metCount / 5) * 100;

  return (
    <div className="password-strength-indicator">
      {/* Barra de progreso */}
      <div className="psi-bar-track">
        <div
          className="psi-bar-fill"
          style={{ width: `${pct}%`, background: barColor, transition: "width 0.3s ease, background 0.3s ease" }}
        />
      </div>
      <p className="psi-label" style={{ color: barColor }}>
        Fortaleza: <strong>{strengthLabel}</strong>
      </p>

      {/* Requisitos */}
      <div className="psi-requirements">
        {requirements.map((req) => (
          <div key={req.label} className={`psi-req${req.test ? " psi-req--met" : ""}`}>
            <span className="material-symbols-outlined psi-icon">
              {req.test ? "check_circle" : "radio_button_unchecked"}
            </span>
            <span className="psi-req-label">{req.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
