import { Layout } from '../../components/layout/Layout';

const mockDebts = [
  { id: 1, from: 'Carlos M.', to: 'Ana G.', amount: '$45.00', type: 'liquida' },
  { id: 2, from: 'Tú', to: 'Luis P.', amount: '$120.00', type: 'liquida' },
  { id: 3, from: 'Elena R.', to: 'Ti', amount: '$85.50', type: 'recibe' },
  { id: 4, from: 'Sofía V.', to: 'Ana G.', amount: '$12.00', type: 'liquida' },
];

const mockTimeline = [
  { id: 1, title: 'Cena en Shibuya', payer: 'Ana G.', amount: '$210.00', time: 'Hace 2 horas', icon: 'restaurant', isPrimary: true },
  { id: 2, title: 'Japan Rail Pass', payer: 'Luis P.', amount: '$540.00', time: 'Ayer, 18:45', icon: 'train', isPrimary: false },
  { id: 3, title: 'Reserva Hotel Shinjuku', payer: 'Ti', amount: '$450.00', time: 'Ayer, 09:20', icon: 'hotel', isPrimary: false },
  { id: 4, title: 'Café Temático Gatos', payer: 'Elena R.', amount: '$50.00', time: '20 Oct, 16:30', icon: 'local_cafe', isPrimary: false, opacity: 0.6 },
];

export function Groups() {
  return (
    <Layout>
      <div className="groups-page">
        {/* Hero Section */}
        <section className="groups-hero">
          <div className="hero-main neo-shadow">
            <p className="hero-label">Círculo Activo</p>
            <h2 className="hero-title">VIAJE A TOKIO</h2>
            <div className="hero-meta">
              <span className="material-symbols-outlined">group</span>
              <span>8 Miembros</span>
            </div>
          </div>
          
          <div className="hero-balance neo-shadow">
            <p className="balance-label">Balance Total del Grupo</p>
            <p className="balance-amount">$1,250.00</p>
            <button className="btn btn-primary" style={{ marginTop: '24px', fontSize: '0.875rem' }}>
              Registrar Gasto
            </button>
          </div>
        </section>

        {/* Content Grid */}
        <div className="groups-content">
          {/* Matriz de Liquidación */}
          <div className="matriz-section">
            <div className="matriz-card neo-shadow bg-surface-container">
              <div className="matriz-header">
                <h3>Matriz de Liquidación</h3>
                <span className="header-tag">Debts & Credits</span>
              </div>
              
              <div className="matriz-grid">
                {mockDebts.map((item) => (
                  <div key={item.id} className="matriz-item bg-white neo-shadow-sm">
                    <div className="matriz-info">
                      <div className="avatar">
                        <span className="material-symbols-outlined">person</span>
                      </div>
                      <div>
                        <p className="name">{item.from}</p>
                        <p className="action">{item.type === 'liquida' ? 'le debe a' : 'te debe a'}</p>
                        <p className="name">{item.to}</p>
                      </div>
                    </div>
                    <div className="matriz-amount">
                      <p className={`amount ${item.type === 'liquida' ? 'error' : 'primary'}`}>{item.amount}</p>
                      <button className="action-btn">{item.type === 'liquida' ? 'Liquidar' : 'Recordar'}</button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Banner Image */}
              <div className="banner-img" style={{ marginTop: '32px' }}>
                <img 
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuDjQRQKkovzVe2KUFB-ASz4AwGN1d3FxcRSF1epfHFTRUHRlGkQtBucejMoP7lRIjmiNpmk6NllmxpMJllpvYzpy29Tue730f98DoBfO49MNPBOmP4sCxLIKkfjcSA-oxLU9F5HHhEiU38W_F2ssQGx7CPe0fdOpeNbf2V0gixlrJ80KpV58esygb2MiG9VoxzVKxCdHqzt5gdWOkwreQ-6EDq0r7t7M0OQCBlvaKZ6veLqVbK5Q12uyUi5gvQdj5iK_9o5o55IxjE" 
                  alt="Tokio Destination" 
                />
              </div>
            </div>
          </div>

          {/* Timeline Sidebar */}
          <div className="timeline-sidebar">
            <div className="timeline-card neo-shadow bg-surface-container-low">
              <h3 className="timeline-title">Actividad Reciente</h3>
              
              <div className="timeline-list">
                {mockTimeline.map((item) => (
                  <div key={item.id} className="timeline-item" style={{ opacity: item.opacity || 1 }}>
                    <div className={`timeline-icon ${item.isPrimary ? 'primary' : 'secondary'}`}>
                      <span className="material-symbols-outlined">{item.icon}</span>
                    </div>
                    <div className="timeline-content">
                      <p className="title">{item.title}</p>
                      <p className="payer">Pagado por {item.payer}</p>
                      <p className="amount">{item.amount}</p>
                      <p className="time">{item.time}</p>
                    </div>
                  </div>
                ))}
              </div>

              <button className="btn btn-secondary" style={{ marginTop: '32px', fontSize: '0.75rem' }}>
                Ver todo el historial
              </button>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
