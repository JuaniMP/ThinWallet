import type { Balance } from '../../types';

interface BalanceSummaryProps {
  balance: Balance | null;
  isLoading?: boolean;
}

export function BalanceSummary({ balance, isLoading }: BalanceSummaryProps) {
  if (isLoading) {
    return <div className="balance-skeleton">Cargando balance...</div>;
  }

  if (!balance) {
    return null;
  }

  return (
    <div className="balance-summary">
      <div className="balance-item income">
        <span className="balance-label">Ingresos</span>
        <span className="balance-value">+${balance.totalIncome.toFixed(2)}</span>
      </div>
      <div className="balance-item expense">
        <span className="balance-label">Gastos</span>
        <span className="balance-value">-${balance.totalExpense.toFixed(2)}</span>
      </div>
      <div className={`balance-item total ${balance.balance >= 0 ? 'positive' : 'negative'}`}>
        <span className="balance-label">Balance</span>
        <span className="balance-value">${balance.balance.toFixed(2)}</span>
      </div>
    </div>
  );
}
