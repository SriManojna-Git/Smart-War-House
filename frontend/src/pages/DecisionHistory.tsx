import React, { useEffect, useState } from 'react';
import api from '../api';
import { 
  History, 
  Search, 
  Filter, 
  BrainCircuit, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Sparkles, 
  ChevronRight, 
  Database,
  RefreshCw,
  TrendingDown
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const DecisionHistory = () => {
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [categoryFilter, setCategoryFilter] = useState('All');

  const fetchHistory = async () => {
    try {
      const response = await api.get('/api/recommendations/history');
      setHistory(response.data);
    } catch (e) {
      console.error('Failed to fetch decision history', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const filteredHistory = history.filter(item => {
    const matchesSearch = search === '' || 
      item.decision?.toLowerCase().includes(search.toLowerCase()) ||
      item.situation?.toLowerCase().includes(search.toLowerCase()) ||
      item.entity_type?.toLowerCase().includes(search.toLowerCase()) ||
      String(item.entity_id).includes(search);

    const matchesStatus = statusFilter === 'All' || 
      (statusFilter === 'Approved' && item.status === 'Applied') ||
      (statusFilter === 'Dismissed' && item.status === 'Dismissed') ||
      (statusFilter === 'Pending' && item.status === 'Pending');

    const matchesCategory = categoryFilter === 'All' || 
      item.category?.toLowerCase() === categoryFilter.toLowerCase();

    return matchesSearch && matchesStatus && matchesCategory;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-text tracking-tight flex items-center gap-2">
            <History className="text-primary w-7 h-7" />
            AI Decision History & Auditability
          </h2>
          <p className="text-textMuted text-sm mt-1">
            Complete immutable lifecycle records of all autonomous AI recommendations, operator actions, and measured operational impacts.
          </p>
        </div>
        <button onClick={fetchHistory} className="btn-secondary p-2.5 rounded-xl">
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Filter Strip */}
      <div className="glass-panel p-4 flex flex-col md:flex-row gap-4 justify-between items-center">
        <div className="flex items-center gap-2 bg-surface border border-border/50 rounded-xl px-3 py-2 w-full md:w-80">
          <Search className="w-4 h-4 text-textMuted" />
          <input 
            type="text" 
            placeholder="Search by Order ID, SKU, or keyword..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="bg-transparent border-none outline-none text-xs text-text w-full placeholder:text-textMuted"
          />
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
          <div className="bg-surface border border-border/50 rounded-xl p-1 flex">
            {['All', 'Approved', 'Dismissed', 'Pending'].map((st) => (
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

          <div className="bg-surface border border-border/50 rounded-xl p-1 flex">
            {['All', 'Allocation', 'Stockout', 'Bottleneck', 'Routing'].map((cat) => (
              <button
                key={cat}
                onClick={() => setCategoryFilter(cat)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  categoryFilter === cat
                    ? 'bg-primary text-white shadow-sm'
                    : 'text-textMuted hover:text-text'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Decision History Records */}
      {loading ? (
        <div className="glass-panel p-12 text-center text-textMuted animate-pulse">
          Loading audit trail of AI decisions...
        </div>
      ) : filteredHistory.length === 0 ? (
        <div className="glass-panel p-16 flex flex-col items-center justify-center text-center">
          <History className="w-16 h-16 text-textMuted mb-3 opacity-30" />
          <h3 className="text-lg font-bold text-text mb-1">No Decision Records Found</h3>
          <p className="text-textMuted text-xs max-w-sm">No decisions matched the selected filter criteria.</p>
        </div>
      ) : (
        <div className="space-y-4">
          <AnimatePresence>
            {filteredHistory.map((item, index) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.03 }}
                className={`glass-panel p-6 border-l-4 ${
                  item.status === 'Applied' ? 'border-l-success' :
                  item.status === 'Dismissed' ? 'border-l-danger' : 'border-l-warning'
                }`}
              >
                <div className="flex flex-col lg:flex-row justify-between gap-6">
                  {/* Left Column: Decision Details */}
                  <div className="flex-1 space-y-3">
                    <div className="flex flex-wrap items-center gap-3">
                      <span className="font-mono font-bold text-text text-sm">
                        #AI-{item.id.toString().padStart(4, '0')}
                      </span>
                      <span className="badge badge-info text-[10px] uppercase font-bold px-2.5 py-0.5">
                        {item.category}
                      </span>
                      <span className="badge badge-success text-[10px] font-semibold flex items-center gap-1">
                        <Sparkles className="w-3 h-3" /> {item.confidence}% Confidence
                      </span>
                      <span className="text-xs text-textMuted ml-auto flex items-center gap-1 font-mono">
                        <Clock className="w-3 h-3" />
                        {new Date(item.created_at).toLocaleString()}
                      </span>
                    </div>

                    <div>
                      <h4 className="text-base font-black text-text">
                        {item.decision}
                      </h4>
                      <p className="text-xs text-textMuted mt-1 leading-relaxed">
                        <strong>Problem Detected:</strong> {item.situation}
                      </p>
                    </div>

                    <div className="p-3 bg-surface/50 rounded-xl border border-border/50 text-xs space-y-1">
                      <p className="text-textMuted">
                        <strong>Reasoning:</strong> {item.reasoning}
                      </p>
                      <p className="text-success font-medium flex items-center gap-1">
                        <strong>Impact:</strong> {item.impact}
                      </p>
                    </div>
                  </div>

                  {/* Right Column: Operator Action & Execution Result */}
                  <div className="lg:w-80 bg-surface/50 border border-border/50 rounded-xl p-4 flex flex-col justify-between space-y-3">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-textMuted tracking-wider">
                        Operator Audit Status
                      </span>
                      <div className="flex items-center gap-2 mt-1.5">
                        {item.status === 'Applied' ? (
                          <span className="badge badge-success flex items-center gap-1 text-xs font-bold">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Approved & Executed
                          </span>
                        ) : item.status === 'Dismissed' ? (
                          <span className="badge badge-danger flex items-center gap-1 text-xs font-bold">
                            <XCircle className="w-3.5 h-3.5" /> Rejected by User
                          </span>
                        ) : (
                          <span className="badge badge-warning flex items-center gap-1 text-xs font-bold">
                            <Clock className="w-3.5 h-3.5" /> Pending Operator Review
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="pt-2 border-t border-border/50 text-xs">
                      <p className="text-textMuted font-medium">Target Entity:</p>
                      <p className="font-mono text-text font-bold mt-0.5">{item.entity_type} #{item.entity_id}</p>
                      <p className="text-primary font-medium text-[11px] mt-2">{item.result}</p>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
};

export default DecisionHistory;
