import { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { Layout } from "../../components/layout/Layout";
import { api } from "../../services/api";
import { transactionService } from "../../services/transactionService";
import { deudaService } from "../../services/deudaService";
import { circleService } from "../../services/circuloGastoService";
import { MoneyInput } from "../../components/common/MoneyInput";
import {
  useCurrency,
  SUPPORTED_CURRENCIES,
  type CurrencyCode,
} from "../../context/CurrencyContext";
import type { CirculoGasto, Deuda, User } from "../../types";

type NewDeudaForm = {
  monto: number;
  idUsuarioAcreedor: string;
  metodoPagoSugerido: string;
  moneda: CurrencyCode;
};

const isFinalState = (e?: string) =>
  e === "CONFIRMADO" || e === "PAGADO" || e === "PAGADA" || e === "RECHAZADO";

export function Debts() {
  const { user } = useAuth();
  const { format: fmt, currency: prefCurrency } = useCurrency();
  const [payables, setPayables] = useState<Deuda[]>([]);
  const [receivables, setReceivables] = useState<Deuda[]>([]);
  const [userNames, setUserNames] = useState<Record<number, string>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [confirmingId, setConfirmingId] = useState<number | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<NewDeudaForm>({
    monto: 0,
    idUsuarioAcreedor: "",
    metodoPagoSugerido: "EFECTIVO",
    moneda: prefCurrency,
  });
  const [submitting, setSubmitting] = useState(false);

  // RQ-07: balance por círculo via fn_calcular_deuda_usuario
  const [circles, setCircles] = useState<CirculoGasto[]>([]);
  const [circleBalances, setCircleBalances] = useState<Record<number, number>>({});

  const fetchDebts = async () => {
    if (!user?.idUsuario) return;
    setIsLoading(true);
    setError(null);
    try {
      const [pay, rec] = await Promise.all([
        deudaService.getByDeudor(user.idUsuario),
        deudaService.getByAcreedor(user.idUsuario),
      ]);
      const payList = Array.isArray(pay) ? pay : [];
      const recList = Array.isArray(rec) ? rec : [];
      setPayables(payList);
      setReceivables(recList);

      const ids = new Set<number>();
      payList.forEach((d) => { if (d.idUsuarioAcreedor) ids.add(d.idUsuarioAcreedor); });
      recList.forEach((d) => { if (d.idUsuarioDeudor) ids.add(d.idUsuarioDeudor); });
      ids.delete(user.idUsuario);

      const names: Record<number, string> = {};
      await Promise.all(
        Array.from(ids).map(async (id) => {
          try {
            const u = await api.get<User>(`/usuarios/${id}`);
            names[id] = `${u.nombres} ${u.apellidos}`.trim();
          } catch {
            names[id] = `Usuario #${id}`;
          }
        }),
      );
      setUserNames(names);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al cargar deudas");
    } finally {
      setIsLoading(false);
    }
  };

  /** RQ-07 — Carga círculos del usuario y consulta fn_calcular_deuda_usuario por cada uno. */
  const fetchCircleBalances = async () => {
    if (!user?.idUsuario) return;
    try {
      const list = await circleService.getCirclesAsMember(user.idUsuario);
      const cs = Array.isArray(list) ? list : [];
      setCircles(cs);

      const entries = await Promise.all(
        cs.map(async (c) => {
          try {
            const v = await deudaService.getBalanceByCircle(
              user.idUsuario,
              c.idCirculoGasto,
            );
            return [c.idCirculoGasto, Number(v) || 0] as const;
          } catch {
            return [c.idCirculoGasto, 0] as const;
          }
        }),
      );
      const map: Record<number, number> = {};
      entries.forEach(([id, v]) => { map[id] = v; });
      setCircleBalances(map);
    } catch {
      // sin círculos / endpoint caído → ignorar
    }
  };

  useEffect(() => {
    fetchDebts();
    fetchCircleBalances();
  }, [user?.idUsuario]); // eslint-disable-line react-hooks/exhaustive-deps

  /** RQ-08 paso 1 — Deudor: "ya pagué". Crea RETIRO y llama sp_pagar_deuda. */
  const handleMarkPaid = async (debt: Deuda) => {
    if (!user?.idUsuario) return;
    setConfirmingId(debt.idDeuda);
    try {
      try {
        await transactionService.create({
          nombre: "Pago de deuda",
          montoOriginal: debt.monto ?? 0,
          tipoMovimiento: "RETIRO",
          idUsuario: user.idUsuario,
          monedaOriginal: debt.moneda ?? "COP",
          tasaCambio: 1,
        });
      } catch {
        // si la transacción falla, igual avanzamos el estado de la deuda
      }
      await deudaService.pagar(debt.idDeuda, debt.metodoPagoSugerido ?? "TRANSFERENCIA");
      await Promise.all([fetchDebts(), fetchCircleBalances()]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al marcar como pagado");
    } finally {
      setConfirmingId(null);
    }
  };

  /** RQ-08 paso 2 — Acreedor confirma recepción. Crea DEPÓSITO y llama sp_confirmar_pago_deuda. */
  const handleConfirmReceive = async (debt: Deuda) => {
    if (!user?.idUsuario) return;
    setConfirmingId(debt.idDeuda);
    try {
      let idTransaccion: number | undefined;
      try {
        const tx = await transactionService.create({
          nombre: "Cobro de deuda",
          montoOriginal: debt.monto ?? 0,
          tipoMovimiento: "DEPOSITO",
          idUsuario: user.idUsuario,
          monedaOriginal: debt.moneda ?? "COP",
          tasaCambio: 1,
        });
        idTransaccion = tx.idTransaccion;
      } catch {
        // si la transacción falla, igual avanzamos el estado de la deuda
      }
      await deudaService.confirmar(debt.idDeuda, idTransaccion);
      await Promise.all([fetchDebts(), fetchCircleBalances()]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al confirmar recepción");
    } finally {
      setConfirmingId(null);
    }
  };

  const handleCreateDebt = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.idUsuario) return;
    if (!form.monto || form.monto <= 0) {
      setError("El monto debe ser un número positivo");
      return;
    }
    const acreedorId = parseInt(form.idUsuarioAcreedor);
    if (isNaN(acreedorId) || acreedorId <= 0) {
      setError("Ingresa un ID de usuario acreedor válido");
      return;
    }
    if (acreedorId === user.idUsuario) {
      setError("No puedes registrar una deuda contigo mismo");
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      await deudaService.create({
        monto: form.monto,
        idUsuarioDeudor: user.idUsuario,
        idUsuarioAcreedor: acreedorId,
        metodoPagoSugerido: form.metodoPagoSugerido,
        estadoPago: "PENDIENTE",
      });
      setForm({ monto: 0, idUsuarioAcreedor: "", metodoPagoSugerido: "EFECTIVO", moneda: prefCurrency });
      setShowForm(false);
      await Promise.all([fetchDebts(), fetchCircleBalances()]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al crear deuda");
    } finally {
      setSubmitting(false);
    }
  };

  // Deudor: pendientes incluyen PENDIENTE y CONFIRMADA_PENDIENTE
  const pendingPayables = payables.filter((d) => !isFinalState(d.estadoPago));
  // Acreedor: idem
  const pendingReceivables = receivables.filter((d) => !isFinalState(d.estadoPago));

  const history = [...payables, ...receivables]
    .filter((d) => isFinalState(d.estadoPago))
    .sort((a, b) =>
      (b.fechaConfirmada ?? b.fechaCreacion ?? "").localeCompare(
        a.fechaConfirmada ?? a.fechaCreacion ?? "",
      ),
    )
    .slice(0, 5);

  const totalPayable = pendingPayables.reduce((s, d) => s + (d.monto ?? 0), 0);
  const totalReceivable = pendingReceivables.reduce((s, d) => s + (d.monto ?? 0), 0);
  const netBalance = totalReceivable - totalPayable;

  const totalCircleBalance = Object.values(circleBalances).reduce((s, v) => s + v, 0);

  return (
    <Layout>
      <div className="debts-page">
        <section style={{ marginBottom: "48px" }}>
          <p className="page-label">Estado de Cuenta</p>
          <h2 className="page-title">Flujo de Deudas</h2>

          {error && (
            <div className="error-alert" style={{ marginBottom: "16px" }}>
              {error}
            </div>
          )}

          {isLoading ? (
            <div className="loading">Cargando deudas...</div>
          ) : (
            <>
              <div className="debt-summary">
                <div className="summary-card bg-secondary neo-shadow">
                  <div className="card-top">
                    <span className="material-symbols-outlined">receipt_long</span>
                    <span className="tag">Por Recibir</span>
                  </div>
                  <h3>Cuentas por Cobrar</h3>
                  <p className="amount">{fmt(totalReceivable, "COP")}</p>
                  <p style={{ fontSize: "0.75rem", opacity: 0.7, marginTop: "4px" }}>
                    {pendingReceivables.length} pendiente(s)
                  </p>
                </div>

                <div className="summary-card bg-high neo-shadow">
                  <div className="card-top">
                    <span className="material-symbols-outlined">outbound</span>
                    <span className="tag">Por Pagar</span>
                  </div>
                  <h3>Cuentas por Pagar</h3>
                  <p className="amount">{fmt(totalPayable, "COP")}</p>
                  <p style={{ fontSize: "0.75rem", opacity: 0.7, marginTop: "4px" }}>
                    {pendingPayables.length} pendiente(s)
                  </p>
                </div>
              </div>

              <div className="debt-net-balance" style={{ marginTop: "16px" }}>
                <span className="material-symbols-outlined" style={{ fontSize: "1rem", verticalAlign: "middle", marginRight: 6 }}>
                  {netBalance >= 0 ? "trending_up" : "trending_down"}
                </span>
                <span>
                  Balance neto:{" "}
                  <strong style={{ color: netBalance >= 0 ? "var(--secondary)" : "var(--error)" }}>
                    {netBalance >= 0 ? "+" : ""}{fmt(netBalance, "COP")}
                  </strong>
                </span>
              </div>
            </>
          )}
        </section>

        {!isLoading && circles.length > 0 && (
          <section style={{ marginBottom: "48px" }}>
            <div className="section-heading">
              <div className="accent-bar primary" />
              <h3>Deuda por círculo</h3>
            </div>
            <p className="debt-section-hint">
              <span className="material-symbols-outlined" style={{ fontSize: "0.875rem", verticalAlign: "middle" }}>functions</span>
              {" "}Calculado en BD con <code>fn_calcular_deuda_usuario</code>. Suma PENDIENTE + CONFIRMADA_PENDIENTE.
            </p>
            <div className="debt-summary">
              {circles.map((c) => (
                <div key={c.idCirculoGasto} className="summary-card neo-shadow" style={{ padding: "16px" }}>
                  <div className="card-top">
                    <span className="material-symbols-outlined">groups</span>
                    <span className="tag">{c.tipoCirculo ?? "Círculo"}</span>
                  </div>
                  <h3 style={{ fontSize: "0.95rem" }}>{c.nombre}</h3>
                  <p className="amount" style={{ fontSize: "1.4rem" }}>
                    {fmt(circleBalances[c.idCirculoGasto] ?? 0, "COP")}
                  </p>
                </div>
              ))}
            </div>
            <p style={{ marginTop: "12px", fontSize: "0.85rem", opacity: 0.8 }}>
              Total pendiente en círculos: <strong>{fmt(totalCircleBalance, "COP")}</strong>
            </p>
          </section>
        )}

        {!isLoading && (
          <div className="debts-content">
            <div className="debts-column">

              {/* CUENTAS POR COBRAR */}
              <div>
                <div className="section-heading">
                  <div className="accent-bar secondary" />
                  <h3>Cuentas por Cobrar</h3>
                </div>
                <p className="debt-section-hint">
                  <span className="material-symbols-outlined" style={{ fontSize: "0.875rem", verticalAlign: "middle" }}>info</span>
                  {" "}Cuando el deudor marca como pagado, podrás confirmar la recepción.
                </p>
                {pendingReceivables.length === 0 ? (
                  <p className="empty">No tienes cobros pendientes</p>
                ) : (
                  <div className="debts-grid">
                    {pendingReceivables.map((item, idx) => {
                      const awaiting = item.estadoPago === "CONFIRMADA_PENDIENTE";
                      return (
                        <div key={item.idDeuda} className="debt-card debt-card--receive">
                          <div className="debt-card__header">
                            <div className="debt-card__avatar">
                              <span className="material-symbols-outlined">person</span>
                            </div>
                            <div className="debt-card__person">
                              <h4>
                                {item.idUsuarioDeudor && userNames[item.idUsuarioDeudor]
                                  ? userNames[item.idUsuarioDeudor]
                                  : `Cobro #${idx + 1}`}
                              </h4>
                              <span className="debt-card__badge debt-card__badge--pending">
                                {item.estadoPago ?? "PENDIENTE"}
                              </span>
                            </div>
                            {item.metodoPagoSugerido && (
                              <span className="debt-card__method">{item.metodoPagoSugerido}</span>
                            )}
                          </div>
                          <p className="debt-card__amount debt-card__amount--income">
                            +{fmt(item.monto ?? 0, (item.moneda ?? "COP") as Parameters<typeof fmt>[1])}
                          </p>
                          {awaiting ? (
                            <button
                              className="action-btn action-btn--receive"
                              onClick={() => handleConfirmReceive(item)}
                              disabled={confirmingId === item.idDeuda}
                            >
                              {confirmingId === item.idDeuda ? (
                                "Procesando..."
                              ) : (
                                <>
                                  <span className="material-symbols-outlined">check</span>
                                  Confirmar Recepción
                                </>
                              )}
                            </button>
                          ) : (
                            <button className="action-btn" disabled style={{ opacity: 0.6 }}>
                              <span className="material-symbols-outlined">hourglass_empty</span>
                              Esperando que el deudor pague
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* CUENTAS POR PAGAR */}
              <div style={{ paddingTop: "40px" }}>
                <div className="section-heading">
                  <div className="accent-bar primary" />
                  <h3>Cuentas por Pagar</h3>
                </div>
                <p className="debt-section-hint">
                  <span className="material-symbols-outlined" style={{ fontSize: "0.875rem", verticalAlign: "middle" }}>info</span>
                  {" "}Al marcar como pagado, el dinero se descuenta de tu saldo y queda pendiente de confirmación por el acreedor.
                </p>
                {pendingPayables.length === 0 ? (
                  <p className="empty">No tienes deudas pendientes de pago</p>
                ) : (
                  <div className="debts-grid">
                    {pendingPayables.map((item, idx) => {
                      const awaitingAcreedor = item.estadoPago === "CONFIRMADA_PENDIENTE";
                      return (
                        <div key={item.idDeuda} className="debt-card debt-card--pay">
                          <div className="debt-card__header">
                            <div className="debt-card__avatar debt-card__avatar--pay">
                              <span className="material-symbols-outlined">person</span>
                            </div>
                            <div className="debt-card__person">
                              <h4>
                                {item.idUsuarioAcreedor && userNames[item.idUsuarioAcreedor]
                                  ? userNames[item.idUsuarioAcreedor]
                                  : `Deuda #${idx + 1}`}
                              </h4>
                              <span className="debt-card__badge debt-card__badge--pending">
                                {item.estadoPago ?? "PENDIENTE"}
                              </span>
                            </div>
                            {item.metodoPagoSugerido && (
                              <span className="debt-card__method">{item.metodoPagoSugerido}</span>
                            )}
                          </div>
                          <p className="debt-card__amount debt-card__amount--expense">
                            -{fmt(item.monto ?? 0, (item.moneda ?? "COP") as Parameters<typeof fmt>[1])}
                          </p>
                          {awaitingAcreedor ? (
                            <button className="action-btn" disabled style={{ opacity: 0.6 }}>
                              <span className="material-symbols-outlined">hourglass_top</span>
                              Esperando confirmación del acreedor
                            </button>
                          ) : (
                            <button
                              className="action-btn action-btn--pay"
                              onClick={() => handleMarkPaid(item)}
                              disabled={confirmingId === item.idDeuda}
                            >
                              {confirmingId === item.idDeuda ? (
                                "Procesando..."
                              ) : (
                                <>
                                  <span className="material-symbols-outlined">payments</span>
                                  Marcar como Pagado
                                </>
                              )}
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            <aside style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
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
                        <p className="item-date">
                          {item.fechaConfirmada
                            ? new Date(item.fechaConfirmada).toLocaleDateString("es-ES")
                            : item.estadoPago}
                        </p>
                        <h5>
                          {item.idUsuarioAcreedor === user?.idUsuario
                            ? (item.idUsuarioDeudor && userNames[item.idUsuarioDeudor]) || `Deudor #${idx + 1}`
                            : (item.idUsuarioAcreedor && userNames[item.idUsuarioAcreedor]) || `Acreedor #${idx + 1}`}
                        </h5>
                        <p className="item-desc">{item.estadoPago}</p>
                        <p className={`item-amount ${item.idUsuarioAcreedor === user?.idUsuario ? "item-amount--income" : "item-amount--expense"}`}>
                          {item.idUsuarioAcreedor === user?.idUsuario ? "+" : "-"}
                          {fmt(item.monto ?? 0, (item.moneda ?? "COP") as Parameters<typeof fmt>[1])}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="quick-action-card">
                <h4>¿Nueva Deuda?</h4>
                <p>
                  Registra un compromiso de pago con otro usuario para mantener
                  tus finanzas al día.
                </p>
                <button className="neo-shadow" onClick={() => setShowForm((v) => !v)}>
                  {showForm ? "CANCELAR" : "AÑADIR DEUDA"}
                </button>
              </div>

              {showForm && (
                <form onSubmit={handleCreateDebt} className="transaction-form">
                  <MoneyInput
                    label="Monto"
                    name="monto"
                    value={form.monto}
                    onChange={(v) => setForm((f) => ({ ...f, monto: v }))}
                    placeholder="0"
                    required
                  />
                  <div className="input-group">
                    <label>Moneda</label>
                    <select
                      value={form.moneda}
                      onChange={(e) => setForm((f) => ({ ...f, moneda: e.target.value as CurrencyCode }))}
                    >
                      {SUPPORTED_CURRENCIES.map((c) => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>
                  <div className="input-group">
                    <label>ID Usuario Acreedor</label>
                    <div className="input-wrapper">
                      <span className="material-symbols-outlined">person</span>
                      <input
                        type="number"
                        placeholder="ID del usuario al que le debes"
                        value={form.idUsuarioAcreedor}
                        onChange={(e) => setForm((f) => ({ ...f, idUsuarioAcreedor: e.target.value }))}
                        required
                      />
                    </div>
                  </div>
                  <div className="input-group">
                    <label>Método de Pago</label>
                    <select
                      value={form.metodoPagoSugerido}
                      onChange={(e) => setForm((f) => ({ ...f, metodoPagoSugerido: e.target.value }))}
                    >
                      <option value="EFECTIVO">Efectivo</option>
                      <option value="TARJETA">Tarjeta</option>
                      <option value="TRANSFERENCIA">Transferencia</option>
                    </select>
                  </div>
                  <button type="submit" className="btn btn-primary neo-shadow" disabled={submitting}>
                    {submitting ? "Guardando..." : "Registrar Deuda"}
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
