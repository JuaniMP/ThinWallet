import { useState } from 'react';
import { Link } from 'react-router-dom';
import { authService } from '../../services/authService';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';

export function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setIsLoading(true);

    try {
      const response = await authService.forgotPassword(email);
      setMessage(response.message);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al recuperar contraseña');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-page" style={{
      backgroundImage: 'radial-gradient(var(--primary) 1px, transparent 1px)',
      backgroundSize: '32px 32px',
    }}>
      <main style={{ width: '100%', maxWidth: '448px', position: 'relative', zIndex: 1 }}>
        {/* Brand Header */}
        <div style={{ marginBottom: '48px', textAlign: 'center' }}>
          <h2 style={{
            color: 'var(--primary)',
            fontFamily: 'var(--font-headline)',
            fontWeight: 700,
            fontSize: '1.25rem',
            letterSpacing: '-0.05em',
            textTransform: 'uppercase',
            marginBottom: '8px'
          }}>THIN WALLET</h2>
          <div style={{ height: '4px', width: '96px', background: 'var(--primary)', margin: '0 auto' }} />
        </div>

        {/* Main Card */}
        <section className="auth-card neo-shadow" style={{ overflow: 'visible', position: 'relative' }}>
          {/* Decorative rotated element */}
          <div className="auth-card-decoration">
            <span className="material-symbols-outlined" style={{ color: 'var(--primary)' }}>key</span>
          </div>

          <header style={{ marginBottom: '32px' }}>
            <h2 style={{ borderBottom: '2px solid var(--primary)', paddingBottom: '16px', marginBottom: '16px' }}>
              ¿Olvidaste tu contraseña?
            </h2>
            <p className="subtitle">
              Introduce tu correo electrónico para recibir un enlace de recuperación.
            </p>
          </header>

          {error && <div className="error-alert">{error}</div>}
          {message && <div className="success-alert">{message}</div>}
          
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
            <Input
              label="Correo Electrónico"
              type="email"
              name="email"
              icon="alternate_email"
              placeholder="nombre@ejemplo.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            
            <Button type="submit" isLoading={isLoading} icon="arrow_forward" className="neo-shadow-hover neo-shadow-active">
              Enviar Enlace
            </Button>
          </form>

          {/* Back link */}
          <div style={{
            marginTop: '40px',
            paddingTop: '24px',
            borderTop: '2px solid rgba(83, 97, 57, 0.2)',
            textAlign: 'center'
          }}>
            <Link to="/login" style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              fontWeight: 700,
              color: 'var(--primary)',
              textDecoration: 'none',
              transition: 'all 0.2s'
            }}>
              <span className="material-symbols-outlined" style={{ fontSize: '0.875rem' }}>arrow_back</span>
              Volver al inicio de sesión
            </Link>
          </div>
        </section>

        {/* Decorative Footer */}
        <div className="auth-bars">
          <div className="bar-1" />
          <div className="bar-2" />
          <div className="bar-3" />
        </div>
        <div className="auth-meta">
          <span>REF: SEC_AUTH_04</span>
          <span>BOTANICAL ARCHIVE SYSTEM v2.0</span>
        </div>
      </main>
    </div>
  );
}
