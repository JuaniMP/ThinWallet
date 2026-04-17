import { useAuth } from '../../context/AuthContext';
import { Layout } from '../../components/layout/Layout';

export function Profile() {
  const { user, logout } = useAuth();

  const stats = [
    { label: 'Total Assets', value: '$24,500.00', bg: 'bg-high' },
    { label: 'Savings Goal', value: '82%', bg: 'bg-accent' },
    { label: 'Active Cards', value: '04', bg: 'bg-high' },
  ];

  const securityItems = [
    { label: 'Two-Factor Authentication', desc: 'Habilitado via Authenticator App', icon: 'check_circle' },
    { label: 'Compartir Datos', desc: 'Limitado a servicios esenciales', icon: 'toggle_on' },
  ];

  const activityItems = [
    { name: 'RETAIL_PURCHASE_049', date: 'Ayer, 14:20', amount: '-$120.50', icon: 'shopping_bag' },
    { name: 'DIVIDEND_INCOME', date: 'Oct 12, 09:00', amount: '+$45.00', icon: 'payments' },
  ];

  return (
    <Layout>
      <div className="profile-page">
        {/* Hero Profile */}
        <div className="profile-hero neo-shadow">
          <div className="profile-avatar">
            <div style={{
              width: '100%', height: '100%',
              background: 'var(--accent)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontWeight: 900, color: 'var(--primary)', fontSize: '3rem',
              fontFamily: 'var(--font-headline)'
            }}>
              {user?.name?.charAt(0)?.toUpperCase() || 'U'}
            </div>
          </div>
          <div className="profile-info">
            <h2>{user?.name || 'Usuario'}</h2>
            <p className="email">{user?.email || 'email@ejemplo.com'}</p>
            <div className="member-badge">
              Miembro desde: Enero 2024
            </div>
          </div>
          <div className="profile-actions">
            <button className="btn btn-primary neo-shadow-hover neo-shadow-active" style={{ fontSize: '0.875rem' }}>
              Editar Perfil
            </button>
            <button className="btn btn-secondary" style={{ fontSize: '0.875rem' }} onClick={logout}>
              Cerrar Sesión
            </button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="stats-grid">
          {stats.map((stat) => (
            <div key={stat.label} className={`stat-card ${stat.bg} neo-shadow`}>
              <p className="stat-label">{stat.label}</p>
              <h3 className="stat-value">{stat.value}</h3>
            </div>
          ))}
        </div>

        {/* Security Section */}
        <div className="profile-section bg-white">
          <h4>Seguridad & Privacidad</h4>
          {securityItems.map((item) => (
            <div key={item.label} className="section-row">
              <div>
                <p className="row-label">{item.label}</p>
                <p className="row-desc">{item.desc}</p>
              </div>
              <span className="material-symbols-outlined" style={{ color: 'var(--primary)' }}>{item.icon}</span>
            </div>
          ))}
        </div>

        {/* Archived Activity */}
        <div className="profile-section bg-accent">
          <h4>Actividad Archivada</h4>
          {activityItems.map((item) => (
            <div key={item.name} className="activity-item">
              <div className="activity-icon">
                <span className="material-symbols-outlined" style={{ color: 'var(--primary)' }}>{item.icon}</span>
              </div>
              <div className="activity-info">
                <p className="activity-name">{item.name}</p>
                <p className="activity-date">{item.date}</p>
              </div>
              <p className="activity-amount">{item.amount}</p>
            </div>
          ))}
          <button className="btn btn-secondary" style={{ marginTop: '24px', fontSize: '0.75rem', letterSpacing: '0.1em' }}>
            Ver Archivo Completo
          </button>
        </div>
      </div>
    </Layout>
  );
}
