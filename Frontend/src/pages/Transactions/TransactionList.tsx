import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTransactions } from '../../context/TransactionContext';
import { useAuth } from '../../context/AuthContext';
import { transactionService } from '../../services/transactionService';
import { TransactionCard } from '../../components/transaction/TransactionCard';
import { Layout } from '../../components/layout/Layout';

export function TransactionList() {
  const { transactions, isLoading, error, fetchTransactions, deleteTransaction } = useTransactions();
  const { user } = useAuth();
  const [saldoTotal, setSaldoTotal] = useState<number>(0);
  const hasFetched = useRef(false);

  useEffect(() => {
    if (hasFetched.current) return;
    hasFetched.current = true;

    fetchTransactions();
    
    if (user?.idUsuario) {
      transactionService.getSaldo(user.idUsuario)
        .then(res => setSaldoTotal(res.saldoTotal))
        .catch(() => setSaldoTotal(0));
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

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
        
        <div className="balance-summary">
          <div className="balance-item total positive">
            <span className="balance-label">Saldo Total</span>
            <span className="balance-value">${saldoTotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
          </div>
        </div>

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
