import React, { useEffect, useState } from 'react';
import api from '../api';
import { 
  Layers, 
  Search, 
  Calendar, 
  AlertTriangle, 
  CheckCircle2, 
  XCircle, 
  MapPin, 
  RefreshCw,
  Clock,
  Filter
} from 'lucide-react';
import { motion } from 'framer-motion';

const Batches = () => {
  const [batches, setBatches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');

  const fetchBatches = async () => {
    try {
      const response = await api.get('/api/inventory/batches');
      setBatches(response.data);
    } catch (e) {
      console.error('Failed to load batches', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBatches();
  }, []);

  const getStatusBadge = (st: string) => {
    switch(st) {
      case 'Expired':
        return <span className="badge badge-danger font-bold text-xs flex items-center gap-1"><XCircle className="w-3.5 h-3.5" /> Expired</span>;
      case 'Near Expiry':
        return <span className="badge badge-warning font-bold text-xs flex items-center gap-1 animate-pulse"><AlertTriangle className="w-3.5 h-3.5" /> Near Expiry</span>;
      default:
        return <span className="badge badge-success font-semibold text-xs flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5" /> Valid</span>;
    }
  };

  const filteredBatches = batches.filter(b => {
    const matchesSearch = search === '' || 
      b.batch_number?.toLowerCase().includes(search.toLowerCase()) ||
      b.sku?.toLowerCase().includes(search.toLowerCase()) ||
      b.product_name?.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'All' || b.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-text tracking-tight flex items-center gap-2">
            <Layers className="text-primary w-7 h-7" />
            Batch & Expiry Date Management
          </h2>
          <p className="text-textMuted text-sm mt-1">
            Manufacturing traceability, shelf-life monitoring, quarantined lots, and storage bin assignments.
          </p>
        </div>
        <button onClick={fetchBatches} className="btn-secondary p-2.5 rounded-xl">
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Filter and Metric Summary Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="glass-card p-4 flex justify-between items-center border-l-4 border-l-success">
          <div>
            <p className="text-xs text-textMuted font-bold">VALID BATCHES</p>
            <h4 className="text-2xl font-black text-success mt-1">{batches.filter(b => b.status === 'Valid').length}</h4>
          </div>
          <CheckCircle2 className="w-8 h-8 text-success opacity-50" />
        </div>

        <div className="glass-card p-4 flex justify-between items-center border-l-4 border-l-warning">
          <div>
            <p className="text-xs text-textMuted font-bold">NEAR EXPIRY (&lt; 30 DAYS)</p>
            <h4 className="text-2xl font-black text-warning mt-1">{batches.filter(b => b.status === 'Near Expiry').length}</h4>
          </div>
          <AlertTriangle className="w-8 h-8 text-warning opacity-50" />
        </div>

        <div className="glass-card p-4 flex justify-between items-center border-l-4 border-l-danger">
          <div>
            <p className="text-xs text-textMuted font-bold">EXPIRED / QUARANTINED</p>
            <h4 className="text-2xl font-black text-danger mt-1">{batches.filter(b => b.status === 'Expired').length}</h4>
          </div>
          <XCircle className="w-8 h-8 text-danger opacity-50" />
        </div>
      </div>

      {/* Search and Filters */}
      <div className="glass-panel p-4 flex flex-col md:flex-row justify-between gap-4 items-center">
        <div className="flex items-center gap-2 bg-surface border border-border/50 rounded-xl px-3 py-2 w-full md:w-80">
          <Search className="w-4 h-4 text-textMuted" />
          <input 
            type="text" 
            placeholder="Search Batch #, SKU, or Product..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="bg-transparent border-none outline-none text-xs text-text w-full placeholder:text-textMuted"
          />
        </div>

        <div className="flex items-center gap-2 bg-surface border border-border/50 rounded-xl p-1">
          {['All', 'Valid', 'Near Expiry', 'Expired'].map((st) => (
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

      {/* Batch Table */}
      <div className="glass-panel overflow-hidden shadow-xl">
        {loading ? (
          <div className="p-12 text-center text-textMuted animate-pulse">Scanning lot numbers and expiration dates...</div>
        ) : filteredBatches.length === 0 ? (
          <div className="p-16 text-center text-textMuted">No batches found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs whitespace-nowrap">
              <thead className="bg-surface/50 text-textMuted uppercase font-bold border-b border-border/50">
                <tr>
                  <th className="px-6 py-4">Batch Number</th>
                  <th className="px-6 py-4">Product / SKU</th>
                  <th className="px-6 py-4">Mfg Date</th>
                  <th className="px-6 py-4">Expiry Date</th>
                  <th className="px-6 py-4">Quantity In Lot</th>
                  <th className="px-6 py-4">Storage Location</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/10">
                {filteredBatches.map((b) => (
                  <tr key={b.id} className={`hover:bg-border/10 transition-colors ${b.status === 'Expired' ? 'bg-danger/5' : ''}`}>
                    <td className="px-6 py-4 font-mono font-bold text-text">{b.batch_number}</td>
                    <td className="px-6 py-4">
                      <p className="font-bold text-text">{b.product_name}</p>
                      <p className="font-mono text-textMuted text-[10px]">{b.sku}</p>
                    </td>
                    <td className="px-6 py-4 text-textMuted font-mono">{b.mfg_date}</td>
                    <td className="px-6 py-4 font-mono font-bold text-text">{b.expiry_date}</td>
                    <td className="px-6 py-4 font-bold text-text font-mono">{b.quantity} Units</td>
                    <td className="px-6 py-4 font-mono text-primary flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5" /> {b.location_code}
                    </td>
                    <td className="px-6 py-4">{getStatusBadge(b.status)}</td>
                    <td className="px-6 py-4 text-right">
                      {b.status === 'Expired' ? (
                        <span className="text-danger font-bold text-[11px]">Quarantine Active</span>
                      ) : (
                        <span className="text-primary font-bold text-[11px] hover:underline cursor-pointer">Re-allocate Slot</span>
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
  );
};

export default Batches;
