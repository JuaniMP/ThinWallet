import { useEffect, useRef, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useTransactions } from '../../context/TransactionContext';
import { categoryService } from '../../services/categoryService';
import { Layout } from '../../components/layout/Layout';
import type { Category } from '../../types';

const CAT_COLORS = ['var(--primary)', 'var(--tertiary-container)', 'var(--secondary-container)', 'var(--accent)'];

export function Dashboard() {
  const { transactions, saldoTotal, fetchTransactions, fetchSaldo } = useTransactions();
  const [categories, setCategories] = useState<Category[]>([]);
  const hasFetched = useRef(false);

  useEffect(() => {
    if (hasFetched.current) return;
    hasFetched.current = true;

    fetchTransactions();
    fetchSaldo();
    categoryService.getAll()
      .then(setCategories)
      .catch(() => setCategories([]));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const recentTransactions = transactions.slice(0, 5);

  const categoryBreakdown = useMemo(() => {
    const expenses = transactions.filter(t => t.type === 'expense');
    const total = expenses.reduce((s, t) => s + t.amount, 0);
    if (total === 0) return [];

    const map: Record<string, number> = {};
    expenses.forEach(t => {
      const key = t.categoryId || '0';
      map[key] = (map[key] || 0) + t.amount;
    });

    return Object.entries(map)
      .map(([key, amount]) => {
        const cat = categories.find(c => String(c.idCategoria) === key);
        return {
          name: cat?.nombre ?? (key === '0' ? 'Sin Categoría' : `Cat. ${key}`),
          percent: Math.round((amount / total) * 100),
        };
      })
      .sort((a, b) => b.percent - a.percent)
      .slice(0, 3);
  }, [transactions, categories]);

  const totalExpense = transactions
    .filter(t => t.type === 'expense')
    .reduce((s, t) => s + t.amount, 0);

  const totalIncome = transactions
    .filter(t => t.type === 'income')
    .reduce((s, t) => s + t.amount, 0);

  return (
    <Layout>
      <div className="dashboard">
        <div className="dashboard-main">
          <div className="balance-hero neo-shadow">
            <div style={{ position: 'relative', zIndex: 10 }}>
              <p className="label">SALDO TOTAL DISPONIBLE</p>
              <h2 className="amount">
                {saldoTotal.toLocaleString('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 })}
              </h2>
              <div className="actions">
                <Link to="/transactions/new" className="hero-btn accent" style={{ textDecoration: 'none' }}>
                  Transferir
                </Link>
                <Link to="/transactions/new" className="hero-btn outline" style={{ textDecoration: 'none' }}>
                  Añadir Fondos
                </Link>
              </div>
            </div>
            <div className="watermark">
              <span className="material-symbols-outlined">account_balance_wallet</span>
            </div>
          </div>

          <div className="bento-grid">
            <div className="bento-card bg-alert neo-shadow">
              <div className="card-header">
                <div>
                  <p className="card-alert-label">RESUMEN</p>
                  <h3>Total Gastos</h3>
                </div>
                <span className="material-symbols-outlined" style={{ color: 'var(--error)' }}>trending_down</span>
              </div>
              <p style={{ fontSize: '1.875rem', fontWeight: 700, color: 'var(--error)', marginBottom: '8px' }}>
                {totalExpense.toLocaleString('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 })}
              </p>
              <p style={{ fontSize: '0.75rem', color: 'var(--on-surface-variant)', lineHeight: 1.4, marginBottom: '16px' }}>
                {transactions.filter(t => t.type === 'expense').length} transacciones de gasto registradas
              </p>
              <div className="progress-bar">
                <div className="fill error" style={{ width: transactions.length > 0 ? `${Math.min(100, (transactions.filter(t => t.type === 'expense').length / transactions.length) * 100)}%` : '0%' }} />
              </div>
            </div>

            <div className="bento-card bg-coach neo-shadow">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                <span className="material-symbols-outlined" style={{ color: 'var(--primary)' }}>psychology</span>
                <h3 style={{ fontSize: '1.125rem' }}>Resumen</h3>
              </div>
              <p style={{ fontStyle: 'italic', fontSize: '0.875rem', color: 'var(--primary)', marginBottom: '16px', lineHeight: 1.6 }}>
                {transactions.length === 0
                  ? '"Registra tu primera transacción para comenzar a analizar tus finanzas."'
                  : `"${transactions.filter(t => t.type === 'income').length} ingresos (+${totalIncome.toLocaleString('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 })}) y ${transactions.filter(t => t.type === 'expense').length} gastos registrados."`}
              </p>
              <Link to="/reports" className="btn btn-secondary" style={{ fontSize: '0.75rem', padding: '8px', letterSpacing: '0.1em', textDecoration: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                Ver Reportes
              </Link>
            </div>
          </div>

          <div className="activity-section">
            <div className="section-header">
              <h3>Actividad Reciente</h3>
              <Link to="/transactions" style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', textDecoration: 'underline', textUnderlineOffset: '4px', textDecorationThickness: '2px' }}>
                Ver Todo
              </Link>
            </div>

            {recentTransactions.length === 0 ? (
              <p className="empty">No hay transacciones recientes. <Link to="/transactions/new" style={{ color: 'var(--primary)', fontWeight: 700 }}>Añadir primera</Link></p>
            ) : (
              <div>
                {recentTransactions.map((t) => (
                  <div key={t.id} className="transaction-row">
                    <div className="tx-left">
                      <div className={`tx-icon ${t.type === 'expense' ? 'error' : ''}`}>
                        <span className="material-symbols-outlined">
                          {t.type === 'income' ? 'payments' : 'shopping_bag'}
                        </span>
                      </div>
                      <div>
                        <p className="tx-name">{t.description}</p>
                        <p className="tx-date">{t.type === 'income' ? 'INGRESO' : 'GASTO'}</p>
                      </div>
                    </div>
                    <p className={`tx-amount ${t.type === 'expense' ? 'error' : ''}`}>
                      {t.type === 'income' ? '+' : '-'}
                      {t.amount.toLocaleString('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 })}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="dashboard-sidebar">
          <div className="categories-card neo-shadow">
            <h3>Categorías de Gasto</h3>
            {categoryBreakdown.length === 0 ? (
              <p style={{ fontSize: '0.75rem', color: 'var(--on-surface-variant)', fontStyle: 'italic' }}>
                Sin datos de gastos aún
              </p>
            ) : (
              categoryBreakdown.map((cat, i) => (
                <div key={cat.name} className="category-item">
                  <div className="category-label">
                    <span>{cat.name}</span>
                    <span>{cat.percent}%</span>
                  </div>
                  <div className="category-bar">
                    <div className="fill" style={{ width: `${cat.percent}%`, background: CAT_COLORS[i % CAT_COLORS.length] }} />
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="quick-actions-grid">
            <Link to="/transactions" className="quick-action-btn neo-shadow-sm" style={{ textDecoration: 'none', color: 'var(--primary)' }}>
              <span className="material-symbols-outlined">receipt_long</span>
              <span className="label">Transacciones</span>
            </Link>
            <Link to="/reports" className="quick-action-btn neo-shadow-sm" style={{ textDecoration: 'none', color: 'var(--primary)' }}>
              <span className="material-symbols-outlined">insert_chart</span>
              <span className="label">Reportes</span>
            </Link>
          </div>
        </div>
      </div>

      <Link to="/transactions/new" className="fab neo-shadow" style={{ textDecoration: 'none', color: 'var(--primary)' }}>
        <span className="material-symbols-outlined">add</span>
      </Link>
    </Layout>
  );
}
