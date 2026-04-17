import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';

export function Login() {
  const [correo, setCorreo] = useState('');
  const [contrasena, setContrasena] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const { login, setRegistrationEmail } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      await login({ correo, contrasena });
      navigate('/dashboard');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al iniciar sesión';
      setError(errorMessage);
      
      // If error message indicates account not verified, redirect to /verify
      if (errorMessage.toLowerCase().includes('verificar') || errorMessage.toLowerCase().includes('verify')) {
        setRegistrationEmail(correo);
        setTimeout(() => navigate('/verify'), 1500);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-page">
      {/* Grid Overlay */}
      <div className="grid-overlay" />

      <main style={{ width: '100%', maxWidth: '448px', position: 'relative', zIndex: 1 }}>
        {/* Brand Identity */}
        <div className="auth-brand">
          <h1>THIN WALLET</h1>
          <p>The Botanical Archivist / Finanzas</p>
        </div>

        {/* Login Card */}
        <div className="auth-card neo-shadow">
          <h2>Acceso Archivista</h2>
          
          {error && <div className="error-alert">{error}</div>}
          
          <form onSubmit={handleSubmit}>
            <Input
              label="Correo Electrónico"
              type="email"
              name="correo"
              icon="person"
              placeholder="nombre@archivo.com"
              value={correo}
              onChange={(e) => setCorreo(e.target.value)}
              required
            />
            
            <Input
              label="Contraseña"
              type="password"
              name="contrasena"
              icon="lock"
              placeholder="••••••••"
              value={contrasena}
              onChange={(e) => setContrasena(e.target.value)}
              required
            />
            
            <Button type="submit" isLoading={isLoading} icon="arrow_right_alt">
              Iniciar Sesión
            </Button>
          </form>

          <div style={{ marginTop: '32px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Token button */}
            <button className="btn btn-secondary" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
              <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>key</span>
              Entrar con Token
            </button>

            {/* Links */}
            <div className="auth-links-row">
              <Link to="/forgot-password" size="small" className="auth-links" style={{ fontSize: '0.75rem', fontWeight: 700, textDecoration: 'underline', textDecorationThickness: '2px', textUnderlineOffset: '4px', padding: '2px 4px' }}>
                ¿Olvidó contraseña?
              </Link>
              <Link to="/register" size="small" className="auth-links" style={{ fontSize: '0.75rem', fontWeight: 700, textDecoration: 'underline', textDecorationThickness: '2px', textUnderlineOffset: '4px', padding: '2px 4px' }}>
                Crear Cuenta
              </Link>
            </div>
          </div>
        </div>

        {/* Footer / Editorial Note */}
        <div className="auth-footer">
          <div className="auth-footer-divider">
            <div className="line" />
            <span className="material-symbols-outlined" style={{ color: 'var(--primary)' }}>eco</span>
            <div className="line" />
          </div>
          <p>
            Diseñado para el minimalismo financiero.<br />
            Edición Neo-Brutalista 2024.
          </p>
        </div>
      </main>
    </div>
  );
}
