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

interface FormErrors {
  nombre?: string;
  valor?: string;
  idCategoria?: string;
  fechaInicio?: string;
  fechaFin?: string;
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
  const [formErrors, setFormErrors] = useState<FormErrors>({});

  // Modal abonar
  const [abonarTarget, setAbonarTarget] = useState<Gasto | null>(null);
  const [abonarMonto, setAbonarMonto] = useState(0);
  const [abonarSaving, setAbonarSaving] = useState(false);
  const [abonarError, setAbonarError] = useState("");

  // Modal confirmar eliminar
  const [deleteTarget, setDeleteTarget] = useState<Gasto | null>(null);
  const [deleting, setDeleting] = useState(false);

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
      setForm(emptyForm());
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
    setForm(emptyForm());
    setError("");
    setFormErrors({});
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
    setFormErrors({});
    setShowForm(true);
  };

  const validateField = (field: keyof FormErrors, value: unknown): string => {
    switch (field) {
      case "nombre": {
        const v = String(value ?? "").trim();
        if (!v) return "El nombre es obligatorio";
        if (v.length < 3) return "Mínimo 3 caracteres";
        if (v.length > 100) return "Máximo 100 caracteres";
        return "";
      }
      case "valor": {
        const n = Number(value);
        if (!n || n <= 0) return "El valor debe ser mayor a 0";
        if (n > 999_999_999_999) return "Valor demasiado alto";
        return "";
      }
      case "idCategoria":
        return !value ? "Selecciona una categoría" : "";
      case "fechaInicio":
        return !value ? "La fecha de inicio es obligatoria" : "";
      case "fechaFin":
        return "";
      default:
        return "";
    }
  };

  const setFieldError = (field: keyof FormErrors, value: unknown) => {
    const msg = validateField(field, value);
    setFormErrors((prev) => ({ ...prev, [field]: msg }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const errors: FormErrors = {
      nombre: validateField("nombre", form.nombre),
      valor: validateField("valor", form.valor),
      idCategoria: validateField("idCategoria", form.idCategoria),
      fechaInicio: validateField("fechaInicio", form.fechaInicio),
    };

    if (form.fechaFin && form.fechaInicio) {
      const start = new Date(form.fechaInicio);
      const end = new Date(form.fechaFin);
      if (end <= start) {
        errors.fechaFin = "La fecha límite debe ser posterior a la fecha de inicio";
      }
    }

    setFormErrors(errors);
    if (Object.values(errors).some((v) => v)) return;

    setSaving(true);
    try {
      const payload: GastoRequest = {
        ...form,
        periodicidad: "META",
        idUsuarioCreador: user?.idUsuario ?? form.idUsuarioCreador,
        fechaInicio: toISO(form.fechaInicio ?? ""),
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
      setError("Error al guardar la meta. Intenta de nuevo.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await gastoService.delete(deleteTarget.idGasto);
      setDeleteTarget(null);
      await load();
    } catch {
      /* ignore */
    } finally {
      setDeleting(false);
    }
  };

  const handleAbonar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!abonarTarget) return;
    setAbonarError("");

    if (!abonarMonto || abonarMonto <= 0) {
      setAbonarError("El monto del abono debe ser mayor a 0");
      return;
    }
    const nuevoTotal = (abonarTarget.montoActual ?? 0) + abonarMonto;
    if (nuevoTotal > abonarTarget.valor) {
      setAbonarError(`El abono supera el valor objetivo de ${fmt(abonarTarget.valor, "COP")}`);
      return;
    }

    setAbonarSaving(true);
    try {
      const ahoraISO = toISO(nowAsLocalInput());

      // Registrar el abono como un gasto real en el sistema
      await gastoService.create({
        nombre: `Abono - ${abonarTarget.nombre}`,
        valor: abonarMonto,
        periodicidad: "GASTO",
        fechaInicio: ahoraISO,
        idUsuarioCreador: user?.idUsuario ?? 0,
        idCategoria: abonarTarget.idCategoria,
      });

      // Actualizar el progreso acumulado en la meta
      await gastoService.update(abonarTarget.idGasto, {
        nombre: abonarTarget.nombre,
        valor: abonarTarget.valor,
        montoActual: nuevoTotal,
        periodicidad: "META",
        fechaInicio: abonarTarget.fechaInicio
          ? toISO(abonarTarget.fechaInicio.slice(0, 16))
          : ahoraISO,
        fechaFin: abonarTarget.fechaFin
          ? toISO(abonarTarget.fechaFin.slice(0, 16))
          : undefined,
        idUsuarioCreador: user?.idUsuario ?? 0,
        idCategoria: abonarTarget.idCategoria,
      });

      setAbonarTarget(null);
      setAbonarMonto(0);
      await load();
    } catch {
      setAbonarError("Error al registrar el abono. Intenta de nuevo.");
    } finally {
      setAbonarSaving(false);
    }
  };

  const progressPct = (meta: Gasto) => {
    const actual = meta.montoActual ?? 0;
    if (!meta.valor || meta.valor === 0) return 0;
    return Math.min(100, Math.round((actual / meta.valor) * 100));
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

        {/* Modal crear / editar meta */}
        {showForm && (
          <div className="modal-overlay" onClick={() => setShowForm(false)}>
            <div
              className="modal-card neo-shadow"
              onClick={(e) => e.stopPropagation()}
            >
              <h3>{editTarget ? "Editar Meta" : "Nueva Meta de Ahorro"}</h3>
              <form onSubmit={(e) => void handleSubmit(e)}>
                <label className={formErrors.nombre ? "field-error-wrap" : ""}>
                  Nombre *
                  <input
                    type="text"
                    value={form.nombre}
                    onChange={(e) => {
                      setForm((f) => ({ ...f, nombre: e.target.value }));
                      setFieldError("nombre", e.target.value);
                    }}
                    placeholder="Ej: Vacaciones, Laptop..."
                    style={formErrors.nombre ? { borderColor: "var(--error)" } : {}}
                  />
                  {formErrors.nombre && (
                    <span className="field-error-msg">{formErrors.nombre}</span>
                  )}
                </label>

                <div style={{ marginBottom: 16 }}>
                  <MoneyInput
                    label="Valor Objetivo (COP) *"
                    name="valor"
                    value={form.valor || 0}
                    onChange={(v) => {
                      setForm((f) => ({ ...f, valor: v }));
                      setFieldError("valor", v);
                    }}
                    required
                    placeholder="Ej: 1,500,000"
                  />
                  {formErrors.valor && (
                    <span className="field-error-msg">{formErrors.valor}</span>
                  )}
                </div>

                <label className={formErrors.idCategoria ? "field-error-wrap" : ""}>
                  Categoría *
                  <select
                    value={form.idCategoria ?? ""}
                    onChange={(e) => {
                      setForm((f) => ({
                        ...f,
                        idCategoria: Number(e.target.value),
                      }));
                      setFieldError("idCategoria", e.target.value);
                    }}
                    style={formErrors.idCategoria ? { borderColor: "var(--error)" } : {}}
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
                  {formErrors.idCategoria && (
                    <span className="field-error-msg">{formErrors.idCategoria}</span>
                  )}
                </label>

                <label className={formErrors.fechaInicio ? "field-error-wrap" : ""}>
                  Fecha Inicio *
                  <input
                    type="datetime-local"
                    value={form.fechaInicio ?? ""}
                    onChange={(e) => {
                      setForm((f) => ({ ...f, fechaInicio: e.target.value }));
                      setFieldError("fechaInicio", e.target.value);
                    }}
                    style={formErrors.fechaInicio ? { borderColor: "var(--error)" } : {}}
                  />
                  {formErrors.fechaInicio && (
                    <span className="field-error-msg">{formErrors.fechaInicio}</span>
                  )}
                </label>

                <label className={formErrors.fechaFin ? "field-error-wrap" : ""}>
                  Fecha Límite
                  <input
                    type="datetime-local"
                    value={form.fechaFin ?? ""}
                    onChange={(e) => {
                      setForm((f) => ({ ...f, fechaFin: e.target.value }));
                      if (e.target.value && form.fechaInicio) {
                        const start = new Date(form.fechaInicio);
                        const end = new Date(e.target.value);
                        setFormErrors((prev) => ({
                          ...prev,
                          fechaFin: end <= start ? "Debe ser posterior a la fecha de inicio" : "",
                        }));
                      }
                    }}
                    style={formErrors.fechaFin ? { borderColor: "var(--error)" } : {}}
                  />
                  {formErrors.fechaFin && (
                    <span className="field-error-msg">{formErrors.fechaFin}</span>
                  )}
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

        {/* Modal abonar a meta */}
        {abonarTarget && (
          <div className="modal-overlay" onClick={() => { setAbonarTarget(null); setAbonarMonto(0); setAbonarError(""); }}>
            <div className="modal-card neo-shadow" onClick={(e) => e.stopPropagation()}>
              <h3>Abonar a Meta</h3>
              <p style={{ fontSize: "0.9rem", color: "var(--on-surface-variant)", marginBottom: 4 }}>
                {abonarTarget.nombre}
              </p>
              <div style={{ marginBottom: 16 }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.85rem", marginBottom: 6 }}>
                  <span>Ahorrado: <strong>{fmt(abonarTarget.montoActual ?? 0, "COP")}</strong></span>
                  <span>Objetivo: <strong>{fmt(abonarTarget.valor, "COP")}</strong></span>
                </div>
                <div className="goal-progress-bar">
                  <div
                    className="goal-progress-fill"
                    style={{ width: `${progressPct(abonarTarget)}%` }}
                  />
                </div>
                <p style={{ fontSize: "0.75rem", textAlign: "right", marginTop: 4, color: "var(--primary)", fontWeight: 700 }}>
                  {progressPct(abonarTarget)}% completado
                </p>
              </div>
              <form onSubmit={(e) => void handleAbonar(e)}>
                <MoneyInput
                  label="Monto a abonar (COP) *"
                  name="abonarMonto"
                  value={abonarMonto}
                  onChange={(v) => { setAbonarMonto(v); setAbonarError(""); }}
                  placeholder="Ej: 200,000"
                />
                {abonarError && <p className="error-msg">{abonarError}</p>}
                <div className="form-actions">
                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={() => { setAbonarTarget(null); setAbonarMonto(0); setAbonarError(""); }}
                  >
                    Cancelar
                  </button>
                  <button type="submit" className="btn-primary" disabled={abonarSaving}>
                    {abonarSaving ? "Guardando..." : "Registrar Abono"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal confirmar eliminar */}
        {deleteTarget && (
          <div className="modal-overlay" onClick={() => setDeleteTarget(null)}>
            <div className="modal-card neo-shadow" style={{ maxWidth: 380 }} onClick={(e) => e.stopPropagation()}>
              <h3>Eliminar Meta</h3>
              <p style={{ fontSize: "0.95rem", marginBottom: 20, color: "var(--on-surface-variant)" }}>
                ¿Estás seguro de que quieres eliminar la meta <strong style={{ color: "var(--on-surface)" }}>"{deleteTarget.nombre}"</strong>? Esta acción no se puede deshacer.
              </p>
              <div className="form-actions">
                <button className="btn-secondary" onClick={() => setDeleteTarget(null)}>
                  Cancelar
                </button>
                <button
                  className="btn-primary"
                  style={{ background: "var(--error)", borderColor: "var(--error)" }}
                  onClick={() => void handleDelete()}
                  disabled={deleting}
                >
                  {deleting ? "Eliminando..." : "Eliminar"}
                </button>
              </div>
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
              const actual = meta.montoActual ?? 0;
              const completada = pct >= 100;
              return (
                <div key={meta.idGasto} className={`goal-card neo-shadow${completada ? " goal-card--done" : ""}`}>
                  <div className="goal-header">
                    <span className="material-symbols-outlined goal-icon">
                      {completada ? "check_circle" : "savings"}
                    </span>
                    <div className="goal-info">
                      <p className="goal-name">{meta.nombre}</p>
                      <p className="goal-value">
                        <span style={{ color: "var(--on-surface-variant)", fontSize: "0.8rem" }}>
                          {fmt(actual, "COP")}
                        </span>
                        {" / "}
                        {fmt(meta.valor, "COP")}
                      </p>
                    </div>
                    <div className="goal-actions">
                      <button
                        className="icon-btn"
                        onClick={() => { setAbonarTarget(meta); setAbonarMonto(0); setAbonarError(""); }}
                        title="Abonar"
                        disabled={completada}
                        style={completada ? { opacity: 0.4 } : {}}
                      >
                        <span className="material-symbols-outlined">add_circle</span>
                      </button>
                      <button
                        className="icon-btn"
                        onClick={() => openEdit(meta)}
                        title="Editar"
                      >
                        <span className="material-symbols-outlined">edit</span>
                      </button>
                      <button
                        className="icon-btn danger"
                        onClick={() => setDeleteTarget(meta)}
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
                      {completada ? "✓ ¡Meta completada!" : `Vence: ${new Date(meta.fechaFin).toLocaleDateString("es-CO")}`}
                    </p>
                  )}

                  <div className="goal-progress-wrap">
                    <div className="goal-progress-bar">
                      <div
                        className="goal-progress-fill"
                        style={{
                          width: `${pct}%`,
                          background: completada ? "var(--success, #1f7a1f)" : "var(--primary)",
                        }}
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
