import { lazy, Suspense, type ComponentType } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { TransactionProvider } from "./context/TransactionContext";
import { CurrencyProvider } from "./context/CurrencyContext";
import "./App.css";

/** Carga cada página bajo demanda para no enviar toda la app en el primer render. */
function lazyPage<K extends string>(
  load: () => Promise<Record<K, ComponentType>>,
  name: K,
) {
  return lazy(() => load().then((module) => ({ default: module[name] })));
}

const Login = lazyPage(() => import("./pages/Auth/Login"), "Login");
const Register = lazyPage(() => import("./pages/Auth/Register"), "Register");
const ForgotPassword = lazyPage(
  () => import("./pages/Auth/ForgotPassword"),
  "ForgotPassword",
);
const Verify = lazyPage(() => import("./pages/Auth/Verify"), "Verify");
const ReclamarPerfil = lazyPage(
  () => import("./pages/Auth/ReclamarPerfil"),
  "ReclamarPerfil",
);
const Dashboard = lazyPage(
  () => import("./pages/Dashboard/Dashboard"),
  "Dashboard",
);
const TransactionList = lazyPage(
  () => import("./pages/Transactions/TransactionList"),
  "TransactionList",
);
const NewTransaction = lazyPage(
  () => import("./pages/Transactions/NewTransaction"),
  "NewTransaction",
);
const Profile = lazyPage(() => import("./pages/Profile/Profile"), "Profile");
const Groups = lazyPage(() => import("./pages/Groups/Groups"), "Groups");
const CircleDetail = lazyPage(
  () => import("./pages/Groups/CircleDetail"),
  "CircleDetail",
);
const Debts = lazyPage(() => import("./pages/Debts/Debts"), "Debts");
const Reports = lazyPage(() => import("./pages/Reports/Reports"), "Reports");
const Goals = lazyPage(() => import("./pages/Goals/Goals"), "Goals");
const ScheduledExpenses = lazyPage(
  () => import("./pages/Scheduled/ScheduledExpenses"),
  "ScheduledExpenses",
);
const GastosHormiga = lazyPage(
  () => import("./pages/GastosHormiga/GastosHormiga"),
  "GastosHormiga",
);
const CierreMensual = lazyPage(
  () => import("./pages/Ciclos/CierreMensual"),
  "CierreMensual",
);

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) return <div className="loading">Cargando...</div>;
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" />;
}

function NonGhostRoute({ children }: { children: React.ReactNode }) {
  const { user, isAuthenticated, isLoading } = useAuth();

  if (isLoading) return <div className="loading">Cargando...</div>;
  if (!isAuthenticated) return <Navigate to="/login" />;
  if (user?.estado === 0) return <Navigate to="/grupos" />;
  return <>{children}</>;
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) return <div className="loading">Cargando...</div>;
  return !isAuthenticated ? <>{children}</> : <Navigate to="/dashboard" />;
}

function AppRoutes() {
  return (
    <Suspense fallback={<div className="loading">Cargando...</div>}>
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
            <PrivateRoute>
              <NewTransaction />
            </PrivateRoute>
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
    </Suspense>
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
