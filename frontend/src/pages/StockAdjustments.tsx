import React, { useEffect, useState } from 'react';
import api from '../api';
import { 
  ShieldAlert, 
  Plus, 
  Search, 
  AlertTriangle, 
  CheckCircle2, 
  RefreshCw, 
  Layers, 
  X, 
  Calendar,
  UserCheck
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const StockAdjustments = () => {
  const [adjustments, setAdjustments] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [newAdjustment, setNewAdjustment] = useState({
    product_id: '',
    quantity_change: -1,
    reason: 'Damaged',
    notes: 'Damaged goods quarantined'
  });

  const fetchData = async () => {
    try {
      const [adjRes, prodRes] = await Promise.all([
        api.get('/api/inventory/adjustments'),
        api.get('/api/inventory')
      ]);
      setAdjustments(adjRes.data);
      setProducts(prodRes.data);
    } catch (e) {
      console.error('Failed to load adjustments', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateAdjustment = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/api/inventory/adjustments', {
        product_id: Number(newAdjustment.product_id) || (products[0]?.product_id || 1),
        quantity_change: Number(newAdjustment.quantity_change),
        reason: newAdjustment.reason,
        notes: newAdjustment.notes
      });
      setShowModal(false);
      fetchData();
    } catch (e) {
      console.error('Failed to record adjustment', e);
    }
  };

  const getReasonBadge = (reason: string) => {
    switch(reason) {
      case 'Damaged':
        return <span className="badge badge-danger text-[10px] font-bold">Damaged</span>;
      case 'Lost':
      case 'Expired':
        return <span className="badge badge-warning text-[10px] font-bold">{reason}</span>;
      default:
        return <span className="badge badge-info text-[10px] font-bold">{reason}</span>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-text tracking-tight flex items-center gap-2">
            <ShieldAlert className="text-primary w-7 h-7" />
            Stock Adjustments & Damage Management Log
          </h2>
          <p className="text-textMuted text-sm mt-1">
            Reconciliation records for cycle count discrepancies, damaged inventory quarantines, and manual variance corrections.
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={fetchData} className="btn-secondary p-2.5 rounded-xl">
            <RefreshCw className="w-4 h-4" />
          </button>
          <button onClick={() => setShowModal(true)} className="btn-primary flex items-center gap-2 font-bold px-4 py-2">
            <Plus className="w-4 h-4" /> Record Discrepancy / Damage
          </button>
        </div>
      </div>

      {/* Adjustments Table */}
      <div className="glass-panel overflow-hidden shadow-xl">
        {loading ? (
          <div className="p-12 text-center text-textMuted animate-pulse">Loading discrepancy audit history...</div>
        ) : adjustments.length === 0 ? (
          <div className="p-16 text-center text-textMuted">No stock adjustments recorded.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs whitespace-nowrap">
              <thead className="bg-surface/50 text-textMuted uppercase font-bold border-b border-border/50">
                <tr>
                  <th className="px-6 py-4">Product / SKU</th>
                  <th className="px-6 py-4">Quantity Variance</th>
                  <th className="px-6 py-4">Reason</th>
                  <th className="px-6 py-4">Auditor / User</th>
                  <th className="px-6 py-4">Date & Time</th>
                  <th className="px-6 py-4">Reconciliation Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/10">
                {adjustments.map((a) => (
                  <tr key={a.id} className="hover:bg-border/10 transition-colors">
                    <td className="px-6 py-4">
                      <p className="font-bold text-text">{a.product_name}</p>
                      <p className="font-mono text-textMuted text-[10px]">{a.sku}</p>
                    </td>
                    <td className="px-6 py-4 font-mono font-bold text-sm">
                      <span className={a.quantity_change > 0 ? 'text-success' : 'text-danger'}>
                        {a.quantity_change > 0 ? `+${a.quantity_change}` : a.quantity_change} Units
                      </span>
                    </td>
                    <td className="px-6 py-4">{getReasonBadge(a.reason)}</td>
                    <td className="px-6 py-4 text-text font-medium flex items-center gap-1.5 mt-2">
                      <UserCheck className="w-3.5 h-3.5 text-primary" /> {a.adjusted_by}
                    </td>
                    <td className="px-6 py-4 text-textMuted font-mono">{a.date}</td>
                    <td className="px-6 py-4 text-textMuted">{a.notes || 'Routine reconciliation'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Record Adjustment Modal */}
      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowModal(false)} className="absolute inset-0 bg-background/80 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="relative w-full max-w-md glass-card p-6 space-y-4 shadow-2xl">
              <div className="flex justify-between items-center border-b border-border/50 pb-3">
                <h3 className="text-base font-bold text-text">Record Stock Adjustment</h3>
                <button onClick={() => setShowModal(false)} className="text-textMuted hover:text-text"><X className="w-5 h-5" /></button>
              </div>

              <form onSubmit={handleCreateAdjustment} className="space-y-4 text-xs">
                <div>
                  <label className="block font-bold text-textMuted uppercase mb-1">Select Product / SKU</label>
                  <select 
                    value={newAdjustment.product_id} 
                    onChange={e => setNewAdjustment({...newAdjustment, product_id: e.target.value})}
                    className="w-full bg-surface border border-border rounded-xl p-2.5 text-text"
                  >
                    {products.map(p => <option key={p.product_id} value={p.product_id}>{p.sku} - {p.product_name} ({p.current_stock} in stock)</option>)}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-textMuted uppercase mb-1">Quantity Adjustment (e.g. -5 or +10)</label>
                  <input 
                    type="number" 
                    value={newAdjustment.quantity_change} 
                    onChange={e => setNewAdjustment({...newAdjustment, quantity_change: parseInt(e.target.value) || 0})}
                    className="w-full bg-surface border border-border rounded-xl p-2.5 text-text font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="block font-bold text-textMuted uppercase mb-1">Variance Reason</label>
                  <select 
                    value={newAdjustment.reason} 
                    onChange={e => setNewAdjustment({...newAdjustment, reason: e.target.value})}
                    className="w-full bg-surface border border-border rounded-xl p-2.5 text-text"
                  >
                    <option value="Damaged">Damaged</option>
                    <option value="Lost">Lost</option>
                    <option value="Expired">Expired</option>
                    <option value="Incorrect Count">Incorrect Count</option>
                    <option value="Returned">Returned</option>
                    <option value="Manual Correction">Manual Correction</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-textMuted uppercase mb-1">Auditor Notes</label>
                  <input 
                    type="text" 
                    value={newAdjustment.notes} 
                    onChange={e => setNewAdjustment({...newAdjustment, notes: e.target.value})}
                    className="w-full bg-surface border border-border rounded-xl p-2.5 text-text"
                    placeholder="Provide incident context..."
                  />
                </div>

                <div className="pt-3 border-t border-border/50 flex justify-end gap-2">
                  <button type="button" onClick={() => setShowModal(false)} className="btn-secondary">Cancel</button>
                  <button type="submit" className="btn-primary font-bold">Apply Stock Adjustment</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default StockAdjustments;
