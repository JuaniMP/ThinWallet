import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Layout } from '../../components/layout/Layout';
import { authService } from '../../services/authService';
import { transactionService } from '../../services/transactionService';
import type { User } from '../../types';

export function Profile() {
  const { user: authUser, logout } = useAuth();
  const [profileData, setProfileData] = useState<User | null>(authUser);
  const [saldo, setSaldo] = useState<number | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [loadingSaldo, setLoadingSaldo] = useState(true);

  useEffect(() => {
    if (!authUser?.idUsuario) {
      setLoadingProfile(false);
      setLoadingSaldo(false);
      return;
    }

    authService.getUserById(authUser.idUsuario)
      .then((data) => setProfileData(data))
      .catch(() => setProfileData(authUser))
      .finally(() => setLoadingProfile(false));

    transactionService.getSaldo(authUser.idUsuario)
      .then((res) => setSaldo(res.saldoTotal))
      .catch(() => setSaldo(null))
      .finally(() => setLoadingSaldo(false));
  }, [authUser?.idUsuario]);

  const fullName = profileData
    ? `${profileData.nombres} ${profileData.apellidos}`
    : 'Usuario';

  const initials = profileData
    ? profileData.nombres.charAt(0).toUpperCase()
    : 'U';

  const memberSince = profileData?.fechaRegistro
    ? new Date(profileData.fechaRegistro).toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'long',
      })
    : null;

  const saldoFormatted =
    saldo !== null
      ? saldo.toLocaleString('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 })
      : '—';

  const stats = [
    { label: 'Saldo Total', value: loadingSaldo ? '...' : saldoFormatted, bg: 'bg-high' },
    { label: 'Usuario', value: profileData?.nombreUsuario || '—', bg: 'bg-accent' },
    { label: 'Estado', value: profileData?.estado === 1 ? 'Activo' : '—', bg: 'bg-high' },
  ];

  const securityItems = [
    { label: 'Two-Factor Authentication', desc: 'Habilitado via Authenticator App', icon: 'check_circle' },
    { label: 'Compartir Datos', desc: 'Limitado a servicios esenciales', icon: 'toggle_on' },
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
              {loadingProfile ? '…' : initials}
            </div>
          </div>
          <div className="profile-info">
            {loadingProfile ? (
              <h2>Cargando...</h2>
            ) : (
              <>
                <h2>{fullName}</h2>
                <p className="email">{profileData?.correo || '—'}</p>
                {profileData?.descripcion && (
                  <p style={{ fontSize: '0.85rem', opacity: 0.75, marginTop: '4px' }}>
                    {profileData.descripcion}
                  </p>
                )}
                <div className="member-badge">
                  {memberSince ? `Miembro desde: ${memberSince}` : 'ThinWallet'}
                </div>
              </>
            )}
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
      </div>
    </Layout>
  );
}
