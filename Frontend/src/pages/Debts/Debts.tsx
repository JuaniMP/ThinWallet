import { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { Layout } from "../../components/layout/Layout";
import { api } from "../../services/api";
import { transactionService } from "../../services/transactionService";
import { MoneyInput } from "../../components/common/MoneyInput";
import {
  useCurrency,
  SUPPORTED_CURRENCIES,
  type CurrencyCode,
} from "../../context/CurrencyContext";
import type { Deuda, User } from "../../types";

type NewDeudaForm = {
  monto: number;
  idUsuarioAcreedor: string;
  metodoPagoSugerido: string;
  moneda: CurrencyCode;
};

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

  const fetchDebts = async () => {
    if (!user?.idUsuario) return;
    setIsLoading(true);
    setError(null);
    try {
      const [pay, rec] = await Promise.all([
        api.get<Deuda[]>(`/deudas/deudor/${user.idUsuario}`),
        api.get<Deuda[]>(`/deudas/acreedor/${user.idUsuario}`),
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

  useEffect(() => {
    fetchDebts();
  }, [user?.idUsuario]); // eslint-disable-line react-hooks/exhaustive-deps

  /** Yo pago una deuda → RETIRO en mi cuenta */
  const handleConfirmPayment = async (debt: Deuda) => {
    if (!user?.idUsuario) return;
    setConfirmingId(debt.idDeuda);
    try {
      const tx = await transactionService.create({
        nombre: "Pago de deuda",
        montoOriginal: debt.monto ?? 0,
        tipoMovimiento: "RETIRO",
        idUsuario: user.idUsuario,
        monedaOriginal: debt.moneda ?? "COP",
        tasaCambio: 1,
        contexto: `Pago de deuda #${debt.idDeuda}`,
      });
      await api.put(`/deudas/${debt.idDeuda}/confirmar`, { idTransaccion: tx.idTransaccion });
      await fetchDebts();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al confirmar pago");
    } finally {
      setConfirmingId(null);
    }
  };

  /** Alguien me paga → DEPÓSITO en mi cuenta */
  const handleConfirmReceive = async (debt: Deuda) => {
    if (!user?.idUsuario) return;
    setConfirmingId(debt.idDeuda);
    try {
      const tx = await transactionService.create({
        nombre: "Cobro de deuda",
        montoOriginal: debt.monto ?? 0,
        tipoMovimiento: "DEPOSITO",
        idUsuario: user.idUsuario,
        monedaOriginal: debt.moneda ?? "COP",
        tasaCambio: 1,
        contexto: `Cobro de deuda #${debt.idDeuda}`,
      });
      await api.put(`/deudas/${debt.idDeuda}/confirmar`, { idTransaccion: tx.idTransaccion });
      await fetchDebts();
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
      await api.post("/deudas", {
        monto: form.monto,
        idUsuarioDeudor: user.idUsuario,
        idUsuarioAcreedor: acreedorId,
        metodoPagoSugerido: form.metodoPagoSugerido,
        estadoPago: "PENDIENTE",
        moneda: form.moneda,
      });
      setForm({ monto: 0, idUsuarioAcreedor: "", metodoPagoSugerido: "EFECTIVO", moneda: prefCurrency });
      setShowForm(false);
      await fetchDebts();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al crear deuda");
    } finally {
      setSubmitting(false);
    }
  };

  const pendingPayables = payables.filter(
    (d) => d.estadoPago !== "CONFIRMADO" && d.estadoPago !== "PAGADO",
  );
  const pendingReceivables = receivables.filter(
    (d) => d.estadoPago !== "CONFIRMADO" && d.estadoPago !== "PAGADO",
  );
  const history = [...payables, ...receivables]
    .filter((d) => d.estadoPago === "CONFIRMADO" || d.estadoPago === "PAGADO")
    .sort((a, b) =>
      (b.fechaConfirmada ?? b.fechaCreacion ?? "").localeCompare(
        a.fechaConfirmada ?? a.fechaCreacion ?? "",
      ),
    )
    .slice(0, 5);

  const totalPayable = pendingPayables.reduce((s, d) => s + (d.monto ?? 0), 0);
  const totalReceivable = pendingReceivables.reduce((s, d) => s + (d.monto ?? 0), 0);
  const netBalance = totalReceivable - totalPayable;

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
                {/* Cobrar primero: entra dinero */}
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

                {/* Pagar segundo: sale dinero */}
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

              {/* Balance neto */}
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

        {!isLoading && (
          <div className="debts-content">
            <div className="debts-column">

              {/* ── CUENTAS POR COBRAR (arriba: alguien me debe a mí) ── */}
              <div>
                <div className="section-heading">
                  <div className="accent-bar secondary" />
                  <h3>Cuentas por Cobrar</h3>
                </div>
                <p className="debt-section-hint">
                  <span className="material-symbols-outlined" style={{ fontSize: "0.875rem", verticalAlign: "middle" }}>info</span>
                  {" "}Al confirmar la recepción, el dinero se suma a tu saldo.
                </p>
                {pendingReceivables.length === 0 ? (
                  <p className="empty">No tienes cobros pendientes</p>
                ) : (
                  <div className="debts-grid">
                    {pendingReceivables.map((item, idx) => (
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
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* ── CUENTAS POR PAGAR (abajo: yo le debo a alguien) ── */}
              <div style={{ paddingTop: "40px" }}>
                <div className="section-heading">
                  <div className="accent-bar primary" />
                  <h3>Cuentas por Pagar</h3>
                </div>
                <p className="debt-section-hint">
                  <span className="material-symbols-outlined" style={{ fontSize: "0.875rem", verticalAlign: "middle" }}>info</span>
                  {" "}Al marcar como pagado, el dinero se descuenta de tu saldo.
                </p>
                {pendingPayables.length === 0 ? (
                  <p className="empty">No tienes deudas pendientes de pago</p>
                ) : (
                  <div className="debts-grid">
                    {pendingPayables.map((item, idx) => (
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
                        <button
                          className="action-btn action-btn--pay"
                          onClick={() => handleConfirmPayment(item)}
                          disabled={confirmingId === item.idDeuda}
                        >
                          {confirmingId === item.idDeuda ? (
                            "Confirmando..."
                          ) : (
                            <>
                              <span className="material-symbols-outlined">payments</span>
                              Marcar como Pagado
                            </>
                          )}
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Right sidebar */}
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
