import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { Button } from "../../components/common/Button";
import { Input } from "../../components/common/Input";
import { PasswordStrengthIndicator } from "../../components/common/PasswordStrengthIndicator";
import {
  validateName,
  validateUsername,
  validateEmail,
  validatePassword,
} from "../../utils/validators";

export function Register() {
  const [nombres, setNombres] = useState("");
  const [apellidos, setApellidos] = useState("");
  const [nombreUsuario, setNombreUsuario] = useState("");
  const [correo, setCorreo] = useState("");
  const [contrasena, setContrasena] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Validar nombres
    const nombresError = validateName(nombres, "Nombres");
    if (nombresError) {
      setError(nombresError);
      return;
    }

    // Validar apellidos
    const apellidosError = validateName(apellidos, "Apellidos");
    if (apellidosError) {
      setError(apellidosError);
      return;
    }

    // Validar nombre de usuario
    const usernameError = validateUsername(nombreUsuario);
    if (usernameError) {
      setError(usernameError);
      return;
    }

    // Validar email
    const emailError = validateEmail(correo);
    if (emailError) {
      setError(emailError);
      return;
    }

    // Validar que las contraseñas coincidan
    if (contrasena !== confirmPassword) {
      setError("Las contraseñas no coinciden");
      return;
    }

    // Validar contraseña fuerte
    const passwordError = validatePassword(contrasena);
    if (passwordError) {
      setError(passwordError);
      return;
    }

    if (!acceptedTerms) {
      setError("Debes aceptar los términos y condiciones");
      return;
    }

    setIsLoading(true);

    try {
      await register({
        nombres,
        apellidos,
        nombreUsuario,
        correo,
        contrasena,
      });
      navigate("/verify");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al crear cuenta");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <main className="register-layout neo-shadow">
        {/* Left Side: Branding (Desktop) */}
        <section className="register-brand-panel">
          <div style={{ position: "relative", zIndex: 10 }}>
            <div className="brand-header">
              <span
                className="material-symbols-outlined"
                style={{ fontSize: "2.25rem" }}
              >
                account_balance
              </span>
              <h1>THIN WALLET</h1>
            </div>
            <div className="hero-text">
              <h2>
                THE
                <br />
                BOTANICAL
                <br />
                ARCHIVIST.
              </h2>
              <p>
                Organiza tus activos digitales con la precisión de un herbario
                real. Estructura, seguridad y crecimiento orgánico.
              </p>
            </div>
          </div>
          <div style={{ position: "relative", zIndex: 10 }}>
            <div className="version-badge">
              <p>Version 2.0.4 - 2024</p>
            </div>
          </div>
        </section>

        {/* Right Side: Form */}
        <section className="register-form-panel">
          <header>
            <h3>NUEVA CUENTA</h3>
            <div className="accent-bar" />
            <p>Empieza a cultivar tu patrimonio hoy mismo.</p>
          </header>

          {error && <div className="error-alert">{error}</div>}

          <form onSubmit={handleSubmit}>
            <div className="form-row">
              <Input
                label="Nombres"
                type="text"
                name="nombres"
                icon="person"
                placeholder="EJ. JULIÁN"
                value={nombres}
                onChange={(e) => setNombres(e.target.value)}
                required
              />
              <Input
                label="Apellidos"
                type="text"
                name="apellidos"
                icon="person"
                placeholder="EJ. ARCHIVISTA"
                value={apellidos}
                onChange={(e) => setApellidos(e.target.value)}
                required
              />
            </div>

            <Input
              label="Nombre de Usuario"
              type="text"
              name="nombreUsuario"
              icon="badge"
              placeholder="julian_archivista"
              value={nombreUsuario}
              onChange={(e) => setNombreUsuario(e.target.value)}
              required
            />

            <Input
              label="Correo Electrónico"
              type="email"
              name="correo"
              icon="alternate_email"
              placeholder="CORREO@EJEMPLO.COM"
              value={correo}
              onChange={(e) => setCorreo(e.target.value)}
              required
            />

            <div className="form-row">
              <div style={{ flex: 1 }}>
                <Input
                  label="Contraseña"
                  type="password"
                  name="contrasena"
                  icon="lock"
                  placeholder="********"
                  value={contrasena}
                  onChange={(e) => setContrasena(e.target.value)}
                  required
                />
                {contrasena && <PasswordStrengthIndicator password={contrasena} />}
              </div>
              <Input
                label="Confirmar Contraseña"
                type="password"
                name="confirmPassword"
                icon="lock_reset"
                placeholder="********"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </div>

            <div className="terms-check">
              <input
                type="checkbox"
                id="terms"
                checked={acceptedTerms}
                onChange={(e) => setAcceptedTerms(e.target.checked)}
              />
              <label htmlFor="terms">
                Acepto los términos y condiciones de uso del servicio.
              </label>
            </div>

            <Button type="submit" isLoading={isLoading} icon="arrow_forward">
              CREAR CUENTA
            </Button>
          </form>

          {/* Footer */}
          <div className="register-footer">
            <p>
              ¿Ya tienes cuenta? <Link to="/login">Inicia sesión</Link>
            </p>
          </div>
        </section>
      </main>
    </div>
  );
}
