import { useState } from 'react';
import { Input } from '../common/Input';
import { Button } from '../common/Button';
import { CategorySelect } from '../category/CategorySelect';

interface TransactionFormProps {
  onSubmit: (data: {
    nombre: string;
    montoOriginal: number;
    tipoMovimiento: string;
    idUsuario: number;
    idCategoria?: number;
  }) => Promise<void>;
  isLoading?: boolean;
}

export function TransactionForm({ onSubmit, isLoading }: TransactionFormProps) {
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState<'DEPOSITO' | 'RETIRO'>('RETIRO');
  const [categoryId, setCategoryId] = useState<number | ''>('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      setError('El monto debe ser un número positivo');
      return;
    }

    if (!description.trim()) {
      setError('La descripción es requerida');
      return;
    }

    if (!categoryId) {
      setError('Por favor subministra una categoría válida');
      return;
    }

    // Get the user from localStorage
    const storedUser = localStorage.getItem('user');
    let idUsuario = 0;
    if (storedUser) {
      try {
        const user = JSON.parse(storedUser);
        idUsuario = user.idUsuario;
      } catch { /* ignore */ }
    }

    if (!idUsuario) {
      setError('No se pudo identificar al usuario. Inicia sesión nuevamente.');
      return;
    }

    try {
      await onSubmit({
        nombre: description.trim(),
        montoOriginal: amountNum,
        tipoMovimiento: type,
        idUsuario,
        idCategoria: Number(categoryId),
      });
      
      setAmount('');
      setDescription('');
      setCategoryId('');
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
          className={`type-btn ${type === 'RETIRO' ? 'active expense' : ''}`}
          onClick={() => {
            setType('RETIRO');
            setCategoryId(''); // Reset category when type changes
          }}
        >
          Retiro
        </button>
        <button
          type="button"
          className={`type-btn ${type === 'DEPOSITO' ? 'active income' : ''}`}
          onClick={() => {
            setType('DEPOSITO');
            setCategoryId(''); // Reset category when type changes
          }}
        >
          Depósito
        </button>
      </div>

      <CategorySelect 
        type={type} 
        value={categoryId} 
        onChange={setCategoryId} 
      />

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

      <Input
        label="Fecha"
        type="date"
        name="date"
        value={new Date().toISOString().split('T')[0]}
        onChange={() => {}}
        required
      />

      <Button type="submit" isLoading={isLoading}>
        Guardar Transacción
      </Button>
    </form>
  );
}
