import { Layout } from '../../components/layout/Layout';

const mockPayables = [
  { id: '1', name: 'Alquiler Oficina Central', amount: 2500, dueDate: 'VENCE EN 2 DÍAS', urgent: true },
  { id: '2', name: 'Servicios de Cloud Computing', amount: 150, dueDate: '15 MAR 2024', urgent: false },
  { id: '3', name: 'Proveedores Logística', amount: 1600, dueDate: '18 MAR 2024', urgent: false },
];

const mockReceivables = [
  { id: '1', name: 'Elena Rodríguez', role: 'CONSULTORÍA UX', amount: 850, hasAvatar: true },
  { id: '2', name: 'TechCorp Inc.', role: 'PROYECTO Q1', amount: 1040.50, hasAvatar: false },
];

const mockHistory = [
  { id: '1', date: 'HOY 10:45 AM', title: 'Pago Recibido', desc: 'Proyecto Frontend - Juan Perez', amount: '+$450.00', isError: false },
  { id: '2', date: 'AYER 04:20 PM', title: 'Pago Realizado', desc: 'Suscripción SaaS Anual', amount: '-$1,200.00', isError: true },
  { id: '3', date: '8 MAR 2024', title: 'Pago Recibido', desc: 'Intereses Cuenta Ahorro', amount: '+$12.30', isError: false },
  { id: '4', date: '5 MAR 2024', title: 'Deuda Liquidada', desc: 'Préstamo Personal - Familiar', amount: '-$500.00', isError: false },
];

export function Debts() {
  return (
    <Layout>
      <div className="debts-page">
        {/* Page Header */}
        <section style={{ marginBottom: '48px' }}>
          <p className="page-label">Estado de Cuenta</p>
          <h2 className="page-title">Flujo de Deudas</h2>

          {/* Summary Cards */}
          <div className="debt-summary">
            <div className="summary-card bg-high neo-shadow">
              <div className="card-top">
                <span className="material-symbols-outlined">outbound</span>
                <span className="tag">Pendiente</span>
              </div>
              <h3>Cuentas por Pagar</h3>
              <p className="amount">$4,250.00</p>
            </div>
            <div className="summary-card bg-secondary neo-shadow">
              <div className="card-top">
                <span className="material-symbols-outlined">receipt_long</span>
                <span className="tag">Por Recibir</span>
              </div>
              <h3>Cuentas por Cobrar</h3>
              <p className="amount">$1,890.50</p>
            </div>
          </div>
        </section>

        {/* Main Content */}
        <div className="debts-content">
          {/* Left: Payables & Receivables */}
          <div className="debts-column">
            {/* Cuentas por Pagar */}
            <div>
              <div className="section-heading">
                <div className="accent-bar primary" />
                <h3>Cuentas por Pagar</h3>
              </div>
              <div className="debts-grid">
                {mockPayables.map((item) => (
                  <div key={item.id} className="debt-card">
                    <div className="card-date">
                      <span className={`date-badge ${item.urgent ? 'urgent' : 'normal'}`}>
                        {item.dueDate}
                      </span>
                      {item.urgent && (
                        <span className="material-symbols-outlined" style={{ color: 'var(--primary)' }}>priority_high</span>
                      )}
                    </div>
                    <h4>{item.name}</h4>
                    <p className="card-amount">${item.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
                    <button className="action-btn">Marcar como Pagado</button>
                  </div>
                ))}
              </div>
            </div>

            {/* Cuentas por Cobrar */}
            <div style={{ paddingTop: '32px' }}>
              <div className="section-heading">
                <div className="accent-bar secondary" />
                <h3>Cuentas por Cobrar</h3>
              </div>
              <div className="debts-grid">
                {mockReceivables.map((item) => (
                  <div key={item.id} className="receivable-card neo-shadow">
                    <div className="profile-row">
                      {item.hasAvatar ? (
                        <div style={{
                          width: 40, height: 40,
                          border: '2px solid var(--primary)',
                          background: 'var(--accent)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontWeight: 700, color: 'var(--primary)', fontSize: '0.875rem'
                        }}>
                          {item.name.charAt(0)}
                        </div>
                      ) : (
                        <div className="icon-placeholder">
                          <span className="material-symbols-outlined">corporate_fare</span>
                        </div>
                      )}
                      <div>
                        <h4>{item.name}</h4>
                        <p>{item.role}</p>
                      </div>
                    </div>
                    <p className="card-amount">${item.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
                    <button className="action-btn">Confirmar Recepción</button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right: History Sidebar */}
          <aside style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div className="history-card">
              <div className="card-header">
                <h3>Historial</h3>
                <span className="material-symbols-outlined">history</span>
              </div>
              <div>
                {mockHistory.map((item) => (
                  <div key={item.id} className={`history-item ${item.isError ? 'error' : ''}`}>
                    <p className="item-date">{item.date}</p>
                    <h5>{item.title}</h5>
                    <p className="item-desc">{item.desc}</p>
                    <p className="item-amount">{item.amount}</p>
                  </div>
                ))}
              </div>
              <button className="history-view-all">Ver Reporte Completo</button>
            </div>

            {/* Quick Action Card */}
            <div className="quick-action-card">
              <h4>¿Nueva Transacción?</h4>
              <p>Registra rápidamente cualquier entrada o salida para mantener tu Thin Wallet siempre al día.</p>
              <button className="neo-shadow">AÑADIR DEUDA</button>
            </div>
          </aside>
        </div>
      </div>
    </Layout>
  );
}
