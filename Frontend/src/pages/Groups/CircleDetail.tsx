import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Layout } from "../../components/layout/Layout";
import { circleService } from "../../services/circuloGastoService";
import { transactionService } from "../../services/transactionService";
import { categoryService } from "../../services/categoryService";
import { useAuth } from "../../context/AuthContext";
import { validateAmount, validateDescription } from "../../utils/validators";
import { MoneyInput } from "../../components/common/MoneyInput";
import { api } from "../../services/api";
import type { CirculoDetalle, Transaccion, Category } from "../../types";

type DivisionItem = { idUsuario: number; nombre: string; monto: number; porcentaje: number };

interface MetaGrupal {
  idGasto: number;
  nombre: string;
  valor: number;
  montoActual: number;
  periodicidad: string;
  aceptaciones: number[];
  totalMiembros: number;
  idUsuarioCreador: number;
}

const FALLBACK_IMAGE =
  "https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?auto=format&fit=crop&w=1600&q=80";


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
  const isGhost = user?.estado === 0;

  // Metas grupales
  const [metasGrupales, setMetasGrupales] = useState<MetaGrupal[]>([]);
  const [showMetaForm, setShowMetaForm] = useState(false);
  const [metaForm, setMetaForm] = useState({ nombre: "", valor: 0 });
  const [metaError, setMetaError] = useState("");
  const [metaSaving, setMetaSaving] = useState(false);
  const [abonoMeta, setAbonoMeta] = useState<{ idGasto: number; monto: number } | null>(null);
  const [editandoMeta, setEditandoMeta] = useState<{ idGasto: number; nombre: string; valor: number } | null>(null);

  const loadMetasGrupales = async (idCirculo: string) => {
    try {
      const data = await api.get<MetaGrupal[]>(`/gastos/circulo/${idCirculo}/metas-grupales`);
      setMetasGrupales(Array.isArray(data) ? data : []);
    } catch { /* silencioso */ }
  };

  const handleProponerMeta = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !user?.idUsuario) return;
    setMetaError("");
    if (!metaForm.nombre.trim()) { setMetaError("El nombre es obligatorio"); return; }
    if (metaForm.valor <= 0) { setMetaError("El valor debe ser mayor a 0"); return; }
    setMetaSaving(true);
    try {
      await api.post(`/gastos/circulo/${id}/meta-grupal?idUsuario=${user.idUsuario}`, {
        nombre: metaForm.nombre.trim(),
        valor: metaForm.valor,
        periodicidad: "META_PROPUESTA",
      });
      setMetaForm({ nombre: "", valor: 0 });
      setShowMetaForm(false);
      await loadMetasGrupales(id);
    } catch (err) {
      setMetaError(err instanceof Error ? err.message : "Error al proponer meta");
    } finally {
      setMetaSaving(false);
    }
  };

  const handleAceptarMeta = async (idGasto: number) => {
    if (!user?.idUsuario) return;
    try {
      await api.put(`/gastos/${idGasto}/meta-grupal/aceptar?idUsuario=${user.idUsuario}`, {});
      if (id) await loadMetasGrupales(id);
    } catch { /* silencioso */ }
  };

  const handleRechazarMeta = async (idGasto: number) => {
    if (!user?.idUsuario) return;
    try {
      await api.put(`/gastos/${idGasto}/meta-grupal/rechazar?idUsuario=${user.idUsuario}`, {});
      if (id) await loadMetasGrupales(id);
    } catch { /* silencioso */ }
  };

  const handleAbonar = async () => {
    if (!abonoMeta || !user?.idUsuario) return;
    const meta = metasGrupales.find((m) => m.idGasto === abonoMeta.idGasto);
    if (!meta) return;
    const restante = (meta.valor ?? 0) - (meta.montoActual ?? 0);
    if (abonoMeta.monto <= 0 || abonoMeta.monto > restante) return;
    try {
      await api.put(`/gastos/${abonoMeta.idGasto}/meta-grupal/abonar?idUsuario=${user.idUsuario}&monto=${abonoMeta.monto}`, {});
      setAbonoMeta(null);
      if (id) await loadMetasGrupales(id);
    } catch { /* silencioso */ }
  };

  const handleGuardarEdicionMeta = async () => {
    if (!editandoMeta) return;
    try {
      await api.put(`/gastos/${editandoMeta.idGasto}`, {
        nombre: editandoMeta.nombre,
        valor: editandoMeta.valor,
        periodicidad: "META",
        idUsuarioCreador: user?.idUsuario,
        idCirculoGasto: Number(id),
        idCategoria: 23,
      });
      setEditandoMeta(null);
      if (id) await loadMetasGrupales(id);
    } catch { /* silencioso */ }
  };

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

  const [modalidadDivision, setModalidadDivision] = useState<"" | "IGUALITARIA" | "PORCENTAJE" | "MONTO_FIJO">("");
  const [divisiones, setDivisiones] = useState<DivisionItem[]>([]);

  const isAdmin = detail?.idUsuarioCreador === user?.idUsuario;

  const handleModalidadChange = (mod: string) => {
    const m = mod as "" | "IGUALITARIA" | "PORCENTAJE" | "MONTO_FIJO";
    setModalidadDivision(m);
    if (!detail || detail.invitados.length === 0) return;
    if (m === "IGUALITARIA") {
      const totalMiembros = detail.invitados.length + 1;
      const parte = gastoForm.monto / totalMiembros;
      setDivisiones(detail.invitados.map((inv) => ({
        idUsuario: inv.idUsuario,
        nombre: inv.nombreCompleto,
        monto: parte,
        porcentaje: 100 / totalMiembros,
      })));
    } else if (m === "PORCENTAJE" || m === "MONTO_FIJO") {
      setDivisiones(detail.invitados.map((inv) => ({
        idUsuario: inv.idUsuario,
        nombre: inv.nombreCompleto,
        monto: 0,
        porcentaje: 0,
      })));
    } else {
      setDivisiones([]);
    }
  };

  useEffect(() => {
    if (modalidadDivision !== "IGUALITARIA" || !detail || detail.invitados.length === 0) return;
    const totalMiembros = detail.invitados.length + 1;
    const parte = gastoForm.monto / totalMiembros;
    setDivisiones((prev) => prev.map((d) => ({ ...d, monto: parte, porcentaje: 100 / totalMiembros })));
  }, [gastoForm.monto, modalidadDivision, detail]);

  const handleRegistrarGasto = async (e: React.FormEvent) => {
    e.preventDefault();
    setGastoError("");

    // Validar descripción/nombre
    const nameError = validateDescription(gastoForm.nombre);
    if (nameError) {
      setGastoError(nameError);
      return;
    }

    // Validar categoría
    if (!gastoForm.idCategoria) {
      setGastoError("Selecciona una categoría");
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

    // Validate PORCENTAJE doesn't exceed 100%
    if (modalidadDivision === "PORCENTAJE") {
      const totalPct = divisiones.reduce((s, d) => s + d.porcentaje, 0);
      if (totalPct > 100) {
        setGastoError("El total de porcentajes no puede superar 100%");
        return;
      }
    }

    setGastoSaving(true);
    setGastoError("");
    try {
      const saved = await transactionService.create({
        nombre: gastoForm.nombre.trim(),
        montoOriginal: monto,
        monedaOriginal: gastoForm.moneda,
        idUsuario: user.idUsuario,
        idCirculoGasto: Number(id),
        idCategoria: gastoForm.idCategoria ? Number(gastoForm.idCategoria) : undefined,
        idTipoMovimiento: 2,
        modalidadDivision: modalidadDivision || undefined,
      });

      // Create a debt for each member with a non-zero share
      if (modalidadDivision && divisiones.length > 0 && saved.idTransaccion) {
        for (const div of divisiones) {
          const montoDeuda =
            modalidadDivision === "PORCENTAJE"
              ? Math.round(monto * div.porcentaje / 100)
              : div.monto;
          if (montoDeuda > 0) {
            try {
              await api.post("/deudas", {
                monto: montoDeuda,
                porcentajeDivision: modalidadDivision === "PORCENTAJE" ? div.porcentaje : null,
                estadoPago: "PENDIENTE",
                idTransaccion: saved.idTransaccion,
                idUsuarioDeudor: div.idUsuario,
                idUsuarioAcreedor: user.idUsuario,
              });
            } catch {
              // continue creating remaining debts even if one fails
            }
          }
        }
      }

      setGastoForm({ nombre: "", monto: 0, idCategoria: "", moneda: "COP" });
      setModalidadDivision("");
      setDivisiones([]);
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
    if (id) void loadMetasGrupales(id);
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
                  <div className="circle-hero-editor">
                    <input
                      value={draftImage}
                      onChange={(event) => setDraftImage(event.target.value)}
                      placeholder="Pega URL de imagen"
                    />
                    <button
                      type="button"
                      className="btn btn-primary"
                      onClick={handleSaveImage}
                    >
                      Guardar
                    </button>
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
                <div>
                  <span>Creador</span>
                  <strong>{detail.nombreCreador || "—"}</strong>
                </div>
              </div>
            </section>

            {/* METAS GRUPALES */}
            <section className="circle-panel neo-shadow">
              <div className="panel-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <h3>Metas del círculo</h3>
                {!isGhost && (
                  <button
                    type="button"
                    className="btn btn-primary"
                    style={{ fontSize: "0.78rem", padding: "6px 14px" }}
                    onClick={() => { setShowMetaForm((v) => !v); setMetaError(""); }}
                  >
                    {showMetaForm ? "Cancelar" : "+ Proponer meta"}
                  </button>
                )}
              </div>

              {showMetaForm && (
                <form onSubmit={(e) => void handleProponerMeta(e)} style={{ marginBottom: 16 }}>
                  <div className="input-group">
                    <label>Nombre de la meta</label>
                    <input
                      type="text"
                      value={metaForm.nombre}
                      onChange={(e) => setMetaForm((f) => ({ ...f, nombre: e.target.value }))}
                      placeholder="Ej: Viaje a Cartagena"
                      required
                    />
                  </div>
                  <MoneyInput
                    label="Monto objetivo (COP)"
                    name="valorMeta"
                    value={metaForm.valor || ""}
                    onChange={(v) => setMetaForm((f) => ({ ...f, valor: v }))}
                    placeholder="0"
                    required
                  />
                  {metaError && <p className="error-msg">{metaError}</p>}
                  <button type="submit" className="btn btn-primary" disabled={metaSaving} style={{ width: "100%" }}>
                    {metaSaving ? "Proponiendo..." : "Proponer meta"}
                  </button>
                </form>
              )}

              {metasGrupales.length === 0 ? (
                <p style={{ color: "var(--on-surface-variant)", fontSize: "0.85rem" }}>No hay metas grupales aún.</p>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  {metasGrupales.map((meta) => {
                    const progreso = Math.min(100, Math.round(((meta.montoActual ?? 0) / meta.valor) * 100));
                    const yoAcepte = meta.aceptaciones?.includes(user?.idUsuario ?? -1);
                    const isPropuesta = meta.periodicidad === "META_PROPUESTA";
                    return (
                      <div key={meta.idGasto} style={{ border: "2px solid var(--primary)", padding: 14, background: "var(--surface-container-low)" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                          <strong style={{ fontSize: "0.9rem" }}>{meta.nombre}</strong>
                          <span style={{
                            fontSize: "0.7rem", fontWeight: 700, padding: "2px 8px",
                            background: isPropuesta ? "var(--accent)" : "var(--primary)",
                            color: isPropuesta ? "var(--primary)" : "var(--background)",
                          }}>
                            {isPropuesta ? `PROPUESTA (${meta.aceptaciones?.length ?? 0}/${meta.totalMiembros ?? "?"})` : "ACTIVA"}
                          </span>
                        </div>

                        {/* Barra de progreso — solo metas activas */}
                        {!isPropuesta && (
                          <>
                            <div style={{ background: "var(--outline-variant)", height: 8, marginBottom: 4 }}>
                              <div style={{ width: `${progreso}%`, height: "100%", background: "var(--primary)", transition: "width 0.4s" }} />
                            </div>
                            <p style={{ fontSize: "0.78rem", marginBottom: 8, color: "var(--on-surface-variant)" }}>
                              {fmt(meta.montoActual ?? 0)} / {fmt(meta.valor)} ({progreso}%)
                            </p>
                          </>
                        )}

                        {/* Acciones según estado */}
                        {isPropuesta && (
                          <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                            {!yoAcepte && (
                              <button
                                type="button"
                                className="btn btn-primary"
                                style={{ flex: 1, fontSize: "0.78rem", padding: "6px" }}
                                onClick={() => void handleAceptarMeta(meta.idGasto)}
                              >
                                Aceptar
                              </button>
                            )}
                            <button
                              type="button"
                              className="btn btn-secondary"
                              style={{ flex: 1, fontSize: "0.78rem", padding: "6px", borderColor: "var(--error, #b00020)", color: "var(--error, #b00020)" }}
                              onClick={() => void handleRechazarMeta(meta.idGasto)}
                            >
                              Rechazar
                            </button>
                          </div>
                        )}

                        {!isPropuesta && (
                          <>
                            {/* Editar — solo creador del círculo, inline */}
                            {editandoMeta?.idGasto === meta.idGasto ? (
                              <div style={{ marginTop: 10, display: "flex", flexDirection: "column", gap: 8 }}>
                                <input
                                  type="text"
                                  value={editandoMeta.nombre}
                                  onChange={(e) => setEditandoMeta((m) => m ? { ...m, nombre: e.target.value } : m)}
                                  style={{ border: "2px solid var(--primary)", padding: "6px 10px", background: "var(--surface)", borderRadius: 0, fontSize: "0.85rem" }}
                                />
                                <MoneyInput
                                  name="editValorMeta"
                                  value={editandoMeta.valor}
                                  onChange={(v) => setEditandoMeta((m) => m ? { ...m, valor: v } : m)}
                                  placeholder="Monto objetivo"
                                />
                                <div style={{ display: "flex", gap: 8 }}>
                                  <button type="button" className="btn btn-primary" style={{ flex: 1, fontSize: "0.78rem" }} onClick={() => void handleGuardarEdicionMeta()}>Guardar</button>
                                  <button type="button" className="btn btn-secondary" style={{ fontSize: "0.78rem" }} onClick={() => setEditandoMeta(null)}>Cancelar</button>
                                </div>
                              </div>
                            ) : (
                              <div style={{ display: "flex", gap: 8, marginTop: 8, flexWrap: "wrap" }}>
                                {/* Abonar — todos los usuarios */}
                                {abonoMeta?.idGasto === meta.idGasto ? (
                                  <>
                                    <div style={{ flex: 1, minWidth: 140 }}>
                                      <MoneyInput
                                        name="abonoMonto"
                                        value={abonoMeta.monto || ""}
                                        onChange={(v) => setAbonoMeta({ idGasto: meta.idGasto, monto: Math.min(v, meta.valor - (meta.montoActual ?? 0)) })}
                                        placeholder={`Máx. ${fmt(meta.valor - (meta.montoActual ?? 0))}`}
                                      />
                                    </div>
                                    <button type="button" className="btn btn-primary" style={{ fontSize: "0.78rem", alignSelf: "flex-end", marginBottom: 4 }} onClick={() => void handleAbonar()}>Abonar</button>
                                    <button type="button" className="btn btn-secondary" style={{ fontSize: "0.78rem", alignSelf: "flex-end", marginBottom: 4 }} onClick={() => setAbonoMeta(null)}>✕</button>
                                  </>
                                ) : (
                                  <button
                                    type="button"
                                    className="btn btn-primary"
                                    style={{ flex: 1, fontSize: "0.78rem" }}
                                    onClick={() => setAbonoMeta({ idGasto: meta.idGasto, monto: 0 })}
                                  >
                                    Abonar
                                  </button>
                                )}
                                {/* Editar / Eliminar — solo creador del círculo */}
                                {detail?.idUsuarioCreador === user?.idUsuario && (
                                  <>
                                    <button
                                      type="button"
                                      className="btn btn-secondary"
                                      style={{ fontSize: "0.78rem" }}
                                      onClick={() => setEditandoMeta({ idGasto: meta.idGasto, nombre: meta.nombre, valor: meta.valor })}
                                    >
                                      Editar
                                    </button>
                                    <button
                                      type="button"
                                      className="btn btn-secondary"
                                      style={{ fontSize: "0.78rem", borderColor: "var(--error, #b00020)", color: "var(--error, #b00020)" }}
                                      onClick={async () => {
                                        try {
                                          await api.delete(`/gastos/${meta.idGasto}`);
                                          setMetasGrupales((prev) => prev.filter((m) => m.idGasto !== meta.idGasto));
                                        } catch { /* silencioso */ }
                                      }}
                                    >
                                      Eliminar
                                    </button>
                                  </>
                                )}
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
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
                onClick={() => { setGastoForm({ nombre: "", monto: 0, idCategoria: "", moneda: "COP" }); setGastoError(""); setModalidadDivision(""); setDivisiones([]); setShowGastoModal(true); }}
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
                <article className="guest-token-item" style={{ marginBottom: 16 }}>
                  <label style={{ fontSize: "0.72rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--primary)" }}>
                    Token de invitación — usuarios registrados
                  </label>
                  <p className="guest-type" style={{ textTransform: "none", letterSpacing: 0, opacity: 0.7 }}>
                    Comparte con personas que ya tienen cuenta. Lo usan en "Unirse a círculo".
                  </p>
                  <div style={{ display: "flex", gap: "8px", alignItems: "stretch" }}>
                    <input
                      type="text"
                      value={detail.tokenInvitacion}
                      readOnly
                      style={{ flex: 1, background: "var(--surface-container-low)", border: "2px solid var(--primary)", padding: "8px 12px", fontFamily: "monospace", fontSize: "0.75rem", color: "var(--primary)", borderRadius: 0 }}
                    />
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={() => { void navigator.clipboard.writeText(detail.tokenInvitacion!); }}
                      style={{ borderRadius: 0, padding: "0 16px", fontSize: "0.75rem", whiteSpace: "nowrap" }}
                    >
                      Copiar
                    </button>
                  </div>
                </article>
              )}

              {/* Usuario fantasma: muestra su propio token de acceso */}
              {isGhost && tokenFromStorage && (
                <article className="guest-token-item" style={{ marginBottom: 12 }}>
                  <label style={{ fontSize: "0.72rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--primary)" }}>
                    Tu token de acceso
                  </label>
                  <p className="guest-type" style={{ textTransform: "none", letterSpacing: 0, opacity: 0.7 }}>
                    Úsalo para entrar a este círculo desde cualquier dispositivo.
                  </p>
                  <div style={{ display: "flex", gap: "8px", alignItems: "stretch" }}>
                    <input
                      type="text"
                      value={tokenFromStorage}
                      readOnly
                      style={{ flex: 1, background: "var(--surface-container-low)", border: "2px solid var(--primary)", padding: "8px 12px", fontFamily: "monospace", fontSize: "0.75rem", color: "var(--primary)", borderRadius: 0 }}
                    />
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={() => { void navigator.clipboard.writeText(tokenFromStorage); }}
                      style={{ borderRadius: 0, padding: "0 16px", fontSize: "0.75rem", whiteSpace: "nowrap" }}
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
                              border: "2px solid var(--error, #b00020)",
                              color: "var(--error, #b00020)",
                              borderRadius: 0,
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
                        <div style={{ marginTop: 10 }}>
                          <label style={{ display: "block", fontSize: "0.68rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--primary)", marginBottom: 6 }}>
                            Token de acceso personal
                          </label>
                          {invitado.tokenInvitacionPersonal ? (
                            <div style={{ display: "flex", gap: "6px", alignItems: "stretch" }}>
                              <input
                                type="text"
                                value={invitado.tokenInvitacionPersonal}
                                readOnly
                                style={{ flex: 1, background: "var(--surface-container-low)", border: "2px solid var(--primary)", padding: "6px 10px", fontFamily: "monospace", fontSize: "0.68rem", color: "var(--primary)", borderRadius: 0 }}
                              />
                              <button
                                type="button"
                                className="btn btn-secondary"
                                onClick={() => { void navigator.clipboard.writeText(invitado.tokenInvitacionPersonal!); }}
                                style={{ borderRadius: 0, padding: "0 12px", fontSize: "0.68rem", whiteSpace: "nowrap" }}
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
              {isAdmin && detail && detail.invitados.length > 0 && (
                <label style={{ marginTop: 8 }}>
                  Modalidad de división
                  <select
                    value={modalidadDivision}
                    onChange={(e) => handleModalidadChange(e.target.value)}
                  >
                    <option value="">Sin división (gasto personal)</option>
                    <option value="IGUALITARIA">Igualitaria (partes iguales)</option>
                    <option value="PORCENTAJE">Por porcentaje</option>
                    <option value="MONTO_FIJO">Monto fijo por persona</option>
                  </select>
                </label>
              )}

              {modalidadDivision && divisiones.length > 0 && (
                <div style={{ marginTop: 8, border: "2px solid var(--outline-variant)", padding: "10px 12px" }}>
                  <p style={{ fontSize: "0.78rem", fontWeight: 700, marginBottom: 10, color: "var(--primary)", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                    Deuda asignada a cada miembro
                  </p>
                  {divisiones.map((div, i) => (
                    <div key={div.idUsuario} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                      <span style={{ flex: 1, fontSize: "0.83rem" }}>{div.nombre}</span>
                      {modalidadDivision === "IGUALITARIA" && (
                        <strong style={{ fontSize: "0.83rem", color: "var(--primary)" }}>{fmt(div.monto)}</strong>
                      )}
                      {modalidadDivision === "PORCENTAJE" && (
                        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                          <input
                            type="number"
                            min={0}
                            max={100}
                            step={1}
                            value={div.porcentaje || ""}
                            onChange={(e) => {
                              const pct = Math.min(100, Math.max(0, Number(e.target.value)));
                              setDivisiones((prev) => prev.map((d, j) => j === i ? { ...d, porcentaje: pct } : d));
                            }}
                            style={{ width: 56, border: "2px solid var(--primary)", background: "var(--surface)", padding: "4px 6px", textAlign: "right" }}
                            placeholder="0"
                          />
                          <span style={{ fontSize: "0.8rem" }}>%</span>
                          {div.porcentaje > 0 && (
                            <span style={{ fontSize: "0.75rem", color: "var(--on-surface-variant)" }}>
                              ≈ {fmt(Math.round(gastoForm.monto * div.porcentaje / 100))}
                            </span>
                          )}
                        </div>
                      )}
                      {modalidadDivision === "MONTO_FIJO" && (
                        <input
                          type="text"
                          value={div.monto ? div.monto.toLocaleString("es-CO") : ""}
                          onChange={(e) => {
                            const v = Number(e.target.value.replace(/[^\d]/g, ""));
                            setDivisiones((prev) => prev.map((d, j) => j === i ? { ...d, monto: v } : d));
                          }}
                          style={{ width: 110, border: "2px solid var(--primary)", background: "var(--surface)", padding: "4px 8px", textAlign: "right" }}
                          placeholder="0"
                        />
                      )}
                    </div>
                  ))}
                  {modalidadDivision === "PORCENTAJE" && (() => {
                    const totalPct = divisiones.reduce((s, d) => s + d.porcentaje, 0);
                    return (
                      <p style={{ fontSize: "0.75rem", marginTop: 4, color: totalPct > 100 ? "var(--error, #b00020)" : "var(--on-surface-variant)" }}>
                        Total: {totalPct}%{totalPct > 100 ? " — excede 100%" : totalPct < 100 ? ` (admin retiene ${100 - totalPct}%)` : ""}
                      </p>
                    );
                  })()}
                  {modalidadDivision === "MONTO_FIJO" && (() => {
                    const totalFijo = divisiones.reduce((s, d) => s + d.monto, 0);
                    return (
                      <p style={{ fontSize: "0.75rem", marginTop: 4, color: totalFijo > gastoForm.monto ? "var(--error, #b00020)" : "var(--on-surface-variant)" }}>
                        Total asignado: {fmt(totalFijo)}{totalFijo > gastoForm.monto ? " — excede el monto del gasto" : ""}
                      </p>
                    );
                  })()}
                </div>
              )}

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
