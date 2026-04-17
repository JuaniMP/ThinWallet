import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Layout } from '../../components/layout/Layout';
import { useAuth } from '../../context/AuthContext';
import { ApiError } from '../../services/api';
import { categoryService } from '../../services/categoryService';
import { circleService } from '../../services/circuloGastoService';
import { transactionService } from '../../services/transactionService';
import { usuarioService } from '../../services/usuarioService';
import type { Category, CirculoDetalle, Transaccion, TipoMovimiento, UsuarioBusqueda } from '../../types';

const FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?auto=format&fit=crop&w=1600&q=80';

export function CircleDetail() {
  const { id } = useParams();
  const { user } = useAuth();

  const [detail, setDetail] = useState<CirculoDetalle | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [imageUrl, setImageUrl] = useState(FALLBACK_IMAGE);
  const [draftImage, setDraftImage] = useState(FALLBACK_IMAGE);
  const [editingImage, setEditingImage] = useState(false);

  // Transacciones
  const [transacciones, setTransacciones] = useState<Transaccion[]>([]);
  const [tiposMovimiento, setTiposMovimiento] = useState<TipoMovimiento[]>([]);
  const [categorias, setCategorias] = useState<Category[]>([]);
  const [showGastoModal, setShowGastoModal] = useState(false);
  const [gastoNombre, setGastoNombre] = useState('');
  const [gastoMonto, setGastoMonto] = useState('');
  const [gastoEsIngreso, setGastoEsIngreso] = useState(false);
  const [gastoCategoria, setGastoCategoria] = useState('');
  const [gastoContexto, setGastoContexto] = useState('');
  const [gastoLoading, setGastoLoading] = useState(false);
  const [gastoError, setGastoError] = useState('');

  // Invitar usuario registrado
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<UsuarioBusqueda[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [inviteError, setInviteError] = useState('');
  const [inviteSuccess, setInviteSuccess] = useState('');
  const searchDebounce = useRef<ReturnType<typeof setTimeout> | null>(null);

  const circleId = Number(id);

  const loadTransacciones = useCallback(async () => {
    if (!circleId) return;
    try {
      const data = await transactionService.getByCirculo(circleId);
      setTransacciones(data);
    } catch {
      setTransacciones([]);
    }
  }, [circleId]);

  useEffect(() => {
    if (!Number.isFinite(circleId) || circleId <= 0) {
      setError('ID de círculo inválido.');
      setLoading(false);
      return;
    }

    const savedImage = localStorage.getItem(`circle-cover-${circleId}`);
    if (savedImage) { setImageUrl(savedImage); setDraftImage(savedImage); }

    const load = async () => {
      setLoading(true);
      try {
        const [data, tipos, cats] = await Promise.all([
          circleService.getCircleDetail(circleId),
          transactionService.getTiposMovimiento(),
          categoryService.getAll(),
        ]);
        setDetail(data);
        setTiposMovimiento(tipos);
        setCategorias(cats);
      } catch {
        setError('No se pudo cargar el círculo.');
      } finally {
        setLoading(false);
      }
    };

    void load();
    void loadTransacciones();
  }, [circleId, loadTransacciones]);

  const esIngresoPor = (t: Transaccion): boolean => {
    const mov = (t.tipoMovimiento ?? '').toUpperCase();
    const cat = (t.tipoCategoria ?? '').toUpperCase();
    const INGRESOS = ['DEPOSITO', 'INGRESO', 'INCOME', 'ENTRADA'];
    return INGRESOS.some(k => mov.includes(k) || cat.includes(k));
  };

  const balanceTotal = useMemo(
    () => transacciones.reduce((acc, t) => {
      const monto = Number(t.montoOriginal) || 0;
      return esIngresoPor(t) ? acc + monto : acc - monto;
    }, 0),
    [transacciones], // eslint-disable-line react-hooks/exhaustive-deps
  );

  const totalIngresos = useMemo(
    () => transacciones.filter(esIngresoPor).reduce((s, t) => s + (Number(t.montoOriginal) || 0), 0),
    [transacciones], // eslint-disable-line react-hooks/exhaustive-deps
  );

  const totalGastos = useMemo(
    () => transacciones.filter(t => !esIngresoPor(t)).reduce((s, t) => s + (Number(t.montoOriginal) || 0), 0),
    [transacciones], // eslint-disable-line react-hooks/exhaustive-deps
  );

  const formatMoney = (amount: number) =>
    amount.toLocaleString('es-CO', { style: 'currency', currency: detail?.monedaBase || 'COP', minimumFractionDigits: 0 });

  const handleSaveImage = () => {
    if (!detail || !draftImage.trim()) return;
    const clean = draftImage.trim();
    setImageUrl(clean);
    localStorage.setItem(`circle-cover-${detail.idCirculoGasto}`, clean);
    setEditingImage(false);
  };

  // ── Registrar transacción ─────────────────────────────────────────────────
  // Categorías filtradas por tipo elegido
  const categoriasFiltradas = useMemo(() => {
    if (categorias.length === 0) return [];
    const DEPOSITO_KEYS = ['DEPOSITO', 'INGRESO', 'INCOME', 'ENTRADA'];
    const filtered = categorias.filter(c => {
      const tc = (c.tipoCategoria ?? '').toUpperCase();
      return gastoEsIngreso
        ? DEPOSITO_KEYS.some(k => tc.includes(k))
        : !DEPOSITO_KEYS.some(k => tc.includes(k));
    });
    return filtered.length > 0 ? filtered : categorias;
  }, [categorias, gastoEsIngreso]);

  const openGastoModal = () => {
    setGastoNombre('');
    setGastoMonto('');
    setGastoEsIngreso(false);
    setGastoCategoria('');
    setGastoContexto('');
    setGastoError('');
    setShowGastoModal(true);
  };

  // Cuando cambia el tipo (ingreso/gasto), resetear la categoría
  const handleTipoChange = (esIngreso: boolean) => {
    setGastoEsIngreso(esIngreso);
    setGastoCategoria('');
  };

  // Resuelve el nombre del tipo de movimiento según si es ingreso/gasto
  const resolverTipoMovimiento = (): string => {
    const DEPOSITO_KEYS = ['DEPOSITO', 'INGRESO', 'INCOME'];
    const RETIRO_KEYS = ['RETIRO', 'GASTO', 'EGRESO', 'SALIDA'];
    if (gastoEsIngreso) {
      const match = tiposMovimiento.find(t => DEPOSITO_KEYS.some(k => t.nombre.toUpperCase().includes(k)));
      return match?.nombre ?? tiposMovimiento[0]?.nombre ?? 'DEPOSITO';
    }
    const match = tiposMovimiento.find(t => RETIRO_KEYS.some(k => t.nombre.toUpperCase().includes(k)));
    return match?.nombre ?? tiposMovimiento[1]?.nombre ?? tiposMovimiento[0]?.nombre ?? 'RETIRO';
  };

  const handleCrearTransaccion = async () => {
    if (!user || !detail || !gastoNombre.trim() || !gastoMonto || !gastoCategoria) return;
    const monto = parseFloat(gastoMonto);
    if (isNaN(monto) || monto <= 0) { setGastoError('El monto debe ser un número positivo.'); return; }

    setGastoLoading(true);
    setGastoError('');
    try {
      await transactionService.create({
        nombre: gastoNombre.trim(),
        montoOriginal: monto,
        tipoMovimiento: resolverTipoMovimiento(),
        idUsuario: user.idUsuario,
        idCirculoGasto: detail.idCirculoGasto,
        idCategoria: Number(gastoCategoria),
        monedaOriginal: detail.monedaBase || 'COP',
        contexto: gastoContexto.trim() || undefined,
      });
      setShowGastoModal(false);
      await loadTransacciones();
    } catch (err) {
      setGastoError(err instanceof ApiError ? err.message : 'No se pudo registrar la transacción.');
    } finally {
      setGastoLoading(false);
    }
  };

  // ── Eliminar transacción ──────────────────────────────────────────────────
  const handleEliminarTransaccion = async (idTransaccion: number) => {
    if (!window.confirm('¿Eliminar esta transacción?')) return;
    try {
      await transactionService.delete(String(idTransaccion));
      setTransacciones(prev => prev.filter(t => t.idTransaccion !== idTransaccion));
    } catch {
      // silently ignore
    }
  };

  // ── Buscar e invitar usuario registrado ───────────────────────────────────
  const handleSearchChange = useCallback((q: string) => {
    setSearchQuery(q);
    setInviteError('');
    setInviteSuccess('');
    if (searchDebounce.current) clearTimeout(searchDebounce.current);
    if (!q.trim()) { setSearchResults([]); return; }
    searchDebounce.current = setTimeout(async () => {
      setSearchLoading(true);
      try {
        const results = await usuarioService.buscarUsuarios(q.trim(), user?.idUsuario);
        setSearchResults(results);
      } catch {
        setSearchResults([]);
      } finally {
        setSearchLoading(false);
      }
    }, 400);
  }, []);

  const handleInvite = async (invitado: UsuarioBusqueda) => {
    if (!detail) return;
    setInviteError('');
    setInviteSuccess('');
    try {
      const updated = await circleService.inviteRegisteredUser(detail.idCirculoGasto, invitado.idUsuario);
      setDetail(updated);
      setSearchQuery('');
      setSearchResults([]);
      setInviteSuccess(`${invitado.nombreCompleto} fue agregado al círculo.`);
    } catch (err) {
      if (err instanceof ApiError && err.status === 409) {
        setInviteError('Este usuario ya es miembro del círculo.');
      } else {
        setInviteError('No se pudo invitar al usuario. Intenta de nuevo.');
      }
    }
  };

  const isCreator = user && detail && detail.idUsuarioCreador === user.idUsuario;

  return (
    <Layout>
      <div className="circle-detail-page">
        <div className="circle-detail-topbar">
          <Link to="/grupos" className="circle-detail-back">← Volver a grupos</Link>
        </div>

        {loading ? (
          <p className="empty-state">Cargando círculo...</p>
        ) : error || !detail ? (
          <p className="empty-state">{error || 'No se encontró el círculo.'}</p>
        ) : (
          <>
            {/* HERO */}
            <section className="circle-hero-section">
              <div className="circle-hero-image-container">
                <img className="circle-hero-image" src={imageUrl} alt={`Portada de ${detail.nombre}`} />
                <button type="button" className="circle-hero-edit-btn" onClick={() => setEditingImage(p => !p)} aria-label="Editar portada">
                  <span className="material-symbols-outlined">edit</span>
                </button>
                {editingImage && (
                  <div className="circle-hero-editor">
                    <input value={draftImage} onChange={e => setDraftImage(e.target.value)} placeholder="Pega URL de imagen" />
                    <button type="button" className="btn btn-primary" onClick={handleSaveImage}>Guardar</button>
                  </div>
                )}
              </div>
              <div className="circle-hero-info neo-shadow">
                <h1 className="circle-hero-title">{(detail.nombre || 'Círculo sin nombre').toUpperCase()}</h1>
                <div className="circle-hero-meta">
                  <span className="circle-status">Activo</span>
                  <span className="circle-type">{detail.tipoCirculo || 'Sin tipo'}</span>
                </div>
              </div>
            </section>

            {/* MÉTRICAS */}
            <section className="circle-metrics-row">
              <div className="circle-metric-card neo-shadow">
                <span className="metric-label">Miembros</span>
                <strong className="metric-value">{detail.totalMiembros}</strong>
              </div>
              <div className="circle-metric-card neo-shadow">
                <span className="metric-label">Ingresos</span>
                <strong className="metric-value" style={{ color: 'var(--primary)', fontSize: '0.95rem' }}>
                  +{formatMoney(totalIngresos)}
                </strong>
              </div>
              <div className="circle-metric-card neo-shadow">
                <span className="metric-label">Gastos</span>
                <strong className="metric-value" style={{ color: '#e53e3e', fontSize: '0.95rem' }}>
                  -{formatMoney(totalGastos)}
                </strong>
              </div>
              <div className="circle-metric-card neo-shadow">
                <span className="metric-label">Balance</span>
                <strong className="metric-value" style={{ color: balanceTotal >= 0 ? 'var(--primary)' : '#e53e3e', fontSize: '0.95rem' }}>
                  {balanceTotal >= 0 ? '+' : ''}{formatMoney(balanceTotal)}
                </strong>
              </div>
            </section>

            {/* ATRIBUTOS */}
            <section className="circle-panel neo-shadow">
              <div className="panel-header"><h3>Atributos del círculo</h3></div>
              <div className="attrs-grid">
                <div><span>Tipo</span><strong>{detail.tipoCirculo || 'Sin tipo'}</strong></div>
                <div><span>Moneda</span><strong>{detail.monedaBase || 'COP'}</strong></div>
                <div><span>Estado</span><strong>{detail.estado === 1 || detail.estado === 'ACTIVO' ? 'Activo' : 'Inactivo'}</strong></div>
                <div><span>Mesadas</span><strong>{detail.permiteMesadas ? 'Sí' : 'No'}</strong></div>
                <div><span>Simplificación</span><strong>{detail.permiteSimplificacionDeudas ? 'Sí' : 'No'}</strong></div>
                <div><span>Creado</span><strong>{detail.fechaCreacion ? new Date(detail.fechaCreacion).toLocaleDateString('es-CO') : 'N/A'}</strong></div>
              </div>
            </section>

            {/* BALANCE Y ACCIÓN */}
            <section className="circle-actions-panel neo-shadow">
              <div className="balance-box">
                <span className="balance-label">Balance del grupo</span>
                <strong className="balance-value" style={{ color: balanceTotal >= 0 ? undefined : '#e53e3e' }}>
                  {formatMoney(balanceTotal)}
                </strong>
              </div>
              <button className="btn btn-primary" type="button" onClick={openGastoModal}>
                + Registrar transacción
              </button>
            </section>

            {/* HISTORIAL DE TRANSACCIONES */}
            <section className="circle-history-panel neo-shadow">
              <div className="panel-header">
                <h3>Historial de transacciones</h3>
                <span className="history-icon">⏱</span>
              </div>
              {transacciones.length === 0 ? (
                <div className="history-empty"><p>No hay transacciones en este círculo aún.</p></div>
              ) : (
                <div className="history-timeline">
                  {transacciones.map(t => {
                    const esIngreso = esIngresoPor(t);
                    const etiqueta = esIngreso ? 'Ingreso' : 'Gasto';
                    return (
                      <div key={t.idTransaccion} className={`history-item history-${esIngreso ? 'income' : 'expense'}`}>
                        <div className="history-line" />
                        <div className="history-content" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <div>
                            <div className="history-title">{t.nombre}</div>
                            <div className="history-desc">
                              <span style={{
                                display: 'inline-block',
                                padding: '1px 7px',
                                borderRadius: '2px',
                                fontSize: '0.72rem',
                                fontWeight: 600,
                                background: esIngreso ? 'var(--primary)' : '#e53e3e',
                                color: '#fff',
                                marginRight: '6px',
                              }}>{etiqueta}</span>
                              {t.contexto || ''}
                            </div>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <strong className="history-amount" style={{ color: esIngreso ? 'var(--primary)' : '#e53e3e' }}>
                              {esIngreso ? '+' : '-'}{formatMoney(Number(t.montoOriginal))}
                            </strong>
                            {isCreator && (
                              <button
                                type="button"
                                onClick={() => void handleEliminarTransaccion(t.idTransaccion)}
                                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#999', fontSize: '1.1rem' }}
                                title="Eliminar"
                                aria-label="Eliminar transacción"
                              >
                                <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>delete</span>
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>

            {/* MIEMBROS DEL CÍRCULO */}
            <section className="circle-panel neo-shadow">
              <div className="panel-header">
                <h3>Miembros del círculo</h3>
                <p>{detail.totalMiembros} en total</p>
              </div>
              <div className="guest-token-grid">
                {/* Tarjeta del creador */}
                <article className="guest-token-item" style={{ borderLeft: '3px solid var(--primary)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <h4 style={{ margin: 0 }}>{detail.nombreCreador || 'Creador'}</h4>
                    <span style={{ fontSize: '0.7rem', padding: '2px 8px', background: 'var(--primary)', color: '#fff', borderRadius: '2px', marginLeft: '8px', whiteSpace: 'nowrap' }}>
                      Admin
                    </span>
                  </div>
                  <p style={{ margin: '4px 0 0', fontSize: '0.8rem', color: 'var(--on-surface-variant)' }}>Creador del círculo</p>
                  {detail.correoCreador && !detail.correoCreador.includes('@thinwallet.local') && (
                    <p className="guest-email" style={{ margin: '2px 0 0', fontSize: '0.8rem' }}>{detail.correoCreador}</p>
                  )}
                </article>

                {/* Resto de miembros */}
                {detail.invitados.length === 0 ? (
                  <p className="empty-state" style={{ padding: '12px 0', gridColumn: '1/-1' }}>
                    Aún no hay otros miembros en este círculo.
                  </p>
                ) : (
                  detail.invitados.map(m => (
                    <article key={m.idUsuario} className="guest-token-item">
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <h4 style={{ margin: 0 }}>{m.nombreCompleto || 'Sin nombre'}</h4>
                        <span style={{
                          fontSize: '0.7rem', padding: '2px 8px',
                          background: m.tipoUsuario === 'REGISTRADO' ? '#2d7a2d' : '#888',
                          color: '#fff', borderRadius: '2px', marginLeft: '8px', whiteSpace: 'nowrap',
                        }}>
                          {m.tipoUsuario === 'REGISTRADO' ? 'Registrado' : 'Fantasma'}
                        </span>
                      </div>
                      <p style={{ margin: '4px 0 2px', fontSize: '0.8rem', color: 'var(--on-surface-variant)' }}>
                        Rol: {m.rolUsuario || 'MIEMBRO'}
                      </p>
                      {m.correo && !m.correo.includes('@thinwallet.local') && (
                        <p className="guest-email" style={{ margin: 0, fontSize: '0.8rem' }}>{m.correo}</p>
                      )}
                      {m.tipoUsuario === 'FANTASMA' && m.tokenInvitacionPersonal && (
                        <div style={{ marginTop: '6px', display: 'flex', gap: '6px', alignItems: 'center' }}>
                          <input
                            type="text" readOnly value={m.tokenInvitacionPersonal}
                            style={{ flex: 1, padding: '4px 6px', border: '1px solid var(--primary)', fontFamily: 'monospace', fontSize: '11px' }}
                          />
                          <button
                            type="button" className="matriz-cta-btn"
                            style={{ padding: '4px 10px', fontSize: '0.75rem' }}
                            onClick={() => { navigator.clipboard.writeText(m.tokenInvitacionPersonal!); }}
                          >
                            Copiar
                          </button>
                        </div>
                      )}
                    </article>
                  ))
                )}
              </div>
            </section>

            {/* INVITAR USUARIO REGISTRADO — solo creador */}
            {isCreator && (
              <section className="circle-panel neo-shadow">
                <div className="panel-header"><h3>Invitar usuario registrado</h3></div>
                <div className="input-group" style={{ marginBottom: '12px' }}>
                  <label>Buscar por correo o nombre de usuario</label>
                  <input
                    value={searchQuery}
                    onChange={e => handleSearchChange(e.target.value)}
                    placeholder="ej: juan@correo.com o juanperez"
                  />
                </div>
                {searchLoading && <p style={{ fontSize: '0.85rem', color: 'var(--on-surface-variant)' }}>Buscando...</p>}
                {searchResults.length > 0 && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '8px' }}>
                    {searchResults.map(u => (
                      <div key={u.idUsuario} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', border: '1px solid var(--outline-variant)', borderRadius: '4px' }}>
                        <div>
                          <strong style={{ fontSize: '0.9rem' }}>{u.nombreCompleto}</strong>
                          <p style={{ fontSize: '0.8rem', color: 'var(--on-surface-variant)', margin: '2px 0 0' }}>{u.correo} · @{u.nombreUsuario}</p>
                        </div>
                        <button type="button" className="matriz-cta-btn" style={{ padding: '6px 14px', fontSize: '0.85rem' }} onClick={() => void handleInvite(u)}>
                          Invitar
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                {!searchLoading && searchQuery.trim() && searchResults.length === 0 && (
                  <p style={{ fontSize: '0.85rem', color: 'var(--on-surface-variant)' }}>No se encontraron usuarios registrados.</p>
                )}
                {inviteSuccess && <p style={{ color: 'var(--primary)', marginTop: '10px', fontSize: '0.85rem' }}>{inviteSuccess}</p>}
                {inviteError && <p style={{ color: '#e53e3e', marginTop: '10px', fontSize: '0.85rem' }}>{inviteError}</p>}
              </section>
            )}
          </>
        )}
      </div>

      {/* MODAL: Registrar transacción */}
      {showGastoModal && detail && (
        <div className="modal-backdrop" onClick={() => setShowGastoModal(false)}>
          <div className="modal-container" onClick={e => e.stopPropagation()}>
            <div className="modal-content neo-shadow">
              <div className="modal-header">
                <h1>Registrar transacción</h1>
                <button type="button" className="close-btn" onClick={() => setShowGastoModal(false)} aria-label="Cerrar">
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>
              <div className="modal-body">
                <div className="input-group">
                  <label>Descripción</label>
                  <input value={gastoNombre} onChange={e => setGastoNombre(e.target.value)} placeholder="Ej: Cena en restaurante" />
                </div>
                <div className="input-group">
                  <label>Monto ({detail.monedaBase || 'COP'})</label>
                  <input type="number" min="0" step="0.01" value={gastoMonto} onChange={e => setGastoMonto(e.target.value)} placeholder="0" />
                </div>
                <div className="input-group">
                  <label>Tipo de movimiento</label>
                  <div style={{ display: 'flex', gap: '10px', marginTop: '4px' }}>
                    {[false, true].map(esIngreso => (
                      <button
                        key={String(esIngreso)}
                        type="button"
                        onClick={() => handleTipoChange(esIngreso)}
                        style={{
                          flex: 1,
                          padding: '10px',
                          border: `2px solid ${esIngreso ? 'var(--primary)' : '#e53e3e'}`,
                          background: gastoEsIngreso === esIngreso
                            ? (esIngreso ? 'var(--primary)' : '#e53e3e')
                            : 'transparent',
                          color: gastoEsIngreso === esIngreso ? '#fff' : (esIngreso ? 'var(--primary)' : '#e53e3e'),
                          fontWeight: 600,
                          cursor: 'pointer',
                          borderRadius: '2px',
                          fontSize: '0.9rem',
                          transition: 'all 0.15s',
                        }}
                      >
                        {esIngreso ? '↑ Ingreso' : '↓ Gasto'}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="input-group">
                  <label>Categoría</label>
                  <select aria-label="Categoría" value={gastoCategoria} onChange={e => setGastoCategoria(e.target.value)}>
                    <option value="" disabled>Selecciona categoría</option>
                    {categoriasFiltradas.map(c => (
                      <option key={c.idCategoria} value={c.idCategoria}>{c.nombre}</option>
                    ))}
                  </select>
                </div>
                <div className="input-group">
                  <label>Contexto (opcional)</label>
                  <input value={gastoContexto} onChange={e => setGastoContexto(e.target.value)} placeholder="Ej: Viaje, Cena, Mercado..." />
                </div>
                {gastoError && <p style={{ color: '#e53e3e', fontSize: '0.85rem', marginTop: '6px' }}>{gastoError}</p>}
              </div>
              <div className="modal-footer">
                <div className="group-modal-actions">
                  <button type="button" onClick={() => setShowGastoModal(false)} className="group-cancel-btn">Cancelar</button>
                  <button
                    type="button"
                    onClick={() => void handleCrearTransaccion()}
                    disabled={gastoLoading || !gastoNombre.trim() || !gastoMonto || !gastoCategoria}
                    className="submit-btn neo-shadow"
                  >
                    {gastoLoading ? 'Guardando...' : 'Registrar'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}
