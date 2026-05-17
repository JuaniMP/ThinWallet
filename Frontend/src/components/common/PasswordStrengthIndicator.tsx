interface PasswordStrengthIndicatorProps {
  password: string;
}

export function PasswordStrengthIndicator({
  password,
}: PasswordStrengthIndicatorProps) {
  const requirements = [
    { test: password.length >= 8, label: "Al menos 8 caracteres" },
    { test: /[a-z]/.test(password), label: "Una letra minúscula" },
    { test: /[A-Z]/.test(password), label: "Una letra mayúscula" },
    { test: /\d/.test(password), label: "Un número" },
    { test: /@$!%*?&/.test(password), label: "Un carácter especial (@$!%*?&)" },
  ];

  const metRequirements = requirements.filter((r) => r.test).length;
  const strength =
    metRequirements === 0
      ? "none"
      : metRequirements <= 2
        ? "weak"
        : metRequirements <= 3
          ? "fair"
          : "strong";

  const strengthColor = {
    none: "#999",
    weak: "#ff6b6b",
    fair: "#ffd93d",
    strong: "#6bcb77",
  };

  return (
    <div style={{ marginTop: 12, fontSize: 13 }}>
      {/* Barra de fortaleza */}
      <div style={{ marginBottom: 8 }}>
        <div
          style={{
            height: 4,
            backgroundColor: "#eee",
            borderRadius: 2,
            overflow: "hidden",
          }}
        >
          <div
            style={{
              height: "100%",
              width: `${(metRequirements / 5) * 100}%`,
              backgroundColor: strengthColor[strength],
              transition: "width 0.3s ease",
            }}
          />
        </div>
        <div style={{ marginTop: 4, fontSize: 12, color: strengthColor[strength] }}>
          Fortaleza: {strength === "none" ? "Sin definir" : strength === "weak" ? "Débil" : strength === "fair" ? "Aceptable" : "Fuerte"}
        </div>
      </div>

      {/* Requisitos */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
        {requirements.map((req) => (
          <div
            key={req.label}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              fontSize: 12,
              color: req.test ? "#6bcb77" : "#999",
            }}
          >
            <span
              style={{
                display: "inline-block",
                width: 16,
                height: 16,
                borderRadius: "50%",
                border: `1px solid ${req.test ? "#6bcb77" : "#ddd"}`,
                backgroundColor: req.test ? "#6bcb77" : "transparent",
              }}
            >
              {req.test && (
                <span
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    width: "100%",
                    height: "100%",
                    color: "white",
                    fontSize: 12,
                    fontWeight: "bold",
                  }}
                >
                  ✓
                </span>
              )}
            </span>
            <span>{req.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
