import React, { useEffect, useState } from 'react';
import api from '../api';
import { 
  Users, 
  Search, 
  Plus, 
  Star, 
  Phone, 
  Mail, 
  Building, 
  CheckCircle2, 
  Truck, 
  FileSpreadsheet, 
  RefreshCw,
  X
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const Suppliers = () => {
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [showAddModal, setShowAddModal] = useState(false);
  const [newSupplier, setNewSupplier] = useState({
    name: '',
    company: '',
    email: '',
    phone: '',
    category: 'Electronics & Sensors',
    rating: 4.8,
    lead_time_days: 7,
    delivery_performance: 97.0,
    status: 'Active',
    address: ''
  });

  const fetchSuppliers = async () => {
    try {
      const response = await api.get('/api/procurement/suppliers');
      setSuppliers(response.data);
    } catch (e) {
      console.error('Failed to fetch suppliers', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSuppliers();
  }, []);

  const handleCreateSupplier = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/api/procurement/suppliers', newSupplier);
      setShowAddModal(false);
      fetchSuppliers();
    } catch (e) {
      console.error('Failed to create supplier', e);
    }
  };

  const filteredSuppliers = suppliers.filter(s => {
    const matchesSearch = search === '' || 
      s.name?.toLowerCase().includes(search.toLowerCase()) ||
      s.company?.toLowerCase().includes(search.toLowerCase()) ||
      s.category?.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'All' || s.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-text tracking-tight flex items-center gap-2">
            <Users className="text-primary w-7 h-7" />
            Supplier Management & Performance CRM
          </h2>
          <p className="text-textMuted text-sm mt-1">
            Vendor catalog, delivery reliability benchmarks, lead-time indices, and direct procurement channels.
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={fetchSuppliers} className="btn-secondary p-2.5 rounded-xl">
            <RefreshCw className="w-4 h-4" />
          </button>
          <button onClick={() => setShowAddModal(true)} className="btn-primary flex items-center gap-2 font-bold px-4 py-2">
            <Plus className="w-4 h-4" /> Onboard Supplier
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="glass-panel p-4 flex flex-col md:flex-row justify-between gap-4 items-center">
        <div className="flex items-center gap-2 bg-surface border border-border/50 rounded-xl px-3 py-2 w-full md:w-80">
          <Search className="w-4 h-4 text-textMuted" />
          <input 
            type="text" 
            placeholder="Search vendor name, company, category..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="bg-transparent border-none outline-none text-xs text-text w-full placeholder:text-textMuted"
          />
        </div>

        <div className="flex items-center gap-2 bg-surface border border-border/50 rounded-xl p-1">
          {['All', 'Preferred', 'Active', 'On Review'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                statusFilter === st
                  ? 'bg-primary text-white shadow-sm'
                  : 'text-textMuted hover:text-text'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Supplier Grid */}
      {loading ? (
        <div className="glass-panel p-12 text-center text-textMuted animate-pulse">Loading verified vendor network...</div>
      ) : filteredSuppliers.length === 0 ? (
        <div className="glass-panel p-16 text-center text-textMuted">No suppliers match the selected filter.</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredSuppliers.map((s, idx) => (
            <motion.div
              key={s.id}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.04 }}
              className="glass-card flex flex-col justify-between space-y-4 hover:border-primary/50 transition-all shadow-xl"
            >
              <div className="space-y-3">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="badge badge-info text-[10px] uppercase font-bold">{s.category}</span>
                    <h3 className="text-base font-black text-text mt-1">{s.name}</h3>
                    <p className="text-xs text-textMuted flex items-center gap-1"><Building className="w-3 h-3" /> {s.company}</p>
                  </div>
                  <span className={`badge ${s.status === 'Preferred' ? 'badge-success' : 'badge-info'} text-[10px] font-bold`}>
                    {s.status}
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2 p-3 bg-surface/50 rounded-xl border border-border/50 text-center">
                  <div>
                    <p className="text-[10px] text-textMuted font-bold">RATING</p>
                    <p className="text-sm font-black text-amber-500 flex items-center justify-center gap-0.5">
                      <Star className="w-3.5 h-3.5 fill-current" /> {s.rating}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] text-textMuted font-bold">LEAD TIME</p>
                    <p className="text-sm font-black text-text font-mono">{s.lead_time_days} Days</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-textMuted font-bold">ON-TIME SLA</p>
                    <p className="text-sm font-black text-success font-mono">{s.delivery_performance}%</p>
                  </div>
                </div>

                <div className="space-y-1.5 text-xs text-textMuted">
                  <p className="flex items-center gap-2 text-text"><Mail className="w-3.5 h-3.5 text-primary" /> {s.email}</p>
                  <p className="flex items-center gap-2"><Phone className="w-3.5 h-3.5 text-primary" /> {s.phone}</p>
                </div>
              </div>

              <div className="pt-3 border-t border-border/50 flex justify-between items-center text-xs">
                <span className="text-textMuted text-[11px] truncate max-w-[180px]">{s.address}</span>
                <span className="text-primary font-bold hover:underline cursor-pointer">View Contracts →</span>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Add Supplier Modal */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowAddModal(false)} className="absolute inset-0 bg-background/80 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="relative w-full max-w-lg glass-card p-6 space-y-4 shadow-2xl">
              <div className="flex justify-between items-center border-b border-border/50 pb-3">
                <h3 className="text-base font-bold text-text">Onboard New Approved Vendor</h3>
                <button onClick={() => setShowAddModal(false)} className="text-textMuted hover:text-text"><X className="w-5 h-5" /></button>
              </div>

              <form onSubmit={handleCreateSupplier} className="space-y-3 text-xs">
                <div>
                  <label className="block font-bold text-textMuted uppercase mb-1">Vendor Contact Name</label>
                  <input type="text" required value={newSupplier.name} onChange={e => setNewSupplier({...newSupplier, name: e.target.value})} className="w-full bg-surface border border-border rounded-xl p-2.5 text-text" placeholder="e.g. Apex Global Components" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-textMuted uppercase mb-1">Company / Entity</label>
                    <input type="text" required value={newSupplier.company} onChange={e => setNewSupplier({...newSupplier, company: e.target.value})} className="w-full bg-surface border border-border rounded-xl p-2.5 text-text" placeholder="Apex Global Inc." />
                  </div>
                  <div>
                    <label className="block font-bold text-textMuted uppercase mb-1">Category</label>
                    <input type="text" required value={newSupplier.category} onChange={e => setNewSupplier({...newSupplier, category: e.target.value})} className="w-full bg-surface border border-border rounded-xl p-2.5 text-text" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-textMuted uppercase mb-1">Email</label>
                    <input type="email" required value={newSupplier.email} onChange={e => setNewSupplier({...newSupplier, email: e.target.value})} className="w-full bg-surface border border-border rounded-xl p-2.5 text-text" />
                  </div>
                  <div>
                    <label className="block font-bold text-textMuted uppercase mb-1">Phone</label>
                    <input type="text" required value={newSupplier.phone} onChange={e => setNewSupplier({...newSupplier, phone: e.target.value})} className="w-full bg-surface border border-border rounded-xl p-2.5 text-text" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-textMuted uppercase mb-1">Lead Time (Days)</label>
                    <input type="number" required value={newSupplier.lead_time_days} onChange={e => setNewSupplier({...newSupplier, lead_time_days: parseInt(e.target.value)})} className="w-full bg-surface border border-border rounded-xl p-2.5 text-text" />
                  </div>
                  <div>
                    <label className="block font-bold text-textMuted uppercase mb-1">Status</label>
                    <select value={newSupplier.status} onChange={e => setNewSupplier({...newSupplier, status: e.target.value})} className="w-full bg-surface border border-border rounded-xl p-2.5 text-text">
                      <option value="Preferred">Preferred</option>
                      <option value="Active">Active</option>
                      <option value="On Review">On Review</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block font-bold text-textMuted uppercase mb-1">Dispatch / Headquarters Address</label>
                  <input type="text" value={newSupplier.address} onChange={e => setNewSupplier({...newSupplier, address: e.target.value})} className="w-full bg-surface border border-border rounded-xl p-2.5 text-text" placeholder="104 Tech Parkway, San Jose, CA" />
                </div>

                <div className="pt-3 border-t border-border/50 flex justify-end gap-2">
                  <button type="button" onClick={() => setShowAddModal(false)} className="btn-secondary">Cancel</button>
                  <button type="submit" className="btn-primary font-bold">Register Vendor</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Suppliers;
