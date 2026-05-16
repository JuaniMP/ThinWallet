import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { TransactionProvider } from "./context/TransactionContext";
import { CurrencyProvider } from "./context/CurrencyContext";
import { Login } from "./pages/Auth/Login";
import { Register } from "./pages/Auth/Register";
import { ForgotPassword } from "./pages/Auth/ForgotPassword";
import { Verify } from "./pages/Auth/Verify";
import { ReclamarPerfil } from "./pages/Auth/ReclamarPerfil";
import { Dashboard } from "./pages/Dashboard/Dashboard";
import { TransactionList } from "./pages/Transactions/TransactionList";
import { NewTransaction } from "./pages/Transactions/NewTransaction";
import { Profile } from "./pages/Profile/Profile";
import { Groups } from "./pages/Groups/Groups";
import { CircleDetail } from "./pages/Groups/CircleDetail";
import { Debts } from "./pages/Debts/Debts";
import { Reports } from "./pages/Reports/Reports";
import { Goals } from "./pages/Goals/Goals";
import { ScheduledExpenses } from "./pages/Scheduled/ScheduledExpenses";
import { GastosHormiga } from "./pages/GastosHormiga/GastosHormiga";
import { CierreMensual } from "./pages/Ciclos/CierreMensual";
import "./App.css";

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) return <div className="loading">Cargando...</div>;
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" />;
}

function NonGhostRoute({ children }: { children: React.ReactNode }) {
  const { user, isAuthenticated, isLoading } = useAuth();

  if (isLoading) return <div className="loading">Cargando...</div>;
  if (!isAuthenticated) return <Navigate to="/login" />;
  if (user?.idTipoUsuario === 3) return <Navigate to="/grupos" />;
  return <>{children}</>;
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) return <div className="loading">Cargando...</div>;
  return !isAuthenticated ? <>{children}</> : <Navigate to="/dashboard" />;
}

function AppRoutes() {
  return (
    <Routes>
      <Route
        path="/login"
        element={
          <PublicRoute>
            <Login />
          </PublicRoute>
        }
      />
      <Route
        path="/register"
        element={
          <PublicRoute>
            <Register />
          </PublicRoute>
        }
      />
      <Route
        path="/forgot-password"
        element={
          <PublicRoute>
            <ForgotPassword />
          </PublicRoute>
        }
      />
      <Route
        path="/verify"
        element={
          <PublicRoute>
            <Verify />
          </PublicRoute>
        }
      />
      <Route
        path="/reclamar-perfil"
        element={
          <PublicRoute>
            <ReclamarPerfil />
          </PublicRoute>
        }
      />

      <Route
        path="/dashboard"
        element={
          <NonGhostRoute>
            <Dashboard />
          </NonGhostRoute>
        }
      />
      <Route
        path="/transactions"
        element={
          <NonGhostRoute>
            <TransactionList />
          </NonGhostRoute>
        }
      />
      <Route
        path="/transactions/new"
        element={
          <NonGhostRoute>
            <NewTransaction />
          </NonGhostRoute>
        }
      />
      <Route
        path="/profile"
        element={
          <PrivateRoute>
            <Profile />
          </PrivateRoute>
        }
      />
      <Route
        path="/grupos"
        element={
          <PrivateRoute>
            <Groups />
          </PrivateRoute>
        }
      />
      <Route
        path="/grupos/:id"
        element={
          <PrivateRoute>
            <CircleDetail />
          </PrivateRoute>
        }
      />
      <Route
        path="/debts"
        element={
          <PrivateRoute>
            <Debts />
          </PrivateRoute>
        }
      />
      <Route
        path="/reports"
        element={
          <NonGhostRoute>
            <Reports />
          </NonGhostRoute>
        }
      />
      <Route
        path="/goals"
        element={
          <NonGhostRoute>
            <Goals />
          </NonGhostRoute>
        }
      />
      <Route
        path="/scheduled"
        element={
          <PrivateRoute>
            <ScheduledExpenses />
          </PrivateRoute>
        }
      />
      <Route
        path="/gastos-hormiga"
        element={
          <PrivateRoute>
            <GastosHormiga />
          </PrivateRoute>
        }
      />
      <Route
        path="/cierre-mensual"
        element={
          <PrivateRoute>
            <CierreMensual />
          </PrivateRoute>
        }
      />

      <Route path="/" element={<Navigate to="/dashboard" />} />
    </Routes>
  );
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <CurrencyProvider>
          <TransactionProvider>
            <AppRoutes />
          </TransactionProvider>
        </CurrencyProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
