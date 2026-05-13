import { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { Layout } from "../../components/layout/Layout";
import { authService } from "../../services/authService";
import { transactionService } from "../../services/transactionService";
import { api } from "../../services/api";
import type { User } from "../../types";

export function Profile() {
  const { user: authUser, logout, setUser } = useAuth();
  const [profileData, setProfileData] = useState<User | null>(authUser);
  const [saldo, setSaldo] = useState<number | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(!!authUser?.idUsuario);
  const [loadingSaldo, setLoadingSaldo] = useState(!!authUser?.idUsuario);

  const isGhost = authUser?.idTipoUsuario === 3;
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

  const fullName = profileData
    ? `${profileData.nombres} ${profileData.apellidos}`
    : "Usuario";

  const initials = profileData
    ? profileData.nombres.charAt(0).toUpperCase()
    : "U";

  const memberSince = profileData?.fechaRegistro
    ? new Date(profileData.fechaRegistro).toLocaleDateString("es-ES", {
        year: "numeric",
        month: "long",
      })
    : null;

  const saldoFormatted =
    saldo !== null
      ? saldo.toLocaleString("es-CO", {
          style: "currency",
          currency: "COP",
          maximumFractionDigits: 0,
        })
      : "—";

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
      value: profileData?.estado === 1 ? "Activo" : "—",
      bg: "bg-high",
    },
  ];

  const securityItems = [
    {
      label: "Two-Factor Authentication",
      desc: "Habilitado via Authenticator App",
      icon: "check_circle",
    },
    {
      label: "Compartir Datos",
      desc: "Limitado a servicios esenciales",
      icon: "toggle_on",
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
          <div
            className="profile-section neo-shadow"
            style={{ background: "var(--accent)", marginBottom: 16 }}
          >
            <h4 style={{ color: "var(--primary)" }}>Cuenta Invitada</h4>
            <p
              style={{
                fontSize: "0.85rem",
                marginBottom: 12,
                color: "var(--on-surface-variant)",
              }}
            >
              Eres un usuario invitado. Reclamá tu perfil para acceder con tu
              propio correo y contraseña.
            </p>
            {reclamarOk && (
              <p style={{ color: "var(--primary)", fontWeight: 700 }}>
                ¡Perfil reclamado exitosamente!
              </p>
            )}
            {!reclamarOk && (
              <button
                className="btn-primary"
                onClick={() => setShowReclamar((v) => !v)}
              >
                {showReclamar ? "Cancelar" : "Reclamar mi perfil"}
              </button>
            )}
            {showReclamar && !reclamarOk && (
              <form
                onSubmit={(e) => void handleReclamar(e)}
                style={{
                  marginTop: 16,
                  display: "flex",
                  flexDirection: "column",
                  gap: 10,
                }}
              >
                <label style={{ fontSize: "0.85rem" }}>
                  Nombres
                  <input
                    type="text"
                    value={reclamarForm.nombres}
                    onChange={(e) =>
                      setReclamarForm((f) => ({
                        ...f,
                        nombres: e.target.value,
                      }))
                    }
                    required
                  />
                </label>
                <label style={{ fontSize: "0.85rem" }}>
                  Apellidos
                  <input
                    type="text"
                    value={reclamarForm.apellidos}
                    onChange={(e) =>
                      setReclamarForm((f) => ({
                        ...f,
                        apellidos: e.target.value,
                      }))
                    }
                    required
                  />
                </label>
                <label style={{ fontSize: "0.85rem" }}>
                  Nombre de usuario
                  <input
                    type="text"
                    value={reclamarForm.nombreUsuario}
                    onChange={(e) =>
                      setReclamarForm((f) => ({
                        ...f,
                        nombreUsuario: e.target.value,
                      }))
                    }
                    required
                  />
                </label>
                <label style={{ fontSize: "0.85rem" }}>
                  Correo electrónico
                  <input
                    type="email"
                    value={reclamarForm.correo}
                    onChange={(e) =>
                      setReclamarForm((f) => ({ ...f, correo: e.target.value }))
                    }
                    required
                  />
                </label>
                <label style={{ fontSize: "0.85rem" }}>
                  Contraseña
                  <input
                    type="password"
                    value={reclamarForm.contrasena}
                    onChange={(e) =>
                      setReclamarForm((f) => ({
                        ...f,
                        contrasena: e.target.value,
                      }))
                    }
                    required
                    minLength={6}
                  />
                </label>
                {reclamarError && <p className="error-msg">{reclamarError}</p>}
                <button type="submit" className="btn-primary">
                  Confirmar y reclamar
                </button>
              </form>
            )}
          </div>
        )}

        {/* Gastos programados y metas — accesos rápidos */}
        <div className="profile-section bg-white" style={{ marginBottom: 16 }}>
          <h4>Mis Finanzas</h4>
          <div
            className="section-row"
            style={{ cursor: "pointer" }}
            onClick={() => window.location.assign("/goals")}
          >
            <div>
              <p className="row-label">Metas de Ahorro</p>
              <p className="row-desc">Gestiona tus objetivos financieros</p>
            </div>
            <span
              className="material-symbols-outlined"
              style={{ color: "var(--primary)" }}
            >
              savings
            </span>
          </div>
          <div
            className="section-row"
            style={{ cursor: "pointer" }}
            onClick={() => window.location.assign("/scheduled")}
          >
            <div>
              <p className="row-label">Gastos Programados</p>
              <p className="row-desc">Automatiza tus gastos recurrentes</p>
            </div>
            <span
              className="material-symbols-outlined"
              style={{ color: "var(--primary)" }}
            >
              event_repeat
            </span>
          </div>
        </div>

        {/* Security Section */}
        <div className="profile-section bg-white">
          <h4>Seguridad & Privacidad</h4>
          {securityItems.map((item) => (
            <div key={item.label} className="section-row">
              <div>
                <p className="row-label">{item.label}</p>
                <p className="row-desc">{item.desc}</p>
              </div>
              <span
                className="material-symbols-outlined"
                style={{ color: "var(--primary)" }}
              >
                {item.icon}
              </span>
            </div>
          ))}
        </div>
      </div>
    </Layout>
  );
}
