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
      <div className="page-container">
        <div className="page-header">
          <div>
            <p className="page-label">RF-15 — Administración de círculos</p>
            <h2 className="page-title">CIERRE DE CICLO MENSUAL</h2>
          </div>
        </div>

        <div className="neo-shadow" style={{ padding: 20 }}>
          <p style={{ marginBottom: 16, color: "var(--on-surface-variant)" }}>
            Cierra el periodo del círculo seleccionado. Se valida que no haya
            deudas pendientes y se registra el cierre en la auditoría.
          </p>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "2fr 1fr 1fr auto",
              gap: 16,
              alignItems: "end",
            }}
          >
            <label>
              Círculo
              <select
                value={idCirculo}
                onChange={(e) =>
                  setIdCirculo(e.target.value ? Number(e.target.value) : "")
                }
                style={{ width: "100%" }}
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
            </label>
            <label>
              Mes
              <select
                value={mes}
                onChange={(e) => setMes(Number(e.target.value))}
                style={{ width: "100%" }}
              >
                {MESES.map((m, i) => (
                  <option key={m} value={i + 1}>
                    {m}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Año
              <input
                type="number"
                min={2000}
                max={2100}
                value={anio}
                onChange={(e) => setAnio(Number(e.target.value))}
              />
            </label>
            <button
              className="btn-primary"
              onClick={() => void ejecutar()}
              disabled={busy}
            >
              {busy ? "Cerrando…" : "Cerrar Ciclo"}
            </button>
          </div>

          {error && (
            <p className="error-msg" style={{ marginTop: 16 }}>
              {error}
            </p>
          )}

          {result && (
            <div
              className="neo-shadow-sm"
              style={{
                marginTop: 24,
                padding: 16,
                background:
                  result.resultado === 1
                    ? "var(--success-container, #d4f7d4)"
                    : "var(--error-container, #ffd6d6)",
              }}
            >
              <p style={{ fontWeight: 700, marginBottom: 4 }}>
                {result.resultado === 1
                  ? "✓ Cierre exitoso"
                  : "× Cierre rechazado"}
              </p>
              <p style={{ fontSize: 14 }}>{result.mensaje}</p>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
