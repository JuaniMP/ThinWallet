import { useState } from 'react';
import type { CreateTransactionRequest } from '../../types';
import { Input } from '../common/Input';
import { Button } from '../common/Button';
import { CategorySelect } from '../category/CategorySelect';

interface TransactionFormProps {
  onSubmit: (data: CreateTransactionRequest) => Promise<void>;
  isLoading?: boolean;
}

export function TransactionForm({ onSubmit, isLoading }: TransactionFormProps) {
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState<'income' | 'expense'>('expense');
  const [categoryId, setCategoryId] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      setError('El monto debe ser un número positivo');
      return;
    }

    if (!categoryId) {
      setError('Selecciona una categoría');
      return;
    }

    try {
      await onSubmit({
        amount: amountNum,
        description,
        type,
        categoryId,
        date,
      });
      
      setAmount('');
      setDescription('');
      setCategoryId('');
      setDate(new Date().toISOString().split('T')[0]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="transaction-form">
      {error && <div className="error-alert">{error}</div>}

      <div className="type-selector">
        <button
          type="button"
          className={`type-btn ${type === 'expense' ? 'active expense' : ''}`}
          onClick={() => setType('expense')}
        >
          Gasto
        </button>
        <button
          type="button"
          className={`type-btn ${type === 'income' ? 'active income' : ''}`}
          onClick={() => setType('income')}
        >
          Ingreso
        </button>
      </div>

      <Input
        label="Monto"
        type="number"
        step="0.01"
        min="0"
        name="amount"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        required
      />

      <Input
        label="Descripción"
        type="text"
        name="description"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        maxLength={500}
        required
      />

      <CategorySelect type={type} value={categoryId} onChange={setCategoryId} />

      <Input
        label="Fecha"
        type="date"
        name="date"
        value={date}
        onChange={(e) => setDate(e.target.value)}
        required
      />

      <Button type="submit" isLoading={isLoading}>
        Guardar Transacción
      </Button>
    </form>
  );
}
