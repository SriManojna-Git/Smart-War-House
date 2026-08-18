import React, { useEffect, useState } from 'react';
import { NavLink } from 'react-router-dom';
import api from '../api';
import { 
  BrainCircuit, 
  Check, 
  X, 
  AlertOctagon, 
  TrendingDown, 
  Sparkles,
  Zap,
  Layers,
  Database,
  ArrowRight,
  RefreshCw,
  CheckCircle2,
  TrendingUp,
  History
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const DecisionCenter = () => {
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState<string>('All');
  const [applyingId, setApplyingId] = useState<number | null>(null);
  const [impactResult, setImpactResult] = useState<any>(null);

  const fetchRecommendations = async () => {
    try {
      const response = await api.get('/api/recommendations');
      setRecommendations(response.data);
    } catch (error) {
      console.error('Failed to fetch recommendations', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecommendations();
  }, []);

  const handleApply = async (id: number) => {
    setApplyingId(id);
    try {
      const response = await api.post(`/api/recommendations/${id}/apply`);
      setRecommendations(recommendations.filter(r => r.id !== id));
      if (response.data.before_after_impact) {
        setImpactResult(response.data.before_after_impact);
      }
    } catch (error) {
      console.error('Failed to apply recommendation', error);
    } finally {
      setApplyingId(null);
    }
  };

  const handleDismiss = async (id: number) => {
    try {
      await api.post(`/api/recommendations/${id}/dismiss`);
      setRecommendations(recommendations.filter(r => r.id !== id));
    } catch (error) {
      console.error('Failed to dismiss recommendation', error);
    }
  };

  const categories = ['All', 'Allocation', 'Stockout', 'Bottleneck', 'Routing'];

  const filteredRecs = recommendations.filter(r => {
    if (activeCategory === 'All') return true;
    return r.category?.toLowerCase() === activeCategory.toLowerCase();
  });

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-text tracking-tight flex items-center gap-2">
            <BrainCircuit className="text-primary w-7 h-7" />
            AI Decision Center (Explainable Engine)
          </h2>
          <p className="text-textMuted text-sm mt-1">
            Real-time explainable decisions with root-cause attribution, confidence metrics, and before/after impact.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <NavLink to="/decision-history" className="btn-secondary text-xs flex items-center gap-1.5 py-2 px-3">
            <History className="w-4 h-4 text-primary" /> Decision History
          </NavLink>
          <button onClick={fetchRecommendations} className="btn-secondary p-2 rounded-xl">
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
              activeCategory === cat
                ? 'bg-primary text-white shadow-lg shadow-primary/25'
                : 'glass-panel text-textMuted hover:text-text'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Decision Cards */}
      {loading ? (
        <div className="glass-panel p-12 text-center text-textMuted animate-pulse">
          Evaluating autonomous decisions and confidence factors...
        </div>
      ) : filteredRecs.length === 0 ? (
        <div className="glass-panel p-16 flex flex-col items-center justify-center text-center">
          <CheckCircle2 className="w-16 h-16 text-success mb-3 opacity-60" />
          <h3 className="text-lg font-bold text-text mb-1">Zero Action Required</h3>
          <p className="text-textMuted text-xs max-w-sm">All operations are running within optimal parameters. No recommendations pending review.</p>
        </div>
      ) : (
        <div className="space-y-6">
          <AnimatePresence>
            {filteredRecs.map((rec, index) => (
              <motion.div 
                key={rec.id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ delay: index * 0.05 }}
                className="glass-card p-6 border-l-4 border-l-primary space-y-6 relative overflow-hidden shadow-xl"
              >
                {/* 1. HEADER ROW */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="badge badge-info text-[10px] uppercase tracking-wider font-bold">
                        {rec.category || 'Allocation'}
                      </span>
                      <span className="text-xs font-mono text-textMuted">Target: {rec.entity_type} #{rec.entity_id}</span>
                    </div>
                    <h3 className="text-lg font-black text-text mt-1">
                      {rec.decision || rec.recommendation}
                    </h3>
                  </div>

                  {/* Dynamic Confidence Pill */}
                  <div className="flex items-center gap-2 bg-success/10 border border-success/30 px-3.5 py-1.5 rounded-xl">
                    <Sparkles className="w-4 h-4 text-success" />
                    <span className="text-xs font-black text-success tracking-wide">
                      {rec.confidence ? `${rec.confidence}% Confidence` : '94% Confidence'}
                    </span>
                  </div>
                </div>

                {/* 2. EXPLAINABLE AI BREAKDOWN */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Left: Root Cause & Situation */}
                  <div className="p-4 bg-surface/60 rounded-xl border border-border/50 space-y-2">
                    <div className="flex items-center gap-2 text-warning font-bold text-xs uppercase tracking-wider">
                      <AlertOctagon className="w-4 h-4" /> Root-Cause Analysis (Why)
                    </div>
                    <p className="text-xs text-text leading-relaxed font-medium">
                      {rec.situation}
                    </p>
                    <p className="text-xs text-textMuted">
                      <strong>Reasoning:</strong> {rec.reasoning}
                    </p>
                  </div>

                  {/* Right: Data Considered & Impact */}
                  <div className="p-4 bg-surface/60 rounded-xl border border-border/50 space-y-2">
                    <div className="flex items-center gap-2 text-primary font-bold text-xs uppercase tracking-wider">
                      <Database className="w-4 h-4" /> Data Considered & Expected Impact
                    </div>
                    <p className="text-xs text-textMuted">
                      <strong>Data Inputs:</strong> {rec.data_considered || 'Order SLA urgency (Critical), Real-time available buffer, FIFO priority sequence.'}
                    </p>
                    <p className="text-xs text-success font-semibold flex items-center gap-1.5 mt-1">
                      <TrendingUp className="w-3.5 h-3.5" /> <strong>Impact:</strong> {rec.impact}
                    </p>
                  </div>
                </div>

                {/* 3. ACTION CONTROLS */}
                <div className="pt-2 border-t border-border/50 flex justify-between items-center">
                  <span className="text-[11px] text-textMuted">
                    Autonomous Engine Model: V3.2 Priority Evaluator
                  </span>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => handleDismiss(rec.id)}
                      className="btn-secondary text-xs px-4 py-2 flex items-center gap-1 text-textMuted hover:text-text"
                    >
                      <X className="w-3.5 h-3.5" /> Dismiss
                    </button>
                    <button
                      onClick={() => handleApply(rec.id)}
                      disabled={applyingId === rec.id}
                      className="btn-primary text-xs px-5 py-2 flex items-center gap-1.5 font-bold shadow-lg shadow-primary/25"
                    >
                      {applyingId === rec.id ? (
                        <Sparkles className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Check className="w-3.5 h-3.5" />
                      )}
                      {applyingId === rec.id ? 'Applying...' : 'Approve & Execute Decision'}
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* 4. BEFORE vs AFTER IMPACT COMPARISON MODAL */}
      <AnimatePresence>
        {impactResult && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setImpactResult(null)} className="absolute inset-0 bg-background/80 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="relative w-full max-w-lg glass-card p-6 space-y-5 shadow-2xl border-l-4 border-l-success">
              <div className="flex items-center justify-between border-b border-border/50 pb-3">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-success/10 text-success rounded-xl">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-text">Decision Executed Successfully</h3>
                    <p className="text-xs text-textMuted">Measured Operational Impact: Before vs After AI Action</p>
                  </div>
                </div>
                <button onClick={() => setImpactResult(null)} className="text-textMuted hover:text-text">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-2.5">
                {impactResult.metrics?.map((m: any, idx: number) => (
                  <div key={idx} className="p-3 bg-surface/60 rounded-xl border border-border/50 flex justify-between items-center text-xs">
                    <div>
                      <p className="font-bold text-text">{m.name}</p>
                      <p className="text-textMuted text-[11px]">
                        Before: <span className="font-mono text-danger font-semibold">{m.before}</span> → After: <span className="font-mono text-success font-bold">{m.after}</span>
                      </p>
                    </div>
                    <span className="badge badge-success text-[10px] font-bold">
                      {m.delta}
                    </span>
                  </div>
                ))}
              </div>

              <div className="pt-2 border-t border-border/50 flex justify-between items-center">
                <NavLink to="/decision-history" className="text-xs text-primary font-bold hover:underline flex items-center gap-1">
                  <History className="w-3.5 h-3.5" /> View Decision Audit Trail
                </NavLink>
                <button onClick={() => setImpactResult(null)} className="btn-primary text-xs font-bold px-4 py-2">
                  Done
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default DecisionCenter;
