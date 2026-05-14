import { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { Layout } from "../../components/layout/Layout";
import { gastoService } from "../../services/gastoService";
import { categoryService } from "../../services/categoryService";
import {
  coachService,
  type CoachRecomendacionResponse,
} from "../../services/coachService";
import type { Gasto, GastoRequest, Category } from "../../types";

const fmt = (v: number) =>
  v.toLocaleString("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  });

function toISO(local: string) {
  return local ? local + ":00" : undefined;
}

export function Goals() {
  const { user } = useAuth();
  const [metas, setMetas] = useState<Gasto[]>([]);
  const [categorias, setCategorias] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editTarget, setEditTarget] = useState<Gasto | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [coach, setCoach] = useState<CoachRecomendacionResponse | null>(null);
  const [coachIngreso, setCoachIngreso] = useState<string>("");
  const [coachLoading, setCoachLoading] = useState(false);

  const cargarCoach = async (ingresoMensual?: number) => {
    if (!user?.idUsuario) return;
    setCoachLoading(true);
    try {
      const data = await coachService.getRecomendacion(
        user.idUsuario,
        ingresoMensual,
      );
      setCoach(data);
    } catch {
      setCoach(null);
    } finally {
      setCoachLoading(false);
    }
  };

  useEffect(() => {
    void cargarCoach();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.idUsuario]);

  const emptyForm = (defaultCat?: number): GastoRequest => ({
    nombre: "",
    valor: 0,
    periodicidad: "META",
    fechaInicio: "",
    fechaFin: "",
    idUsuarioCreador: user?.idUsuario ?? 0,
    idCategoria: defaultCat,
  });
  const [form, setForm] = useState<GastoRequest>(emptyForm());

  const load = async () => {
    if (!user?.idUsuario) return;
    try {
      const [data, cats] = await Promise.all([
        gastoService.getMetas(user.idUsuario),
        categoryService.getAll(),
      ]);
      const catList = Array.isArray(cats) ? cats : [];
      setCategorias(catList);
      setMetas(Array.isArray(data) ? data : []);
      setForm(emptyForm(catList[0]?.idCategoria));
    } catch {
      setMetas([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const openNew = () => {
    setEditTarget(null);
    setForm(emptyForm(categorias[0]?.idCategoria));
    setError("");
    setShowForm(true);
  };

  const openEdit = (meta: Gasto) => {
    setEditTarget(meta);
    setForm({
      nombre: meta.nombre,
      valor: meta.valor,
      periodicidad: "META",
      fechaInicio: meta.fechaInicio ? meta.fechaInicio.slice(0, 16) : "",
      fechaFin: meta.fechaFin ? meta.fechaFin.slice(0, 16) : "",
      idUsuarioCreador: user?.idUsuario ?? 0,
      idCategoria: meta.idCategoria ?? categorias[0]?.idCategoria,
    });
    setError("");
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.nombre.trim() || form.valor <= 0) {
      setError("Nombre y valor son requeridos");
      return;
    }
    if (!form.idCategoria) {
      setError("Selecciona una categoría");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const payload: GastoRequest = {
        ...form,
        periodicidad: "META",
        fechaInicio: form.fechaInicio ? toISO(form.fechaInicio) : undefined,
        fechaFin: form.fechaFin ? toISO(form.fechaFin) : undefined,
      };
      if (editTarget) {
        await gastoService.update(editTarget.idGasto, payload);
      } else {
        await gastoService.create(payload);
      }
      setShowForm(false);
      await load();
    } catch {
      setError("Error al guardar la meta");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("¿Eliminar esta meta?")) return;
    try {
      await gastoService.delete(id);
      await load();
    } catch {
      /* ignore */
    }
  };

  const progressPct = (meta: Gasto) => {
    if (!meta.fechaInicio || !meta.fechaFin) return 0;
    const start = new Date(meta.fechaInicio).getTime();
    const end = new Date(meta.fechaFin).getTime();
    const now = Date.now();
    if (now >= end) return 100;
    if (now <= start) return 0;
    return Math.round(((now - start) / (end - start)) * 100);
  };

  return (
    <Layout>
      <div className="page-container">
        <div className="page-header">
          <div>
            <p className="page-label">Finanzas Personales</p>
            <h2 className="page-title">METAS DE AHORRO</h2>
          </div>
          <button className="btn-primary" onClick={openNew}>
            <span className="material-symbols-outlined">add</span>
            Nueva Meta
          </button>
        </div>

        <div
          className="neo-shadow"
          style={{ padding: 20, marginBottom: 24, background: "var(--surface)" }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              marginBottom: 12,
            }}
          >
            <span
              className="material-symbols-outlined"
              style={{ color: "var(--primary)" }}
            >
              psychology
            </span>
            <h3 style={{ margin: 0 }}>Coach Financiero · 50/30/20</h3>
          </div>

          <div
            style={{
              display: "flex",
              gap: 8,
              alignItems: "flex-end",
              marginBottom: 16,
              flexWrap: "wrap",
            }}
          >
            <label style={{ flex: 1, minWidth: 200 }}>
              Ingreso mensual (COP)
              <input
                type="number"
                value={coachIngreso}
                onChange={(e) => setCoachIngreso(e.target.value)}
                placeholder="Ej: 2500000"
                style={{ width: "100%" }}
              />
            </label>
            <button
              className="btn-secondary"
              onClick={() =>
                void cargarCoach(
                  coachIngreso ? Number(coachIngreso) : undefined,
                )
              }
              disabled={coachLoading}
            >
              {coachLoading ? "Calculando…" : "Actualizar"}
            </button>
          </div>

          {coach && coach.ingresoMensual > 0 ? (
            <>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(3, 1fr)",
                  gap: 12,
                  marginBottom: 16,
                }}
              >
                <CoachStat
                  label="Necesidades (50%)"
                  objetivo={coach.necesidadesMax}
                  real={coach.gastoNecesidades}
                  pct={coach.porcentajeNecesidades}
                />
                <CoachStat
                  label="Deseos (30%)"
                  objetivo={coach.deseosMax}
                  real={coach.gastoDeseos}
                  pct={coach.porcentajeDeseos}
                />
                <CoachStat
                  label="Ahorro (20%)"
                  objetivo={coach.ahorroObjetivo}
                  real={Math.max(
                    0,
                    coach.ingresoMensual - coach.gastoTotal,
                  )}
                  pct={coach.cumplimientoAhorro}
                  positive
                />
              </div>
              <ul
                style={{
                  margin: 0,
                  paddingLeft: 16,
                  fontSize: 14,
                  lineHeight: 1.6,
                }}
              >
                {coach.recomendaciones.map((r, i) => (
                  <li key={i}>{r}</li>
                ))}
              </ul>
            </>
          ) : (
            <p
              style={{
                fontSize: 13,
                color: "var(--on-surface-variant)",
                fontStyle: "italic",
              }}
            >
              Ingresa tu sueldo mensual y dale "Actualizar" para activar las
              recomendaciones.
            </p>
          )}
        </div>

        {showForm && (
          <div className="modal-overlay" onClick={() => setShowForm(false)}>
            <div
              className="modal-card neo-shadow"
              onClick={(e) => e.stopPropagation()}
            >
              <h3>{editTarget ? "Editar Meta" : "Nueva Meta de Ahorro"}</h3>
              <form onSubmit={(e) => void handleSubmit(e)}>
                <label>
                  Nombre
                  <input
                    type="text"
                    value={form.nombre}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, nombre: e.target.value }))
                    }
                    placeholder="Ej: Vacaciones, Laptop..."
                    required
                  />
                </label>
                <label>
                  Valor Objetivo (COP)
                  <input
                    type="number"
                    min={1}
                    value={form.valor || ""}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, valor: Number(e.target.value) }))
                    }
                    required
                  />
                </label>
                <label>
                  Categoría
                  <select
                    value={form.idCategoria ?? ""}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        idCategoria: Number(e.target.value),
                      }))
                    }
                    required
                  >
                    <option value="" disabled>
                      Seleccionar categoría
                    </option>
                    {categorias.map((c) => (
                      <option key={c.idCategoria} value={c.idCategoria}>
                        {c.nombre}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  Fecha Inicio
                  <input
                    type="datetime-local"
                    value={form.fechaInicio ?? ""}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, fechaInicio: e.target.value }))
                    }
                  />
                </label>
                <label>
                  Fecha Límite
                  <input
                    type="datetime-local"
                    value={form.fechaFin ?? ""}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, fechaFin: e.target.value }))
                    }
                  />
                </label>
                {error && <p className="error-msg">{error}</p>}
                <div className="form-actions">
                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={() => setShowForm(false)}
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="btn-primary"
                    disabled={saving}
                  >
                    {saving
                      ? "Guardando..."
                      : editTarget
                        ? "Actualizar"
                        : "Crear"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {loading ? (
          <div className="loading">Cargando metas...</div>
        ) : metas.length === 0 ? (
          <div className="empty-state neo-shadow">
            <span
              className="material-symbols-outlined"
              style={{ fontSize: 48 }}
            >
              savings
            </span>
            <p>No tienes metas de ahorro todavía.</p>
            <button className="btn-primary" onClick={openNew}>
              Crear primera meta
            </button>
          </div>
        ) : (
          <div className="goals-grid">
            {metas.map((meta) => {
              const pct = progressPct(meta);
              return (
                <div key={meta.idGasto} className="goal-card neo-shadow">
                  <div className="goal-header">
                    <span className="material-symbols-outlined goal-icon">
                      savings
                    </span>
                    <div className="goal-info">
                      <p className="goal-name">{meta.nombre}</p>
                      <p className="goal-value">{fmt(meta.valor)}</p>
                    </div>
                    <div className="goal-actions">
                      <button
                        className="icon-btn"
                        onClick={() => openEdit(meta)}
                        title="Editar"
                      >
                        <span className="material-symbols-outlined">edit</span>
                      </button>
                      <button
                        className="icon-btn danger"
                        onClick={() => void handleDelete(meta.idGasto)}
                        title="Eliminar"
                      >
                        <span className="material-symbols-outlined">
                          delete
                        </span>
                      </button>
                    </div>
                  </div>

                  {meta.fechaFin && (
                    <p className="goal-date">
                      Vence:{" "}
                      {new Date(meta.fechaFin).toLocaleDateString("es-CO")}
                    </p>
                  )}

                  <div className="goal-progress-wrap">
                    <div className="goal-progress-bar">
                      <div
                        className="goal-progress-fill"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className="goal-pct">{pct}%</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </Layout>
  );
}

function CoachStat({
  label,
  objetivo,
  real,
  pct,
  positive,
}: {
  label: string;
  objetivo: number;
  real: number;
  pct: number;
  positive?: boolean;
}) {
  const fill = Math.min(100, Math.max(0, Number(pct) || 0));
  const danger = !positive && fill > 100;
  return (
    <div
      style={{
        padding: 12,
        background: "var(--surface-variant, #f5f5f7)",
        borderRadius: 8,
      }}
    >
      <p
        style={{
          fontSize: 11,
          fontWeight: 700,
          letterSpacing: "0.06em",
          textTransform: "uppercase",
          marginBottom: 4,
        }}
      >
        {label}
      </p>
      <p style={{ fontSize: 14, marginBottom: 2 }}>
        {fmt(real)} /{" "}
        <span style={{ color: "var(--on-surface-variant)" }}>
          {fmt(objetivo)}
        </span>
      </p>
      <div
        style={{
          height: 6,
          background: "var(--surface)",
          borderRadius: 6,
          overflow: "hidden",
          marginTop: 4,
        }}
      >
        <div
          style={{
            width: `${fill}%`,
            height: "100%",
            background: positive
              ? "var(--success, #1f7a1f)"
              : danger
                ? "var(--error)"
                : "var(--primary)",
            transition: "width .3s",
          }}
        />
      </div>
      <p style={{ fontSize: 11, marginTop: 4 }}>{pct.toFixed(1)}%</p>
    </div>
  );
}
