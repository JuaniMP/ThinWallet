import type { Transaction } from '../../types';

interface TransactionCardProps {
  transaction: Transaction;
  onDelete?: (id: string) => void;
}

export function TransactionCard({ transaction, onDelete }: TransactionCardProps) {
  const isIncome = transaction.type === 'income';

  return (
    <div className={`transaction-card ${transaction.type}`}>
      <div className="transaction-info">
        <span className="transaction-description">{transaction.description}</span>
        <span className="transaction-date">
          {new Date(transaction.date).toLocaleDateString('es-ES')}
        </span>
      </div>
      <div className="transaction-amount">
        <span className={isIncome ? 'amount-income' : 'amount-expense'}>
          {isIncome ? '+' : '-'}${transaction.amount.toFixed(2)}
        </span>
        {onDelete && (
          <button
            className="delete-btn"
            onClick={() => onDelete(transaction.id)}
            aria-label="Eliminar"
          >
            ×
          </button>
        )}
      </div>
    </div>
  );
}
