import { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { Layout } from "../../components/layout/Layout";
import { gastoService } from "../../services/gastoService";
import { categoryService } from "../../services/categoryService";
import {
  coachService,
  type CoachRecomendacionResponse,
} from "../../services/coachService";
import { api } from "../../services/api";
import { MoneyInput } from "../../components/common/MoneyInput";
import {
  useCurrency,
  SUPPORTED_CURRENCIES,
  type CurrencyCode,
} from "../../context/CurrencyContext";
import type { Gasto, GastoRequest, Category } from "../../types";

interface BackendTxLite {
  montoOriginal: number;
  tipoMovimiento: string | null;
  idTipoMovimiento: number | null;
}

function toISO(local: string) {
  return local ? local + ":00" : undefined;
}

function nowAsLocalInput(): string {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}T${pad(now.getHours())}:${pad(now.getMinutes())}`;
}

export function Goals() {
  const { user } = useAuth();
  const { format: fmt, currency: prefCurrency } = useCurrency();
  const [metas, setMetas] = useState<Gasto[]>([]);
  const [categorias, setCategorias] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editTarget, setEditTarget] = useState<Gasto | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [coach, setCoach] = useState<CoachRecomendacionResponse | null>(null);
  const [coachIngreso, setCoachIngreso] = useState<number>(0);
  const [coachMoneda, setCoachMoneda] = useState<CurrencyCode>(prefCurrency);
  const [coachLoading, setCoachLoading] = useState(false);
  const [importingSalary, setImportingSalary] = useState(false);
  const [coachInfo, setCoachInfo] = useState("");

  const importarSalario = async () => {
    if (!user?.idUsuario) return;
    setImportingSalary(true);
    setCoachInfo("");
    try {
      const txs = await api.get<BackendTxLite[]>(
        `/transacciones/usuario/${user.idUsuario}`,
      );
      const deposits = (Array.isArray(txs) ? txs : []).filter(
        (t) => t.tipoMovimiento === "DEPOSITO" || t.idTipoMovimiento === 1,
      );
      if (deposits.length === 0) {
        setCoachInfo(
          "No tienes ingresos registrados. Crea una transacción tipo Depósito primero.",
        );
        return;
      }
      const total = deposits.reduce(
        (acc, t) => acc + Number(t.montoOriginal || 0),
        0,
      );
      setCoachIngreso(total);
      setCoachInfo(
        `Se importaron ${deposits.length} ingreso(s) por un total de ${fmt(total, "COP")}.`,
      );
    } catch {
      setCoachInfo("No fue posible importar los ingresos.");
    } finally {
      setImportingSalary(false);
    }
  };

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
    fechaInicio: nowAsLocalInput(),
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
    if (!form.fechaInicio) {
      setError("La fecha de inicio es obligatoria");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const payload: GastoRequest = {
        ...form,
        periodicidad: "META",
        idUsuarioCreador: user?.idUsuario ?? form.idUsuarioCreador,
        fechaInicio: toISO(form.fechaInicio),
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

        <div className="coach-card neo-shadow">
          <div className="coach-card__header">
            <span className="material-symbols-outlined coach-card__icon">
              psychology
            </span>
            <div>
              <h3>Coach Financiero</h3>
              <p className="coach-card__subtitle">Regla 50 / 30 / 20</p>
            </div>
          </div>

          <div className="coach-salary-row">
            <div className="coach-salary-input">
              <MoneyInput
                label="Ingreso mensual"
                name="coachIngreso"
                value={coachIngreso}
                onChange={setCoachIngreso}
                prefix={coachMoneda}
                placeholder="Ej: 2,500,000"
              />
            </div>
            <div className="input-group">
              <label htmlFor="coachMoneda">Moneda</label>
              <select
                id="coachMoneda"
                value={coachMoneda}
                onChange={(e) => setCoachMoneda(e.target.value as CurrencyCode)}
              >
                {SUPPORTED_CURRENCIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
            <div className="coach-actions-row">
              <button
                type="button"
                className="btn-import-salary"
                onClick={() => void importarSalario()}
                disabled={importingSalary}
                title="Sumar todos tus depósitos registrados"
              >
                <span className="material-symbols-outlined">download</span>
                {importingSalary ? "Importando…" : "Importar de ingresos"}
              </button>
              <button
                type="button"
                className="btn-primary coach-update-btn"
                onClick={() =>
                  void cargarCoach(coachIngreso > 0 ? coachIngreso : undefined)
                }
                disabled={coachLoading}
              >
                {coachLoading ? "Calculando…" : "Actualizar"}
              </button>
            </div>
          </div>

          {coachInfo && <p className="coach-info">{coachInfo}</p>}

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
                  fmt={fmt}
                />
                <CoachStat
                  label="Deseos (30%)"
                  objetivo={coach.deseosMax}
                  real={coach.gastoDeseos}
                  pct={coach.porcentajeDeseos}
                  fmt={fmt}
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
                  fmt={fmt}
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
                <MoneyInput
                  label="Valor Objetivo (COP)"
                  name="valor"
                  value={form.valor || 0}
                  onChange={(v) => setForm((f) => ({ ...f, valor: v }))}
                  required
                  placeholder="Ej: 1,500,000"
                />
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
                  Fecha Inicio *
                  <input
                    type="datetime-local"
                    value={form.fechaInicio ?? ""}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, fechaInicio: e.target.value }))
                    }
                    required
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
                      <p className="goal-value">{fmt(meta.valor, "COP")}</p>
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
  fmt,
}: {
  label: string;
  objetivo: number;
  real: number;
  pct: number;
  positive?: boolean;
  fmt: (amount: number, from?: CurrencyCode) => string;
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
        {fmt(real, "COP")} /{" "}
        <span style={{ color: "var(--on-surface-variant)" }}>
          {fmt(objetivo, "COP")}
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
