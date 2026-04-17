import { type ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const { user } = useAuth();
  const location = useLocation();

  const navItems = [
    { path: '/dashboard', icon: 'home', label: 'INICIO' },
    { path: '/grupos', icon: 'group', label: 'GRUPOS' },
    { path: '/transactions/new', icon: 'add_box', label: 'AÑADIR' },
    { path: '/debts', icon: 'insert_chart', label: 'REPORTES' },
    { path: '/profile', icon: 'person', label: 'PERFIL' },
  ];


  return (
    <div className="app">
      {/* TopAppBar */}
      <header className="top-app-bar">
        <div className="brand">
          <div className="avatar">
            <div style={{
              width: '100%',
              height: '100%',
              background: 'var(--accent)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 700,
              color: 'var(--primary)',
              fontSize: '1rem'
            }}>
< dev-frontend
              {user?.nombres?.charAt(0)?.toUpperCase() || 'U'}

              {user?.name?.charAt(0)?.toUpperCase() || 'U'}
 main
            </div>
          </div>
          <h1>THIN WALLET</h1>
        </div>
        <div className="actions">
          <button className="icon-btn">
            <span className="material-symbols-outlined">notifications</span>
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main>{children}</main>

      {/* Bottom Nav Bar */}
      <nav className="bottom-nav">
        {navItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className={location.pathname === item.path ? 'active' : ''}
          >
            <span className="material-symbols-outlined">{item.icon}</span>
            <span className="nav-label">{item.label}</span>
          </Link>
        ))}
      </nav>
    </div>
  );
}