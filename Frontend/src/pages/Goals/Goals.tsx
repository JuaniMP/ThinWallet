import { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { Layout } from "../../components/layout/Layout";
import { gastoService } from "../../services/gastoService";
import { categoryService } from "../../services/categoryService";
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
