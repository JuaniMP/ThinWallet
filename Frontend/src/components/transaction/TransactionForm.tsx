import { useState } from "react";
import { Input } from "../common/Input";
import { Button } from "../common/Button";
import { MoneyInput } from "../common/MoneyInput";
import {
  SUPPORTED_CURRENCIES,
  type CurrencyCode,
} from "../../context/CurrencyContext";
import { CategorySelect } from "../category/CategorySelect";

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
  const [amount, setAmount] = useState<number>(0);
  const [description, setDescription] = useState("");
  const [type, setType] = useState<"DEPOSITO" | "RETIRO">("RETIRO");
  const [categoryId, setCategoryId] = useState<number | "">("");
  const [paymentMethodId, setPaymentMethodId] = useState<number>(1);
  const [moneda, setMoneda] = useState<CurrencyCode>("COP");
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!amount || amount <= 0) {
      setError("El monto debe ser un número positivo");
      return;
    }

    if (!description.trim()) {
      setError("La descripción es requerida");
      return;
    }

    if (!categoryId) {
      setError("Por favor subministra una categoría válida");
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
            setType("DEPOSITO");
            setCategoryId("");
          }}
        >
          Depósito
        </button>
      </div>

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

      <div className="amount-currency-row">
        <MoneyInput
          label="Monto"
          name="amount"
          value={amount}
          onChange={setAmount}
          prefix={moneda}
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
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
      </div>

      <Input
        label="Descripción"
        type="text"
        name="description"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        maxLength={500}
        required
      />

      <Button type="submit" isLoading={isLoading}>
        Guardar Transacción
      </Button>
    </form>
  );
}
