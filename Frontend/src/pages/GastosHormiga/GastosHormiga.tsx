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

  const load = async (u = umbral, d = dias) => {
    if (!user?.idUsuario) return;
    setLoading(true);
    setError("");
    try {
      const res = await gastosHormigaService.getByUsuario(
        user.idUsuario,
        u,
        d,
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
            <p className="page-label">Análisis de Gastos</p>
            <h2 className="page-title">GASTOS HORMIGA</h2>
          </div>
        </div>

        <div className="neo-shadow" style={{ padding: 20, marginBottom: 24 }}>
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
              onBlur={() => void load(umbral, dias)}
              placeholder="Ej: 50,000"
            />
            <div className="input-group">
              <label htmlFor="dias-select">Período de análisis</label>
              <select
                id="dias-select"
                value={dias}
                onChange={(e) => {
                  const d = Number(e.target.value);
                  setDias(d);
                  void load(umbral, d);
                }}
              >
                <option value={7}>Última semana (7 días)</option>
                <option value={15}>Últimas 2 semanas (15 días)</option>
                <option value={30}>Último mes (30 días)</option>
                <option value={60}>Últimos 2 meses (60 días)</option>
                <option value={90}>Últimos 3 meses (90 días)</option>
                <option value={180}>Últimos 6 meses (180 días)</option>
                <option value={365}>Último año (365 días)</option>
              </select>
            </div>
            <button
              className="btn-primary"
              onClick={() => void load(umbral, dias)}
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
