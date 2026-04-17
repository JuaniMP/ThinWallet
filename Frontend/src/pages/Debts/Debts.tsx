import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Layout } from '../../components/layout/Layout';
import { api } from '../../services/api';
import type { Deuda } from '../../types';

type NewDeudaForm = {
  monto: string;
  idUsuarioAcreedor: string;
  metodoPagoSugerido: string;
};

export function Debts() {
  const { user } = useAuth();
  const [payables, setPayables] = useState<Deuda[]>([]);
  const [receivables, setReceivables] = useState<Deuda[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [confirmingId, setConfirmingId] = useState<number | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<NewDeudaForm>({ monto: '', idUsuarioAcreedor: '', metodoPagoSugerido: 'EFECTIVO' });
  const [submitting, setSubmitting] = useState(false);

  const fetchDebts = async () => {
    if (!user?.idUsuario) return;
    setIsLoading(true);
    setError(null);
    try {
      const [pay, rec] = await Promise.all([
        api.get<Deuda[]>(`/deudas/deudor/${user.idUsuario}`),
        api.get<Deuda[]>(`/deudas/acreedor/${user.idUsuario}`),
      ]);
      setPayables(Array.isArray(pay) ? pay : []);
      setReceivables(Array.isArray(rec) ? rec : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar deudas');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDebts();
  }, [user?.idUsuario]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleConfirm = async (idDeuda: number) => {
    setConfirmingId(idDeuda);
    try {
      await api.put(`/deudas/${idDeuda}/confirmar`, {});
      await fetchDebts();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al confirmar pago');
    } finally {
      setConfirmingId(null);
    }
  };

  const handleCreateDebt = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.idUsuario) return;
    const monto = parseFloat(form.monto);
    if (isNaN(monto) || monto <= 0) {
      setError('El monto debe ser un número positivo');
      return;
    }
    const acreedorId = parseInt(form.idUsuarioAcreedor);
    if (isNaN(acreedorId) || acreedorId <= 0) {
      setError('Ingresa un ID de usuario acreedor válido');
      return;
    }
    if (acreedorId === user.idUsuario) {
      setError('No puedes registrar una deuda contigo mismo');
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      await api.post('/deudas', {
        monto,
        idUsuarioDeudor: user.idUsuario,
        idUsuarioAcreedor: acreedorId,
        metodoPagoSugerido: form.metodoPagoSugerido,
        estadoPago: 'PENDIENTE',
      });
      setForm({ monto: '', idUsuarioAcreedor: '', metodoPagoSugerido: 'EFECTIVO' });
      setShowForm(false);
      await fetchDebts();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al crear deuda');
    } finally {
      setSubmitting(false);
    }
  };

  const fmt = (v: number) =>
    v.toLocaleString('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 });

  const pendingPayables = payables.filter(d => d.estadoPago !== 'CONFIRMADO' && d.estadoPago !== 'PAGADO');
  const pendingReceivables = receivables.filter(d => d.estadoPago !== 'CONFIRMADO' && d.estadoPago !== 'PAGADO');
  const history = [...payables, ...receivables]
    .filter(d => d.estadoPago === 'CONFIRMADO' || d.estadoPago === 'PAGADO')
    .sort((a, b) => (b.fechaConfirmada ?? b.fechaCreacion ?? '').localeCompare(a.fechaConfirmada ?? a.fechaCreacion ?? ''))
    .slice(0, 5);

  const totalPayable = pendingPayables.reduce((s, d) => s + (d.monto ?? 0), 0);
  const totalReceivable = pendingReceivables.reduce((s, d) => s + (d.monto ?? 0), 0);

  return (
    <Layout>
      <div className="debts-page">
        <section style={{ marginBottom: '48px' }}>
          <p className="page-label">Estado de Cuenta</p>
          <h2 className="page-title">Flujo de Deudas</h2>

          {error && <div className="error-alert" style={{ marginBottom: '16px' }}>{error}</div>}

          {isLoading ? (
            <div className="loading">Cargando deudas...</div>
          ) : (
            <div className="debt-summary">
              <div className="summary-card bg-high neo-shadow">
                <div className="card-top">
                  <span className="material-symbols-outlined">outbound</span>
                  <span className="tag">Pendiente</span>
                </div>
                <h3>Cuentas por Pagar</h3>
                <p className="amount">{fmt(totalPayable)}</p>
                <p style={{ fontSize: '0.75rem', opacity: 0.7, marginTop: '4px' }}>{pendingPayables.length} deuda(s)</p>
              </div>
              <div className="summary-card bg-secondary neo-shadow">
                <div className="card-top">
                  <span className="material-symbols-outlined">receipt_long</span>
                  <span className="tag">Por Recibir</span>
                </div>
                <h3>Cuentas por Cobrar</h3>
                <p className="amount">{fmt(totalReceivable)}</p>
                <p style={{ fontSize: '0.75rem', opacity: 0.7, marginTop: '4px' }}>{pendingReceivables.length} deuda(s)</p>
              </div>
            </div>
          )}
        </section>

        {!isLoading && (
          <div className="debts-content">
            <div className="debts-column">
              {/* Cuentas por Pagar */}
              <div>
                <div className="section-heading">
                  <div className="accent-bar primary" />
                  <h3>Cuentas por Pagar</h3>
                </div>
                {pendingPayables.length === 0 ? (
                  <p className="empty">No tienes deudas pendientes de pago</p>
                ) : (
                  <div className="debts-grid">
                    {pendingPayables.map((item, idx) => (
                      <div key={item.idDeuda} className="debt-card">
                        <div className="card-date">
                          <span className="date-badge normal">
                            {item.estadoPago ?? 'PENDIENTE'}
                          </span>
                          {item.metodoPagoSugerido && (
                            <span style={{ fontSize: '0.625rem', fontWeight: 700, opacity: 0.7 }}>
                              {item.metodoPagoSugerido}
                            </span>
                          )}
                        </div>
                        <h4>Deuda #{idx + 1}</h4>
                        <p className="card-amount">{fmt(item.monto ?? 0)}</p>
                        <button
                          className="action-btn"
                          onClick={() => handleConfirm(item.idDeuda)}
                          disabled={confirmingId === item.idDeuda}
                        >
                          {confirmingId === item.idDeuda ? 'Confirmando...' : 'Marcar como Pagado'}
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Cuentas por Cobrar */}
              <div style={{ paddingTop: '32px' }}>
                <div className="section-heading">
                  <div className="accent-bar secondary" />
                  <h3>Cuentas por Cobrar</h3>
                </div>
                {pendingReceivables.length === 0 ? (
                  <p className="empty">No tienes cobros pendientes</p>
                ) : (
                  <div className="debts-grid">
                    {pendingReceivables.map((item, idx) => (
                      <div key={item.idDeuda} className="receivable-card neo-shadow">
                        <div className="profile-row">
                          <div className="icon-placeholder">
                            <span className="material-symbols-outlined">person</span>
                          </div>
                          <div>
                            <h4>Cobro #{idx + 1}</h4>
                            <p>{item.estadoPago ?? 'PENDIENTE'}</p>
                          </div>
                        </div>
                        <p className="card-amount">{fmt(item.monto ?? 0)}</p>
                        <button
                          className="action-btn"
                          onClick={() => handleConfirm(item.idDeuda)}
                          disabled={confirmingId === item.idDeuda}
                        >
                          {confirmingId === item.idDeuda ? 'Procesando...' : 'Confirmar Recepción'}
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Right sidebar */}
            <aside style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <div className="history-card">
                <div className="card-header">
                  <h3>Historial</h3>
                  <span className="material-symbols-outlined">history</span>
                </div>
                {history.length === 0 ? (
                  <p className="empty">Sin historial aún</p>
                ) : (
                  <div>
                    {history.map((item, idx) => (
                      <div key={item.idDeuda} className="history-item">
                        <p className="item-date">{item.fechaConfirmada ? new Date(item.fechaConfirmada).toLocaleDateString('es-ES') : item.estadoPago}</p>
                        <h5>Deuda #{idx + 1}</h5>
                        <p className="item-desc">{item.estadoPago}</p>
                        <p className="item-amount">{fmt(item.monto ?? 0)}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="quick-action-card">
                <h4>¿Nueva Deuda?</h4>
                <p>Registra un compromiso de pago con otro usuario para mantener tus finanzas al día.</p>
                <button className="neo-shadow" onClick={() => setShowForm(v => !v)}>
                  {showForm ? 'CANCELAR' : 'AÑADIR DEUDA'}
                </button>
              </div>

              {showForm && (
                <form onSubmit={handleCreateDebt} className="transaction-form">
                  <div className="input-group">
                    <label>Monto</label>
                    <div className="input-wrapper">
                      <span className="material-symbols-outlined">payments</span>
                      <input
                        type="number"
                        placeholder="0"
                        min="0"
                        step="0.01"
                        value={form.monto}
                        onChange={e => setForm(f => ({ ...f, monto: e.target.value }))}
                        required
                      />
                    </div>
                  </div>
                  <div className="input-group">
                    <label>ID Usuario Acreedor</label>
                    <div className="input-wrapper">
                      <span className="material-symbols-outlined">person</span>
                      <input
                        type="number"
                        placeholder="ID del usuario al que le debes"
                        value={form.idUsuarioAcreedor}
                        onChange={e => setForm(f => ({ ...f, idUsuarioAcreedor: e.target.value }))}
                        required
                      />
                    </div>
                  </div>
                  <div className="input-group">
                    <label>Método de Pago</label>
                    <select value={form.metodoPagoSugerido} onChange={e => setForm(f => ({ ...f, metodoPagoSugerido: e.target.value }))}>
                      <option value="EFECTIVO">Efectivo</option>
                      <option value="TARJETA">Tarjeta</option>
                      <option value="TRANSFERENCIA">Transferencia</option>
                    </select>
                  </div>
                  <button type="submit" className="btn btn-primary neo-shadow" disabled={submitting}>
                    {submitting ? 'Guardando...' : 'Registrar Deuda'}
                  </button>
                </form>
              )}
            </aside>
          </div>
        )}
      </div>
    </Layout>
  );
}
