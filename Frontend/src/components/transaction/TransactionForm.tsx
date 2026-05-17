import { useState } from "react";
import { Input } from "../common/Input";
import { Button } from "../common/Button";
import { MoneyInput } from "../common/MoneyInput";
import { SUPPORTED_CURRENCIES, type CurrencyCode } from "../../context/CurrencyContext";
import { CategorySelect } from "../category/CategorySelect";
import {
  validateAmount,
  validateDescription,
  validateCurrency,
} from "../../utils/validators";
import { useAuth } from "../../context/AuthContext";

interface TransactionFormProps {
  onSubmit: (data: {
    nombre: string;
    montoOriginal: number;
    tipoMovimiento: string;
    idUsuario: number;
    idCategoria?: number;
    idTipoMovimiento: number;
    monedaOriginal: string;
    tasaCambio: number;
  }) => Promise<void>;
  isLoading?: boolean;
}

export function TransactionForm({ onSubmit, isLoading }: TransactionFormProps) {
  const { user } = useAuth();
  const isGhost = user?.estado === 0;
  const [amount, setAmount] = useState<number>(0);
  const [description, setDescription] = useState("");
  const [type, setType] = useState<"DEPOSITO" | "RETIRO" | null>(isGhost ? "DEPOSITO" : null);
  const [ghostRetiroMsg, setGhostRetiroMsg] = useState(false);
  const [categoryId, setCategoryId] = useState<number | "">("");
  const [paymentMethodId, setPaymentMethodId] = useState<number | null>(null);
  const [moneda, setMoneda] = useState<CurrencyCode>("COP");
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Validar tipo de movimiento
    if (!type) {
      setError("Selecciona Retiro o Depósito");
      return;
    }

    // Validar método de pago
    if (!paymentMethodId) {
      setError("Selecciona un método de pago");
      return;
    }

    // Validar categoría
    if (!categoryId) {
      setError("Selecciona una categoría");
      return;
    }

    // Validar monto
    const amountError = validateAmount(amount);
    if (amountError) {
      setError(amountError);
      return;
    }

    // Validar descripción
    const descError = validateDescription(description);
    if (descError) {
      setError(descError);
      return;
    }

    // Validar moneda
    const currencyError = validateCurrency(moneda);
    if (currencyError) {
      setError(currencyError);
      return;
    }


    const storedUser = localStorage.getItem("user");
    let idUsuario = 0;
    if (storedUser) {
      try {
        const user = JSON.parse(storedUser);
        idUsuario = user.idUsuario;
      } catch {
        /* ignore */
      }
    }

    if (!idUsuario) {
      setError("No se pudo identificar al usuario. Inicia sesión nuevamente.");
      return;
    }

    try {
      await onSubmit({
        nombre: description.trim(),
        montoOriginal: amount,
        tipoMovimiento: type,
        idUsuario,
        idCategoria: Number(categoryId),
        idTipoMovimiento: paymentMethodId,
        monedaOriginal: moneda,
        tasaCambio: 1,
      });

      setAmount(0);
      setDescription("");
      setCategoryId("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al guardar");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="transaction-form">
      {error && <div className="error-alert">{error}</div>}

      <div className="type-selector">
        <button
          type="button"
          className={`type-btn ${type === "RETIRO" ? "active expense" : ""}`}
          onClick={() => {
            if (isGhost) { setGhostRetiroMsg(true); return; }
            setGhostRetiroMsg(false);
            setType("RETIRO");
            setCategoryId("");
          }}
        >
          Retiro
        </button>
        <button
          type="button"
          className={`type-btn ${type === "DEPOSITO" ? "active income" : ""}`}
          onClick={() => {
            setGhostRetiroMsg(false);
            setType("DEPOSITO");
            setCategoryId("");
          }}
        >
          Depósito
        </button>
      </div>
      {ghostRetiroMsg && (
        <div style={{ margin: "12px 0", padding: "14px 16px", borderLeft: "4px solid var(--primary)", background: "var(--surface-container-low)" }}>
          <p style={{ margin: 0, fontSize: "0.72rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--primary)", marginBottom: 6 }}>
            Cuenta invitada
          </p>
          <p style={{ margin: 0, fontSize: "0.84rem", color: "var(--on-surface-variant)", lineHeight: 1.5 }}>
            No puedes registrar gastos personales sin una cuenta activa. Solo puedes registrar depósitos o gastos dentro de un círculo.
          </p>
        </div>
      )}

      <div className="input-group">
        <label>Método de Pago</label>
        <div className="type-selector payment-method">
          <button
            type="button"
            className={`type-btn payment-btn ${paymentMethodId === 1 ? "active cash" : ""}`}
            onClick={() => setPaymentMethodId(1)}
          >
            <span className="material-symbols-outlined">payments</span>
            Efectivo
          </button>
          <button
            type="button"
            className={`type-btn payment-btn ${paymentMethodId === 2 ? "active card" : ""}`}
            onClick={() => setPaymentMethodId(2)}
          >
            <span className="material-symbols-outlined">credit_card</span>
            Tarjeta
          </button>
        </div>
      </div>

      <CategorySelect type={type} value={categoryId} onChange={setCategoryId} />

      <MoneyInput
        label="Monto"
        name="amount"
        value={amount}
        onChange={setAmount}
        required
      />
      <div className="input-group">
        <label htmlFor="moneda">Moneda</label>
        <select
          id="moneda"
          value={moneda}
          onChange={(e) => setMoneda(e.target.value as CurrencyCode)}
        >
          {SUPPORTED_CURRENCIES.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      </div>

      <Input
        label="Descripción"
        type="text"
        name="description"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        maxLength={200}
        required
      />

      <Button type="submit" isLoading={isLoading}>
        Guardar Transacción
      </Button>
    </form>
  );
}
