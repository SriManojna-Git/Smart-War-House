import React, { useEffect, useState } from 'react';
import api from '../api';
import { 
  Package, 
  Search, 
  Filter, 
  Plus, 
  X, 
  AlertTriangle, 
  Sparkles, 
  CheckCircle2, 
  Clock, 
  ArrowRight,
  TrendingUp,
  RefreshCw,
  FileSpreadsheet
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import ReportExportModal from '../components/ReportExportModal';

const Inventory = () => {
  const [inventory, setInventory] = useState<any[]>([]);
  const [predictions, setPredictions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showRestockModal, setShowRestockModal] = useState(false);
  const [approvingId, setApprovingId] = useState<number | null>(null);
  
  // Restock Form State
  const [restockData, setRestockData] = useState({
    product_id: '',
    quantity: 50,
    expected_date: '',
    supplier: '',
    notes: ''
  });
  const [showExportModal, setShowExportModal] = useState(false);
  const [isRestocking, setIsRestocking] = useState(false);

  const fetchInventoryData = async () => {
    try {
      const [invRes, predRes] = await Promise.all([
        api.get('/api/inventory'),
        api.get('/api/inventory/predictions')
      ]);
      setInventory(invRes.data);
      setPredictions(predRes.data);
    } catch (error) {
      console.error('Failed to fetch inventory data', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInventoryData();
  }, []);

  const handleRestock = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsRestocking(true);
    try {
      await api.post(`/api/inventory/${restockData.product_id}/restock`, {
        quantity: Number(restockData.quantity),
        expected_date: restockData.expected_date ? new Date(restockData.expected_date).toISOString() : null,
        supplier: restockData.supplier,
        notes: restockData.notes
      });
      setShowRestockModal(false);
      setRestockData({ product_id: '', quantity: 50, expected_date: '', supplier: '', notes: '' });
      fetchInventoryData();
    } catch (error) {
      console.error('Restock failed', error);
    } finally {
      setIsRestocking(false);
    }
  };

  const handleApproveReorder = async (productId: number, qty: number) => {
    setApprovingId(productId);
    try {
      await api.post('/api/recommendations/reorder/approve', {
        product_id: productId,
        quantity: qty,
        supplier: 'Auto-Approved Supplier',
        notes: 'Replenishment triggered from Predictive Stockout Engine'
      });
      fetchInventoryData();
    } catch (e) {
      console.error('Approve reorder failed', e);
    } finally {
      setApprovingId(null);
    }
  };

  const criticalPreds = predictions.filter(p => ['CRITICAL', 'HIGH'].includes(p.stockout_risk));

  const getRiskBadge = (risk: string, days: number) => {
    switch(risk) {
      case 'CRITICAL':
        return <span className="badge badge-danger font-bold text-xs">Critical ({days}d)</span>;
      case 'HIGH':
        return <span className="badge badge-warning font-bold text-xs">High ({days}d)</span>;
      case 'MEDIUM':
        return <span className="badge badge-info text-xs">Medium ({days}d)</span>;
      default:
        return <span className="badge badge-success text-xs">Healthy ({days}d)</span>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-text tracking-tight flex items-center gap-2">
            <Package className="text-primary w-7 h-7" />
            Predictive Stockout & Inventory Intelligence
          </h2>
          <p className="text-textMuted text-sm mt-1">
            Real-time stock velocity, predictive depletion horizons, and autonomous reorder execution.
          </p>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={() => setShowExportModal(true)}
            className="btn-secondary text-xs flex items-center gap-1.5 py-2 px-3 font-bold"
          >
            <FileSpreadsheet className="w-4 h-4 text-success" /> Export
          </button>
          <button onClick={fetchInventoryData} className="btn-secondary p-2.5 rounded-xl">
            <RefreshCw className="w-4 h-4" />
          </button>
          <button onClick={() => setShowRestockModal(true)} className="btn-primary flex items-center gap-2 font-bold px-4 py-2">
            <Plus className="w-4 h-4" /> Manual Restock
          </button>
        </div>
      </div>

      {/* 1. PREDICTIVE REORDER BANNER */}
      {criticalPreds.length > 0 && (
        <div className="glass-panel p-6 border-l-4 border-l-danger space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="p-2 bg-danger/10 text-danger rounded-lg">
                <AlertTriangle className="w-5 h-5" />
              </span>
              <div>
                <h3 className="text-sm font-bold text-text uppercase tracking-wider">
                  Smart Reorder Recommendations ({criticalPreds.length} SKUs at Risk)
                </h3>
                <p className="text-xs text-textMuted">Projected stockout within 4 days based on current demand velocity.</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {criticalPreds.map((pred) => (
              <div key={pred.product_id} className="bg-surface/60 rounded-xl p-4 border border-border/50 flex flex-col justify-between space-y-3">
                <div>
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-bold text-text text-sm">{pred.product_name}</h4>
                      <p className="text-xs text-textMuted font-mono">{pred.sku}</p>
                    </div>
                    {getRiskBadge(pred.stockout_risk, pred.depletion_days)}
                  </div>
                  <p className="text-xs text-text/80 mt-2">
                    Available: <strong>{pred.available_stock}</strong> | Demand: <strong>{pred.daily_demand}/day</strong> | Depletion in <strong>{pred.depletion_days} days</strong>.
                  </p>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-border/50">
                  <span className="text-xs font-semibold text-primary">
                    Rec. Order: +{pred.recommended_reorder_qty} units
                  </span>
                  <button
                    onClick={() => handleApproveReorder(pred.product_id, pred.recommended_reorder_qty)}
                    disabled={approvingId === pred.product_id}
                    className="btn-primary text-xs px-3 py-1.5 flex items-center gap-1.5 font-bold"
                  >
                    {approvingId === pred.product_id ? (
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Sparkles className="w-3.5 h-3.5" />
                    )}
                    Approve Reorder
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 2. INVENTORY TABLE */}
      <div className="glass-panel overflow-hidden shadow-xl">
        {loading ? (
          <div className="p-8 text-center text-textMuted animate-pulse">Analyzing stock horizons...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-surface/50 text-textMuted uppercase text-xs font-semibold border-b border-border/50">
                <tr>
                  <th className="px-6 py-4">Product / SKU</th>
                  <th className="px-6 py-4">Stockout Horizon</th>
                  <th className="px-6 py-4 text-right">Current</th>
                  <th className="px-6 py-4 text-right">Available</th>
                  <th className="px-6 py-4 text-right">Reserved</th>
                  <th className="px-6 py-4 text-right">Allocated</th>
                  <th className="px-6 py-4 text-right">Incoming</th>
                  <th className="px-6 py-4 text-right">Damaged</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/10">
                {inventory.map((item, index) => {
                  const pred = predictions.find(p => p.product_id === item.product_id) || {
                    stockout_risk: 'LOW',
                    depletion_days: (item.available_stock / Math.max(item.daily_demand, 0.1)).toFixed(1)
                  };
                  return (
                    <motion.tr 
                      key={item.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: index * 0.01 }}
                      className="hover:bg-border/10 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <p className="font-bold text-text">PROD-{item.product_id}</p>
                        <p className="text-xs text-textMuted">{item.daily_demand}/day demand</p>
                      </td>
                      <td className="px-6 py-4">
                        {getRiskBadge(pred.stockout_risk, Number(pred.depletion_days))}
                      </td>
                      <td className="px-6 py-4 text-right font-medium text-text">{item.current_stock}</td>
                      <td className="px-6 py-4 text-right font-black text-success">{item.available_stock}</td>
                      <td className="px-6 py-4 text-right text-warning font-medium">{item.reserved_stock}</td>
                      <td className="px-6 py-4 text-right text-primary font-medium">{item.allocated_stock || 0}</td>
                      <td className="px-6 py-4 text-right text-textMuted">{item.incoming_stock > 0 ? `+${item.incoming_stock}` : '-'}</td>
                      <td className="px-6 py-4 text-right text-danger">{item.damaged_stock > 0 ? item.damaged_stock : '-'}</td>
                    </motion.tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 3. RESTOCK MODAL */}
      <AnimatePresence>
        {showRestockModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowRestockModal(false)} className="absolute inset-0 bg-background/80 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="relative w-full max-w-lg glass-card p-6 shadow-2xl">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold text-text">Manual Stock Replenishment</h3>
                <button onClick={() => setShowRestockModal(false)} className="text-textMuted hover:text-text">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleRestock} className="space-y-4 text-xs">
                <div>
                  <label className="block text-xs font-medium text-textMuted mb-1">Select Product</label>
                  <select 
                    required
                    value={restockData.product_id}
                    onChange={(e) => setRestockData({...restockData, product_id: e.target.value})}
                    className="w-full bg-surface border border-border rounded-xl px-4 py-2.5 text-text focus:outline-none focus:border-primary text-xs"
                  >
                    <option value="">Select a Product</option>
                    {inventory.map(item => (
                      <option key={item.id} value={item.product_id}>PROD-{item.product_id} (Available: {item.available_stock})</option>
                    ))}
                  </select>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-textMuted mb-1">Restock Quantity</label>
                    <input 
                      type="number" min="1" required
                      value={restockData.quantity}
                      onChange={(e) => setRestockData({...restockData, quantity: parseInt(e.target.value) || 0})}
                      className="w-full bg-surface border border-border rounded-xl px-4 py-2.5 text-text focus:outline-none focus:border-primary text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-textMuted mb-1">Supplier</label>
                    <input 
                      type="text" 
                      value={restockData.supplier}
                      onChange={(e) => setRestockData({...restockData, supplier: e.target.value})}
                      className="w-full bg-surface border border-border rounded-xl px-4 py-2.5 text-text focus:outline-none focus:border-primary text-xs"
                      placeholder="Primary Logistics Corp"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-textMuted mb-1">Notes</label>
                  <textarea 
                    value={restockData.notes}
                    onChange={(e) => setRestockData({...restockData, notes: e.target.value})}
                    className="w-full bg-surface border border-border rounded-xl px-4 py-2 text-text focus:outline-none focus:border-primary h-20 resize-none text-xs"
                    placeholder="Inbound batch details..."
                  />
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-border/50">
                  <button type="button" onClick={() => setShowRestockModal(false)} className="btn-secondary text-xs">
                    Cancel
                  </button>
                  <button type="submit" disabled={isRestocking} className="btn-primary text-xs font-bold px-5">
                    {isRestocking ? 'Restocking...' : 'Receive Restock'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      <ReportExportModal isOpen={showExportModal} onClose={() => setShowExportModal(false)} defaultReport="inventory" />
    </div>
  );
};

export default Inventory;
