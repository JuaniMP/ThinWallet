import { useEffect, useRef, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { Layout } from "../../components/layout/Layout";
import { authService } from "../../services/authService";
import { transactionService } from "../../services/transactionService";
import { api } from "../../services/api";
import {
  useCurrency,
  SUPPORTED_CURRENCIES,
  type CurrencyCode,
} from "../../context/CurrencyContext";
import { validatePassword, validateName, validateUsername, validateEmail } from "../../utils/validators";
import type { User } from "../../types";

export function Profile() {
  const { user: authUser, logout, setUser } = useAuth();
  const { currency, setCurrency, format } = useCurrency();
  const [profileData, setProfileData] = useState<User | null>(authUser);
  const [saldo, setSaldo] = useState<number | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(!!authUser?.idUsuario);
  const [loadingSaldo, setLoadingSaldo] = useState(!!authUser?.idUsuario);

  const isGhost = authUser?.estado === 0;

  const [idCopied, setIdCopied] = useState(false);
  const handleCopyId = () => {
    if (profileData?.idUsuario) {
      void navigator.clipboard.writeText(String(profileData.idUsuario));
      setIdCopied(true);
      setTimeout(() => setIdCopied(false), 2000);
    }
  };

  const [showCambiarPass, setShowCambiarPass] = useState(false);
  const [passForm, setPassForm] = useState({
    contrasenaActual: "",
    nuevaContrasena: "",
    confirmar: "",
  });
  const [passError, setPassError] = useState("");
  const [passOk, setPassOk] = useState(false);
  const [passLoading, setPassLoading] = useState(false);
  const passFormRef = useRef<HTMLFormElement>(null);

  const handleCambiarPass = async (e: React.FormEvent) => {
    e.preventDefault();
    setPassError("");
    if (!passForm.contrasenaActual) {
      setPassError("Ingresa tu contraseña actual");
      return;
    }
    const passErr = validatePassword(passForm.nuevaContrasena);
    if (passErr) { setPassError(passErr); return; }
    if (passForm.nuevaContrasena !== passForm.confirmar) {
      setPassError("Las contraseñas nuevas no coinciden");
      return;
    }
    if (!authUser?.idUsuario) return;
    setPassLoading(true);
    try {
      await authService.cambiarContrasenaAutenticado(
        authUser.idUsuario,
        passForm.contrasenaActual,
        passForm.nuevaContrasena,
      );
      setPassOk(true);
      setPassForm({ contrasenaActual: "", nuevaContrasena: "", confirmar: "" });
      setShowCambiarPass(false);
    } catch (err: unknown) {
      setPassError(err instanceof Error ? err.message : "Error al cambiar la contraseña");
    } finally {
      setPassLoading(false);
    }
  };

  const [showEditPerfil, setShowEditPerfil] = useState(false);
  const [editForm, setEditForm] = useState({
    nombres: profileData?.nombres ?? "",
    apellidos: profileData?.apellidos ?? "",
    nombreUsuario: profileData?.nombreUsuario ?? "",
    descripcion: profileData?.descripcion ?? "",
  });
  const [editError, setEditError] = useState("");
  const [editSaving, setEditSaving] = useState(false);

  const openEditPerfil = () => {
    setEditForm({
      nombres: profileData?.nombres ?? "",
      apellidos: profileData?.apellidos ?? "",
      nombreUsuario: profileData?.nombreUsuario ?? "",
      descripcion: profileData?.descripcion ?? "",
    });
    setEditError("");
    setShowEditPerfil(true);
  };

  const handleEditPerfil = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!authUser?.idUsuario) return;
    setEditError("");
    const nombresErr = validateName(editForm.nombres, "Nombres");
    if (nombresErr) { setEditError(nombresErr); return; }
    const apellidosErr = validateName(editForm.apellidos, "Apellidos");
    if (apellidosErr) { setEditError(apellidosErr); return; }
    if (editForm.nombreUsuario) {
      const usernameErr = validateUsername(editForm.nombreUsuario);
      if (usernameErr) { setEditError(usernameErr); return; }
    }
    setEditSaving(true);
    try {
      const updated = await authService.updatePerfil(authUser.idUsuario, editForm);
      setProfileData(updated);
      if (setUser) setUser(updated);
      setShowEditPerfil(false);
    } catch (err: unknown) {
      setEditError(err instanceof Error ? err.message : "Error al actualizar perfil");
    } finally {
      setEditSaving(false);
    }
  };

  const [showReclamar, setShowReclamar] = useState(false);
  const [reclamarForm, setReclamarForm] = useState({
    nombres: authUser?.nombres ?? "",
    apellidos: authUser?.apellidos ?? "",
    nombreUsuario: "",
    correo: "",
    contrasena: "",
  });
  const [reclamarError, setReclamarError] = useState("");
  const [reclamarOk, setReclamarOk] = useState(false);

  const handleReclamar = async (e: React.FormEvent) => {
    e.preventDefault();
    setReclamarError("");
    const nombresErr = validateName(reclamarForm.nombres, "Nombres");
    if (nombresErr) { setReclamarError(nombresErr); return; }
    const apellidosErr = validateName(reclamarForm.apellidos, "Apellidos");
    if (apellidosErr) { setReclamarError(apellidosErr); return; }
    const usernameErr = validateUsername(reclamarForm.nombreUsuario);
    if (usernameErr) { setReclamarError(usernameErr); return; }
    const emailErr = validateEmail(reclamarForm.correo);
    if (emailErr) { setReclamarError(emailErr); return; }
    const passErr = validatePassword(reclamarForm.contrasena);
    if (passErr) { setReclamarError(passErr); return; }
    try {
      const usuario = await api.post<User>("/usuarios/reclamar-perfil", {
        tokenReclamo: authUser?.tokenReclamo,
        ...reclamarForm,
      });
      if (setUser) setUser(usuario);
      setProfileData(usuario);
      setReclamarOk(true);
      setShowReclamar(false);
    } catch (err: unknown) {
      setReclamarError(
        err instanceof Error ? err.message : "Error al reclamar perfil",
      );
    }
  };

  useEffect(() => {
    if (!authUser?.idUsuario) {
      return;
    }

    authService
      .getUserById(authUser.idUsuario)
      .then((data) => setProfileData(data))
      .catch(() => setProfileData(authUser))
      .finally(() => setLoadingProfile(false));

    transactionService
      .getSaldo(authUser.idUsuario)
      .then((res) => setSaldo(res.saldoTotal))
      .catch(() => setSaldo(null))
      .finally(() => setLoadingSaldo(false));
  }, [authUser?.idUsuario]);

  const fullName =
    profileData?.nombres && profileData?.apellidos
      ? `${profileData.nombres} ${profileData.apellidos}`
      : profileData?.nombres ?? "Usuario";

  const initials = profileData?.nombres
    ? profileData.nombres.charAt(0).toUpperCase()
    : "U";

  const memberSince = profileData?.fechaRegistro
    ? new Date(profileData.fechaRegistro).toLocaleDateString("es-ES", {
        year: "numeric",
        month: "long",
      })
    : null;

  const saldoFormatted = saldo !== null ? format(saldo, "COP") : "—";

  const stats = [
    {
      label: "Saldo Total",
      value: loadingSaldo ? "..." : saldoFormatted,
      bg: "bg-high",
    },
    {
      label: "Usuario",
      value: profileData?.nombreUsuario || "—",
      bg: "bg-accent",
    },
    {
      label: "Estado",
      value: profileData?.estado === 1 ? "Activo" : profileData?.estado === 0 ? "Fantasma" : "—",
      bg: "bg-high",
    },
  ];


  return (
    <Layout>
      <div className="profile-page">
        {/* Hero Profile */}
        <div className="profile-hero neo-shadow">
          <div className="profile-avatar">
            <div
              style={{
                width: "100%",
                height: "100%",
                background: "var(--accent)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: 900,
                color: "var(--primary)",
                fontSize: "3rem",
                fontFamily: "var(--font-headline)",
              }}
            >
              {loadingProfile ? "…" : initials}
            </div>
          </div>
          <div className="profile-info">
            {loadingProfile ? (
              <h2>Cargando...</h2>
            ) : (
              <>
                <h2>{fullName}</h2>
                <p className="email">{profileData?.correo || "—"}</p>
                {profileData?.descripcion && (
                  <p
                    style={{
                      fontSize: "0.85rem",
                      opacity: 0.75,
                      marginTop: "4px",
                    }}
                  >
                    {profileData.descripcion}
                  </p>
                )}
                <div className="member-badge">
                  {memberSince ? `Miembro desde: ${memberSince}` : "ThinWallet"}
                </div>
              </>
            )}
          </div>
          <div className="profile-actions">
            <button
              className="btn btn-primary neo-shadow-hover neo-shadow-active"
              style={{ fontSize: "0.875rem" }}
              onClick={openEditPerfil}
            >
              Editar Perfil
            </button>
            <button
              className="btn btn-secondary"
              style={{ fontSize: "0.875rem" }}
              onClick={logout}
            >
              Cerrar Sesión
            </button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="stats-grid">
          {stats.map((stat) => (
            <div key={stat.label} className={`stat-card ${stat.bg} neo-shadow`}>
              <p className="stat-label">{stat.label}</p>
              <h3 className="stat-value">{stat.value}</h3>
            </div>
          ))}
        </div>

        {/* Reclamar perfil para cuentas fantasma */}
        {isGhost && (
          <div className="profile-section neo-shadow" style={{ marginBottom: 16, padding: 0, overflow: "hidden" }}>
            {/* Header */}
            <div style={{ background: "var(--primary)", padding: "16px 20px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <p style={{ margin: 0, fontSize: "0.68rem", fontWeight: 700, letterSpacing: "0.12em", color: "var(--background)", opacity: 0.75 }}>CUENTA INVITADA</p>
                <h4 style={{ margin: "2px 0 0", color: "var(--background)", fontSize: "1rem", fontWeight: 700 }}>Reclama tu perfil</h4>
              </div>
              <span className="material-symbols-outlined" style={{ color: "var(--background)", fontSize: 28, opacity: 0.8 }}>person_add</span>
            </div>

            <div style={{ padding: "16px 20px" }}>
              {reclamarOk ? (
                <p style={{ color: "var(--primary)", fontWeight: 700, margin: 0 }}>¡Perfil reclamado exitosamente!</p>
              ) : (
                <>
                  <p style={{ fontSize: "0.85rem", marginBottom: 16, color: "var(--on-surface-variant)", lineHeight: 1.5 }}>
                    Eres un usuario invitado. Registra tus datos para acceder con tu propio correo y contraseña.
                  </p>

                  {!showReclamar ? (
                    <button className="btn btn-primary" style={{ width: "100%" }} onClick={() => setShowReclamar(true)}>
                      Reclamar mi perfil →
                    </button>
                  ) : (
                    <form onSubmit={(e) => void handleReclamar(e)} style={{ display: "flex", flexDirection: "column", gap: 0 }}>
                      <div className="input-group">
                        <label>Nombres</label>
                        <input type="text" value={reclamarForm.nombres} onChange={(e) => setReclamarForm((f) => ({ ...f, nombres: e.target.value }))} required />
                      </div>
                      <div className="input-group">
                        <label>Apellidos</label>
                        <input type="text" value={reclamarForm.apellidos} onChange={(e) => setReclamarForm((f) => ({ ...f, apellidos: e.target.value }))} required />
                      </div>
                      <div className="input-group">
                        <label>Nombre de usuario</label>
                        <input type="text" value={reclamarForm.nombreUsuario} onChange={(e) => setReclamarForm((f) => ({ ...f, nombreUsuario: e.target.value }))} required />
                      </div>
                      <div className="input-group">
                        <label>Correo electrónico</label>
                        <input type="email" value={reclamarForm.correo} onChange={(e) => setReclamarForm((f) => ({ ...f, correo: e.target.value }))} required />
                      </div>
                      <div className="input-group">
                        <label>Contraseña</label>
                        <input type="password" value={reclamarForm.contrasena} onChange={(e) => setReclamarForm((f) => ({ ...f, contrasena: e.target.value }))} required />
                      </div>
                      {reclamarError && <p className="error-msg">{reclamarError}</p>}
                      <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
                        <button type="button" className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setShowReclamar(false)}>Cancelar</button>
                        <button type="submit" className="btn btn-primary" style={{ flex: 2 }}>Confirmar y reclamar</button>
                      </div>
                    </form>
                  )}
                </>
              )}
            </div>
          </div>
        )}

        {/* Preferencia de moneda */}
        <div className="profile-section bg-white" style={{ marginBottom: 16 }}>
          <h4>Moneda Preferida</h4>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
            <span className="material-symbols-outlined" style={{ color: "var(--primary)", fontSize: "1.4rem", flexShrink: 0 }}>
              currency_exchange
            </span>
            <p className="row-desc" style={{ margin: 0 }}>
              Todos los valores se convertirán y mostrarán en esta moneda
            </p>
          </div>
          <div className="input-group" style={{ marginBottom: 0 }}>
            <label>Visualizar todo en</label>
            <select
              value={currency}
              onChange={(e) => setCurrency(e.target.value as CurrencyCode)}
            >
              {SUPPORTED_CURRENCIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Gastos programados y metas — accesos rápidos */}
        <div className="profile-section bg-white" style={{ marginBottom: 16, opacity: isGhost ? 0.4 : 1, pointerEvents: isGhost ? "none" : "auto" }}>
          <h4 style={{ display: "flex", alignItems: "center", gap: 8 }}>
            Mis Finanzas
            {isGhost && <span className="material-symbols-outlined" style={{ fontSize: "1rem", color: "var(--on-surface-variant)" }}>lock</span>}
          </h4>
          <div
            className="section-row"
            style={{ cursor: isGhost ? "not-allowed" : "pointer" }}
            onClick={() => !isGhost && window.location.assign("/scheduled")}
          >
            <div>
              <p className="row-label">Gastos Programados</p>
              <p className="row-desc">Automatiza tus gastos recurrentes</p>
            </div>
            <span className="material-symbols-outlined" style={{ color: "var(--primary)" }}>event_repeat</span>
          </div>
          <div
            className="section-row"
            style={{ cursor: isGhost ? "not-allowed" : "pointer", borderTop: "1px solid var(--outline-variant)" }}
            onClick={() => !isGhost && window.location.assign("/gastos-hormiga")}
          >
            <div>
              <p className="row-label">Gastos Hormiga</p>
              <p className="row-desc">Detecta micro-gastos que erosionan tu balance</p>
            </div>
            <span className="material-symbols-outlined" style={{ color: "var(--primary)" }}>pest_control</span>
          </div>
        </div>

        {/* ID de usuario */}
        <div className="profile-section bg-white" style={{ marginBottom: 16 }}>
          <h4>Tu ID de Usuario</h4>
          <div className="section-row" style={{ alignItems: "center" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span
                className="material-symbols-outlined"
                style={{ color: "var(--primary)", fontSize: "1.5rem" }}
              >
                key
              </span>
              <div>
                <p className="row-label" style={{ fontFamily: "monospace", fontSize: "1.1rem", letterSpacing: 2 }}>
                  {loadingProfile ? "..." : (profileData?.idUsuario ?? "—")}
                </p>
                <p className="row-desc">Comparte este ID para que otros te agreguen como acreedor en deudas</p>
              </div>
            </div>
            <button
              className="btn btn-secondary"
              style={{ fontSize: "0.8rem", padding: "6px 12px", minWidth: 80 }}
              onClick={handleCopyId}
              disabled={loadingProfile}
            >
              {idCopied ? "¡Copiado!" : "Copiar"}
            </button>
          </div>
        </div>

        {/* Security Section */}
        <div className="profile-section bg-white" style={{ opacity: isGhost ? 0.4 : 1, pointerEvents: isGhost ? "none" : "auto" }}>
          <h4 style={{ display: "flex", alignItems: "center", gap: 8 }}>
            Seguridad & Privacidad
            {isGhost && <span className="material-symbols-outlined" style={{ fontSize: "1rem", color: "var(--on-surface-variant)" }}>lock</span>}
          </h4>

          {/* Cambiar contraseña */}
          <div className="section-row" style={{ flexDirection: "column", alignItems: "flex-start", gap: 8 }}>
            <div
              style={{ display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%", cursor: "pointer" }}
              onClick={() => { setShowCambiarPass((v) => !v); setPassError(""); setPassOk(false); }}
            >
              <div>
                <p className="row-label">Cambiar Contraseña</p>
                <p className="row-desc">Actualiza tu contraseña de acceso</p>
              </div>
              <span className="material-symbols-outlined" style={{ color: "var(--primary)" }}>
                {showCambiarPass ? "expand_less" : "lock_reset"}
              </span>
            </div>
            {passOk && (
              <p style={{ color: "var(--primary)", fontWeight: 700, fontSize: "0.85rem" }}>
                ¡Contraseña actualizada exitosamente!
              </p>
            )}
            {showCambiarPass && (
              <form
                ref={passFormRef}
                onSubmit={(e) => void handleCambiarPass(e)}
                style={{ width: "100%", display: "flex", flexDirection: "column", gap: 0, marginTop: 8 }}
              >
                <div className="input-group">
                  <label>Contraseña actual</label>
                  <input
                    type="password"
                    value={passForm.contrasenaActual}
                    onChange={(e) => setPassForm((f) => ({ ...f, contrasenaActual: e.target.value }))}
                    required
                    autoComplete="current-password"
                  />
                </div>
                <div className="input-group">
                  <label>Nueva contraseña</label>
                  <input
                    type="password"
                    value={passForm.nuevaContrasena}
                    onChange={(e) => setPassForm((f) => ({ ...f, nuevaContrasena: e.target.value }))}
                    required
                    minLength={6}
                    autoComplete="new-password"
                  />
                </div>
                <div className="input-group">
                  <label>Confirmar nueva contraseña</label>
                  <input
                    type="password"
                    value={passForm.confirmar}
                    onChange={(e) => setPassForm((f) => ({ ...f, confirmar: e.target.value }))}
                    required
                    minLength={6}
                    autoComplete="new-password"
                  />
                </div>
                {passError && <p className="error-msg">{passError}</p>}
                <div style={{ display: "flex", gap: 0, marginTop: 4, borderTop: "2px solid var(--primary)" }}>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    style={{ flex: 1, borderRadius: 0, borderRight: "1px solid var(--primary)" }}
                    onClick={() => { setShowCambiarPass(false); setPassError(""); }}
                  >
                    Cancelar
                  </button>
                  <button type="submit" className="btn btn-primary" disabled={passLoading} style={{ flex: 2, borderRadius: 0 }}>
                    {passLoading ? "Guardando..." : "Guardar contraseña"}
                  </button>
                </div>
              </form>
            )}
          </div>

        </div>
      </div>

      {/* Modal Editar Perfil */}
      {showEditPerfil && (
        <div className="modal-overlay" onClick={() => setShowEditPerfil(false)}>
          <div className="modal-card neo-shadow" onClick={(e) => e.stopPropagation()}>
            <h3>Editar Perfil</h3>
            <form onSubmit={(e) => void handleEditPerfil(e)}>
              <label>
                Nombres
                <input
                  type="text"
                  value={editForm.nombres}
                  onChange={(e) => setEditForm((f) => ({ ...f, nombres: e.target.value }))}
                  required
                />
              </label>
              <label>
                Apellidos
                <input
                  type="text"
                  value={editForm.apellidos}
                  onChange={(e) => setEditForm((f) => ({ ...f, apellidos: e.target.value }))}
                  required
                />
              </label>
              <label>
                Nombre de usuario
                <input
                  type="text"
                  value={editForm.nombreUsuario}
                  onChange={(e) => setEditForm((f) => ({ ...f, nombreUsuario: e.target.value }))}
                />
              </label>
              <label>
                Descripción (opcional)
                <input
                  type="text"
                  value={editForm.descripcion}
                  onChange={(e) => setEditForm((f) => ({ ...f, descripcion: e.target.value }))}
                  placeholder="Una breve descripción tuya"
                />
              </label>
              {editError && <p className="error-msg">{editError}</p>}
              <div className="form-actions">
                <button type="button" className="btn-secondary" onClick={() => setShowEditPerfil(false)}>
                  Cancelar
                </button>
                <button type="submit" className="btn-primary" disabled={editSaving}>
                  {editSaving ? "Guardando..." : "Guardar"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Layout>
  );
}
