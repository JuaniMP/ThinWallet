import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { ApiError } from "../../services/api";
import { circleService } from "../../services/circuloGastoService";
import type { CirculoGasto, TipoCirculo } from "../../types";
import { Layout } from "../../components/layout/Layout";

export function Groups() {
  const { user } = useAuth();
  const [circles, setCircles] = useState<CirculoGasto[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingCircles, setLoadingCircles] = useState(false);
  const [tipoCirculos, setTipoCirculos] = useState<TipoCirculo[]>([]);
  const [tokenCreado, setTokenCreado] = useState<string | null>(null);

  const [nombre, setNombre] = useState("");
  const [tipo, setTipo] = useState("");
  const [invitados, setInvitados] = useState([""]);
  const [createError, setCreateError] = useState("");

  const [showJoinModal, setShowJoinModal] = useState(false);
  const [joinToken, setJoinToken] = useState("");
  const [joinLoading, setJoinLoading] = useState(false);
  const [joinError, setJoinError] = useState("");

  const openCreateModal = () => {
    setNombre("");
    setTipo("");
    setInvitados([""]);
    setCreateError("");
    setShowModal(true);
  };

  const tipoCirculoOptions = tipoCirculos.filter(
    (tc) => tc.nombre !== "Individual",
  );

  const totalGuests = useMemo(
    () =>
      circles.reduce(
        (total, circle) => total + (circle.nombresInvitados?.length ?? 0),
        0,
      ),
    [circles],
  );

  useEffect(() => {
    let isActive = true;

    const loadTipoCirculos = async () => {
      if (user?.tipoUsuario === 3) return;
      try {
        const allTipoCirculos = await circleService.getAllTipoCirculos();
        if (!isActive) return;
        setTipoCirculos(allTipoCirculos);
      } catch (error) {
        console.error("Error cargando tipos de círculo", error);
        if (isActive) setTipoCirculos([]);
      }
    };

    const loadCircles = async () => {
      if (!user?.idUsuario) {
        if (isActive) setCircles([]);
        return;
      }
      setLoadingCircles(true);
      try {
        let circulosResultado: CirculoGasto[] = [];
        if (user.tipoUsuario === 3) {
          circulosResultado = await circleService.getCirclesAsMember(
            user.idUsuario,
          );
        } else {
          circulosResultado = await circleService.getCirclesByUser(
            user.idUsuario,
          );
        }
        if (isActive) setCircles(circulosResultado);
      } catch (error) {
        console.error("Error cargando círculos", error);
        if (isActive) setCircles([]);
      } finally {
        if (isActive) setLoadingCircles(false);
      }
    };

    void loadTipoCirculos();
    void loadCircles();

    return () => {
      isActive = false;
    };
  }, [user?.idUsuario]); // eslint-disable-line react-hooks/exhaustive-deps

  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);

  const handleDeleteCircle = async (id: number) => {
    setDeletingId(id);
    try {
      await circleService.deleteCircle(id);
      setCircles((prev) => prev.filter((c) => c.idCirculoGasto !== id));
    } catch (error) {
      console.error("Error eliminando círculo", error);
    } finally {
      setDeletingId(null);
      setConfirmDeleteId(null);
    }
  };

  const handleAddGuestInput = () => setInvitados([...invitados, ""]);

  const handleJoin = async () => {
    if (!joinToken.trim() || !user) return;
    setJoinLoading(true);
    setJoinError("");
    try {
      await circleService.joinCircle(joinToken.trim(), user.idUsuario);
      setShowJoinModal(false);
      setJoinToken("");
      const updated = await circleService.getCirclesByUser(user.idUsuario);
      setCircles(updated);
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        if (err.status === 409)
          setJoinError("Ya eres miembro de este círculo.");
        else if (err.status === 404)
          setJoinError("Token inválido o círculo no encontrado.");
        else setJoinError("No se pudo unir al círculo. Verifica el token.");
      } else {
        setJoinError("No se pudo unir al círculo. Verifica el token.");
      }
    } finally {
      setJoinLoading(false);
    }
  };

  const handleCreate = async () => {
    setCreateError("");
    if (!nombre.trim()) { setCreateError("El nombre del grupo es obligatorio"); return; }
    if (nombre.trim().length < 3) { setCreateError("El nombre debe tener al menos 3 caracteres"); return; }
    if (!tipo) { setCreateError("Selecciona un tipo de círculo"); return; }
    if (!user) return;
    setLoading(true);
    try {
      const response = await circleService.createCircle({
        nombre,
        tipoCirculo: tipo,
        idUsuarioCreador: user.idUsuario,
        nombresInvitados: invitados.filter((n) => n.trim() !== ""),
      });

      if (
        response &&
        typeof response === "object" &&
        "tokenInvitacion" in response
      ) {
        const token = response.tokenInvitacion as string;
        setTokenCreado(token);
        localStorage.setItem("user-token", token);
      }

      setShowModal(false);
      setNombre("");
      setTipo("");
      setInvitados([""]);

      // Reload circles
      if (user.tipoUsuario === 3) {
        const updated = await circleService.getCirclesAsMember(user.idUsuario);
        setCircles(updated);
      } else {
        const updated = await circleService.getCirclesByUser(user.idUsuario);
        setCircles(updated);
      }
    } catch (error) {
      setCreateError(error instanceof Error ? error.message : "Error al crear el círculo");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="groups-page">
        <section className="groups-hero neo-shadow">
          <div className="hero-main">
            <p className="hero-label">Gestión compartida</p>
            <h1 className="hero-title">
              {user?.tipoUsuario === 3
                ? "Tus círculos invitados"
                : "Tus círculos de gasto"}
            </h1>
            <p className="hero-copy">
              {user?.tipoUsuario === 3
                ? "Visualiza los círculos a los que has sido invitado y participa en la gestión de gastos compartidos."
                : "Crea espacios para viajes, hogar o amigos con una vista clara, simple y más cercana al resto de la app."}
            </p>
            <div className="hero-meta">
              <span>
                {circles.length} círculos{" "}
                {user?.tipoUsuario === 3 ? "disponibles" : "activos"}
              </span>
              {user?.tipoUsuario !== 3 && (
                <>
                  <span>·</span>
                  <span>{totalGuests} invitados</span>
                </>
              )}
            </div>
          </div>

          <div className="hero-balance">
            <p className="balance-label">Estado actual</p>
            <div className="balance-amount">{circles.length}</div>
            <p className="balance-detail">
              {user?.tipoUsuario === 3
                ? circles.length > 0
                  ? "Selecciona uno para ver detalles"
                  : "Sin círculos por el momento"
                : circles.length > 0
                  ? "Listos para revisar y administrar."
                  : "Crea tu primer círculo para empezar."}
            </p>
          </div>
        </section>

        <section className="groups-content">
          <div className="matriz-card neo-shadow">
            <div className="matriz-header">
              <div>
                <p className="header-tag">Tus grupos</p>
                <h3>
                  {user?.tipoUsuario === 3
                    ? "Círculos disponibles"
                    : "Circulos creados"}
                </h3>
              </div>
              {user?.tipoUsuario !== 3 && (
                <div style={{ display: "flex", gap: "8px" }}>
                  <button
                    onClick={() => {
                      setJoinToken("");
                      setJoinError("");
                      setShowJoinModal(true);
                    }}
                    className="matriz-cta-btn"
                    style={{
                      background: "var(--surface)",
                      color: "var(--primary)",
                      border: "2px solid var(--primary)",
                    }}
                  >
                    Unirse
                  </button>
                  <button onClick={openCreateModal} className="matriz-cta-btn">
                    + Crear
                  </button>
                </div>
              )}
            </div>

            {loadingCircles ? (
              <p className="empty-state">Cargando círculos...</p>
            ) : circles.length === 0 ? (
              <div className="groups-empty-state">
                <div className="groups-empty-mark">CG</div>
                <h4>
                  {user?.tipoUsuario === 3
                    ? "Sin invitaciones"
                    : "Sin círculos todavía"}
                </h4>
                <p>
                  {user?.tipoUsuario === 3
                    ? "Aún no has sido invitado a ningún círculo de gasto."
                    : "Empieza con un grupo para dividir gastos y mantener todo más ordenado."}
                </p>
              </div>
            ) : (
              <div className="matriz-grid">
                {circles.map((circle) => (
                  <div key={circle.idCirculoGasto} className="matriz-item">
                    <div className="matriz-info">
                      <div className="avatar">
                        {circle.nombre.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="name">{circle.nombre}</div>
                        <div className="action">
                          {circle.tipoCirculo} ·{" "}
                          {circle.nombresInvitados?.length ?? 0} {(circle.nombresInvitados?.length ?? 0) === 1 ? "miembro" : "miembros"}
                        </div>
                        {circle.nombresInvitados && circle.nombresInvitados.length > 0 && (
                          <div style={{ fontSize: "0.7rem", color: "var(--on-surface-variant)", marginTop: 2 }}>
                            {circle.nombresInvitados.slice(0, 3).join(", ")}
                            {circle.nombresInvitados.length > 3 ? ` +${circle.nombresInvitados.length - 3}` : ""}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="matriz-amount">
                      <div className="amount primary">Activo</div>
                      <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
                        <Link
                          to={`/grupos/${circle.idCirculoGasto}`}
                          className="action-btn"
                        >
                          Ver círculo
                        </Link>
                        {user?.tipoUsuario !== 3 && (
                          <button
                            type="button"
                            title="Eliminar círculo"
                            onClick={() => setConfirmDeleteId(circle.idCirculoGasto)}
                            style={{
                              background: "transparent",
                              border: "2px solid var(--primary)",
                              color: "var(--primary)",
                              cursor: "pointer",
                              padding: "4px 7px",
                              display: "flex",
                              alignItems: "center",
                              opacity: 0.6,
                              transition: "opacity 0.15s",
                            }}
                            onMouseEnter={(e) => (e.currentTarget.style.opacity = "1")}
                            onMouseLeave={(e) => (e.currentTarget.style.opacity = "0.6")}
                          >
                            <span className="material-symbols-outlined" style={{ fontSize: 15 }}>delete</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {user?.tipoUsuario !== 3 && (
            <aside className="timeline-card neo-shadow">
              <h3 className="timeline-title">Cómo funciona</h3>
              <div className="timeline-list">
                <div className="timeline-item">
                  <div className="timeline-icon primary">
                    <span className="material-symbols-outlined">add</span>
                  </div>
                  <div className="timeline-content">
                    <div className="title">1. Crea un círculo</div>
                    <div className="payer">Ponle nombre y define el tipo.</div>
                    <div className="amount">Viaje, hogar o amigos</div>
                  </div>
                </div>
                <div className="timeline-item">
                  <div className="timeline-icon secondary">
                    <span className="material-symbols-outlined">group_add</span>
                  </div>
                  <div className="timeline-content">
                    <div className="title">2. Agrega invitados</div>
                    <div className="payer">
                      Comparte el grupo con las personas correctas.
                    </div>
                    <div className="amount">
                      Todos quedan dentro de un mismo contexto
                    </div>
                  </div>
                </div>
                <div className="timeline-item">
                  <div className="timeline-icon secondary">
                    <span className="material-symbols-outlined">
                      receipt_long
                    </span>
                  </div>
                  <div className="timeline-content">
                    <div className="title">3. Divide gastos</div>
                    <div className="payer">
                      Revisa deudas, aportes y transacciones.
                    </div>
                    <div className="amount">Menos ruido, más control</div>
                  </div>
                </div>
              </div>
            </aside>
          )}
        </section>

        {/* Modal: Crear círculo */}
        {showModal && user?.tipoUsuario !== 3 && (
          <div className="modal-backdrop" onClick={() => setShowModal(false)}>
              <div className="modal-content neo-shadow" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                  <h1>Nuevo círculo</h1>
                  <button
                    type="button"
                    className="close-btn"
                    onClick={() => setShowModal(false)}
                    aria-label="Cerrar modal"
                  >
                    <span className="material-symbols-outlined">close</span>
                  </button>
                </div>

                <div className="modal-body">
                  <div className="input-group">
                    <label>Nombre del grupo</label>
                    <input
                      value={nombre}
                      onChange={(e) => setNombre(e.target.value)}
                      placeholder="Ej: Viaje a la playa"
                    />
                  </div>

                  <div className="input-group">
                    <label>Tipo</label>
                    <select
                      aria-label="Tipo de círculo"
                      value={tipo}
                      onChange={(e) => setTipo(e.target.value)}
                    >
                      <option value="" disabled>
                        Selecciona un tipo
                      </option>
                      {tipoCirculoOptions.map((option) => (
                        <option
                          key={option.idTipoCirculo}
                          value={option.nombre}
                        >
                          {option.nombre}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="input-group">
                    <label>¿A quiénes invitamos?</label>
                    {invitados.map((guestName, index) => (
                      <input
                        key={index}
                        className="group-guest-input"
                        placeholder={`Nombre del invitado ${index + 1}`}
                        value={guestName}
                        onChange={(e) => {
                          const newInv = [...invitados];
                          newInv[index] = e.target.value;
                          setInvitados(newInv);
                        }}
                      />
                    ))}
                    <button
                      type="button"
                      onClick={handleAddGuestInput}
                      className="group-add-guest-btn"
                    >
                      + Agregar otro invitado
                    </button>
                  </div>
                </div>

                <div className="modal-footer">
                  {createError && (
                    <p style={{ color: "var(--danger, #e53e3e)", fontSize: "0.85rem", margin: "0 0 8px", padding: "0 4px" }}>
                      {createError}
                    </p>
                  )}
                  <div className="group-modal-actions">
                    <button
                      type="button"
                      onClick={() => setShowModal(false)}
                      className="group-cancel-btn"
                    >
                      Cancelar
                    </button>
                    <button
                      type="button"
                      onClick={() => void handleCreate()}
                      disabled={loading}
                      className="submit-btn neo-shadow"
                    >
                      {loading ? "Creando..." : "Crear círculo"}
                    </button>
                  </div>
                </div>
              </div>
          </div>
        )}
      </div>

      {/* Modal: Unirse con token */}
      {showJoinModal && (
        <div className="modal-backdrop" onClick={() => setShowJoinModal(false)}>
            <div className="modal-content neo-shadow" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h1>Unirse a un círculo</h1>
                <button
                  type="button"
                  className="close-btn"
                  onClick={() => setShowJoinModal(false)}
                  aria-label="Cerrar modal"
                >
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>
              <div className="modal-body">
                <div className="input-group">
                  <label>Token de invitación</label>
                  <input
                    value={joinToken}
                    onChange={(e) => setJoinToken(e.target.value)}
                    placeholder="Pega aquí el token del círculo"
                    style={{ fontFamily: "monospace" }}
                  />
                  {joinError && (
                    <p
                      style={{
                        color: "var(--danger, #e53e3e)",
                        marginTop: "6px",
                        fontSize: "0.85rem",
                      }}
                    >
                      {joinError}
                    </p>
                  )}
                </div>
              </div>
              <div className="modal-footer">
                <div className="group-modal-actions">
                  <button
                    type="button"
                    onClick={() => setShowJoinModal(false)}
                    className="group-cancel-btn"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    onClick={handleJoin}
                    disabled={joinLoading || !joinToken.trim()}
                    className="submit-btn neo-shadow"
                  >
                    {joinLoading ? "Uniéndose..." : "Unirse"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

      {/* Modal: Token generado */}
      {tokenCreado && (
        <div className="modal-backdrop" onClick={() => setTokenCreado(null)}>
            <div className="modal-content neo-shadow" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h1>Token de invitación</h1>
                <button
                  type="button"
                  className="close-btn"
                  onClick={() => setTokenCreado(null)}
                  aria-label="Cerrar modal"
                >
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>

              <div className="modal-body">
                <div className="input-group">
                  <label>Comparte este token con los invitados</label>
                  <div
                    style={{ display: "flex", gap: "10px", marginTop: "10px" }}
                  >
                    <input
                      type="text"
                      readOnly
                      value={tokenCreado}
                      style={{
                        padding: "12px",
                        borderRadius: "0",
                        border: "2px solid var(--primary)",
                        fontFamily: "monospace",
                        flex: 1,
                        fontSize: "0.85rem",
                        wordBreak: "break-all",
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(tokenCreado);
                        alert("Token copiado");
                      }}
                      className="submit-btn neo-shadow"
                      style={{ padding: "12px 20px" }}
                    >
                      Copiar
                    </button>
                  </div>
                </div>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  onClick={() => setTokenCreado(null)}
                  className="submit-btn neo-shadow"
                >
                  Listo
                </button>
              </div>
            </div>
          </div>
        )}
      {/* Modal: Confirmar eliminación */}
      {confirmDeleteId !== null && (
        <div className="modal-overlay" onClick={() => setConfirmDeleteId(null)}>
          <div
            className="neo-shadow"
            onClick={(e) => e.stopPropagation()}
            style={{
              background: "var(--background)",
              border: "2px solid var(--primary)",
              padding: "28px 24px 20px",
              maxWidth: 360,
              width: "90%",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
              <span className="material-symbols-outlined" style={{ color: "var(--primary)", fontSize: 28 }}>
                warning
              </span>
              <h3 style={{ fontFamily: "var(--font-display)", fontSize: "1.1rem", fontWeight: 900, color: "var(--primary)", margin: 0 }}>
                ELIMINAR CÍRCULO
              </h3>
            </div>
            <p style={{ fontSize: "0.88rem", color: "var(--on-surface-variant)", lineHeight: 1.6, marginBottom: 24 }}>
              Esta acción es permanente. Se eliminará el círculo y todos sus gastos asociados. ¿Continuar?
            </p>
            <div style={{ display: "flex", gap: 10, borderTop: "2px solid var(--primary)", paddingTop: 16 }}>
              <button
                type="button"
                onClick={() => setConfirmDeleteId(null)}
                style={{
                  flex: 1,
                  padding: "10px",
                  background: "transparent",
                  border: "2px solid var(--primary)",
                  color: "var(--primary)",
                  fontFamily: "var(--font-label)",
                  fontWeight: 700,
                  fontSize: "0.8rem",
                  letterSpacing: "0.06em",
                  cursor: "pointer",
                }}
              >
                CANCELAR
              </button>
              <button
                type="button"
                disabled={deletingId === confirmDeleteId}
                onClick={() => void handleDeleteCircle(confirmDeleteId)}
                style={{
                  flex: 1,
                  padding: "10px",
                  background: "var(--primary)",
                  border: "2px solid var(--primary)",
                  color: "var(--on-primary)",
                  fontFamily: "var(--font-label)",
                  fontWeight: 700,
                  fontSize: "0.8rem",
                  letterSpacing: "0.06em",
                  cursor: "pointer",
                  opacity: deletingId === confirmDeleteId ? 0.7 : 1,
                }}
              >
                {deletingId === confirmDeleteId ? "ELIMINANDO..." : "SÍ, ELIMINAR"}
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}

export default Groups;
