import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTransactions } from '../../context/TransactionContext';
import { Layout } from '../../components/layout/Layout';

export function Dashboard() {
  const { user } = useAuth();
  const { transactions, balance, fetchTransactions, fetchBalance } = useTransactions();

  useEffect(() => {
    fetchTransactions({ limit: 5 });
    fetchBalance();
  }, []);

  const recentTransactions = transactions.slice(0, 5);
  const totalBalance = balance ? balance.totalIncome - balance.totalExpense : 0;

  const mockCategories = [
    { name: 'Vivienda', percent: 45, color: 'primary' },
    { name: 'Alimentación', percent: 20, color: 'tertiary' },
    { name: 'Ocio', percent: 15, color: 'secondary' },
  ];

  return (
    <Layout>
      <div className="dashboard">
        {/* Main Column */}
        <div className="dashboard-main">
          {/* Hero Balance Banner */}
          <div className="balance-hero neo-shadow">
            <div style={{ position: 'relative', zIndex: 10 }}>
              <p className="label">SALDO TOTAL DISPONIBLE</p>
              <h2 className="amount">${totalBalance.toLocaleString('en-US', { minimumFractionDigits: 2 })}</h2>
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

          {/* Bento Grid */}
          <div className="bento-grid">
            {/* Gastos Hormiga */}
            <div className="bento-card bg-alert neo-shadow">
              <div className="card-header">
                <div>
                  <p className="card-alert-label">ALERTA CRÍTICA</p>
                  <h3>Gastos Hormiga</h3>
                </div>
                <span className="material-symbols-outlined" style={{ color: 'var(--error)' }}>bug_report</span>
              </div>
              <p style={{ fontSize: '1.875rem', fontWeight: 700, color: 'var(--error)', marginBottom: '8px' }}>$142.50</p>
              <p style={{ fontSize: '0.75rem', color: 'var(--on-surface-variant)', lineHeight: 1.4, marginBottom: '16px' }}>
                Has gastado más en café y snacks esta semana que el mes pasado.
              </p>
              <div className="progress-bar">
                <div className="fill error" style={{ width: '75%' }} />
              </div>
            </div>

            {/* Coach Financiero */}
            <div className="bento-card bg-coach neo-shadow">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                <span className="material-symbols-outlined" style={{ color: 'var(--primary)' }}>psychology</span>
                <h3 style={{ fontSize: '1.125rem' }}>FinCoach</h3>
              </div>
              <p style={{ fontStyle: 'italic', fontSize: '0.875rem', color: 'var(--primary)', marginBottom: '16px', lineHeight: 1.6 }}>
                "Si reduces tus suscripciones activas hoy, podrías ahorrar $45.00 extra para tu fondo de retiro este mes."
              </p>
              <button className="btn btn-secondary" style={{ fontSize: '0.75rem', padding: '8px', letterSpacing: '0.1em' }}>
                Ver Recomendaciones
              </button>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="activity-section">
            <div className="section-header">
              <h3>Actividad Reciente</h3>
              <Link to="/transactions" style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', textDecoration: 'underline', textUnderlineOffset: '4px', textDecorationThickness: '2px' }}>
                Ver Todo
              </Link>
            </div>

            {recentTransactions.length === 0 ? (
              <p className="empty">No hay transacciones recientes</p>
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
                        <p className={`tx-date ${t.type === 'expense' ? '' : ''}`}>
                          {new Date(t.date).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' }).toUpperCase()}
                        </p>
                      </div>
                    </div>
                    <p className={`tx-amount ${t.type === 'expense' ? 'error' : ''}`}>
                      {t.type === 'income' ? '+' : '-'}${t.amount.toFixed(2)}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="dashboard-sidebar">
          {/* Categories */}
          <div className="categories-card neo-shadow">
            <h3>Categorías</h3>
            {mockCategories.map((cat) => (
              <div key={cat.name} className="category-item">
                <div className="category-label">
                  <span>{cat.name}</span>
                  <span>{cat.percent}%</span>
                </div>
                <div className="category-bar">
                  <div className={`fill`} style={{ width: `${cat.percent}%`, background: `var(--${cat.color})` }} />
                </div>
              </div>
            ))}
          </div>

          {/* Quick Actions */}
          <div className="quick-actions-grid">
            <Link to="/transactions" className="quick-action-btn neo-shadow-sm" style={{ textDecoration: 'none', color: 'var(--primary)' }}>
              <span className="material-symbols-outlined">receipt_long</span>
              <span className="label">Facturas</span>
            </Link>
            <Link to="/debts" className="quick-action-btn neo-shadow-sm" style={{ textDecoration: 'none', color: 'var(--primary)' }}>
              <span className="material-symbols-outlined">savings</span>
              <span className="label">Ahorros</span>
            </Link>
          </div>
        </div>
      </div>

      {/* FAB (Desktop only) */}
      <Link to="/transactions/new" className="fab neo-shadow" style={{ textDecoration: 'none', color: 'var(--primary)' }}>
        <span className="material-symbols-outlined">add</span>
      </Link>
    </Layout>
  );
}
