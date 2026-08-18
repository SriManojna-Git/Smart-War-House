import React, { useEffect, useState } from 'react';
import api from '../api';
import { 
  FileText, 
  Plus, 
  Search, 
  CheckCircle2, 
  Clock, 
  Truck, 
  ArrowRight, 
  Sparkles, 
  RefreshCw, 
  DollarSign, 
  Layers, 
  X,
  Package,
  Calendar
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const PurchaseOrders = () => {
  const [pos, setPos] = useState<any[]>([]);
  const [reorders, setReorders] = useState<any[]>([]);
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'orders' | 'smart-reorder'>('orders');
  const [statusFilter, setStatusFilter] = useState('All');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [convertingId, setConvertingId] = useState<number | null>(null);

  const [newPO, setNewPO] = useState({
    supplier_id: '',
    expected_delivery_days: 7,
    notes: '',
    items: [{ product_id: '', quantity: 100, unit_price: 45.0 }]
  });

  const fetchData = async () => {
    try {
      const [posRes, reordersRes, supRes, prodRes] = await Promise.all([
        api.get('/api/procurement/purchase-orders'),
        api.get('/api/procurement/reorder-suggestions'),
        api.get('/api/procurement/suppliers'),
        api.get('/api/inventory')
      ]);
      setPos(posRes.data);
      setReorders(reordersRes.data);
      setSuppliers(supRes.data);
      setProducts(prodRes.data);
    } catch (e) {
      console.error('Failed to load procurement data', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleUpdateStatus = async (poId: number, nextStatus: string) => {
    try {
      await api.post(`/api/procurement/purchase-orders/${poId}/status`, { status: nextStatus });
      fetchData();
    } catch (e) {
      console.error('Failed to update status', e);
    }
  };

  const handleConvertReorder = async (r: any) => {
    setConvertingId(r.product_id);
    try {
      await api.post('/api/procurement/reorder-to-po', {
        product_id: r.product_id,
        supplier_id: r.supplier_id,
        quantity: r.suggested_quantity
      });
      fetchData();
      setActiveTab('orders');
    } catch (e) {
      console.error('Conversion failed', e);
    } finally {
      setConvertingId(null);
    }
  };

  const handleCreatePO = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/api/procurement/purchase-orders', {
        supplier_id: Number(newPO.supplier_id) || (suppliers[0]?.id || 1),
        expected_delivery_days: Number(newPO.expected_delivery_days),
        notes: newPO.notes,
        items: newPO.items.map(it => ({
          product_id: Number(it.product_id) || (products[0]?.product_id || 1),
          quantity: Number(it.quantity),
          unit_price: Number(it.unit_price)
        }))
      });
      setShowCreateModal(false);
      fetchData();
    } catch (e) {
      console.error('Failed to create PO', e);
    }
  };

  const getStatusBadge = (st: string) => {
    switch(st) {
      case 'Received':
      case 'Closed':
        return <span className="badge badge-success font-bold text-[10px] uppercase">{st}</span>;
      case 'Ordered':
      case 'Approved':
        return <span className="badge badge-info font-bold text-[10px] uppercase">{st}</span>;
      case 'Partially Received':
        return <span className="badge badge-warning font-bold text-[10px] uppercase">{st}</span>;
      default:
        return <span className="badge bg-surface text-textMuted border border-border text-[10px] uppercase">{st}</span>;
    }
  };

  const filteredPos = pos.filter(po => {
    if (statusFilter === 'All') return true;
    return po.status === statusFilter;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-text tracking-tight flex items-center gap-2">
            <FileText className="text-primary w-7 h-7" />
            Purchase Order Management & Smart Procurement
          </h2>
          <p className="text-textMuted text-sm mt-1">
            End-to-end procurement lifecycle: Draft → Created → Approved → Ordered → Goods Received.
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={fetchData} className="btn-secondary p-2.5 rounded-xl">
            <RefreshCw className="w-4 h-4" />
          </button>
          <button onClick={() => setShowCreateModal(true)} className="btn-primary flex items-center gap-2 font-bold px-4 py-2">
            <Plus className="w-4 h-4" /> Create Purchase Order
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-3 border-b border-border/50 pb-2">
        <button
          onClick={() => setActiveTab('orders')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeTab === 'orders'
              ? 'bg-primary text-white shadow-md'
              : 'text-textMuted hover:text-text'
          }`}
        >
          <FileText className="w-4 h-4" /> Active Purchase Orders ({pos.length})
        </button>
        <button
          onClick={() => setActiveTab('smart-reorder')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeTab === 'smart-reorder'
              ? 'bg-primary text-white shadow-md'
              : 'text-textMuted hover:text-text'
          }`}
        >
          <Sparkles className="w-4 h-4 text-amber-400" /> Smart Reorder Suggestions ({reorders.filter(r => r.is_reorder_needed).length})
        </button>
      </div>

      {/* TAB 1: PURCHASE ORDERS */}
      {activeTab === 'orders' && (
        <div className="space-y-4">
          <div className="flex gap-2 overflow-x-auto pb-1">
            {['All', 'Created', 'Approved', 'Ordered', 'Partially Received', 'Received', 'Closed'].map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${
                  statusFilter === st ? 'bg-surface text-primary border border-primary' : 'text-textMuted hover:text-text'
                }`}
              >
                {st}
              </button>
            ))}
          </div>

          <div className="glass-panel overflow-hidden shadow-xl">
            {loading ? (
              <div className="p-12 text-center text-textMuted animate-pulse">Loading purchase orders...</div>
            ) : filteredPos.length === 0 ? (
              <div className="p-16 text-center text-textMuted">No purchase orders found.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs whitespace-nowrap">
                  <thead className="bg-surface/50 text-textMuted uppercase font-bold border-b border-border/50">
                    <tr>
                      <th className="px-6 py-4">PO Number</th>
                      <th className="px-6 py-4">Supplier</th>
                      <th className="px-6 py-4">Order Date</th>
                      <th className="px-6 py-4">Expected Delivery</th>
                      <th className="px-6 py-4">Line Items</th>
                      <th className="px-6 py-4">Total Amount</th>
                      <th className="px-6 py-4">Status</th>
                      <th className="px-6 py-4 text-right">Workflow Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/10">
                    {filteredPos.map((po) => (
                      <tr key={po.id} className="hover:bg-border/10 transition-colors">
                        <td className="px-6 py-4 font-mono font-bold text-text">{po.po_number}</td>
                        <td className="px-6 py-4 font-bold text-text">{po.supplier_name}</td>
                        <td className="px-6 py-4 text-textMuted">{new Date(po.order_date).toLocaleDateString()}</td>
                        <td className="px-6 py-4 text-textMuted font-mono">{new Date(po.expected_delivery).toLocaleDateString()}</td>
                        <td className="px-6 py-4">
                          <span className="text-text font-medium">{po.items?.length || 1} SKUs</span>
                          <span className="text-textMuted ml-1">({po.items?.[0]?.quantity || 0} units)</span>
                        </td>
                        <td className="px-6 py-4 font-bold text-text font-mono">${po.total_amount?.toFixed(2)}</td>
                        <td className="px-6 py-4">{getStatusBadge(po.status)}</td>
                        <td className="px-6 py-4 text-right space-x-2">
                          {po.status === 'Created' && (
                            <button onClick={() => handleUpdateStatus(po.id, 'Approved')} className="btn-secondary text-[11px] py-1 px-2.5 font-bold text-primary">
                              Approve PO
                            </button>
                          )}
                          {po.status === 'Approved' && (
                            <button onClick={() => handleUpdateStatus(po.id, 'Ordered')} className="btn-primary text-[11px] py-1 px-2.5 font-bold">
                              Transmit to Vendor
                            </button>
                          )}
                          {po.status === 'Ordered' && (
                            <button onClick={() => handleUpdateStatus(po.id, 'Received')} className="btn-primary text-[11px] py-1 px-2.5 font-bold bg-success text-white">
                              Receive Inbound Goods
                            </button>
                          )}
                          {po.status === 'Received' && (
                            <button onClick={() => handleUpdateStatus(po.id, 'Closed')} className="btn-secondary text-[11px] py-1 px-2.5">
                              Close PO
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: SMART REORDER SUGGESTIONS */}
      {activeTab === 'smart-reorder' && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {reorders.map((r, idx) => (
            <motion.div
              key={r.product_id}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.03 }}
              className={`glass-card flex flex-col justify-between space-y-4 border-l-4 ${
                r.reorder_priority === 'CRITICAL' ? 'border-l-danger bg-danger/5' :
                r.reorder_priority === 'HIGH' ? 'border-l-warning bg-warning/5' : 'border-l-primary'
              }`}
            >
              <div className="space-y-3">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="font-mono text-[10px] text-textMuted font-bold">{r.sku}</span>
                    <h3 className="text-base font-black text-text mt-0.5">{r.product_name}</h3>
                    <p className="text-xs text-textMuted">Supplier: {r.supplier_name}</p>
                  </div>
                  <span className={`badge ${
                    r.reorder_priority === 'CRITICAL' ? 'badge-danger' :
                    r.reorder_priority === 'HIGH' ? 'badge-warning' : 'badge-info'
                  } font-bold text-[10px]`}>
                    {r.reorder_priority}
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2 p-3 bg-surface/60 rounded-xl border border-border/50 text-center text-xs">
                  <div>
                    <p className="text-[10px] text-textMuted font-bold">CURRENT</p>
                    <p className="font-bold text-text">{r.current_stock} Units</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-textMuted font-bold">REORDER PT</p>
                    <p className="font-bold text-warning">{r.reorder_point} Units</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-textMuted font-bold">SUGGESTED</p>
                    <p className="font-bold text-primary font-mono">+{r.suggested_quantity}</p>
                  </div>
                </div>

                <div className="text-xs text-textMuted flex justify-between">
                  <span>Est. Total Cost: <strong className="text-text font-mono">${r.estimated_total_cost}</strong></span>
                  <span>Lead Time: <strong className="text-text">{r.lead_time_days} days</strong></span>
                </div>
              </div>

              <div className="pt-3 border-t border-border/50">
                <button
                  onClick={() => handleConvertReorder(r)}
                  disabled={convertingId === r.product_id}
                  className="w-full btn-primary text-xs py-2.5 flex items-center justify-center gap-2 font-bold shadow-md shadow-primary/20"
                >
                  {convertingId === r.product_id ? (
                    <Sparkles className="w-4 h-4 animate-spin" />
                  ) : (
                    <ArrowRight className="w-4 h-4" />
                  )}
                  {convertingId === r.product_id ? 'Generating PO...' : 'Convert to Purchase Order'}
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* CREATE PO MODAL */}
      <AnimatePresence>
        {showCreateModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowCreateModal(false)} className="absolute inset-0 bg-background/80 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="relative w-full max-w-lg glass-card p-6 space-y-4 shadow-2xl">
              <div className="flex justify-between items-center border-b border-border/50 pb-3">
                <h3 className="text-base font-bold text-text">Issue New Purchase Order</h3>
                <button onClick={() => setShowCreateModal(false)} className="text-textMuted hover:text-text"><X className="w-5 h-5" /></button>
              </div>

              <form onSubmit={handleCreatePO} className="space-y-4 text-xs">
                <div>
                  <label className="block font-bold text-textMuted uppercase mb-1">Select Supplier</label>
                  <select 
                    value={newPO.supplier_id} 
                    onChange={e => setNewPO({...newPO, supplier_id: e.target.value})}
                    className="w-full bg-surface border border-border rounded-xl p-2.5 text-text"
                  >
                    {suppliers.map(s => <option key={s.id} value={s.id}>{s.name} ({s.company})</option>)}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-textMuted uppercase mb-1">Select Product / SKU</label>
                  <select 
                    value={newPO.items[0].product_id}
                    onChange={e => {
                      const updated = [...newPO.items];
                      updated[0].product_id = e.target.value;
                      setNewPO({...newPO, items: updated});
                    }}
                    className="w-full bg-surface border border-border rounded-xl p-2.5 text-text"
                  >
                    {products.map(p => <option key={p.product_id} value={p.product_id}>{p.sku} - {p.product_name} (${p.price})</option>)}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-textMuted uppercase mb-1">Procurement Quantity</label>
                    <input 
                      type="number" 
                      min="10" 
                      value={newPO.items[0].quantity} 
                      onChange={e => {
                        const updated = [...newPO.items];
                        updated[0].quantity = parseInt(e.target.value) || 10;
                        setNewPO({...newPO, items: updated});
                      }}
                      className="w-full bg-surface border border-border rounded-xl p-2.5 text-text"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-textMuted uppercase mb-1">Negotiated Unit Price ($)</label>
                    <input 
                      type="number" 
                      step="0.1" 
                      value={newPO.items[0].unit_price} 
                      onChange={e => {
                        const updated = [...newPO.items];
                        updated[0].unit_price = parseFloat(e.target.value) || 10;
                        setNewPO({...newPO, items: updated});
                      }}
                      className="w-full bg-surface border border-border rounded-xl p-2.5 text-text"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-textMuted uppercase mb-1">Expected Delivery (Days)</label>
                  <input 
                    type="number" 
                    value={newPO.expected_delivery_days} 
                    onChange={e => setNewPO({...newPO, expected_delivery_days: parseInt(e.target.value) || 7})}
                    className="w-full bg-surface border border-border rounded-xl p-2.5 text-text"
                  />
                </div>

                <div className="pt-3 border-t border-border/50 flex justify-end gap-2">
                  <button type="button" onClick={() => setShowCreateModal(false)} className="btn-secondary">Cancel</button>
                  <button type="submit" className="btn-primary font-bold">Create Purchase Order</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default PurchaseOrders;
