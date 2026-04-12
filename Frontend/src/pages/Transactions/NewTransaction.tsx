import { useNavigate } from 'react-router-dom';
import { useTransactions } from '../../context/TransactionContext';
import { TransactionForm } from '../../components/transaction/TransactionForm';
import { Layout } from '../../components/layout/Layout';
import type { CreateTransactionRequest } from '../../types';

export function NewTransaction() {
  const { createTransaction, isLoading, error } = useTransactions();
  const navigate = useNavigate();

  const handleSubmit = async (data: CreateTransactionRequest) => {
    await createTransaction(data);
    navigate('/transactions');
  };

  return (
    <Layout>
      <div className="new-transaction-page">
        <h2>Nueva Transacción</h2>
        
        {error && <div className="error-alert">{error}</div>}
        
        <TransactionForm onSubmit={handleSubmit} isLoading={isLoading} />
      </div>
    </Layout>
  );
}
