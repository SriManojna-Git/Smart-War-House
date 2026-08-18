import React, { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  LayoutDashboard, 
  BrainCircuit, 
  Package,
  PackageOpen,
  ShoppingCart,
  PlaySquare,
  Bell,
  Search,
  LogOut,
  User as UserIcon,
  Moon,
  Sun,
  ShieldAlert,
  Zap,
  RotateCcw,
  Sparkles,
  CheckCircle2,
  X,
  History,
  Users,
  FileText,
  Layers,
  MapPin,
  Truck,
  ArrowLeftRight,
  TrendingUp,
  BarChart3,
  Scan
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../api';
import FuturisticBackground from './FuturisticBackground';
import GlobalSearchModal from './GlobalSearchModal';
import BarcodeScannerModal from './BarcodeScannerModal';

const Sidebar = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();
  
  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navSections = [
    {
      title: 'COMMAND CENTER',
      items: [
        { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
        { name: 'AI Decision Center', path: '/decisions', icon: BrainCircuit },
        { name: 'Decision History', path: '/decision-history', icon: History },
      ]
    },
    {
      title: 'INVENTORY & WAREHOUSE',
      items: [
        { name: 'Stock & Inventory', path: '/inventory', icon: Package },
        { name: 'Allocation Tracking', path: '/allocations', icon: PackageOpen },
        { name: 'Batches & Expiry', path: '/inventory/batches', icon: Layers },
        { name: '2D Layout & Heatmap', path: '/warehouse/layout', icon: MapPin },
        { name: 'Stock Transfers', path: '/transfers', icon: ArrowLeftRight },
        { name: 'Adjustments & Damage', path: '/inventory/adjustments', icon: ShieldAlert },
      ]
    },
    {
      title: 'PROCUREMENT & LOGISTICS',
      items: [
        { name: 'Purchase Orders', path: '/procurement/orders', icon: FileText },
        { name: 'Supplier Management', path: '/procurement/suppliers', icon: Users },
        { name: 'Shipment Tracking', path: '/shipments', icon: Truck },
        { name: 'Orders & Priority', path: '/orders', icon: ShoppingCart },
      ]
    },
    {
      title: 'ANALYTICS & AI',
      items: [
        { name: 'Demand Forecasting', path: '/analytics/forecast', icon: TrendingUp },
        { name: 'AI Optimization', path: '/analytics/optimization', icon: Sparkles },
        { name: 'Valuation & Turnover', path: '/analytics/valuation', icon: BarChart3 },
        { name: 'What-If Simulator', path: '/simulator', icon: PlaySquare },
        { name: 'Exceptions & Audits', path: '/exceptions', icon: ShieldAlert },
        { name: 'Smart Alerts', path: '/alerts', icon: Bell },
      ]
    }
  ];

  return (
    <aside className="w-64 glass-sidebar flex flex-col h-screen overflow-y-auto z-10 select-none">
      <div className="p-5 border-b border-border/50">
        <h1 className="text-lg font-black text-text flex items-center gap-2 tracking-tight">
          <BrainCircuit className="text-primary w-6 h-6 animate-pulse" />
          SMARTFULFILL <span className="text-primary">AI</span>
        </h1>
        <p className="text-[10px] font-bold text-textMuted uppercase tracking-widest mt-0.5">Autonomous Smart WMS</p>
      </div>

      <nav className="flex-1 px-3 py-3 space-y-4">
        {navSections.map((sec, sIdx) => (
          <div key={sIdx} className="space-y-1">
            <h4 className="px-3 text-[10px] font-bold text-textMuted uppercase tracking-wider">{sec.title}</h4>
            {sec.items.map((item) => (
              <NavLink
                key={item.name}
                to={item.path}
                className={({ isActive }) =>
                  `flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                    isActive 
                      ? 'bg-primary text-white shadow-md shadow-primary/25 font-semibold' 
                      : 'text-textMuted hover:bg-border/10 hover:text-text'
                  }`
                }
              >
                <item.icon className="w-3.5 h-3.5 flex-shrink-0" />
                <span className="truncate">{item.name}</span>
              </NavLink>
            ))}
          </div>
        ))}
      </nav>

      <div className="p-3 border-t border-border/50 space-y-1 text-xs">
        <NavLink 
          to="/profile"
          className={({ isActive }) =>
            `flex items-center gap-2 px-3 py-2 rounded-xl transition-colors w-full ${
              isActive ? 'text-text bg-border/20 font-medium' : 'text-textMuted hover:text-text hover:bg-border/10'
            }`
          }
        >
          <UserIcon className="w-3.5 h-3.5" />
          My Profile
        </NavLink>
        <button 
          onClick={handleLogout}
          className="flex items-center gap-2 px-3 py-2 text-danger hover:bg-danger/10 transition-colors w-full rounded-xl border border-transparent font-medium"
        >
          <LogOut className="w-3.5 h-3.5" />
          Log Out
        </button>
      </div>
    </aside>
  );
};

const Header = () => {
  const { user } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [showDemoModal, setShowDemoModal] = useState(false);
  const [demoTriggering, setDemoTriggering] = useState(false);
  const [demoResetting, setDemoResetting] = useState(false);
  const [demoResult, setDemoResult] = useState<any>(null);
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [showScannerModal, setShowScannerModal] = useState(false);

  const handleTriggerDemo = async () => {
    setDemoTriggering(true);
    try {
      const res = await api.post('/api/demo/trigger');
      setDemoResult(res.data);
    } catch (e) {
      console.error('Demo trigger failed', e);
    } finally {
      setDemoTriggering(false);
    }
  };

  const handleResetDemo = async () => {
    setDemoResetting(true);
    try {
      await api.post('/api/demo/reset');
      setDemoResult(null);
      setShowDemoModal(false);
      window.location.reload();
    } catch (e) {
      console.error('Demo reset failed', e);
    } finally {
      setDemoResetting(false);
    }
  };

  return (
    <header className="h-16 glass-header border-b border-border/50 flex items-center justify-between px-6 z-10">
      {/* Global Universal Search Trigger */}
      <button 
        onClick={() => setShowSearchModal(true)}
        className="flex items-center gap-2.5 bg-surface/60 border border-border/60 hover:border-primary/50 text-textMuted px-3.5 py-1.5 rounded-xl w-64 text-xs transition-all shadow-sm group text-left"
      >
        <Search className="w-3.5 h-3.5 text-textMuted group-hover:text-primary transition-colors" />
        <span className="truncate">Universal Search (SKU, PO, Lot)...</span>
      </button>

      <div className="flex items-center gap-3">
        {/* Quick Barcode Scanner Trigger */}
        <button 
          onClick={() => setShowScannerModal(true)}
          className="btn-secondary text-xs px-3 py-1.5 rounded-xl flex items-center gap-1.5 font-bold shadow-sm"
          title="Open Barcode & QR Scanner"
        >
          <Scan className="w-3.5 h-3.5 text-primary" />
          <span className="hidden sm:inline">Scanner</span>
        </button>

        {/* Live Simulation Judge Mode */}
        <button 
          onClick={() => setShowDemoModal(true)}
          className="px-3 py-1.5 rounded-xl text-xs font-bold bg-gradient-to-r from-amber-500/20 via-orange-500/20 to-amber-500/20 border border-amber-500/30 text-amber-300 hover:border-amber-400 flex items-center gap-1.5 transition-all shadow-sm"
        >
          <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-spin" />
          <span className="hidden sm:inline">Judge Scenario Mode</span>
        </button>

        {/* Dark / Light Theme Toggle */}
        <button 
          onClick={toggleTheme} 
          className="p-2 rounded-xl text-textMuted hover:text-text hover:bg-border/20 transition-all border border-border/40"
          title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
        >
          {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-indigo-500" />}
        </button>

        <NavLink to="/profile" className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-border/20 transition-all">
          <div className="w-8 h-8 rounded-full bg-primary/20 border border-primary/40 flex items-center justify-center text-primary font-bold text-xs">
            {user?.full_name?.charAt(0) || 'A'}
          </div>
          <div className="hidden md:block text-left text-xs">
            <p className="font-bold text-text leading-tight">{user?.full_name || 'Admin User'}</p>
            <p className="text-[10px] text-textMuted font-mono">Lead WMS Orchestrator</p>
          </div>
        </NavLink>
      </div>

      {/* Global Modals */}
      <GlobalSearchModal isOpen={showSearchModal} onClose={() => setShowSearchModal(false)} />
      <BarcodeScannerModal isOpen={showScannerModal} onClose={() => setShowScannerModal(false)} />

      {/* Judge Scenario Modal */}
      <AnimatePresence>
        {showDemoModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowDemoModal(false)} className="absolute inset-0 bg-background/80 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="relative w-full max-w-lg glass-card p-6 space-y-4 shadow-2xl">
              <div className="flex justify-between items-center border-b border-border/50 pb-3">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-amber-400" />
                  <h3 className="text-base font-bold text-text">Autonomous Simulation Scenarios</h3>
                </div>
                <button onClick={() => setShowDemoModal(false)} className="text-textMuted hover:text-text"><X className="w-5 h-5" /></button>
              </div>

              <p className="text-xs text-textMuted">
                Instantly inject complex real-time anomalies (stockouts, SLA deadline bottlenecks, and courier transit delays) to demonstrate SmartFulfill AI's autonomous optimization.
              </p>

              <div className="space-y-3 pt-2">
                <button
                  onClick={handleTriggerDemo}
                  disabled={demoTriggering}
                  className="w-full btn-primary py-3 rounded-xl font-bold flex items-center justify-center gap-2 text-xs shadow-lg shadow-primary/25"
                >
                  {demoTriggering ? <Sparkles className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
                  Inject Multi-Zone Anomaly Scenario
                </button>

                <button
                  onClick={handleResetDemo}
                  disabled={demoResetting}
                  className="w-full btn-secondary py-2.5 rounded-xl font-bold flex items-center justify-center gap-2 text-xs text-textMuted hover:text-danger hover:border-danger/30"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  Reset Warehouse State to Baseline
                </button>
              </div>

              {demoResult && (
                <div className="p-3.5 rounded-xl bg-success/10 border border-success/30 text-xs space-y-1">
                  <p className="font-bold text-success flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4" /> Scenario Injected Successfully!
                  </p>
                  <p className="text-textMuted">{demoResult.message}</p>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </header>
  );
};

const Layout = () => {
  return (
    <div className="flex h-screen overflow-hidden bg-background text-text relative">
      <FuturisticBackground variant="app" />
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden relative z-10">
        <Header />
        <main className="flex-1 overflow-y-auto p-6 md:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default Layout;
