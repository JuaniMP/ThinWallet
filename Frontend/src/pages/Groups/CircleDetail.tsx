import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Layout } from "../../components/layout/Layout";
import { circleService } from "../../services/circuloGastoService";
import { transactionService } from "../../services/transactionService";
import { categoryService } from "../../services/categoryService";
import { useAuth } from "../../context/AuthContext";
import { validateAmount, validateDescription } from "../../utils/validators";
import { MoneyInput } from "../../components/common/MoneyInput";
import type { CirculoDetalle, Transaccion, Category } from "../../types";

const FALLBACK_IMAGE =
  "https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?auto=format&fit=crop&w=1600&q=80";

const PRESET_IMAGES = [
  // Viajes
  { url: "https://images.unsplash.com/photo-1488646953014-85cb44e25828?auto=format&fit=crop&w=800&q=80", label: "Viaje" },
  { url: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80", label: "Playa" },
  { url: "https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?auto=format&fit=crop&w=800&q=80", label: "Montaña" },
  { url: "https://images.unsplash.com/photo-1523906834658-6e24ef2386f9?auto=format&fit=crop&w=800&q=80", label: "Ciudad" },
  { url: "https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?auto=format&fit=crop&w=800&q=80", label: "Tokio" },
  // Comida y salidas
  { url: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=800&q=80", label: "Comida" },
  { url: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=800&q=80", label: "Restaurante" },
  { url: "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&w=800&q=80", label: "Cena" },
  { url: "https://images.unsplash.com/photo-1551024709-8f23befc6f87?auto=format&fit=crop&w=800&q=80", label: "Bebidas" },
  { url: "https://images.unsplash.com/photo-1530103862676-de8c9debad1d?auto=format&fit=crop&w=800&q=80", label: "Fiesta" },
  // Amigos y familia
  { url: "https://images.unsplash.com/photo-1511632765486-a01980e01a18?auto=format&fit=crop&w=800&q=80", label: "Amigos" },
  { url: "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=800&q=80", label: "Grupo" },
  // Deportes y hogar
  { url: "https://images.unsplash.com/photo-1461896836934-ffe607ba8211?auto=format&fit=crop&w=800&q=80", label: "Deporte" },
  { url: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?auto=format&fit=crop&w=800&q=80", label: "Hogar" },
  { url: "https://images.unsplash.com/photo-1469474968028-56623f02e42e?auto=format&fit=crop&w=800&q=80", label: "Naturaleza" },
];

const fmt = (v: number) =>
  v.toLocaleString("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 });

export function CircleDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const [detail, setDetail] = useState<CirculoDetalle | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [imageUrl, setImageUrl] = useState(FALLBACK_IMAGE);
  const [draftImage, setDraftImage] = useState(FALLBACK_IMAGE);
  const [editingImage, setEditingImage] = useState(false);
  const [history, setHistory] = useState<Transaccion[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [tokenFromStorage, setTokenFromStorage] = useState<string | null>(null);
  const [expulsando, setExpulsando] = useState<number | null>(null);
  const isGhost = user?.idTipoUsuario === 3;

  const handleExpulsar = async (idUsuario: number) => {
    if (!id) return;
    setExpulsando(idUsuario);
    try {
      await circleService.expulsarMiembro(Number(id), idUsuario);
      setDetail((prev) =>
        prev ? { ...prev, invitados: prev.invitados.filter((i) => i.idUsuario !== idUsuario) } : prev
      );
    } catch {
      // silently ignore
    } finally {
      setExpulsando(null);
    }
  };

  // Modal registrar gasto
  const [showGastoModal, setShowGastoModal] = useState(false);
  const [gastoForm, setGastoForm] = useState({ nombre: "", monto: 0, idCategoria: "", moneda: "COP" });
  const [gastoError, setGastoError] = useState("");
  const [gastoSaving, setGastoSaving] = useState(false);

  const handleRegistrarGasto = async (e: React.FormEvent) => {
    e.preventDefault();
    setGastoError("");

    // Validar descripción/nombre
    const nameError = validateDescription(gastoForm.nombre);
    if (nameError) {
      setGastoError(nameError);
      return;
    }

    // Validar monto
    const monto = gastoForm.monto;
    const amountError = validateAmount(monto);
    if (amountError) {
      setGastoError(amountError);
      return;
    }

    if (!user?.idUsuario) return;
    setGastoSaving(true);
    setGastoError("");
    try {
      await transactionService.create({
        nombre: gastoForm.nombre.trim(),
        montoOriginal: monto,
        monedaOriginal: gastoForm.moneda,
        idUsuario: user.idUsuario,
        idCirculoGasto: Number(id),
        idCategoria: gastoForm.idCategoria ? Number(gastoForm.idCategoria) : undefined,
        idTipoMovimiento: 2,
      });
      setGastoForm({ nombre: "", monto: 0, idCategoria: "", moneda: "COP" });
      setShowGastoModal(false);
      // Reload history
      const txs = await transactionService.getByCirculo(Number(id));
      setHistory(Array.isArray(txs) ? txs : []);
    } catch (err: unknown) {
      setGastoError(err instanceof Error ? err.message : "Error al registrar gasto");
    } finally {
      setGastoSaving(false);
    }
  };

  useEffect(() => {
    const circleId = Number(id);
    if (!Number.isFinite(circleId) || circleId <= 0) {
      setError("ID de círculo inválido.");
      setLoading(false);
      return;
    }

    const savedImage = localStorage.getItem(`circle-cover-${circleId}`);
    if (savedImage) {
      setImageUrl(savedImage);
      setDraftImage(savedImage);
    }

    // Para usuario fantasma: su token personal de acceso
    const savedToken = localStorage.getItem("userToken");
    if (savedToken) {
      setTokenFromStorage(savedToken);
    }

    const load = async () => {
      setLoading(true);
      try {
        const [data, txs, cats] = await Promise.all([
          circleService.getCircleDetail(circleId),
          transactionService.getByCirculo(circleId).catch(() => []),
          categoryService.getAll().catch(() => []),
        ]);
        setDetail(data);
        setHistory(Array.isArray(txs) ? txs : []);
        setCategories(Array.isArray(cats) ? cats : []);
      } catch (loadError) {
        console.error("Error cargando detalle del círculo", loadError);
        setError("No se pudo cargar el círculo.");
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, [id]);

  const totalGastos = useMemo(
    () => history.reduce((s, t) => s + (Number(t.montoOriginal) || 0), 0),
    [history],
  );

  const presupuesto = fmt(totalGastos);

  const getNombreUsuario = (idUsuario?: number): string => {
    if (!idUsuario) return "Desconocido";
    if (idUsuario === user?.idUsuario) return `${user.nombres} ${user.apellidos}`.trim();
    const miembro = detail?.invitados?.find((m) => m.idUsuario === idUsuario);
    return miembro?.nombreCompleto ?? `Usuario #${idUsuario}`;
  };

  const handleSaveImage = () => {
    if (!detail || !draftImage.trim()) {
      return;
    }
    const clean = draftImage.trim();
    setImageUrl(clean);
    localStorage.setItem(`circle-cover-${detail.idCirculoGasto}`, clean);
    setEditingImage(false);
  };

  return (
    <Layout>
      <div className="circle-detail-page">
        <div className="circle-detail-topbar">
          <Link to="/grupos" className="circle-detail-back">
            ← Volver a grupos
          </Link>
        </div>

        {loading ? (
          <p className="empty-state">Cargando círculo...</p>
        ) : error || !detail ? (
          <p className="empty-state">{error || "No se encontró el círculo."}</p>
        ) : (
          <>
            {/* HERO SECTION WITH IMAGE */}
            <section className="circle-hero-section">
              <div className="circle-hero-image-container">
                <img
                  className="circle-hero-image"
                  src={imageUrl}
                  alt={`Portada de ${detail.nombre}`}
                />
                <button
                  type="button"
                  className="circle-hero-edit-btn"
                  onClick={() => setEditingImage((prev) => !prev)}
                  aria-label="Editar portada"
                  title="Editar portada"
                >
                  <span className="material-symbols-outlined">edit</span>
                </button>
                {editingImage && (
                  <div className="circle-hero-editor" style={{ display: "block", padding: "16px" }}>
                    <p style={{ fontSize: "0.78rem", fontWeight: 600, marginBottom: 10, color: "var(--on-surface-variant)", letterSpacing: "0.05em" }}>
                      ELIGE UNA PORTADA
                    </p>
                    <div style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(5, 1fr)",
                      gap: 8,
                      marginBottom: 14,
                    }}>
                      {PRESET_IMAGES.map((img) => (
                        <button
                          key={img.url}
                          type="button"
                          title={img.label}
                          onClick={() => { setDraftImage(img.url); }}
                          style={{
                            padding: 0,
                            border: draftImage === img.url ? "3px solid var(--primary)" : "3px solid transparent",
                            borderRadius: 8,
                            overflow: "hidden",
                            cursor: "pointer",
                            aspectRatio: "16/9",
                            background: "none",
                            position: "relative",
                          }}
                        >
                          <img
                            src={img.url}
                            alt={img.label}
                            style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                          />
                          <span style={{
                            position: "absolute",
                            bottom: 0,
                            left: 0,
                            right: 0,
                            background: "rgba(0,0,0,0.45)",
                            color: "#fff",
                            fontSize: "0.6rem",
                            padding: "2px 4px",
                            textAlign: "center",
                            letterSpacing: "0.05em",
                          }}>
                            {img.label.toUpperCase()}
                          </span>
                        </button>
                      ))}
                    </div>
                    <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                      <input
                        value={draftImage}
                        onChange={(event) => setDraftImage(event.target.value)}
                        placeholder="O pega una URL personalizada"
                        style={{ flex: 1, fontSize: "0.8rem" }}
                      />
                      <button
                        type="button"
                        className="btn btn-primary"
                        onClick={handleSaveImage}
                        style={{ flexShrink: 0 }}
                      >
                        Guardar
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <div className="circle-hero-info neo-shadow">
                <h1 className="circle-hero-title">
                  {(detail.nombre || "Círculo sin nombre").toUpperCase()}
                </h1>
                <div className="circle-hero-meta">
                  <span className="circle-status">Activo</span>
                  <span className="circle-type">
                    {detail.tipoCirculo || "Sin tipo"}
                  </span>
                </div>
              </div>
            </section>

            {/* KEY METRICS CARDS */}
            <section className="circle-metrics-row">
              <div className="circle-metric-card neo-shadow">
                <span className="metric-label">Miembros</span>
                <strong className="metric-value">{detail.totalMiembros}</strong>
              </div>
              <div className="circle-metric-card neo-shadow">
                <span className="metric-label">Invitados</span>
                <strong className="metric-value">
                  {detail.totalInvitados}
                </strong>
              </div>
              <div className="circle-metric-card neo-shadow">
                <span className="metric-label">Creado</span>
                <strong className="metric-value">
                  {detail.fechaCreacion
                    ? new Date(detail.fechaCreacion).toLocaleDateString(
                        "es-CO",
                        { day: "2-digit", month: "2-digit" },
                      )
                    : "N/A"}
                </strong>
              </div>
              <div className="circle-metric-card neo-shadow">
                <span className="metric-label">Moneda</span>
                <strong className="metric-value">
                  {detail.monedaBase || "USD"}
                </strong>
              </div>
            </section>

            {/* ATTRIBUTES SECTION */}
            <section className="circle-panel neo-shadow">
              <div className="panel-header">
                <h3>Atributos del círculo</h3>
              </div>
              <div className="attrs-grid">
                <div>
                  <span>Tipo</span>
                  <strong>{detail.tipoCirculo || "Sin tipo"}</strong>
                </div>
                <div>
                  <span>Moneda</span>
                  <strong>{detail.monedaBase || "USD"}</strong>
                </div>
                <div>
                  <span>Estado</span>
                  <strong>{detail.estado === "ACTIVO" || detail.estado === 1 || detail.estado === "1" ? "Activo" : "Inactivo"}</strong>
                </div>
                <div>
                  <span>Mesadas</span>
                  <strong>{detail.permiteMesadas ? "Sí" : "No"}</strong>
                </div>
                <div>
                  <span>Simplificación</span>
                  <strong>
                    {detail.permiteSimplificacionDeudas ? "Sí" : "No"}
                  </strong>
                </div>
                <div>
                  <span>Creado</span>
                  <strong>
                    {detail.fechaCreacion
                      ? new Date(detail.fechaCreacion).toLocaleDateString(
                          "es-CO",
                        )
                      : "N/A"}
                  </strong>
                </div>
              </div>
            </section>

            {/* HISTORY SECTION */}
            <section className="circle-history-panel neo-shadow">
              <div className="panel-header">
                <h3>Historial de Gastos</h3>
                <span className="history-icon">⏱</span>
              </div>
              {history.length === 0 ? (
                <div className="history-empty">
                  <p>No hay gastos registrados aún</p>
                </div>
              ) : (
                <div className="history-timeline">
                  {history.slice(0, 10).map((item) => {
                    const cat = categories.find((c) => c.idCategoria === item.idCategoria);
                    return (
                      <div key={item.idTransaccion} className="history-item history-expense">
                        <div className="history-line" />
                        <div className="history-content">
                          <div className="history-time">
                            {(item.fechaEjecucion ?? item.contexto)
                              ? new Date((item.fechaEjecucion ?? item.contexto)!).toLocaleString("es-CO", {
                                  day: "2-digit",
                                  month: "2-digit",
                                  year: "numeric",
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })
                              : "—"}
                          </div>
                          <div className="history-title">{item.nombre}</div>
                          <div className="history-desc">{cat?.nombre ?? item.tipoCategoria ?? "Sin categoría"}</div>
                          <div className="history-author">Por: {getNombreUsuario(item.idUsuario)}</div>
                          <div className="history-amount">{fmt(Number(item.montoOriginal))}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>

            {/* BALANCE & ACTIONS */}
            <section className="circle-actions-panel neo-shadow">
              <div className="balance-box">
                <span className="balance-label">Total gastos del grupo</span>
                <strong className="balance-value">{presupuesto}</strong>
              </div>
              <button
                className="btn btn-primary"
                type="button"
                onClick={() => { setGastoForm({ nombre: "", monto: 0, idCategoria: "", moneda: "COP" }); setGastoError(""); setShowGastoModal(true); }}
              >
                Registrar gasto
              </button>
            </section>

            {/* INVITEES & TOKENS SECTION */}
            <section className="circle-panel neo-shadow">
              <div className="panel-header">
                <h3>Invitados y acceso</h3>
                <p>{detail.totalInvitados} invitados</p>
              </div>

              {/* Token global del círculo — para que usuarios registrados se unan */}
              {!isGhost && detail.tokenInvitacion && (
                <article className="guest-token-item" style={{ marginBottom: 16, borderLeft: "4px solid var(--primary)" }}>
                  <h4 style={{ marginBottom: 4 }}>Token de invitación (usuarios registrados)</h4>
                  <p style={{ fontSize: "0.78rem", color: "var(--on-surface-variant)", marginBottom: 6 }}>
                    Comparte este token con personas que ya tienen cuenta. Lo usan en "Unirse a círculo".
                  </p>
                  <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                    <input
                      type="text"
                      value={detail.tokenInvitacion}
                      readOnly
                      style={{ flex: 1, padding: "8px", border: "1px solid var(--outline-variant)", fontFamily: "monospace", fontSize: "11px" }}
                    />
                    <button
                      type="button"
                      className="matriz-cta-btn"
                      onClick={() => { void navigator.clipboard.writeText(detail.tokenInvitacion!); }}
                      style={{ padding: "8px 14px", whiteSpace: "nowrap" }}
                    >
                      Copiar
                    </button>
                  </div>
                </article>
              )}

              {/* Usuario fantasma: muestra su propio token de acceso */}
              {isGhost && tokenFromStorage && (
                <article className="guest-token-item" style={{ marginBottom: 12 }}>
                  <h4>Tu token de acceso</h4>
                  <p style={{ fontSize: "0.78rem", color: "var(--on-surface-variant)", marginBottom: 6 }}>
                    Úsalo para entrar a este círculo desde cualquier dispositivo.
                  </p>
                  <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                    <input
                      type="text"
                      value={tokenFromStorage}
                      readOnly
                      style={{ flex: 1, padding: "8px", border: "1px solid var(--outline-variant)", fontFamily: "monospace", fontSize: "11px" }}
                    />
                    <button
                      type="button"
                      className="matriz-cta-btn"
                      onClick={() => { navigator.clipboard.writeText(tokenFromStorage); alert("Token copiado"); }}
                      style={{ padding: "8px 14px", whiteSpace: "nowrap" }}
                    >
                      Copiar
                    </button>
                  </div>
                </article>
              )}

              {detail.invitados.length === 0 ? (
                <p className="empty-state">Aún no hay invitados en este círculo.</p>
              ) : (
                <div className="guest-token-grid">
                  {detail.invitados.map((invitado) => (
                    <article key={invitado.idUsuario} className="guest-token-item">
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                        <h4 style={{ margin: 0 }}>{invitado.nombreCompleto}</h4>
                        {!isGhost && (
                          <button
                            type="button"
                            title="Eliminar del círculo"
                            disabled={expulsando === invitado.idUsuario}
                            onClick={() => void handleExpulsar(invitado.idUsuario)}
                            style={{
                              background: "none",
                              border: "1px solid var(--error, #b00020)",
                              color: "var(--error, #b00020)",
                              borderRadius: "6px",
                              padding: "2px 8px",
                              fontSize: "0.7rem",
                              cursor: "pointer",
                              opacity: expulsando === invitado.idUsuario ? 0.5 : 1,
                              letterSpacing: "0.04em",
                              flexShrink: 0,
                              marginLeft: 8,
                            }}
                          >
                            {expulsando === invitado.idUsuario ? "···" : "✕"}
                          </button>
                        )}
                      </div>
                      <p className="guest-type">{invitado.tipoUsuario?.toUpperCase() === "FANTASMA" ? "Invitado fantasma" : (invitado.tipoUsuario || "Registrado")}</p>
                      {invitado.correo && !invitado.correo.includes("thinwallet.local") && (
                        <p className="guest-email">{invitado.correo}</p>
                      )}
                      {/* Token personal del fantasma — visible solo para el creador */}
                      {!isGhost && invitado.tipoUsuario?.toUpperCase() === "FANTASMA" && (
                        <div style={{ marginTop: 8 }}>
                          <p style={{ fontSize: "0.72rem", color: "var(--on-surface-variant)", marginBottom: 4, fontWeight: 600 }}>
                            Token de acceso personal:
                          </p>
                          {invitado.tokenInvitacionPersonal ? (
                            <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
                              <input
                                type="text"
                                value={invitado.tokenInvitacionPersonal}
                                readOnly
                                style={{ flex: 1, padding: "6px", fontFamily: "monospace", fontSize: "10px", border: "1px solid var(--outline-variant)" }}
                              />
                              <button
                                type="button"
                                className="matriz-cta-btn"
                                onClick={() => { void navigator.clipboard.writeText(invitado.tokenInvitacionPersonal!); }}
                                style={{ padding: "6px 10px", fontSize: "0.72rem", whiteSpace: "nowrap" }}
                              >
                                Copiar
                              </button>
                            </div>
                          ) : (
                            <p style={{ fontSize: "0.72rem", color: "var(--on-surface-variant)", fontStyle: "italic" }}>Recarga la página para ver el token</p>
                          )}
                        </div>
                      )}
                    </article>
                  ))}
                </div>
              )}
            </section>
          </>
        )}
      </div>

      {/* Modal registrar gasto */}
      {showGastoModal && (
        <div className="modal-overlay" onClick={() => setShowGastoModal(false)}>
          <div className="modal-card neo-shadow" onClick={(e) => e.stopPropagation()}>
            <h3>Registrar Gasto en Círculo</h3>
            <form onSubmit={(e) => void handleRegistrarGasto(e)}>
              <label>
                Nombre del gasto
                <input
                  type="text"
                  value={gastoForm.nombre}
                  onChange={(e) => setGastoForm((f) => ({ ...f, nombre: e.target.value }))}
                  placeholder="Ej: Cena, Transporte..."
                  required
                />
              </label>
              <div className="amount-currency-row" style={{ gap: 12, alignItems: "end" }}>
                <MoneyInput
                  label="Monto"
                  name="monto"
                  value={gastoForm.monto}
                  onChange={(v) => setGastoForm((f) => ({ ...f, monto: v }))}
                  placeholder="Ej: 1,000,000"
                  required
                />
                <label style={{ flex: 1, marginBottom: 0 }}>
                  Moneda
                  <select
                    value={gastoForm.moneda}
                    onChange={(e) => setGastoForm((f) => ({ ...f, moneda: e.target.value }))}
                  >
                    <option value="COP">COP</option>
                    <option value="USD">USD</option>
                    <option value="EUR">EUR</option>
                  </select>
                </label>
              </div>
              <label>
                Categoría
                <select
                  value={gastoForm.idCategoria}
                  onChange={(e) => setGastoForm((f) => ({ ...f, idCategoria: e.target.value }))}
                >
                  <option value="" disabled>Seleccionar categoría</option>
                  {categories.map((c) => (
                    <option key={c.idCategoria} value={c.idCategoria}>{c.nombre}</option>
                  ))}
                </select>
              </label>
              {gastoError && <p className="error-msg">{gastoError}</p>}
              <div className="form-actions">
                <button type="button" className="btn-secondary" onClick={() => setShowGastoModal(false)}>
                  Cancelar
                </button>
                <button type="submit" className="btn-primary" disabled={gastoSaving}>
                  {gastoSaving ? "Guardando..." : "Registrar"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Layout>
  );
}
