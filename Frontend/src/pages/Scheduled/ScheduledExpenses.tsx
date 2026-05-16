import { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { Layout } from "../../components/layout/Layout";
import { gastoService } from "../../services/gastoService";
import { categoryService } from "../../services/categoryService";
import { useCurrency } from "../../context/CurrencyContext";
import { MoneyInput } from "../../components/common/MoneyInput";
import { validateAmount, validateDescription, validateDate } from "../../utils/validators";
import type { Gasto, GastoRequest, Category } from "../../types";

const PERIODICIDADES = ["DIARIO", "SEMANAL", "MENSUAL"];

function toISO(local: string) {
  return local ? local + ":00" : undefined;
}

function nowAsLocalInput(): string {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}T${pad(now.getHours())}:${pad(now.getMinutes())}`;
}

export function ScheduledExpenses() {
  const { user } = useAuth();
  const { format: fmt } = useCurrency();
  const [gastos, setGastos] = useState<Gasto[]>([]);
  const [categorias, setCategorias] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editTarget, setEditTarget] = useState<Gasto | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const emptyForm = (defaultCat?: number): GastoRequest => ({
    nombre: "",
    valor: 0,
    periodicidad: "MENSUAL",
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
        gastoService.getProgramados(user.idUsuario),
        categoryService.getAll(),
      ]);
      const catList = Array.isArray(cats) ? cats : [];
      setCategorias(catList);
      setGastos(Array.isArray(data) ? data : []);
      setForm(emptyForm(catList[0]?.idCategoria));
    } catch {
      setGastos([]);
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

  const openEdit = (g: Gasto) => {
    setEditTarget(g);
    setForm({
      nombre: g.nombre,
      valor: g.valor,
      periodicidad: g.periodicidad ?? "MENSUAL",
      fechaInicio: g.fechaInicio ? g.fechaInicio.slice(0, 16) : "",
      fechaFin: g.fechaFin ? g.fechaFin.slice(0, 16) : "",
      idUsuarioCreador: user?.idUsuario ?? 0,
      idCategoria: g.idCategoria ?? categorias[0]?.idCategoria,
    });
    setError("");
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Validar nombre/descripción
    const nameError = validateDescription(form.nombre, 3, 100);
    if (nameError) {
      setError(nameError);
      return;
    }

    // Validar monto
    const amountError = validateAmount(form.valor);
    if (amountError) {
      setError(amountError);
      return;
    }

    // Validar categoría
    if (!form.idCategoria) {
      setError("Selecciona una categoría");
      return;
    }

    // Validar fecha de inicio
    if (!form.fechaInicio) {
      setError("La fecha de inicio es obligatoria");
      return;
    }

    const dateStartError = validateDate(form.fechaInicio);
    if (dateStartError) {
      setError(dateStartError);
      return;
    }

    // Validar fecha de fin si está presente
    if (form.fechaFin) {
      const dateEndError = validateDate(form.fechaFin);
      if (dateEndError) {
        setError(dateEndError);
        return;
      }

      // Validar que fechaFin sea posterior a fechaInicio
      const start = new Date(form.fechaInicio);
      const end = new Date(form.fechaFin);
      if (end <= start) {
        setError("La fecha de fin debe ser posterior a la fecha de inicio");
        return;
      }
    }
    setSaving(true);
    setError("");
    try {
      const payload: GastoRequest = {
        ...form,
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
      setError("Error al guardar el gasto programado");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("¿Eliminar este gasto programado?")) return;
    try {
      await gastoService.delete(id);
      await load();
    } catch {
      /* ignore */
    }
  };

  const periodIcon = (p?: string) => {
    if (p === "DIARIO") return "today";
    if (p === "SEMANAL") return "view_week";
    if (p === "UNICO") return "receipt_long";
    return "calendar_month";
  };

  const periodLabel = (p?: string) => {
    if (p === "UNICO") return "GASTO ÚNICO";
    return p ?? "—";
  };

  const isActive = (g: Gasto) => {
    const now = new Date();
    const fin = g.fechaFin ? new Date(g.fechaFin) : null;
    return !fin || fin >= now;
  };

  return (
    <Layout>
      <div className="page-container">
        <div className="page-header">
          <div>
            <p className="page-label">Automatización</p>
            <h2 className="page-title">GASTOS PROGRAMADOS</h2>
          </div>
          <button className="btn-primary" onClick={openNew}>
            <span className="material-symbols-outlined">add</span>
            Nuevo
          </button>
        </div>

        {showForm && (
          <div className="modal-overlay" onClick={() => setShowForm(false)}>
            <div
              className="modal-card neo-shadow"
              onClick={(e) => e.stopPropagation()}
            >
              <h3>
                {editTarget
                  ? "Editar Gasto Programado"
                  : "Nuevo Gasto Programado"}
              </h3>
              <form onSubmit={(e) => void handleSubmit(e)}>
                <label>
                  Nombre
                  <input
                    type="text"
                    value={form.nombre}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, nombre: e.target.value }))
                    }
                    placeholder="Ej: Netflix, Arriendo..."
                    required
                  />
                </label>
                <MoneyInput
                  label="Monto (COP)"
                  name="valor"
                  value={form.valor || 0}
                  onChange={(v) => setForm((f) => ({ ...f, valor: v }))}
                  required
                  placeholder="Ej: 50,000"
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
                  Periodicidad
                  <select
                    value={form.periodicidad ?? "MENSUAL"}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, periodicidad: e.target.value }))
                    }
                  >
                    {PERIODICIDADES.map((p) => (
                      <option key={p} value={p}>
                        {p}
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
                  Fecha Fin (opcional)
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
          <div className="loading">Cargando gastos programados...</div>
        ) : gastos.length === 0 ? (
          <div className="empty-state neo-shadow">
            <span
              className="material-symbols-outlined"
              style={{ fontSize: 48 }}
            >
              event_repeat
            </span>
            <p>No tienes gastos programados todavía.</p>
            <button className="btn-primary" onClick={openNew}>
              Crear primero
            </button>
          </div>
        ) : (
          <div className="scheduled-list">
            {gastos.map((g) => (
              <div
                key={g.idGasto}
                className={`scheduled-card neo-shadow ${isActive(g) ? "" : "inactive"}`}
              >
                <span className="material-symbols-outlined scheduled-icon">
                  {periodIcon(g.periodicidad)}
                </span>
                <div className="scheduled-info">
                  <p className="scheduled-name">{g.nombre}</p>
                  <p className="scheduled-amount">{fmt(g.valor, "COP")}</p>
                  <p className="scheduled-period">{periodLabel(g.periodicidad)}</p>
                  {g.fechaFin && (
                    <p
                      className="scheduled-date"
                      style={{
                        fontSize: "0.75rem",
                        color: "var(--on-surface-variant)",
                      }}
                    >
                      Hasta: {new Date(g.fechaFin).toLocaleDateString("es-CO")}
                    </p>
                  )}
                </div>
                {!isActive(g) && (
                  <span className="badge-inactive">Expirado</span>
                )}
                <div className="scheduled-actions">
                  <button
                    className="icon-btn"
                    onClick={() => openEdit(g)}
                    title="Editar"
                  >
                    <span className="material-symbols-outlined">edit</span>
                  </button>
                  <button
                    className="icon-btn danger"
                    onClick={() => void handleDelete(g.idGasto)}
                    title="Eliminar"
                  >
                    <span className="material-symbols-outlined">delete</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}
