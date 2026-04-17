import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTransactions } from '../../context/TransactionContext';
import { TransactionCard } from '../../components/transaction/TransactionCard';
import { BalanceSummary } from '../../components/transaction/BalanceSummary';
import { Layout } from '../../components/layout/Layout';

export function TransactionList() {
  const { transactions, balance, isLoading, error, fetchTransactions, fetchBalance, deleteTransaction } = useTransactions();

  useEffect(() => {
    fetchTransactions();
    fetchBalance();
  }, []);

  const handleDelete = async (id: string) => {
    if (window.confirm('¿Eliminar esta transacción?')) {
      await deleteTransaction(id);
    }
  };

  if (error) {
    return (
      <Layout>
        <div className="transactions-page">
          <div className="error-alert">{error}</div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="transactions-page">
        <h2>Mis Transacciones</h2>
        
        <BalanceSummary balance={balance} isLoading={isLoading} />

        {isLoading && transactions.length === 0 ? (
          <div className="loading">Cargando transacciones...</div>
        ) : transactions.length === 0 ? (
          <div className="empty-state">
            <p>No hay transacciones aún</p>
            <Link to="/transactions/new">Agregar primera transacción</Link>
          </div>
        ) : (
          <div className="transaction-list">
            {transactions.map((transaction) => (
              <TransactionCard
                key={transaction.id}
                transaction={transaction}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}
