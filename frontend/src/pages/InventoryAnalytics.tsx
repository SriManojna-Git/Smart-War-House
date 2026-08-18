import React, { useEffect, useState } from 'react';
import api from '../api';
import { 
  BarChart3, 
  DollarSign, 
  TrendingUp, 
  Flame, 
  AlertTriangle, 
  Layers, 
  RefreshCw,
  PieChart as PieChartIcon,
  ArrowRight
} from 'lucide-react';
import { motion } from 'framer-motion';

const InventoryAnalytics = () => {
  const [valuation, setValuation] = useState<any>(null);
  const [turnover, setTurnover] = useState<any>(null);
  const [deadStock, setDeadStock] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'valuation' | 'turnover' | 'movement'>('valuation');

  const fetchAnalytics = async () => {
    try {
      const [valRes, turnRes, deadRes] = await Promise.all([
        api.get('/api/analytics/valuation'),
        api.get('/api/analytics/turnover'),
        api.get('/api/analytics/dead-stock')
      ]);
      setValuation(valRes.data);
      setTurnover(turnRes.data);
      setDeadStock(deadRes.data);
    } catch (e) {
      console.error('Failed to load analytics', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-text tracking-tight flex items-center gap-2">
            <BarChart3 className="text-primary w-7 h-7" />
            Advanced Inventory Analytics & Asset Valuation
          </h2>
          <p className="text-textMuted text-sm mt-1">
            Financial capital analysis, annualized turnover velocity, velocity quadrant classifications, and dead stock recovery.
          </p>
        </div>
        <button onClick={fetchAnalytics} className="btn-secondary p-2.5 rounded-xl">
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Top 4 KPI Metrics Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-card p-4 space-y-1 border-l-4 border-l-primary">
          <p className="text-[10px] text-textMuted font-bold uppercase">TOTAL INVENTORY VALUATION</p>
          <h3 className="text-2xl font-black text-text font-mono">${valuation?.total_inventory_value?.toLocaleString()}</h3>
          <p className="text-[11px] text-success font-semibold">Across {valuation?.total_products_count} active catalog SKUs</p>
        </div>

        <div className="glass-card p-4 space-y-1 border-l-4 border-l-success">
          <p className="text-[10px] text-textMuted font-bold uppercase">ANNUALIZED TURNOVER RATE</p>
          <h3 className="text-2xl font-black text-success font-mono">{turnover?.average_turnover_rate}x</h3>
          <p className="text-[11px] text-textMuted">{turnover?.benchmark_status}</p>
        </div>

        <div className="glass-card p-4 space-y-1 border-l-4 border-l-warning">
          <p className="text-[10px] text-textMuted font-bold uppercase">TIED-UP DEAD STOCK VALUE</p>
          <h3 className="text-2xl font-black text-warning font-mono">${deadStock?.total_tied_up_value?.toLocaleString()}</h3>
          <p className="text-[11px] text-warning font-semibold">{deadStock?.dead_stock_count} SKUs requiring liquidation</p>
        </div>

        <div className="glass-card p-4 space-y-1 border-l-4 border-l-cyan-400">
          <p className="text-[10px] text-textMuted font-bold uppercase">FAST-MOVING SKUs</p>
          <h3 className="text-2xl font-black text-cyan-400 font-mono">{deadStock?.fast_moving_count} Items</h3>
          <p className="text-[11px] text-textMuted">High pick velocity surge</p>
        </div>
      </div>

      {/* Subnavigation Tabs */}
      <div className="flex items-center gap-3 border-b border-border/50 pb-2">
        <button
          onClick={() => setActiveTab('valuation')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
            activeTab === 'valuation' ? 'bg-primary text-white shadow-md' : 'text-textMuted hover:text-text'
          }`}
        >
          <DollarSign className="w-4 h-4" /> Category Asset Valuation
        </button>
        <button
          onClick={() => setActiveTab('turnover')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
            activeTab === 'turnover' ? 'bg-primary text-white shadow-md' : 'text-textMuted hover:text-text'
          }`}
        >
          <TrendingUp className="w-4 h-4" /> Inventory Turnover & DSI
        </button>
        <button
          onClick={() => setActiveTab('movement')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
            activeTab === 'movement' ? 'bg-primary text-white shadow-md' : 'text-textMuted hover:text-text'
          }`}
        >
          <Flame className="w-4 h-4" /> Velocity Classifications & Dead Stock
        </button>
      </div>

      {/* TAB 1: VALUATION */}
      {activeTab === 'valuation' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Category Breakdown */}
          <div className="glass-card p-6 space-y-4">
            <h3 className="text-base font-bold text-text flex items-center gap-2">
              <PieChartIcon className="w-4 h-4 text-primary" /> Category Valuation Breakdown
            </h3>
            <div className="space-y-3">
              {valuation?.category_breakdown?.map((c: any, i: number) => (
                <div key={i} className="p-3 bg-surface/50 rounded-xl border border-border/50 space-y-1.5">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-bold text-text">{c.category}</span>
                    <span className="font-mono font-bold text-primary">${c.value?.toLocaleString()} ({c.percentage}%)</span>
                  </div>
                  <div className="w-full bg-surface rounded-full h-1.5 overflow-hidden">
                    <div className="bg-primary h-full rounded-full" style={{ width: `${c.percentage}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* SKU Valuation Table */}
          <div className="lg:col-span-2 glass-panel overflow-hidden shadow-xl">
            <div className="p-4 border-b border-border/50 font-bold text-sm text-text">
              Product-Wise Financial Ledger
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs whitespace-nowrap">
                <thead className="bg-surface/50 text-textMuted uppercase font-bold border-b border-border/50">
                  <tr>
                    <th className="px-5 py-3">SKU</th>
                    <th className="px-5 py-3">Product Name</th>
                    <th className="px-5 py-3">Current Units</th>
                    <th className="px-5 py-3">Unit Cost</th>
                    <th className="px-5 py-3">Asset Value</th>
                    <th className="px-5 py-3">Gross Margin</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/10">
                  {valuation?.product_valuations?.map((p: any) => (
                    <tr key={p.product_id} className="hover:bg-border/10">
                      <td className="px-5 py-3 font-mono font-bold text-text">{p.sku}</td>
                      <td className="px-5 py-3 text-text font-medium">{p.name}</td>
                      <td className="px-5 py-3 font-mono">{p.current_stock}</td>
                      <td className="px-5 py-3 font-mono text-textMuted">${p.unit_cost?.toFixed(2)}</td>
                      <td className="px-5 py-3 font-mono font-bold text-primary">${p.total_value?.toFixed(2)}</td>
                      <td className="px-5 py-3 text-success font-bold font-mono">+{p.margin_pct}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: TURNOVER */}
      {activeTab === 'turnover' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="glass-card p-6 space-y-4 border-t-4 border-t-success">
            <h3 className="text-base font-bold text-text flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-success" /> Top Fast-Turnover SKUs
            </h3>
            <div className="space-y-2">
              {turnover?.high_turnover?.map((h: any, i: number) => (
                <div key={i} className="p-3 bg-surface/50 rounded-xl border border-border/50 flex justify-between items-center text-xs">
                  <div>
                    <p className="font-bold text-text">{h.name}</p>
                    <p className="font-mono text-textMuted text-[10px]">{h.sku}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-black text-success font-mono text-sm">{h.turnover_rate}x / yr</p>
                    <p className="text-[10px] text-textMuted">{h.days_sales_inventory} Days DSI</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="glass-card p-6 space-y-4 border-t-4 border-t-warning">
            <h3 className="text-base font-bold text-text flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-warning" /> Low Turnover Watchlist
            </h3>
            <div className="space-y-2">
              {turnover?.low_turnover?.map((l: any, i: number) => (
                <div key={i} className="p-3 bg-surface/50 rounded-xl border border-border/50 flex justify-between items-center text-xs">
                  <div>
                    <p className="font-bold text-text">{l.name}</p>
                    <p className="font-mono text-textMuted text-[10px]">{l.sku}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-black text-warning font-mono text-sm">{l.turnover_rate}x / yr</p>
                    <p className="text-[10px] text-textMuted">{l.days_sales_inventory} Days DSI</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: VELOCITY & DEAD STOCK */}
      {activeTab === 'movement' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div className="glass-card p-4 space-y-2 border-l-4 border-l-danger">
              <h4 className="font-bold text-text">🔥 Fast Moving</h4>
              <p className="text-textMuted">High turnover rate (&gt;4.0 units/day). Buffer continuously.</p>
              <p className="font-black text-base text-text">{deadStock?.fast_moving_count} SKUs</p>
            </div>
            <div className="glass-card p-4 space-y-2 border-l-4 border-l-warning">
              <h4 className="font-bold text-text">🟡 Medium Moving</h4>
              <p className="text-textMuted">Steady baseline consumption. Replenish periodically.</p>
              <p className="font-black text-base text-text">{deadStock?.medium_moving_count} SKUs</p>
            </div>
            <div className="glass-card p-4 space-y-2 border-l-4 border-l-textMuted">
              <h4 className="font-bold text-text">⚫ Dead Stock</h4>
              <p className="text-textMuted">Zero movement in &gt;60 days. Immediate liquidation advised.</p>
              <p className="font-black text-base text-warning">${deadStock?.total_tied_up_value?.toLocaleString()} Tied Up</p>
            </div>
          </div>

          <div className="glass-panel overflow-hidden shadow-xl">
            <div className="p-4 border-b border-border/50 font-bold text-sm text-text">
              Dead Stock & Slow-Moving Remediation Hub
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs whitespace-nowrap">
                <thead className="bg-surface/50 text-textMuted uppercase font-bold border-b border-border/50">
                  <tr>
                    <th className="px-5 py-3">Classification</th>
                    <th className="px-5 py-3">SKU</th>
                    <th className="px-5 py-3">Product</th>
                    <th className="px-5 py-3">Units in Stock</th>
                    <th className="px-5 py-3">Days Inactive</th>
                    <th className="px-5 py-3">Tied-Up Capital</th>
                    <th className="px-5 py-3">AI Suggested Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/10">
                  {deadStock?.dead_stock?.concat(deadStock?.slow_moving || [])?.map((d: any, idx: number) => (
                    <tr key={idx} className="hover:bg-border/10">
                      <td className="px-5 py-3 font-bold text-text">{d.classification}</td>
                      <td className="px-5 py-3 font-mono text-text">{d.sku}</td>
                      <td className="px-5 py-3 font-medium text-text">{d.name}</td>
                      <td className="px-5 py-3 font-mono">{d.stock}</td>
                      <td className="px-5 py-3 font-mono text-warning">{d.days_inactive} days</td>
                      <td className="px-5 py-3 font-mono font-bold text-danger">${d.tied_up_value?.toFixed(2)}</td>
                      <td className="px-5 py-3 text-textMuted">{d.suggested_action}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InventoryAnalytics;
