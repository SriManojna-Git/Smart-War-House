import React, { useEffect, useState } from 'react';
import api from '../api';
import { 
  Sparkles, 
  BrainCircuit, 
  CheckCircle2, 
  ArrowRight, 
  RefreshCw, 
  Layers, 
  MapPin, 
  DollarSign, 
  ShieldAlert,
  Zap
} from 'lucide-react';
import { motion } from 'framer-motion';

const AIOptimization = () => {
  const [optimizations, setOptimizations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [appliedIndices, setAppliedIndices] = useState<number[]>([]);

  const fetchOptimizations = async () => {
    try {
      const response = await api.get('/api/analytics/optimization');
      setOptimizations(response.data);
    } catch (e) {
      console.error('Failed to load optimizations', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOptimizations();
  }, []);

  const handleApply = (idx: number) => {
    setAppliedIndices(prev => [...prev, idx]);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-text tracking-tight flex items-center gap-2">
            <BrainCircuit className="text-primary w-7 h-7" />
            AI Autonomous Inventory Optimization Engine
          </h2>
          <p className="text-textMuted text-sm mt-1">
            Continuous systemic audit across velocity, holding costs, dead stock risks, supplier SLA, and slotting geometry.
          </p>
        </div>
        <button onClick={fetchOptimizations} className="btn-secondary p-2.5 rounded-xl">
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Optimization Action Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {loading ? (
          <div className="md:col-span-2 glass-panel p-16 text-center text-textMuted animate-pulse">Running systemic optimization audit...</div>
        ) : optimizations.length === 0 ? (
          <div className="md:col-span-2 glass-panel p-16 text-center text-textMuted">Warehouse inventory is operating at 100% optimal equilibrium.</div>
        ) : (
          optimizations.map((opt, idx) => {
            const isApplied = appliedIndices.includes(idx);
            return (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                className={`glass-card flex flex-col justify-between space-y-4 border-l-4 ${
                  opt.priority === 'CRITICAL' ? 'border-l-danger bg-danger/5' :
                  opt.priority === 'HIGH' ? 'border-l-warning bg-warning/5' : 'border-l-primary'
                }`}
              >
                <div className="space-y-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className={`badge ${
                        opt.type === 'REORDER' ? 'badge-danger' :
                        opt.type === 'RELOCATE' ? 'badge-info' : 'badge-warning'
                      } font-bold text-[10px]`}>
                        {opt.type} STRATEGY
                      </span>
                      <h3 className="text-base font-black text-text mt-1.5">{opt.title}</h3>
                    </div>
                    <span className="font-mono text-xs text-success font-bold flex items-center gap-1">
                      <Sparkles className="w-3.5 h-3.5" /> {opt.confidence_pct}% AI Match
                    </span>
                  </div>

                  <div className="p-3 bg-surface/60 rounded-xl border border-border/50 space-y-2 text-xs">
                    <div>
                      <p className="font-bold text-textMuted uppercase text-[10px]">DIAGNOSTIC REASONING</p>
                      <p className="text-text mt-0.5">{opt.reason}</p>
                    </div>
                    <div>
                      <p className="font-bold text-textMuted uppercase text-[10px]">PRESCRIPTIVE ACTION</p>
                      <p className="text-primary font-bold mt-0.5">{opt.action}</p>
                    </div>
                  </div>

                  <p className="text-xs text-textMuted">
                    Expected Systemic Impact: <strong className="text-success">{opt.expected_impact}</strong>
                  </p>
                </div>

                <div className="pt-3 border-t border-border/50">
                  <button
                    onClick={() => handleApply(idx)}
                    disabled={isApplied}
                    className={`w-full text-xs py-2.5 rounded-xl font-bold flex items-center justify-center gap-2 transition-all ${
                      isApplied 
                        ? 'bg-success/20 text-success border border-success/30' 
                        : 'btn-primary shadow-md shadow-primary/20'
                    }`}
                  >
                    {isApplied ? (
                      <>
                        <CheckCircle2 className="w-4 h-4" /> Optimization Executed
                      </>
                    ) : (
                      <>
                        <Zap className="w-4 h-4" /> Execute Recommended Action
                      </>
                    )}
                  </button>
                </div>
              </motion.div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default AIOptimization;
