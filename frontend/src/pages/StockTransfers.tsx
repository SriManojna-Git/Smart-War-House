import React, { useEffect, useState } from 'react';
import api from '../api';
import { 
  ArrowLeftRight, 
  Plus, 
  Search, 
  CheckCircle2, 
  Clock, 
  RefreshCw, 
  Building, 
  X,
  Sparkles
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const StockTransfers = () => {
  const [transfers, setTransfers] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [newTransfer, setNewTransfer] = useState({
    product_id: '',
    quantity: 20,
    notes: 'Inter-facility balance'
  });

  const fetchData = async () => {
    try {
      const [trRes, prodRes] = await Promise.all([
        api.get('/api/transfers'),
        api.get('/api/inventory')
      ]);
      setTransfers(trRes.data);
      setProducts(prodRes.data);
    } catch (e) {
      console.error('Failed to load transfers', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleUpdateStatus = async (id: number, nextStatus: string) => {
    try {
      await api.post(`/api/transfers/${id}/status`, { status: nextStatus });
      fetchData();
    } catch (e) {
      console.error('Failed to update transfer status', e);
    }
  };

  const handleCreateTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/api/transfers', {
        product_id: Number(newTransfer.product_id) || (products[0]?.product_id || 1),
        quantity: Number(newTransfer.quantity),
        notes: newTransfer.notes
      });
      setShowModal(false);
      fetchData();
    } catch (e) {
      console.error('Failed to create transfer', e);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-text tracking-tight flex items-center gap-2">
            <ArrowLeftRight className="text-primary w-7 h-7" />
            Inter-Warehouse & Inter-Zone Stock Transfers
          </h2>
          <p className="text-textMuted text-sm mt-1">
            Automated stock redistribution, buffer rebalancing, and transit tracking between fulfillment wings.
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={fetchData} className="btn-secondary p-2.5 rounded-xl">
            <RefreshCw className="w-4 h-4" />
          </button>
          <button onClick={() => setShowModal(true)} className="btn-primary flex items-center gap-2 font-bold px-4 py-2">
            <Plus className="w-4 h-4" /> Request Stock Transfer
          </button>
        </div>
      </div>

      {/* Transfers Table */}
      <div className="glass-panel overflow-hidden shadow-xl">
        {loading ? (
          <div className="p-12 text-center text-textMuted animate-pulse">Loading stock movement manifests...</div>
        ) : transfers.length === 0 ? (
          <div className="p-16 text-center text-textMuted">No stock transfers recorded.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs whitespace-nowrap">
              <thead className="bg-surface/50 text-textMuted uppercase font-bold border-b border-border/50">
                <tr>
                  <th className="px-6 py-4">Transfer #</th>
                  <th className="px-6 py-4">Product / SKU</th>
                  <th className="px-6 py-4">Quantity</th>
                  <th className="px-6 py-4">Requested By</th>
                  <th className="px-6 py-4">Date</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Workflow Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/10">
                {transfers.map((t) => (
                  <tr key={t.id} className="hover:bg-border/10 transition-colors">
                    <td className="px-6 py-4 font-mono font-bold text-text">{t.transfer_number}</td>
                    <td className="px-6 py-4">
                      <p className="font-bold text-text">{t.product_name}</p>
                      <p className="font-mono text-textMuted text-[10px]">{t.sku}</p>
                    </td>
                    <td className="px-6 py-4 font-bold text-text font-mono">{t.quantity} Units</td>
                    <td className="px-6 py-4 text-text font-medium">{t.requested_by}</td>
                    <td className="px-6 py-4 text-textMuted font-mono">{t.request_date}</td>
                    <td className="px-6 py-4">
                      <span className={`badge ${
                        t.status === 'Completed' ? 'badge-success' :
                        t.status === 'In Transit' ? 'badge-info' : 'badge-warning'
                      } font-bold text-[10px] uppercase`}>
                        {t.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right space-x-2">
                      {t.status === 'Requested' && (
                        <button onClick={() => handleUpdateStatus(t.id, 'In Transit')} className="btn-primary text-[11px] py-1 px-2.5 font-bold">
                          Dispatch Transfer
                        </button>
                      )}
                      {t.status === 'In Transit' && (
                        <button onClick={() => handleUpdateStatus(t.id, 'Completed')} className="btn-primary text-[11px] py-1 px-2.5 font-bold bg-success text-white">
                          Receive & Finalize
                        </button>
                      )}
                      {t.status === 'Completed' && (
                        <span className="text-success font-bold text-[11px]">Completed</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Transfer Modal */}
      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowModal(false)} className="absolute inset-0 bg-background/80 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="relative w-full max-w-md glass-card p-6 space-y-4 shadow-2xl">
              <div className="flex justify-between items-center border-b border-border/50 pb-3">
                <h3 className="text-base font-bold text-text">Initiate Stock Transfer</h3>
                <button onClick={() => setShowModal(false)} className="text-textMuted hover:text-text"><X className="w-5 h-5" /></button>
              </div>

              <form onSubmit={handleCreateTransfer} className="space-y-4 text-xs">
                <div>
                  <label className="block font-bold text-textMuted uppercase mb-1">Select Product / SKU</label>
                  <select 
                    value={newTransfer.product_id} 
                    onChange={e => setNewTransfer({...newTransfer, product_id: e.target.value})}
                    className="w-full bg-surface border border-border rounded-xl p-2.5 text-text"
                  >
                    {products.map(p => <option key={p.product_id} value={p.product_id}>{p.sku} - {p.product_name} ({p.current_stock} avail)</option>)}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-textMuted uppercase mb-1">Transfer Quantity</label>
                  <input 
                    type="number" 
                    min="1" 
                    value={newTransfer.quantity} 
                    onChange={e => setNewTransfer({...newTransfer, quantity: parseInt(e.target.value) || 1})}
                    className="w-full bg-surface border border-border rounded-xl p-2.5 text-text"
                  />
                </div>

                <div>
                  <label className="block font-bold text-textMuted uppercase mb-1">Transfer Notes / Reason</label>
                  <input 
                    type="text" 
                    value={newTransfer.notes} 
                    onChange={e => setNewTransfer({...newTransfer, notes: e.target.value})}
                    className="w-full bg-surface border border-border rounded-xl p-2.5 text-text"
                  />
                </div>

                <div className="pt-3 border-t border-border/50 flex justify-end gap-2">
                  <button type="button" onClick={() => setShowModal(false)} className="btn-secondary">Cancel</button>
                  <button type="submit" className="btn-primary font-bold">Dispatch Transfer</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default StockTransfers;
