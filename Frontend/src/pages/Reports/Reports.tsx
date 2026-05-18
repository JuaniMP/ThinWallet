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

export function Reports() {
  const { user } = useAuth();
  const { transactions, fetchTransactions, isLoading } = useTransactions();
  const [categories, setCategories] = useState<Categoria[]>([]);
  const [catLoading, setCatLoading] = useState(true);
  const [downloading, setDownloading] = useState<"pdf" | "csv" | null>(null);

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
              <h4>Ingresos vs Gastos</h4>
              {transactions.length === 0 ? (
                <p className="empty">Sin transacciones registradas aún</p>
              ) : (
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
              )}
            </div>

            {/* Category breakdown */}
            {categoryData.length > 0 && (
              <div className="report-section neo-shadow">
                <h4>Por Categoría</h4>
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
                      <span className="material-symbols-outlined">
                        payments
                      </span>
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
                      <span className="material-symbols-outlined">
                        credit_card
                      </span>
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
