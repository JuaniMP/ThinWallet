import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';

export function Register() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden');
      return;
    }

    if (password.length < 8) {
      setError('La contraseña debe tener al menos 8 caracteres');
      return;
    }

    if (!acceptedTerms) {
      setError('Debes aceptar los términos y condiciones');
      return;
    }

    setIsLoading(true);

    try {
      await register({ name, email, password });
      navigate('/login');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al crear cuenta');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <main className="register-layout neo-shadow">
        {/* Left Side: Branding (Desktop) */}
        <section className="register-brand-panel">
          <div style={{ position: 'relative', zIndex: 10 }}>
            <div className="brand-header">
              <span className="material-symbols-outlined" style={{ fontSize: '2.25rem' }}>account_balance</span>
              <h1>THIN WALLET</h1>
            </div>
            <div className="hero-text">
              <h2>THE<br />BOTANICAL<br />ARCHIVIST.</h2>
              <p>Organiza tus activos digitales con la precisión de un herbario real. Estructura, seguridad y crecimiento orgánico.</p>
            </div>
          </div>
          <div style={{ position: 'relative', zIndex: 10 }}>
            <div className="version-badge">
              <p>Version 2.0.4 - 2024</p>
            </div>
          </div>
        </section>

        {/* Right Side: Form */}
        <section className="register-form-panel">
          <header>
            <h3>NUEVA CUENTA</h3>
            <div className="accent-bar" />
            <p>Empieza a cultivar tu patrimonio hoy mismo.</p>
          </header>

          {error && <div className="error-alert">{error}</div>}

          <form onSubmit={handleSubmit}>
            <Input
              label="Nombre Completo"
              type="text"
              name="name"
              icon="person"
              placeholder="EJ. JULIÁN ARCHIVISTA"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />

            <Input
              label="Correo Electrónico"
              type="email"
              name="email"
              icon="alternate_email"
              placeholder="CORREO@EJEMPLO.COM"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />

            <div className="form-row">
              <Input
                label="Contraseña"
                type="password"
                name="password"
                icon="lock"
                placeholder="********"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <Input
                label="Confirmar Contraseña"
                type="password"
                name="confirmPassword"
                icon="lock_reset"
                placeholder="********"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </div>

            <div className="terms-check">
              <input
                type="checkbox"
                id="terms"
                checked={acceptedTerms}
                onChange={(e) => setAcceptedTerms(e.target.checked)}
              />
              <label htmlFor="terms">
                Acepto los términos y condiciones de uso del servicio.
              </label>
            </div>

            <Button type="submit" isLoading={isLoading} icon="arrow_forward">
              CREAR CUENTA
            </Button>
          </form>

          {/* Social Auth */}
          <div className="social-separator">
            <div className="line" />
            <span>O REGÍSTRATE CON</span>
            <div className="line" />
          </div>

          <div className="social-buttons">
            <button className="social-btn" type="button">
              <span className="material-symbols-outlined" style={{ fontSize: '1rem' }}>public</span>
              GOOGLE
            </button>
            <button className="social-btn" type="button">
              <span className="material-symbols-outlined" style={{ fontSize: '1rem' }}>cloud</span>
              APPLE ID
            </button>
          </div>

          {/* Footer */}
          <div className="register-footer">
            <p>
              ¿Ya tienes cuenta?{' '}
              <Link to="/login">Inicia sesión</Link>
            </p>
          </div>
        </section>
      </main>
    </div>
  );
}
