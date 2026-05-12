import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { authService } from "../../services/authService";
import { Button } from "../../components/common/Button";
import { Input } from "../../components/common/Input";

export function Verify() {
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [resending, setResending] = useState(false);

  const { verify, registrationEmail } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!registrationEmail) {
      // User reached this page without going through registration
    }
  }, [registrationEmail]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!registrationEmail) {
      setError(
        "No se encontró un correo para verificar. Por favor intenta registrarte de nuevo.",
      );
      return;
    }

    setError("");
    setSuccess("");
    setIsLoading(true);

    try {
      await verify(registrationEmail, code);
      setSuccess("¡Correo verificado exitosamente! Ya puedes iniciar sesión.");
      setTimeout(() => navigate("/login"), 3000);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Código de verificación incorrecto o expirado",
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    if (!registrationEmail) {
      setError(
        "No se encontró un correo. Por favor intenta registrarte de nuevo.",
      );
      return;
    }
    setResending(true);
    setError("");
    setSuccess("");
    try {
      await authService.reenviarVerificacion(registrationEmail);
      setSuccess("Código reenviado a tu correo. Revisa tu bandeja de entrada.");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Error al reenviar el código",
      );
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="grid-overlay" />

      <main
        style={{
          width: "100%",
          maxWidth: "448px",
          position: "relative",
          zIndex: 1,
        }}
      >
        <div className="auth-brand">
          <h1>THIN WALLET</h1>
          <p>Verificación de Identidad / Registro</p>
        </div>

        <div className="auth-card neo-shadow">
          <h2>Verificar Correo</h2>
          <p className="subtitle">
            Hemos enviado un código de 6 dígitos a: <br />
            <strong>{registrationEmail || "tu correo electrónico"}</strong>
          </p>

          {error && <div className="error-alert">{error}</div>}
          {success && <div className="success-alert">{success}</div>}

          <form onSubmit={handleSubmit}>
            <Input
              label="Código de Verificación"
              type="text"
              name="code"
              icon="pin"
              placeholder="123456"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              required
              maxLength={6}
            />

            <Button type="submit" isLoading={isLoading} icon="verified_user">
              Verificar Cuenta
            </Button>
          </form>

          <div style={{ marginTop: "32px", textAlign: "center" }}>
            <p style={{ fontSize: "0.875rem", fontWeight: 500 }}>
              ¿No recibiste el código?{" "}
              <button
                type="button"
                className="auth-links"
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  textDecoration: "underline",
                  fontWeight: 700,
                  color: "var(--primary)",
                }}
                onClick={handleResend}
                disabled={resending}
              >
                {resending ? "Reenviando..." : "Reenviar código"}
              </button>
            </p>
            <div style={{ marginTop: "16px" }}>
              <Link to="/login" className="auth-links">
                Volver al inicio de sesión
              </Link>
            </div>
          </div>
        </div>

        <div className="auth-footer">
          <div className="auth-footer-divider">
            <div className="line" />
            <span
              className="material-symbols-outlined"
              style={{ color: "var(--primary)" }}
            >
              shield_lock
            </span>
            <div className="line" />
          </div>
          <p>
            Tu seguridad es nuestra prioridad.
            <br />
            Edición Neo-Brutalista 2024.
          </p>
        </div>
      </main>
    </div>
  );
}
