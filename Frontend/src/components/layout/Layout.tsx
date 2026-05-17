import { useEffect, useRef, useState } from "react";
import { type ReactNode } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { notificacionService } from "../../services/notificacionService";
import type { Notificacion } from "../../types";

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [showGhostModal, setShowGhostModal] = useState(false);

  const [notificaciones, setNotificaciones] = useState<Notificacion[]>([]);
  const [showPanel, setShowPanel] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  const noLeidas = notificaciones.filter((n) => !n.leida).length;

  const isGhost = user?.estado === 0;
  const ghostBlocked = ["/dashboard", "/transactions/new", "/goals", "/reports"];

  const navItems = [
    { path: "/dashboard", icon: "home", label: "INICIO" },
    { path: "/grupos", icon: "group", label: "GRUPOS" },
    { path: "/transactions/new", icon: "add_box", label: "AÑADIR" },
    { path: "/debts", icon: "receipt_long", label: "DEUDAS" },
    { path: "/goals", icon: "savings", label: "METAS" },
    { path: "/reports", icon: "insert_chart", label: "REPORTES" },
    { path: "/profile", icon: "person", label: "PERFIL" },
  ];

  // Cargar notificaciones al montar y cada 30 s; se detiene si el endpoint no existe (MongoDB deshabilitado)
  useEffect(() => {
    if (!user?.idUsuario) return;
    let active = true;
    let interval: ReturnType<typeof setInterval> | null = null;

    const load = async () => {
      try {
        const data = await notificacionService.getByUsuario(user.idUsuario);
        if (active) setNotificaciones(data);
      } catch (err: unknown) {
        if (
          err instanceof Error &&
          "status" in err &&
          (err as { status: number }).status === 404
        ) {
          // Endpoint no disponible (MongoDB deshabilitado) — detener polling
          if (interval) clearInterval(interval);
        }
      }
    };

    void load();
    interval = setInterval(() => {
      void load();
    }, 30000);
    return () => {
      active = false;
      if (interval) clearInterval(interval);
    };
  }, [user?.idUsuario]);

  // Cerrar panel al hacer clic fuera
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setShowPanel(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleTogglePanel = () => setShowPanel((p) => !p);

  const handleMarcarLeida = async (id: string) => {
    try {
      await notificacionService.marcarLeida(id);
      setNotificaciones((prev) =>
        prev.map((n) => (n.id === id ? { ...n, leida: true } : n)),
      );
    } catch {
      /* ignore */
    }
  };

  const handleMarcarTodas = async () => {
    if (!user?.idUsuario) return;
    try {
      await notificacionService.marcarTodasLeidas(user.idUsuario);
      setNotificaciones((prev) => prev.map((n) => ({ ...n, leida: true })));
    } catch {
      /* ignore */
    }
  };

  const handleEliminar = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await notificacionService.eliminar(id);
      setNotificaciones((prev) => prev.filter((n) => n.id !== id));
    } catch {
      /* ignore */
    }
  };

  const formatFecha = (fecha: string) => {
    try {
      return new Date(fecha).toLocaleString("es-CO", {
        day: "2-digit",
        month: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return "";
    }
  };

  const iconoPorTipo = (tipo: string) => {
    if (tipo === "INVITACION_CIRCULO") return "group_add";
    return "notifications";
  };

  return (
    <div className="app">
      {/* TopAppBar */}
      <header className="top-app-bar">
        <div className="brand">
          <div className="avatar">
            <div
              style={{
                width: "100%",
                height: "100%",
                background: "var(--accent)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: 700,
                color: "var(--primary)",
                fontSize: "1rem",
              }}
            >
              {(
                user?.nombres?.charAt(0) ||
                user?.name?.charAt(0) ||
                "U"
              ).toUpperCase()}
            </div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
            <h1>THIN WALLET</h1>
            <span style={{ fontSize: "0.6rem", fontWeight: 700, color: "var(--on-surface-variant)", letterSpacing: "0.08em", fontFamily: "var(--font-label)", marginTop: -2 }}>
              v1.2.0
            </span>
          </div>
        </div>

        <div
          className="actions"
          style={{ position: "relative" }}
          ref={panelRef}
        >
          <button
            className="icon-btn"
            onClick={handleTogglePanel}
            style={{ position: "relative" }}
            aria-label="Notificaciones"
          >
            <span className="material-symbols-outlined">notifications</span>
            {noLeidas > 0 && (
              <span
                style={{
                  position: "absolute",
                  top: 4,
                  right: 4,
                  background: "#e53e3e",
                  color: "#fff",
                  borderRadius: "50%",
                  width: 16,
                  height: 16,
                  fontSize: "0.65rem",
                  fontWeight: 700,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  lineHeight: 1,
                }}
              >
                {noLeidas > 9 ? "9+" : noLeidas}
              </span>
            )}
          </button>

          {/* Panel de notificaciones */}
          {showPanel && (
            <div
              style={{
                position: "absolute",
                top: "110%",
                right: 0,
                width: 320,
                maxHeight: 420,
                overflowY: "auto",
                background: "var(--surface)",
                border: "1px solid var(--outline-variant)",
                boxShadow: "0 8px 24px rgba(0,0,0,0.18)",
                zIndex: 1000,
              }}
            >
              {/* Header del panel */}
              <div
                style={{
                  padding: "12px 16px",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  borderBottom: "1px solid var(--outline-variant)",
                  position: "sticky",
                  top: 0,
                  background: "var(--surface)",
                }}
              >
                <strong style={{ fontSize: "0.9rem" }}>
                  Notificaciones {noLeidas > 0 && `(${noLeidas})`}
                </strong>
                {noLeidas > 0 && (
                  <button
                    type="button"
                    onClick={() => void handleMarcarTodas()}
                    style={{
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      fontSize: "0.75rem",
                      color: "var(--primary)",
                      fontWeight: 600,
                    }}
                  >
                    Marcar todas leídas
                  </button>
                )}
              </div>

              {notificaciones.length === 0 ? (
                <div
                  style={{
                    padding: "24px 16px",
                    textAlign: "center",
                    color: "var(--on-surface-variant)",
                    fontSize: "0.85rem",
                  }}
                >
                  <span
                    className="material-symbols-outlined"
                    style={{ fontSize: 36, display: "block", marginBottom: 8 }}
                  >
                    notifications_none
                  </span>
                  Sin notificaciones
                </div>
              ) : (
                notificaciones.map((n) => (
                  <div
                    key={n.id}
                    onClick={() => {
                      if (!n.leida) void handleMarcarLeida(n.id);
                    }}
                    style={{
                      padding: "12px 16px",
                      borderBottom: "1px solid var(--outline-variant)",
                      background: n.leida
                        ? "transparent"
                        : "var(--surface-container-low, #f5f5f5)",
                      cursor: n.leida ? "default" : "pointer",
                      display: "flex",
                      gap: "12px",
                      alignItems: "flex-start",
                    }}
                  >
                    <span
                      className="material-symbols-outlined"
                      style={{
                        fontSize: 22,
                        color: n.leida
                          ? "var(--on-surface-variant)"
                          : "var(--primary)",
                        flexShrink: 0,
                        marginTop: 2,
                      }}
                    >
                      {iconoPorTipo(n.tipo)}
                    </span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          fontWeight: n.leida ? 400 : 700,
                          fontSize: "0.85rem",
                          marginBottom: 2,
                        }}
                      >
                        {n.titulo}
                      </div>
                      <div
                        style={{
                          fontSize: "0.78rem",
                          color: "var(--on-surface-variant)",
                          marginBottom: 4,
                        }}
                      >
                        {n.mensaje}
                      </div>
                      <div
                        style={{
                          fontSize: "0.7rem",
                          color: "var(--on-surface-variant)",
                        }}
                      >
                        {formatFecha(n.fechaCreacion)}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={(e) => void handleEliminar(n.id, e)}
                      style={{
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        color: "#bbb",
                        padding: 0,
                        flexShrink: 0,
                      }}
                      aria-label="Eliminar notificación"
                    >
                      <span
                        className="material-symbols-outlined"
                        style={{ fontSize: 16 }}
                      >
                        close
                      </span>
                    </button>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main>{children}</main>

      {/* Bottom Nav Bar */}
      <nav className="bottom-nav">
        {navItems.map((item) => {
          const blocked = isGhost && ghostBlocked.includes(item.path);
          if (blocked) {
            return (
              <button
                key={item.path}
                type="button"
                className="nav-ghost-blocked"
                onClick={() => setShowGhostModal(true)}
                title="Reclama tu perfil para acceder"
              >
                <span className="material-symbols-outlined">{item.icon}</span>
                <span className="nav-label">{item.label}</span>
              </button>
            );
          }
          return (
            <Link
              key={item.path}
              to={item.path}
              className={location.pathname === item.path ? "active" : ""}
            >
              <span className="material-symbols-outlined">{item.icon}</span>
              <span className="nav-label">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Modal reclamar perfil */}
      {showGhostModal && (
        <div className="modal-overlay" onClick={() => setShowGhostModal(false)}>
          <div className="modal-card neo-shadow" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 340 }}>
            <h3>Acceso restringido</h3>
            <p style={{ fontSize: "0.9rem", margin: "12px 0 20px", color: "var(--on-surface-variant)", lineHeight: 1.5 }}>
              Eres un usuario invitado. Para acceder a esta sección debes reclamar tu perfil y crear una cuenta completa.
            </p>
            <div className="form-actions">
              <button type="button" className="btn-secondary" onClick={() => setShowGhostModal(false)}>
                Cerrar
              </button>
              <button
                type="button"
                className="btn-primary"
                onClick={() => { setShowGhostModal(false); navigate("/reclamar-perfil"); }}
              >
                Reclamar perfil
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
