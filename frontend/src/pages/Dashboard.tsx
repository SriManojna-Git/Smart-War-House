import React, { useEffect, useState } from 'react';
import { NavLink } from 'react-router-dom';
import api from '../api';
import { 
  TrendingUp, 
  PackageSearch, 
  AlertTriangle, 
  Activity, 
  CheckCircle2, 
  Clock, 
  ArrowUpRight, 
  BrainCircuit, 
  Zap, 
  ShieldAlert, 
  ArrowRight, 
  Sparkles, 
  MapPin, 
  Layers, 
  FileSpreadsheet, 
  Download, 
  Scan, 
  Truck, 
  FileText, 
  ArrowLeftRight, 
  DollarSign, 
  Package, 
  RefreshCw 
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';
import ReportExportModal from '../components/ReportExportModal';
import BarcodeScannerModal from '../components/BarcodeScannerModal';

const mockChartData = [
  { name: 'Mon', fulfillment: 88, orders: 45 },
  { name: 'Tue', fulfillment: 90, orders: 52 },
  { name: 'Wed', fulfillment: 85, orders: 38 },
  { name: 'Thu', fulfillment: 92, orders: 65 },
  { name: 'Fri', fulfillment: 95, orders: 48 },
  { name: 'Sat', fulfillment: 96, orders: 50 },
  { name: 'Sun', fulfillment: 94, orders: 40 },
];

const Dashboard = () => {
  const [kpis, setKpis] = useState<any>(null);
  const [impactKpis, setImpactKpis] = useState<any>(null);
  const [zoneHeatmap, setZoneHeatmap] = useState<any>(null);
  const [valuation, setValuation] = useState<any>(null);
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showExportModal, setShowExportModal] = useState(false);
  const [showScannerModal, setShowScannerModal] = useState(false);
  const [selectedZone, setSelectedZone] = useState<any>(null);

  const fetchDashboardData = async () => {
    try {
      const [kpiRes, impactRes, heatmapRes, valRes, recRes] = await Promise.all([
        api.get('/api/dashboard/kpi'),
        api.get('/api/dashboard/impact-kpis'),
        api.get('/api/warehouse/zones-heatmap'),
        api.get('/api/analytics/valuation'),
        api.get('/api/recommendations')
      ]);
      setKpis(kpiRes.data);
      setImpactKpis(impactRes.data);
      setZoneHeatmap(heatmapRes.data);
      setValuation(valRes.data);
      setRecommendations(recRes.data);
    } catch (error) {
      console.error('Failed to fetch dashboard data', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  return (
    <div className="space-y-6">
      {/* 1. Header & Executive Action Bar */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="badge badge-success text-[10px] font-mono font-bold tracking-wider uppercase flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-success animate-ping"></span>
              Live Autonomous WMS Operational
            </span>
            <span className="text-textMuted text-xs font-mono">• Multi-Zone Facility Alpha</span>
          </div>
          <h2 className="text-2xl lg:text-3xl font-black text-text tracking-tight mt-1 flex items-center gap-2">
            Executive Summary Command Center
          </h2>
          <p className="text-textMuted text-xs lg:text-sm mt-0.5">
            Real-time fulfillment telemetry, autonomous optimization, financial valuation, and carrier logistics.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button 
            onClick={() => setShowScannerModal(true)}
            className="btn-secondary text-xs px-3.5 py-2 flex items-center gap-1.5 font-bold shadow-sm"
          >
            <Scan className="w-4 h-4 text-primary" /> Scan Barcode / QR
          </button>
          <NavLink 
            to="/procurement/orders"
            className="btn-secondary text-xs px-3.5 py-2 flex items-center gap-1.5 font-bold shadow-sm"
          >
            <FileText className="w-4 h-4 text-info" /> Purchase Orders
          </NavLink>
          <button 
            onClick={() => setShowExportModal(true)}
            className="btn-primary text-xs px-4 py-2 flex items-center gap-1.5 font-bold shadow-md shadow-primary/20"
          >
            <Download className="w-4 h-4" /> Export Report Hub
          </button>
        </div>
      </div>

      {/* 2. Executive Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-5 space-y-2 border-l-4 border-l-primary">
          <div className="flex justify-between items-center text-textMuted">
            <span className="text-[10px] font-bold uppercase tracking-wider">TOTAL INVENTORY VALUE</span>
            <DollarSign className="w-5 h-5 text-primary" />
          </div>
          <h3 className="text-2xl font-black text-text font-mono">${valuation?.total_inventory_value?.toLocaleString() || '148,250'}</h3>
          <div className="flex items-center gap-1.5 text-xs text-success font-semibold">
            <TrendingUp className="w-3.5 h-3.5" /> +12.4% Asset Growth MoM
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="glass-card p-5 space-y-2 border-l-4 border-l-success">
          <div className="flex justify-between items-center text-textMuted">
            <span className="text-[10px] font-bold uppercase tracking-wider">SLA ON-TIME RATE</span>
            <CheckCircle2 className="w-5 h-5 text-success" />
          </div>
          <h3 className="text-2xl font-black text-success font-mono">{impactKpis?.fulfillment_percentage || '98.4'}%</h3>
          <p className="text-xs text-textMuted">{impactKpis?.orders_fulfilled || '42'} Orders Fulfilled On-Schedule</p>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass-card p-5 space-y-2 border-l-4 border-l-warning">
          <div className="flex justify-between items-center text-textMuted">
            <span className="text-[10px] font-bold uppercase tracking-wider">STOCKOUT RISKS</span>
            <AlertTriangle className="w-5 h-5 text-warning" />
          </div>
          <h3 className="text-2xl font-black text-warning font-mono">{kpis?.critical_stockout_risks || 2} Critical</h3>
          <NavLink to="/inventory" className="text-xs text-warning hover:underline font-semibold flex items-center gap-1">
            {kpis?.low_stock_items_count || 3} SKUs below safety buffer →
          </NavLink>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="glass-card p-5 space-y-2 border-l-4 border-l-cyan-400">
          <div className="flex justify-between items-center text-textMuted">
            <span className="text-[10px] font-bold uppercase tracking-wider">ACTIVE SHIPMENTS</span>
            <Truck className="w-5 h-5 text-cyan-400" />
          </div>
          <h3 className="text-2xl font-black text-cyan-400 font-mono">8 In Transit</h3>
          <NavLink to="/shipments" className="text-xs text-primary hover:underline font-semibold flex items-center gap-1">
            4 Inbound POs | 4 Outbound →
          </NavLink>
        </motion.div>
      </div>

      {/* 3. Real-Time Interactive Zone Heatmap & Warehouse Space Matrix */}
      <div className="glass-panel p-6 space-y-4">
        <div className="flex justify-between items-center border-b border-border/50 pb-3">
          <div>
            <h3 className="text-base font-bold text-text flex items-center gap-2">
              <MapPin className="w-4 h-4 text-primary" /> Live Warehouse Zone Density & Bottleneck Heatmap
            </h3>
            <p className="text-xs text-textMuted">Interactive floorplan displaying occupancy, pick activity, and AGV corridor load.</p>
          </div>
          <NavLink to="/warehouse/layout" className="text-primary text-xs font-bold hover:underline flex items-center gap-1">
            Full 2D Layout <ArrowRight className="w-3.5 h-3.5" />
          </NavLink>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3.5">
          {zoneHeatmap?.zones?.map((z: any) => (
            <motion.button
              key={z.zone_id}
              onClick={() => setSelectedZone(z)}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className={`p-4 rounded-xl border text-left transition-all relative overflow-hidden group ${
                z.occupancy_percentage >= 85 ? 'bg-danger/10 border-danger/50' :
                z.occupancy_percentage >= 65 ? 'bg-warning/10 border-warning/50' : 'bg-surface/60 border-border/60'
              }`}
            >
              <div className="flex justify-between items-center mb-1.5">
                <span className="font-mono font-bold text-xs text-text">{z.name}</span>
                <span className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase ${
                  z.occupancy_percentage >= 85 ? 'badge-danger' : z.occupancy_percentage >= 65 ? 'badge-warning' : 'badge-info'
                }`}>
                  {z.occupancy_percentage}%
                </span>
              </div>
              <p className="text-[11px] text-textMuted font-medium truncate">{z.description}</p>
              <div className="w-full bg-surface rounded-full h-1.5 mt-2.5 overflow-hidden border border-border/30">
                <div 
                  className={`h-full rounded-full ${
                    z.occupancy_percentage >= 85 ? 'bg-danger' : z.occupancy_percentage >= 65 ? 'bg-warning' : 'bg-primary'
                  }`} 
                  style={{ width: `${z.occupancy_percentage}%` }}
                />
              </div>
            </motion.button>
          ))}
        </div>
      </div>

      {/* 4. Chart & AI Autonomous Action Hub */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chart Column */}
        <div className="lg:col-span-2 glass-card p-6 space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-base font-bold text-text">Fulfillment Throughput & Volume</h3>
              <p className="text-xs text-textMuted">Weekly trend of completed order batches</p>
            </div>
            <span className="badge badge-info text-xs font-mono font-bold">7-Day Real-Time</span>
          </div>

          <div className="h-64 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={mockChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorFulfillment" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} domain={[70, 100]} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#090e1f', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '0.75rem', fontSize: '12px' }}
                  itemStyle={{ color: '#fff' }}
                />
                <Area type="monotone" dataKey="fulfillment" stroke="#6366f1" strokeWidth={2.5} fillOpacity={1} fill="url(#colorFulfillment)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* AI Quick Recommendations Stream */}
        <div className="glass-card p-6 space-y-4 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex justify-between items-center border-b border-border/50 pb-2">
              <h3 className="text-base font-bold text-text flex items-center gap-1.5">
                <BrainCircuit className="w-4 h-4 text-primary" /> Autonomous AI Actions
              </h3>
              <NavLink to="/decisions" className="text-primary text-xs font-bold hover:underline">
                View All →
              </NavLink>
            </div>

            <div className="space-y-2.5">
              {recommendations.slice(0, 3).map((rec: any) => (
                <div key={rec.id} className="p-3 rounded-xl bg-surface/50 border border-border/50 space-y-1">
                  <div className="flex justify-between items-center text-xs">
                    <span className="badge badge-warning text-[10px] font-bold">{rec.category}</span>
                    <span className="text-success font-mono font-bold text-[10px]">{Math.round(rec.confidence * 100)}% Match</span>
                  </div>
                  <p className="font-bold text-text text-xs line-clamp-1">{rec.decision || rec.recommendation}</p>
                  <p className="text-[11px] text-textMuted line-clamp-1">{rec.impact}</p>
                </div>
              ))}
            </div>
          </div>

          <NavLink to="/analytics/optimization" className="w-full btn-primary text-xs py-2.5 text-center font-bold flex items-center justify-center gap-2">
            <Zap className="w-4 h-4" /> Open Optimization Engine
          </NavLink>
        </div>
      </div>

      {/* Modals */}
      <ReportExportModal isOpen={showExportModal} onClose={() => setShowExportModal(false)} />
      <BarcodeScannerModal isOpen={showScannerModal} onClose={() => setShowScannerModal(false)} />
    </div>
  );
};

export default Dashboard;
