import { useEffect, useState } from "react";
import { Layout } from "../../components/layout/Layout";
import { useAuth } from "../../context/AuthContext";
import { circleService } from "../../services/circuloGastoService";
import {
  cicloService,
  type CierreCicloResponse,
} from "../../services/cicloService";
import type { CirculoGasto } from "../../types";

const MESES = [
  "Enero",
  "Febrero",
  "Marzo",
  "Abril",
  "Mayo",
  "Junio",
  "Julio",
  "Agosto",
  "Septiembre",
  "Octubre",
  "Noviembre",
  "Diciembre",
];

export function CierreMensual() {
  const { user } = useAuth();
  const [circulos, setCirculos] = useState<CirculoGasto[]>([]);
  const [idCirculo, setIdCirculo] = useState<number | "">("");
  const today = new Date();
  const [mes, setMes] = useState<number>(today.getMonth() + 1);
  const [anio, setAnio] = useState<number>(today.getFullYear());
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<CierreCicloResponse | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!user?.idUsuario) return;
    circleService
      .getCirclesByUser(user.idUsuario)
      .then((list) => {
        setCirculos(list);
        if (list.length > 0) setIdCirculo(list[0].idCirculoGasto);
      })
      .catch(() => setCirculos([]));
  }, [user?.idUsuario]);

  const ejecutar = async () => {
    if (!idCirculo) {
      setError("Selecciona un círculo");
      return;
    }
    setBusy(true);
    setError("");
    setResult(null);
    try {
      const res = await cicloService.cerrarMensual({
        idCirculo: Number(idCirculo),
        mes,
        anio,
      });
      setResult(res);
    } catch (err) {
      const msg =
        err instanceof Error && err.message ? err.message : "Error en el cierre";
      setError(msg);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Layout>
      <div className="debts-page">
        <section style={{ marginBottom: "32px" }}>
          <p className="page-label">Administración de círculos</p>
          <h2 className="page-title">Cierre de ciclo mensual</h2>
        </section>

        <section
          className="neo-shadow"
          style={{
            padding: "24px",
            background: "var(--surface-container-low)",
            borderLeft: "4px solid var(--primary)",
            marginBottom: 24,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
            <span className="material-symbols-outlined">event_available</span>
            <h3 style={{ margin: 0 }}>Cerrar el periodo</h3>
          </div>
          <p style={{ fontSize: "0.9rem", lineHeight: 1.5, opacity: 0.85, marginBottom: 20 }}>
            Selecciona el círculo y el periodo (mes/año) que quieres cerrar. El sistema verifica
            que no haya deudas pendientes y deja constancia del cierre en la auditoría. Si alguien
            aún debe, te indicará cuántas deudas faltan resolver antes de poder cerrar.
          </p>

          <form
            className="transaction-form"
            onSubmit={(e) => {
              e.preventDefault();
              void ejecutar();
            }}
          >
            <div className="input-group">
              <label htmlFor="circulo">Círculo</label>
              <select
                id="circulo"
                value={idCirculo}
                onChange={(e) =>
                  setIdCirculo(e.target.value ? Number(e.target.value) : "")
                }
              >
                <option value="" disabled>
                  Seleccionar círculo
                </option>
                {circulos.map((c) => (
                  <option key={c.idCirculoGasto} value={c.idCirculoGasto}>
                    {c.nombre}
                  </option>
                ))}
              </select>
            </div>

            <div className="input-group">
              <label htmlFor="mes">Mes</label>
              <select
                id="mes"
                value={mes}
                onChange={(e) => setMes(Number(e.target.value))}
              >
                {MESES.map((m, i) => (
                  <option key={m} value={i + 1}>
                    {m}
                  </option>
                ))}
              </select>
            </div>

            <div className="input-group">
              <label htmlFor="anio">Año</label>
              <input
                id="anio"
                type="number"
                min={2000}
                max={2100}
                value={anio}
                onChange={(e) => setAnio(Number(e.target.value))}
              />
            </div>

            <button type="submit" className="btn btn-primary neo-shadow" disabled={busy}>
              <span className="material-symbols-outlined">event_available</span>
              {busy ? "Cerrando…" : "Cerrar ciclo"}
            </button>
          </form>

          {error && (
            <div className="error-alert" style={{ marginTop: 20 }}>
              {error}
            </div>
          )}

          {result && (
            <div
              className="neo-shadow"
              style={{
                marginTop: 20,
                padding: "14px 18px",
                borderLeft: result.resultado === 1
                  ? "4px solid var(--secondary)"
                  : "4px solid var(--error)",
                background: "var(--surface-container)",
              }}
            >
              <p style={{ margin: 0, fontWeight: 700, marginBottom: 4 }}>
                {result.resultado === 1 ? "✓ Cierre exitoso" : "× Cierre rechazado"}
              </p>
              <p style={{ margin: 0, fontSize: "0.9rem", opacity: 0.85 }}>
                {result.mensaje}
              </p>
            </div>
          )}
        </section>
      </div>
    </Layout>
  );
}
