import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { Button } from "../../components/common/Button";
import { Input } from "../../components/common/Input";
import { validateEmail, validatePassword } from "../../utils/validators";

export function Login() {
  const [correo, setCorreo] = useState("");
  const [contrasena, setContrasena] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showTokenModal, setShowTokenModal] = useState(false);
  const [tokenInput, setTokenInput] = useState("");
  const { login, loginWithToken } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    const emailErr = validateEmail(correo);
    if (emailErr) { setError(emailErr); return; }
    const passErr = validatePassword(contrasena);
    if (passErr) { setError(passErr); return; }
    setIsLoading(true);

    try {
      await login({ correo, contrasena });
      navigate("/dashboard");
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Error al iniciar sesión";
      setError(errorMessage);
      if (
        errorMessage.toLowerCase().includes("verificar") ||
        errorMessage.toLowerCase().includes("verify")
      ) {
        navigate("/verify");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleTokenSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);
    try {
      await loginWithToken(tokenInput.trim());
      navigate("/grupos");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Token inválido");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-page">
      {/* Grid Overlay */}
      <div className="grid-overlay" />

      <main
        style={{
          width: "100%",
          maxWidth: "448px",
          position: "relative",
          zIndex: 1,
        }}
      >
        {/* Brand Identity */}
        <div className="auth-brand">
          <h1>THIN WALLET</h1>
          <p>Tu billetera inteligente / Finanzas personales</p>
        </div>

        {/* Login Card */}
        <div className="auth-card neo-shadow">
          <h2>Acceso de Usuario</h2>

          {error && <div className="error-alert">{error}</div>}

          <form onSubmit={handleSubmit}>
            <Input
              label="Correo Electrónico"
              type="email"
              name="correo"
              icon="person"
              placeholder="nombre@archivo.com"
              value={correo}
              onChange={(e) => setCorreo(e.target.value)}
              required
            />

            <Input
              label="Contraseña"
              type="password"
              name="contrasena"
              icon="lock"
              placeholder="••••••••"
              value={contrasena}
              onChange={(e) => setContrasena(e.target.value)}
              required
            />

            <Button type="submit" isLoading={isLoading} icon="arrow_right_alt">
              Iniciar Sesión
            </Button>
          </form>

          <div style={{ marginTop: "16px" }}>
            <button
              type="button"
              className="btn btn-secondary"
              style={{
                width: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
              }}
              onClick={() => {
                setShowTokenModal(true);
                setError("");
              }}
            >
              <span
                className="material-symbols-outlined"
                style={{ fontSize: "18px" }}
              >
                key
              </span>
              Entrar con Token
            </button>
          </div>

          <div
            style={{
              marginTop: "24px",
              display: "flex",
              flexDirection: "column",
              gap: "16px",
            }}
          >
            <div className="auth-links-row">
              <Link
                to="/forgot-password"
                className="auth-links"
                style={{
                  fontSize: "0.75rem",
                  fontWeight: 700,
                  textDecoration: "underline",
                  textDecorationThickness: "2px",
                  textUnderlineOffset: "4px",
                  padding: "2px 4px",
                }}
              >
                ¿Olvidó contraseña?
              </Link>
              <Link
                to="/register"
                className="auth-links"
                style={{
                  fontSize: "0.75rem",
                  fontWeight: 700,
                  textDecoration: "underline",
                  textDecorationThickness: "2px",
                  textUnderlineOffset: "4px",
                  padding: "2px 4px",
                }}
              >
                Crear Cuenta
              </Link>
            </div>
          </div>
        </div>

        {/* Footer / Editorial Note */}
        <div className="auth-footer">
          <div className="auth-footer-divider">
            <div className="line" />
            <span
              className="material-symbols-outlined"
              style={{ color: "var(--primary)" }}
            >
              eco
            </span>
            <div className="line" />
          </div>
          <p>
            Controla tus gastos, organiza tus círculos y alcanza tus metas financieras.
            <br />
            v1.2.0 — 2026
          </p>
        </div>
      </main>

      {/* Modal: Entrar con Token */}
      {showTokenModal && (
        <div className="modal-overlay" onClick={() => setShowTokenModal(false)}>
          <div
            className="modal-overlay-content neo-shadow"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <h2>Entrar con Token</h2>
              <button
                type="button"
                className="close-btn"
                onClick={() => setShowTokenModal(false)}
                aria-label="Cerrar"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <p
              style={{
                fontSize: "0.85rem",
                marginBottom: "20px",
                color: "var(--on-surface-variant)",
                lineHeight: 1.5,
              }}
            >
              Ingresa el token personal que recibiste para acceder a tu círculo.
            </p>
            {error && <div className="error-alert">{error}</div>}
            <form onSubmit={handleTokenSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <div className="input-group" style={{ marginBottom: 0 }}>
                <label style={{ fontWeight: 600, letterSpacing: "0.05em", fontSize: "0.78rem" }}>Token de acceso</label>
                <input
                  type="text"
                  value={tokenInput}
                  onChange={(e) => setTokenInput(e.target.value)}
                  placeholder="Pega aquí tu token"
                  style={{ fontFamily: "monospace", fontSize: "0.85rem" }}
                  required
                />
              </div>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={isLoading || !tokenInput.trim()}
                style={{ width: "100%", marginTop: "4px" }}
              >
                {isLoading ? "Verificando..." : "Acceder →"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
