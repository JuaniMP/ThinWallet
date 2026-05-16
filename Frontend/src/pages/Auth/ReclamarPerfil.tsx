import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "../../components/common/Button";
import { Input } from "../../components/common/Input";
import { PasswordStrengthIndicator } from "../../components/common/PasswordStrengthIndicator";
import { reclamarPerfilService } from "../../services/reclamarPerfilService";
import {
  validateName,
  validateUsername,
  validateEmail,
  validatePassword,
} from "../../utils/validators";

export function ReclamarPerfil() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const initialToken = searchParams.get("token") ?? "";

  const [tokenReclamo, setTokenReclamo] = useState(initialToken);
  const [nombres, setNombres] = useState("");
  const [apellidos, setApellidos] = useState("");
  const [nombreUsuario, setNombreUsuario] = useState("");
  const [correo, setCorreo] = useState("");
  const [contrasena, setContrasena] = useState("");
  const [confirmar, setConfirmar] = useState("");

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    // Validar token
    if (!tokenReclamo.trim()) {
      setError("El token de reclamación es obligatorio.");
      return;
    }

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
    if (contrasena !== confirmar) {
      setError("Las contraseñas no coinciden.");
      return;
    }

    // Validar contraseña fuerte
    const passwordError = validatePassword(contrasena);
    if (passwordError) {
      setError(passwordError);
      return;
    }

    setBusy(true);
    try {
      const user = await reclamarPerfilService.reclamar({
        tokenReclamo: tokenReclamo.trim(),
        nombres: nombres.trim(),
        apellidos: apellidos.trim(),
        nombreUsuario: nombreUsuario.trim(),
        correo: correo.trim(),
        contrasena,
      });
      setSuccess(
        `Perfil reclamado para ${user.nombres} ${user.apellidos}. Ya puedes iniciar sesión.`,
      );
      setTimeout(() => navigate("/login"), 2000);
    } catch (err) {
      const msg =
        err instanceof Error && err.message
          ? err.message
          : "No fue posible reclamar el perfil.";
      setError(
        msg.includes("TOKEN_INVALIDO")
          ? "Token inválido o el perfil ya fue reclamado."
          : msg.includes("CORREO_EN_USO")
            ? "El correo ya está en uso."
            : msg.includes("NOMBRE_EN_USO")
              ? "El nombre de usuario ya está en uso."
              : msg,
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card neo-shadow">
        <h2 className="auth-title">RECLAMAR PERFIL</h2>
        <p
          style={{
            fontSize: 14,
            color: "var(--on-surface-variant)",
            marginBottom: 16,
            lineHeight: 1.5,
          }}
        >
          Si alguien te incluyó en un círculo de gastos sin que tuvieras cuenta,
          recibiste un token de reclamación. Úsalo aquí para crear tu cuenta y
          tomar control de tus deudas.
        </p>

        <form onSubmit={(e) => void submit(e)}>
          <Input
            label="Token de reclamación"
            value={tokenReclamo}
            onChange={(e) => setTokenReclamo(e.target.value)}
            placeholder="Pega aquí tu token"
            required
          />
          <Input
            label="Nombres"
            value={nombres}
            onChange={(e) => setNombres(e.target.value)}
            required
          />
          <Input
            label="Apellidos"
            value={apellidos}
            onChange={(e) => setApellidos(e.target.value)}
            required
          />
          <Input
            label="Nombre de usuario"
            value={nombreUsuario}
            onChange={(e) => setNombreUsuario(e.target.value)}
            required
          />
          <Input
            label="Correo electrónico"
            type="email"
            value={correo}
            onChange={(e) => setCorreo(e.target.value)}
            required
          />
          <div>
            <Input
              label="Contraseña"
              type="password"
              value={contrasena}
              onChange={(e) => setContrasena(e.target.value)}
              required
            />
            {contrasena && <PasswordStrengthIndicator password={contrasena} />}
          </div>
          <Input
            label="Confirmar contraseña"
            type="password"
            value={confirmar}
            onChange={(e) => setConfirmar(e.target.value)}
            required
          />

          {error && <p className="error-msg">{error}</p>}
          {success && (
            <p style={{ color: "var(--success, #1f7a1f)", fontWeight: 600 }}>
              {success}
            </p>
          )}

          <Button
            type="submit"
            disabled={busy}
            isLoading={busy}
            className="full-width"
          >
            Reclamar perfil
          </Button>
        </form>

        <p style={{ marginTop: 16, textAlign: "center", fontSize: 14 }}>
          ¿Ya tienes cuenta? <Link to="/login">Iniciar sesión</Link>
        </p>
      </div>
    </div>
  );
}
