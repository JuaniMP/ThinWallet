import { useEffect, useState, useMemo } from "react";
import { useAuth } from "../../context/AuthContext";
import { useTransactions } from "../../context/TransactionContext";
import { Layout } from "../../components/layout/Layout";
import { api } from "../../services/api";
import { reporteService } from "../../services/reporteService";

interface Categoria {
  idCategoria: number;
  nombre: string;
}

// ── SVG Donut chart: Ingresos vs Gastos ─────────────────────────────────────
function PieChart({
  income,
  expense,
  fmt,
}: {
  income: number;
  expense: number;
  fmt: (v: number) => string;
}) {
  const r = 60;
  const cx = 80;
  const cy = 80;
  const circ = 2 * Math.PI * r;
  const total = income + expense;

  if (total === 0) return <p className="empty">Sin transacciones registradas aún</p>;

  const incomeLen = (income / total) * circ;
  const expenseLen = (expense / total) * circ;
  const startOffset = circ / 4; // empieza en las 12 en punto
  const incomePct = Math.round((income / total) * 100);
  const expensePct = 100 - incomePct;
  const diff = Math.abs(incomePct - expensePct);
  const isPositive = income >= expense;

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 32,
        flexWrap: "wrap",
        justifyContent: "center",
        padding: "8px 0",
      }}
    >
      <svg width="160" height="160" viewBox="0 0 160 160">
        {/* Track de fondo */}
        <circle
          cx={cx}
          cy={cy}
          r={r}
          fill="none"
          stroke="var(--outline-variant)"
          strokeWidth="22"
        />
        {/* Segmento gastos */}
        {expenseLen > 0 && (
          <circle
            cx={cx}
            cy={cy}
            r={r}
            fill="none"
            stroke="#e53e3e"
            strokeWidth="22"
            strokeLinecap="butt"
            strokeDasharray={`${expenseLen} ${circ - expenseLen}`}
            strokeDashoffset={startOffset - incomeLen}
          />
        )}
        {/* Segmento ingresos */}
        {incomeLen > 0 && (
          <circle
            cx={cx}
            cy={cy}
            r={r}
            fill="none"
            stroke="#38a169"
            strokeWidth="22"
            strokeLinecap="butt"
            strokeDasharray={`${incomeLen} ${circ - incomeLen}`}
            strokeDashoffset={startOffset}
          />
        )}
        {/* Texto central */}
        <text
          x={cx}
          y={cy - 7}
          textAnchor="middle"
          fontSize="10"
          fill="var(--on-surface-variant)"
          fontFamily="var(--font-label, sans-serif)"
          fontWeight="600"
          letterSpacing="0.06em"
        >
          DIFERENCIA
        </text>
        <text
          x={cx}
          y={cy + 10}
          textAnchor="middle"
          fontSize="13"
          fill={isPositive ? "#38a169" : "#e53e3e"}
          fontWeight="700"
          fontFamily="var(--font-label, sans-serif)"
        >
          {isPositive ? "+" : "-"}{diff}%
        </text>
      </svg>

      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div
            style={{
              width: 14,
              height: 14,
              borderRadius: "50%",
              background: "#38a169",
              flexShrink: 0,
            }}
          />
          <div>
            <p style={{ margin: 0, fontSize: "0.72rem", color: "var(--on-surface-variant)", fontWeight: 600 }}>
              INGRESOS
            </p>
            <p style={{ margin: 0, fontWeight: 700, fontSize: "1rem" }}>
              {fmt(income)}{" "}
              <span style={{ color: "#38a169", fontSize: "0.8rem" }}>
                ({incomePct}%)
              </span>
            </p>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div
            style={{
              width: 14,
              height: 14,
              borderRadius: "50%",
              background: "#e53e3e",
              flexShrink: 0,
            }}
          />
          <div>
            <p style={{ margin: 0, fontSize: "0.72rem", color: "var(--on-surface-variant)", fontWeight: 600 }}>
              GASTOS
            </p>
            <p style={{ margin: 0, fontWeight: 700, fontSize: "1rem" }}>
              {fmt(expense)}{" "}
              <span style={{ color: "#e53e3e", fontSize: "0.8rem" }}>
                ({expensePct}%)
              </span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Histograma vertical: Por Categoría ──────────────────────────────────────
function Histogram({
  categoryData,
  fmt,
}: {
  categoryData: { nombre: string; income: number; expense: number; total: number }[];
  fmt: (v: number) => string;
}) {
  const top = categoryData.slice(0, 8);
  const maxVal = Math.max(...top.map((c) => Math.max(c.income, c.expense)), 1);
  const barH = 140;

  if (top.length === 0)
    return <p className="empty">Sin categorías registradas aún</p>;

  return (
    <div style={{ overflowX: "auto" }}>
      <div
        style={{
          display: "flex",
          alignItems: "flex-end",
          gap: 4,
          minWidth: top.length * 72,
          height: barH + 48,
          padding: "0 8px",
          borderBottom: "2px solid var(--outline-variant)",
        }}
      >
        {top.map((cat) => {
          const incH = Math.round((cat.income / maxVal) * barH);
          const expH = Math.round((cat.expense / maxVal) * barH);
          return (
            <div
              key={cat.nombre}
              style={{
                flex: 1,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                minWidth: 56,
              }}
            >
              {/* Barras */}
              <div
                style={{
                  display: "flex",
                  alignItems: "flex-end",
                  gap: 2,
                  height: barH,
                }}
              >
                <div
                  style={{
                    width: 18,
                    height: `${incH}px`,
                    background: "#38a169",
                    borderRadius: "3px 3px 0 0",
                    minHeight: cat.income > 0 ? 2 : 0,
                  }}
                  title={`Ingreso: ${fmt(cat.income)}`}
                />
                <div
                  style={{
                    width: 18,
                    height: `${expH}px`,
                    background: "#e53e3e",
                    borderRadius: "3px 3px 0 0",
                    minHeight: cat.expense > 0 ? 2 : 0,
                  }}
                  title={`Gasto: ${fmt(cat.expense)}`}
                />
              </div>
              {/* Etiqueta */}
              <p
                style={{
                  fontSize: "0.58rem",
                  textAlign: "center",
                  maxWidth: 60,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                  color: "var(--on-surface-variant)",
                  margin: "4px 0 0",
                  fontWeight: 600,
                  letterSpacing: "0.04em",
                }}
              >
                {cat.nombre.toUpperCase()}
              </p>
            </div>
          );
        })}
      </div>
      <div className="cat-legend" style={{ marginTop: 12 }}>
        <span className="legend-dot income-dot" /> Ingresos
        <span className="legend-dot expense-dot" /> Gastos
      </div>
    </div>
  );
}

// ── Toggle de visualización ──────────────────────────────────────────────────
function ChartToggle({
  options,
  value,
  onChange,
}: {
  options: { key: string; label: string; icon: string }[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div style={{ display: "flex", gap: 4 }}>
      {options.map((o) => (
        <button
          key={o.key}
          onClick={() => onChange(o.key)}
          title={o.label}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 4,
            padding: "4px 10px",
            fontSize: "0.72rem",
            fontWeight: 700,
            letterSpacing: "0.06em",
            border: "2px solid var(--primary)",
            borderRadius: 4,
            cursor: "pointer",
            background: value === o.key ? "var(--primary)" : "transparent",
            color: value === o.key ? "var(--background)" : "var(--primary)",
            transition: "background 0.15s, color 0.15s",
          }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: "0.9rem" }}>
            {o.icon}
          </span>
          {o.label}
        </button>
      ))}
    </div>
  );
}

// ── Componente principal ─────────────────────────────────────────────────────
export function Reports() {
  const { user } = useAuth();
  const { transactions, fetchTransactions, isLoading } = useTransactions();
  const [categories, setCategories] = useState<Categoria[]>([]);
  const [catLoading, setCatLoading] = useState(true);
  const [downloading, setDownloading] = useState<"pdf" | "csv" | null>(null);

  // Tipo de gráfica para cada sección
  const [incExpChart, setIncExpChart] = useState<"bars" | "pie">("bars");
  const [catChart, setCatChart] = useState<"bars" | "histogram">("bars");

  const handleDownloadPdf = async () => {
    if (!user?.idUsuario) return;
    setDownloading("pdf");
    try {
      await reporteService.descargarPdf(user.idUsuario);
    } catch {
      /* ignore */
    } finally {
      setDownloading(null);
    }
  };

  const handleDownloadCsv = async () => {
    if (!user?.idUsuario) return;
    setDownloading("csv");
    try {
      await reporteService.descargarCsv(user.idUsuario);
    } catch {
      /* ignore */
    } finally {
      setDownloading(null);
    }
  };

  useEffect(() => {
    if (user?.idUsuario) fetchTransactions();
    api
      .get<Categoria[]>("/categorias")
      .then((res) => setCategories(Array.isArray(res) ? res : []))
      .catch(() => {})
      .finally(() => setCatLoading(false));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const metrics = useMemo(() => {
    const income = transactions
      .filter((t) => t.type === "income")
      .reduce((s, t) => s + t.amount, 0);
    const expense = transactions
      .filter((t) => t.type === "expense")
      .reduce((s, t) => s + t.amount, 0);
    return {
      income,
      expense,
      balance: income - expense,
      total: transactions.length,
    };
  }, [transactions]);

  const categoryData = useMemo(() => {
    const map: Record<
      string,
      { nombre: string; income: number; expense: number }
    > = {};
    transactions.forEach((t) => {
      const key = t.categoryId || "0";
      const cat = categories.find((c) => String(c.idCategoria) === key);
      const nombre =
        cat?.nombre ?? (key === "0" ? "Sin Categoría" : `Categoría ${key}`);
      if (!map[key]) map[key] = { nombre, income: 0, expense: 0 };
      if (t.type === "income") map[key].income += t.amount;
      else map[key].expense += t.amount;
    });
    return Object.values(map)
      .map((v) => ({ ...v, total: v.income + v.expense }))
      .sort((a, b) => b.total - a.total);
  }, [transactions, categories]);

  const paymentData = useMemo(() => {
    const cash = transactions.filter((t) => t.idTipoMovimiento === 1).length;
    const card = transactions.filter((t) => t.idTipoMovimiento !== 1).length;
    return { cash, card, total: transactions.length };
  }, [transactions]);

  const fmt = (v: number) =>
    v.toLocaleString("es-CO", {
      style: "currency",
      currency: "COP",
      maximumFractionDigits: 0,
    });

  const maxBar = Math.max(metrics.income, metrics.expense, 1);
  const maxCat = Math.max(
    ...(categoryData.length > 0 ? categoryData.map((c) => c.total) : [1]),
  );

  const loading = isLoading || catLoading;

  return (
    <Layout>
      <div className="reports-page">
        <div className="reports-header">
          <div>
            <p className="page-label">Análisis Financiero</p>
            <h2 className="page-title">REPORTES</h2>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button
              className="btn-secondary"
              onClick={() => void handleDownloadCsv()}
              disabled={downloading === "csv"}
              title="Exportar CSV"
            >
              <span className="material-symbols-outlined">download</span>
              {downloading === "csv" ? "Exportando..." : "CSV"}
            </button>
            <button
              className="btn-primary"
              onClick={() => void handleDownloadPdf()}
              disabled={downloading === "pdf"}
              title="Exportar PDF"
            >
              <span className="material-symbols-outlined">picture_as_pdf</span>
              {downloading === "pdf" ? "Generando..." : "PDF"}
            </button>
          </div>
        </div>

        {loading ? (
          <div className="loading">Cargando datos...</div>
        ) : (
          <>
            {/* Summary cards */}
            <div className="reports-summary">
              <div className="report-card rc-income neo-shadow">
                <span className="material-symbols-outlined">trending_up</span>
                <p className="rc-label">Ingresos Totales</p>
                <p className="rc-value">{fmt(metrics.income)}</p>
              </div>
              <div className="report-card rc-expense neo-shadow">
                <span className="material-symbols-outlined">trending_down</span>
                <p className="rc-label">Gastos Totales</p>
                <p className="rc-value">{fmt(metrics.expense)}</p>
              </div>
              <div
                className={`report-card neo-shadow ${metrics.balance >= 0 ? "rc-balance-pos" : "rc-balance-neg"}`}
              >
                <span className="material-symbols-outlined">
                  account_balance_wallet
                </span>
                <p className="rc-label">Saldo Neto</p>
                <p className="rc-value">{fmt(metrics.balance)}</p>
              </div>
              <div className="report-card rc-count neo-shadow">
                <span className="material-symbols-outlined">receipt_long</span>
                <p className="rc-label">Transacciones</p>
                <p className="rc-value">{metrics.total}</p>
              </div>
            </div>

            {/* Income vs Expense */}
            <div className="report-section neo-shadow">
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: 16,
                  flexWrap: "wrap",
                  gap: 8,
                }}
              >
                <h4 style={{ margin: 0 }}>Ingresos vs Gastos</h4>
                <ChartToggle
                  options={[
                    { key: "bars", label: "Barras", icon: "bar_chart" },
                    { key: "pie", label: "Torta", icon: "donut_large" },
                  ]}
                  value={incExpChart}
                  onChange={(v) => setIncExpChart(v as "bars" | "pie")}
                />
              </div>

              {transactions.length === 0 ? (
                <p className="empty">Sin transacciones registradas aún</p>
              ) : incExpChart === "bars" ? (
                <div className="bar-chart">
                  <div className="chart-y-axis">
                    <span>{fmt(maxBar)}</span>
                    <span>{fmt(maxBar / 2)}</span>
                    <span>$0</span>
                  </div>
                  <div className="chart-bars">
                    <div className="chart-column">
                      <div className="chart-bar-wrap">
                        <div
                          className="chart-bar income-bar"
                          style={{
                            height: `${(metrics.income / maxBar) * 180}px`,
                          }}
                        />
                      </div>
                      <p className="chart-label">Ingresos</p>
                      <p className="chart-sublabel income">
                        {fmt(metrics.income)}
                      </p>
                    </div>
                    <div className="chart-column">
                      <div className="chart-bar-wrap">
                        <div
                          className="chart-bar expense-bar"
                          style={{
                            height: `${(metrics.expense / maxBar) * 180}px`,
                          }}
                        />
                      </div>
                      <p className="chart-label">Gastos</p>
                      <p className="chart-sublabel expense">
                        {fmt(metrics.expense)}
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <PieChart
                  income={metrics.income}
                  expense={metrics.expense}
                  fmt={fmt}
                />
              )}
            </div>

            {/* Category breakdown */}
            {categoryData.length > 0 && (
              <div className="report-section neo-shadow">
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: 16,
                    flexWrap: "wrap",
                    gap: 8,
                  }}
                >
                  <h4 style={{ margin: 0 }}>Por Categoría</h4>
                  <ChartToggle
                    options={[
                      { key: "bars", label: "Barras", icon: "align_justify_flex_start" },
                      { key: "histogram", label: "Histograma", icon: "stacked_bar_chart" },
                    ]}
                    value={catChart}
                    onChange={(v) => setCatChart(v as "bars" | "histogram")}
                  />
                </div>

                {catChart === "bars" ? (
                  <div className="cat-breakdown">
                    {categoryData.map((cat) => (
                      <div key={cat.nombre} className="cat-row">
                        <p className="cat-name">{cat.nombre.toUpperCase()}</p>
                        <div className="cat-bars-group">
                          {cat.income > 0 && (
                            <div className="cat-bar-line">
                              <div
                                className="cat-bar-fill income-fill"
                                style={{
                                  width: `${(cat.income / maxCat) * 100}%`,
                                }}
                              />
                              <span className="cat-bar-amt income">
                                {fmt(cat.income)}
                              </span>
                            </div>
                          )}
                          {cat.expense > 0 && (
                            <div className="cat-bar-line">
                              <div
                                className="cat-bar-fill expense-fill"
                                style={{
                                  width: `${(cat.expense / maxCat) * 100}%`,
                                }}
                              />
                              <span className="cat-bar-amt expense">
                                {fmt(cat.expense)}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                    <div className="cat-legend">
                      <span className="legend-dot income-dot" /> Ingresos
                      <span className="legend-dot expense-dot" /> Gastos
                    </div>
                  </div>
                ) : (
                  <Histogram categoryData={categoryData} fmt={fmt} />
                )}
              </div>
            )}

            {/* Payment method */}
            {paymentData.total > 0 && (
              <div className="report-section neo-shadow">
                <h4>Método de Pago</h4>
                <div className="payment-chart">
                  <div className="payment-track">
                    {paymentData.cash > 0 && (
                      <div
                        className="payment-seg cash-seg"
                        style={{
                          width: `${(paymentData.cash / paymentData.total) * 100}%`,
                        }}
                      />
                    )}
                    {paymentData.card > 0 && (
                      <div
                        className="payment-seg card-seg"
                        style={{
                          width: `${(paymentData.card / paymentData.total) * 100}%`,
                        }}
                      />
                    )}
                  </div>
                  <div className="payment-legend">
                    <div className="payment-item">
                      <span className="material-symbols-outlined">payments</span>
                      <div>
                        <p className="pm-label">Efectivo</p>
                        <p className="pm-value">
                          {paymentData.cash} transacciones
                        </p>
                      </div>
                      <p className="pm-pct">
                        {paymentData.total > 0
                          ? Math.round(
                              (paymentData.cash / paymentData.total) * 100,
                            )
                          : 0}
                        %
                      </p>
                    </div>
                    <div className="payment-item">
                      <span className="material-symbols-outlined">credit_card</span>
                      <div>
                        <p className="pm-label">Tarjeta</p>
                        <p className="pm-value">
                          {paymentData.card} transacciones
                        </p>
                      </div>
                      <p className="pm-pct">
                        {paymentData.total > 0
                          ? Math.round(
                              (paymentData.card / paymentData.total) * 100,
                            )
                          : 0}
                        %
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </Layout>
  );
}
