import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authService } from '../../services/authService';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';

export function ForgotPassword() {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [correo, setCorreo] = useState('');
  const [codigo, setCodigo] = useState('');
  const [nuevaContrasena, setNuevaContrasena] = useState('');
  const [confirmarContrasena, setConfirmarContrasena] = useState('');
  
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleRequestCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setIsLoading(true);

    try {
      const responseMessage = await authService.requestPasswordResetCode(correo);
      setMessage(responseMessage);
      setStep(2);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al solicitar el código');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setIsLoading(true);

    try {
      const responseMessage = await authService.verifyPasswordResetCode(correo, codigo);
      setMessage(responseMessage);
      setStep(3);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al verificar el código');
    } finally {
      setIsLoading(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (nuevaContrasena !== confirmarContrasena) {
      setError('Las contraseñas no coinciden');
      return;
    }

    setError('');
    setMessage('');
    setIsLoading(true);

    try {
      const responseMessage = await authService.changePassword(correo, codigo, nuevaContrasena);
      setMessage(responseMessage);
      
      // Wait for user to read success message before redirecting
      setTimeout(() => {
        navigate('/login');
      }, 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cambiar la contraseña');
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
            <span className="material-symbols-outlined" style={{ color: 'var(--primary)' }}>
              {step === 1 ? 'key' : step === 2 ? 'pin' : 'lock_reset'}
            </span>
          </div>

          <header style={{ marginBottom: '32px' }}>
            <h2 style={{ borderBottom: '2px solid var(--primary)', paddingBottom: '16px', marginBottom: '16px' }}>
              {step === 1 && '¿Olvidaste tu contraseña?'}
              {step === 2 && 'Verificar Código'}
              {step === 3 && 'Crear Nueva Contraseña'}
            </h2>
            <p className="subtitle">
              {step === 1 && 'Introduce tu correo electrónico para recibir un código de recuperación.'}
              {step === 2 && 'Ingresa el código de 6 dígitos que hemos enviado a tu correo.'}
              {step === 3 && 'Por favor, ingresa tu nueva contraseña segura.'}
            </p>
          </header>

          {error && <div className="error-alert">{error}</div>}
          {message && <div className="success-alert">{message}</div>}
          
          {step === 1 && (
            <form onSubmit={handleRequestCode} style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
              <Input
                label="Correo Electrónico"
                type="email"
                name="correo"
                icon="alternate_email"
                placeholder="nombre@ejemplo.com"
                value={correo}
                onChange={(e) => setCorreo(e.target.value)}
                required
              />
              
              <Button type="submit" isLoading={isLoading} icon="send" className="neo-shadow-hover neo-shadow-active">
                Enviar Código
              </Button>
            </form>
          )}

          {step === 2 && (
            <form onSubmit={handleVerifyCode} style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
              <Input
                label="Código de Verificación"
                type="text"
                name="codigo"
                icon="pin"
                placeholder="123456"
                value={codigo}
                onChange={(e) => setCodigo(e.target.value)}
                maxLength={6}
                required
              />
              
              <Button type="submit" isLoading={isLoading} icon="check_circle" className="neo-shadow-hover neo-shadow-active">
                Verificar Código
              </Button>
            </form>
          )}

          {step === 3 && (
            <form onSubmit={handleChangePassword} style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
              <Input
                label="Nueva Contraseña"
                type="password"
                name="nuevaContrasena"
                icon="lock"
                placeholder="••••••••"
                value={nuevaContrasena}
                onChange={(e) => setNuevaContrasena(e.target.value)}
                required
              />
              
              <Input
                label="Confirmar Contraseña"
                type="password"
                name="confirmarContrasena"
                icon="lock_clock"
                placeholder="••••••••"
                value={confirmarContrasena}
                onChange={(e) => setConfirmarContrasena(e.target.value)}
                required
              />
              
              <Button type="submit" isLoading={isLoading} icon="update" className="neo-shadow-hover neo-shadow-active">
                Actualizar Contraseña
              </Button>
            </form>
          )}

          {/* Back link */}
          <div style={{
            marginTop: '40px',
            paddingTop: '24px',
            borderTop: '2px solid rgba(83, 97, 57, 0.2)',
            textAlign: 'center'
          }}>
            {step === 1 ? (
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
            ) : (
              <button 
                type="button"
                onClick={() => {
                  setStep((prev) => (prev - 1) as 1 | 2);
                  setError('');
                  setMessage('');
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  fontWeight: 700,
                  color: 'var(--primary)',
                  textDecoration: 'none',
                  transition: 'all 0.2s',
                  padding: 0,
                  fontFamily: 'inherit',
                  fontSize: '1rem'
                }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: '0.875rem' }}>arrow_back</span>
                Paso Anterior
              </button>
            )}
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
