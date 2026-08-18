import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import DecisionCenter from './pages/DecisionCenter';
import DecisionHistory from './pages/DecisionHistory';
import Inventory from './pages/Inventory';
import Allocations from './pages/Allocations';
import Exceptions from './pages/Exceptions';
import Orders from './pages/Orders';
import Simulator from './pages/Simulator';
import Alerts from './pages/Alerts';
import Login from './pages/Login';
import Onboarding from './pages/Onboarding';
import Profile from './pages/Profile';
import Suppliers from './pages/Suppliers';
import PurchaseOrders from './pages/PurchaseOrders';
import Batches from './pages/Batches';
import WarehouseLayout from './pages/WarehouseLayout';
import Shipments from './pages/Shipments';
import StockTransfers from './pages/StockTransfers';
import InventoryAnalytics from './pages/InventoryAnalytics';
import DemandForecast from './pages/DemandForecast';
import AIOptimization from './pages/AIOptimization';
import StockAdjustments from './pages/StockAdjustments';

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <div className="min-h-screen bg-background flex items-center justify-center text-text">Loading...</div>;
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
};

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/onboarding" element={
        <ProtectedRoute>
          <Onboarding />
        </ProtectedRoute>
      } />
      
      <Route path="/" element={
        <ProtectedRoute>
          <Layout />
        </ProtectedRoute>
      }>
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="decisions" element={<DecisionCenter />} />
        <Route path="decision-history" element={<DecisionHistory />} />
        <Route path="inventory" element={<Inventory />} />
        <Route path="inventory/batches" element={<Batches />} />
        <Route path="inventory/adjustments" element={<StockAdjustments />} />
        <Route path="allocations" element={<Allocations />} />
        <Route path="warehouse/layout" element={<WarehouseLayout />} />
        <Route path="procurement/suppliers" element={<Suppliers />} />
        <Route path="procurement/orders" element={<PurchaseOrders />} />
        <Route path="shipments" element={<Shipments />} />
        <Route path="transfers" element={<StockTransfers />} />
        <Route path="analytics/forecast" element={<DemandForecast />} />
        <Route path="analytics/optimization" element={<AIOptimization />} />
        <Route path="analytics/valuation" element={<InventoryAnalytics />} />
        <Route path="exceptions" element={<Exceptions />} />
        <Route path="orders" element={<Orders />} />
        <Route path="simulator" element={<Simulator />} />
        <Route path="alerts" element={<Alerts />} />
        <Route path="profile" element={<Profile />} />
      </Route>
    </Routes>
  );
}

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Router>
          <AppRoutes />
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
