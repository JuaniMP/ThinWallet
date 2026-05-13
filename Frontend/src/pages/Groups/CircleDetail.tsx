import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Layout } from "../../components/layout/Layout";
import { circleService } from "../../services/circuloGastoService";
import type { CirculoDetalle } from "../../types";

const FALLBACK_IMAGE =
  "https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?auto=format&fit=crop&w=1600&q=80";

interface HistoryItem {
  id: string;
  date: string;
  title: string;
  description: string;
  amount: string;
  type: "income" | "expense";
}

export function CircleDetail() {
  const { id } = useParams();
  const [detail, setDetail] = useState<CirculoDetalle | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [imageUrl, setImageUrl] = useState(FALLBACK_IMAGE);
  const [draftImage, setDraftImage] = useState(FALLBACK_IMAGE);
  const [editingImage, setEditingImage] = useState(false);
  const [history] = useState<HistoryItem[]>([]);
  const [tokenFromStorage, setTokenFromStorage] = useState<string | null>(null);

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

    // Recuperar token del usuario desde localStorage
    const savedToken = localStorage.getItem("user-token");
    if (savedToken) {
      setTokenFromStorage(savedToken);
    }

    const load = async () => {
      setLoading(true);
      try {
        const data = await circleService.getCircleDetail(circleId);
        setDetail(data);
      } catch (loadError) {
        console.error("Error cargando detalle del círculo", loadError);
        setError("No se pudo cargar el círculo.");
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, [id]);

  const presupuesto = useMemo(() => {
    if (!detail?.presupuestoGrupal) {
      return "$0.00";
    }
    return Number(detail.presupuestoGrupal).toLocaleString("en-US", {
      style: "currency",
      currency: detail.monedaBase || "USD",
      minimumFractionDigits: 2,
    });
  }, [detail]);

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
                  <strong>{detail.estado === 1 ? "Activo" : "Inactivo"}</strong>
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
                <h3>Historial</h3>
                <span className="history-icon">⏱</span>
              </div>
              {history.length === 0 ? (
                <div className="history-empty">
                  <p>No hay historial aún</p>
                </div>
              ) : (
                <div className="history-timeline">
                  {history.map((item) => (
                    <div
                      key={item.id}
                      className={`history-item history-${item.type}`}
                    >
                      <div className="history-line"></div>
                      <div className="history-content">
                        <div className="history-time">{item.date}</div>
                        <div className="history-title">{item.title}</div>
                        <div className="history-desc">{item.description}</div>
                        <div className="history-amount">{item.amount}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* BALANCE & ACTIONS */}
            <section className="circle-actions-panel neo-shadow">
              <div className="balance-box">
                <span className="balance-label">Balance total del grupo</span>
                <strong className="balance-value">{presupuesto}</strong>
              </div>
              <button className="btn btn-primary" type="button">
                Registrar gasto
              </button>
            </section>

            {/* INVITEES & TOKENS SECTION */}
            <section className="circle-panel neo-shadow">
              <div className="panel-header">
                <h3>Invitados y acceso</h3>
                <p>{detail.totalInvitados} invitados</p>
              </div>

              {detail.invitados.length === 0 && !tokenFromStorage ? (
                <p className="empty-state">
                  Aún no hay invitados en este círculo.
                </p>
              ) : (
                <div className="guest-token-grid">
                  {/* Token como primer item - entrada del usuario */}
                  {tokenFromStorage && (
                    <article className="guest-token-item">
                      <h4>Tu entrada</h4>
                      <div
                        style={{
                          display: "flex",
                          gap: "8px",
                          alignItems: "flex-start",
                        }}
                      >
                        <input
                          type="text"
                          value={tokenFromStorage}
                          readOnly
                          style={{
                            flex: 1,
                            padding: "8px",
                            border: "1px solid var(--border-color)",
                            borderRadius: "4px",
                            fontFamily: "monospace",
                            fontSize: "12px",
                            wordBreak: "break-all",
                          }}
                        />
                        <button
                          type="button"
                          className="matriz-cta-btn"
                          onClick={() => {
                            if (tokenFromStorage) {
                              navigator.clipboard.writeText(tokenFromStorage);
                              alert("Token copiado al portapapeles");
                            }
                          }}
                          title="Copiar token"
                          style={{ padding: "8px 16px", whiteSpace: "nowrap" }}
                        >
                          Copiar
                        </button>
                      </div>
                    </article>
                  )}

                  {/* Invitados debajo del token */}
                  {detail.invitados.map((invitado) => (
                    <article
                      key={invitado.idUsuario}
                      className="guest-token-item"
                    >
                      <h4>{invitado.nombreCompleto}</h4>
                      <p className="guest-type">
                        Tipo: {invitado.tipoUsuario || "N/A"}
                      </p>
                      {invitado.correo && (
                        <p className="guest-email">{invitado.correo}</p>
                      )}
                    </article>
                  ))}
                </div>
              )}
            </section>
          </>
        )}
      </div>
    </Layout>
  );
}
