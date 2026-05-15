import { useEffect, useState } from "react";
import { Layout } from "../../components/layout/Layout";
import { useAuth } from "../../context/AuthContext";
import { useCurrency } from "../../context/CurrencyContext";
import { MoneyInput } from "../../components/common/MoneyInput";
import {
  gastosHormigaService,
  type GastosHormigaResponse,
} from "../../services/gastosHormigaService";

export function GastosHormiga() {
  const { user } = useAuth();
  const { format: fmt } = useCurrency();
  const [umbral, setUmbral] = useState<number>(20000);
  const [dias, setDias] = useState<number>(30);
  const [data, setData] = useState<GastosHormigaResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const load = async () => {
    if (!user?.idUsuario) return;
    setLoading(true);
    setError("");
    try {
      const res = await gastosHormigaService.getByUsuario(
        user.idUsuario,
        umbral,
        dias,
      );
      setData(res);
    } catch {
      setError("No fue posible cargar los gastos hormiga.");
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.idUsuario]);

  const promedio =
    data && data.cantidad > 0 ? data.totalGastado / data.cantidad : 0;

  return (
    <Layout>
      <div className="page-container">
        <div className="page-header">
          <div>
            <p className="page-label">RF-10 — Detección de micro-gastos</p>
            <h2 className="page-title">GASTOS HORMIGA</h2>
          </div>
        </div>

        <div className="neo-shadow" style={{ padding: 16, marginBottom: 24 }}>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr auto",
              gap: 16,
              alignItems: "end",
            }}
          >
            <MoneyInput
              label="Umbral por transacción (COP)"
              name="umbral"
              value={umbral}
              onChange={(v) => setUmbral(v)}
              placeholder="Ej: 20,000"
            />
            <label>
              Días a considerar
              <input
                type="number"
                min={1}
                max={365}
                value={dias}
                onChange={(e) => setDias(Number(e.target.value) || 0)}
                style={{ width: "100%" }}
              />
            </label>
            <button
              className="btn-primary"
              onClick={() => void load()}
              disabled={loading}
            >
              {loading ? "Cargando…" : "Analizar"}
            </button>
          </div>
          {error && <p className="error-msg">{error}</p>}
        </div>

        <div
          className="bento-grid"
          style={{ gridTemplateColumns: "repeat(3,1fr)", gap: 16 }}
        >
          <div className="bento-card neo-shadow">
            <p className="card-alert-label">CANTIDAD</p>
            <h3 style={{ fontSize: "2rem", marginTop: 8 }}>
              {data?.cantidad ?? 0}
            </h3>
            <p style={{ fontSize: 12, color: "var(--on-surface-variant)" }}>
              micro-gastos detectados
            </p>
          </div>
          <div className="bento-card neo-shadow">
            <p className="card-alert-label">TOTAL ACUMULADO</p>
            <h3
              style={{
                fontSize: "1.5rem",
                marginTop: 8,
                color: "var(--error)",
              }}
            >
              {fmt(data?.totalGastado ?? 0, "COP")}
            </h3>
            <p style={{ fontSize: 12, color: "var(--on-surface-variant)" }}>
              dinero erosionado en gastos pequeños
            </p>
          </div>
          <div className="bento-card neo-shadow">
            <p className="card-alert-label">PROMEDIO</p>
            <h3 style={{ fontSize: "1.5rem", marginTop: 8 }}>{fmt(promedio, "COP")}</h3>
            <p style={{ fontSize: 12, color: "var(--on-surface-variant)" }}>
              por transacción hormiga
            </p>
          </div>
        </div>

        <div className="activity-section" style={{ marginTop: 24 }}>
          <div className="section-header">
            <h3>Detalle de micro-gastos</h3>
          </div>
          {loading ? (
            <div className="loading">Analizando…</div>
          ) : !data || data.transacciones.length === 0 ? (
            <p className="empty">
              No se detectaron gastos hormiga bajo este umbral.
            </p>
          ) : (
            <div>
              {data.transacciones.map((t) => (
                <div key={t.idTransaccion} className="transaction-row">
                  <div className="tx-left">
                    <div className="tx-icon error">
                      <span className="material-symbols-outlined">
                        pest_control
                      </span>
                    </div>
                    <div>
                      <p className="tx-name">{t.nombre}</p>
                      <p className="tx-date">
                        {t.tipoMovimiento ?? "GASTO"} ·{" "}
                        {t.tipoCategoria ?? "Sin categoría"}
                      </p>
                    </div>
                  </div>
                  <p className="tx-amount error">
                    -{fmt(Number(t.montoOriginal ?? 0), "COP")}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
