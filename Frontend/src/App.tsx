import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { TransactionProvider } from './context/TransactionContext';
import { AuthGuard } from './components/layout/AuthGuard';
import { Login } from './pages/Auth/Login';
import { Register } from './pages/Auth/Register';
import { ForgotPassword } from './pages/Auth/ForgotPassword';
import { Dashboard } from './pages/Dashboard/Dashboard';
import { TransactionList } from './pages/Transactions/TransactionList';
import { NewTransaction } from './pages/Transactions/NewTransaction';
import { Debts } from './pages/Debts/Debts';
import { Profile } from './pages/Profile/Profile';
import { Groups } from './pages/Groups/Groups';
import './App.css';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <TransactionProvider>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            
            <Route
              path="/dashboard"
              element={
                <AuthGuard>
                  <Dashboard />
                </AuthGuard>
              }
            />
            <Route
              path="/transactions"
              element={
                <AuthGuard>
                  <TransactionList />
                </AuthGuard>
              }
            />
            <Route
              path="/transactions/new"
              element={
                <AuthGuard>
                  <NewTransaction />
                </AuthGuard>
              }
            />
            <Route
              path="/debts"
              element={
                <AuthGuard>
                  <Debts />
                </AuthGuard>
              }
            />
            <Route
              path="/profile"
              element={
                <AuthGuard>
                  <Profile />
                </AuthGuard>
              }
            />
            <Route
              path="/grupos"
              element={
                <AuthGuard>
                  <Groups />
                </AuthGuard>
              }
            />
            
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </TransactionProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
