import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, X, Package, ShoppingCart, Users, FileText, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';
import api from '../api';

interface GlobalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const GlobalSearchModal: React.FC<GlobalSearchModalProps> = ({ isOpen, onClose }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (!query.trim()) {
      setResults(null);
      return;
    }
    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await api.get(`/api/search/global?query=${encodeURIComponent(query.trim())}`);
        setResults(res.data);
      } catch (e) {
        console.error('Search failed', e);
      } finally {
        setLoading(false);
      }
    }, 250);
    return () => clearTimeout(timer);
  }, [query]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-20">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="absolute inset-0 bg-background/80 backdrop-blur-md" />
      <motion.div initial={{ opacity: 0, scale: 0.95, y: -20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: -20 }} className="relative w-full max-w-2xl glass-card p-5 space-y-4 shadow-2xl">
        <div className="flex items-center gap-3 bg-surface/80 border border-border/80 rounded-2xl px-4 py-3">
          <Search className="w-5 h-5 text-primary" />
          <input 
            type="text"
            autoFocus
            placeholder="Universal Fast Search: SKU, Customer, Supplier, PO number, Category..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="bg-transparent border-none outline-none text-sm text-text w-full placeholder:text-textMuted"
          />
          <button onClick={onClose} className="text-textMuted hover:text-text p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        {results && (
          <div className="space-y-4 max-h-[60vh] overflow-y-auto pt-2 text-xs">
            {/* Products Section */}
            {results.products?.length > 0 && (
              <div className="space-y-1.5">
                <h5 className="font-bold text-textMuted uppercase text-[10px] tracking-wider flex items-center gap-1.5">
                  <Package className="w-3.5 h-3.5 text-primary" /> Matching Products ({results.products.length})
                </h5>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {results.products.map((p: any) => (
                    <button
                      key={p.id}
                      onClick={() => { onClose(); navigate('/inventory'); }}
                      className="p-2.5 rounded-xl bg-surface/50 border border-border/50 hover:border-primary text-left flex justify-between items-center transition-all"
                    >
                      <div>
                        <p className="font-bold text-text">{p.name}</p>
                        <p className="font-mono text-textMuted text-[10px]">{p.sku} | {p.category}</p>
                      </div>
                      <span className="badge badge-info text-[10px] font-bold">{p.stock} units</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Orders Section */}
            {results.orders?.length > 0 && (
              <div className="space-y-1.5">
                <h5 className="font-bold text-textMuted uppercase text-[10px] tracking-wider flex items-center gap-1.5">
                  <ShoppingCart className="w-3.5 h-3.5 text-warning" /> Matching Orders ({results.orders.length})
                </h5>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {results.orders.map((o: any) => (
                    <button
                      key={o.id}
                      onClick={() => { onClose(); navigate('/orders'); }}
                      className="p-2.5 rounded-xl bg-surface/50 border border-border/50 hover:border-warning text-left flex justify-between items-center transition-all"
                    >
                      <div>
                        <p className="font-bold text-text">ORD-#{o.id} ({o.customer})</p>
                        <p className="text-textMuted text-[10px]">${o.value?.toFixed(2)} | {o.status}</p>
                      </div>
                      <span className="badge badge-warning text-[10px]">{o.urgency}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Suppliers Section */}
            {results.suppliers?.length > 0 && (
              <div className="space-y-1.5">
                <h5 className="font-bold text-textMuted uppercase text-[10px] tracking-wider flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-success" /> Suppliers ({results.suppliers.length})
                </h5>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {results.suppliers.map((s: any) => (
                    <button
                      key={s.id}
                      onClick={() => { onClose(); navigate('/procurement/suppliers'); }}
                      className="p-2.5 rounded-xl bg-surface/50 border border-border/50 hover:border-success text-left flex justify-between items-center transition-all"
                    >
                      <div>
                        <p className="font-bold text-text">{s.name}</p>
                        <p className="text-textMuted text-[10px]">{s.company}</p>
                      </div>
                      <span className="badge badge-success text-[10px]">★ {s.rating}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* POs Section */}
            {results.purchase_orders?.length > 0 && (
              <div className="space-y-1.5">
                <h5 className="font-bold text-textMuted uppercase text-[10px] tracking-wider flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-info" /> Purchase Orders ({results.purchase_orders.length})
                </h5>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {results.purchase_orders.map((po: any) => (
                    <button
                      key={po.id}
                      onClick={() => { onClose(); navigate('/procurement/orders'); }}
                      className="p-2.5 rounded-xl bg-surface/50 border border-border/50 hover:border-primary text-left flex justify-between items-center transition-all"
                    >
                      <div>
                        <p className="font-mono font-bold text-text">{po.po_number}</p>
                        <p className="text-textMuted text-[10px]">${po.total_amount?.toFixed(2)}</p>
                      </div>
                      <span className="badge badge-info text-[10px]">{po.status}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {Object.values(results).every((arr: any) => !arr || arr.length === 0) && (
              <p className="text-center text-textMuted py-4">No records found matching "{query}".</p>
            )}
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default GlobalSearchModal;
