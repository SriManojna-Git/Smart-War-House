import React, { useEffect, useState } from 'react';
import api from '../api';
import { 
  AlertOctagon, 
  ShieldAlert, 
  CheckCircle2, 
  Clock, 
  Sparkles, 
  Filter, 
  Check, 
  ChevronRight,
  RefreshCw,
  AlertTriangle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const Exceptions = () => {
  const [exceptions, setExceptions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('All');
  const [resolvingId, setResolvingId] = useState<number | null>(null);

  const fetchExceptions = async () => {
    try {
      const response = await api.get('/api/exceptions');
      setExceptions(response.data);
    } catch (error) {
      console.error('Failed to fetch exceptions', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExceptions();
  }, []);

  const handleResolve = async (id: number, resolution: string) => {
    setResolvingId(id);
    try {
      await api.post(`/api/exceptions/${id}/resolve`, { resolution });
      fetchExceptions();
    } catch (error) {
      console.error('Failed to resolve exception', error);
    } finally {
      setResolvingId(null);
    }
  };

  const getSeverityBadge = (severity: string) => {
    switch (severity?.toLowerCase()) {
      case 'critical':
        return <span className="badge badge-danger">Critical</span>;
      case 'high':
        return <span className="badge badge-warning">High</span>;
      case 'medium':
        return <span className="badge badge-info">Medium</span>;
      default:
        return <span className="badge bg-surface text-textMuted border border-border">Low</span>;
    }
  };

  const filteredExceptions = exceptions.filter(e => {
    if (filter === 'Open') return e.status === 'Open';
    if (filter === 'Resolved') return e.status === 'Resolved';
    return true;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-text tracking-tight flex items-center gap-2">
            <ShieldAlert className="text-danger w-7 h-7" />
            Exception Command Center
          </h2>
          <p className="text-textMuted text-sm mt-1">
            Real-time anomaly detection, AI root-cause analysis, and one-click operational resolutions.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="bg-surface border border-border/50 rounded-xl p-1 flex">
            {['All', 'Open', 'Resolved'].map((tab) => (
              <button
                key={tab}
                onClick={() => setFilter(tab)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  filter === tab
                    ? 'bg-primary text-white shadow-sm'
                    : 'text-textMuted hover:text-text'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
          <button onClick={fetchExceptions} className="btn-secondary p-2.5 rounded-xl">
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {loading ? (
        <div className="glass-panel p-12 text-center text-textMuted animate-pulse">
          Analyzing warehouse anomalies...
        </div>
      ) : filteredExceptions.length === 0 ? (
        <div className="glass-panel p-12 flex flex-col items-center justify-center text-center">
          <CheckCircle2 className="w-16 h-16 text-success mb-4 opacity-50" />
          <h3 className="text-xl font-medium text-text mb-1">Zero Open Exceptions</h3>
          <p className="text-textMuted max-w-md">
            All warehouse workflows are operating strictly within tolerance levels.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          <AnimatePresence>
            {filteredExceptions.map((exc, index) => (
              <motion.div
                key={exc.id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ delay: index * 0.05 }}
                className={`glass-panel p-6 border-l-4 ${
                  exc.status === 'Resolved' 
                    ? 'border-l-success opacity-75' 
                    : exc.severity === 'Critical' 
                    ? 'border-l-danger' 
                    : 'border-l-warning'
                }`}
              >
                <div className="flex flex-col lg:flex-row justify-between gap-6">
                  {/* Left: Exception Info */}
                  <div className="flex-1 space-y-3">
                    <div className="flex items-center gap-3">
                      {getSeverityBadge(exc.severity || 'High')}
                      <span className="text-xs px-2.5 py-1 bg-surface border border-border/50 rounded text-textMuted font-mono">
                        {exc.type}
                      </span>
                      <span className="text-xs text-textMuted">
                        Entity #{exc.related_entity_id} ({exc.entity_type})
                      </span>
                      <span className="text-xs text-textMuted ml-auto flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {new Date(exc.created_at).toLocaleTimeString()}
                      </span>
                    </div>

                    <h3 className="text-lg font-bold text-text">
                      {exc.description}
                    </h3>

                    {/* AI Analysis Box */}
                    <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 space-y-2">
                      <div className="flex items-center gap-2 text-primary font-semibold text-xs uppercase tracking-wide">
                        <Sparkles className="w-4 h-4" /> AI Root Cause Analysis
                      </div>
                      <p className="text-sm text-text/90 leading-relaxed">
                        {exc.ai_analysis || "Anomaly evaluated against active order priorities and available buffer stock."}
                      </p>
                    </div>
                  </div>

                  {/* Right: Recommended Decision & Action */}
                  <div className="lg:w-96 flex flex-col justify-between bg-surface/50 border border-border/50 rounded-xl p-4">
                    <div>
                      <h4 className="text-xs uppercase font-bold text-textMuted mb-1 flex items-center gap-1.5">
                        <AlertTriangle className="w-3.5 h-3.5 text-warning" /> Recommended Resolution
                      </h4>
                      <p className="text-sm text-text font-medium mt-1">
                        {exc.recommended_action || "Auto-allocate buffer unit and route damaged stock to RMA vendor credit."}
                      </p>
                    </div>

                    <div className="mt-4 pt-4 border-t border-border/50 flex items-center justify-between">
                      <span className={`text-xs font-semibold ${exc.status === 'Resolved' ? 'text-success' : 'text-warning'}`}>
                        Status: {exc.status}
                      </span>

                      {exc.status === 'Open' ? (
                        <button
                          onClick={() => handleResolve(exc.id, exc.recommended_action || "Applied AI Recommended Solution")}
                          disabled={resolvingId === exc.id}
                          className="btn-primary text-xs px-4 py-2 flex items-center gap-1.5"
                        >
                          {resolvingId === exc.id ? (
                            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <Check className="w-3.5 h-3.5" />
                          )}
                          Execute AI Resolution
                        </button>
                      ) : (
                        <span className="text-xs text-textMuted italic">
                          Resolved: {exc.resolution}
                        </span>
                      )}
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

export default Exceptions;
