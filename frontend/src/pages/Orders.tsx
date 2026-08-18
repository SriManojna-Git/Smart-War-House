import React, { useEffect, useState } from 'react';
import api from '../api';
import { 
  ShoppingCart, 
  Search, 
  Zap, 
  Clock, 
  Info, 
  CheckCircle2, 
  ArrowRight,
  ShieldCheck, 
  X,
  History,
  Sparkles,
  ChevronDown,
  AlertTriangle,
  FileSpreadsheet,
  Check
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import ReportExportModal from '../components/ReportExportModal';

const Orders = () => {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  const [showExportModal, setShowExportModal] = useState(false);
  
  // Timeline Modal State
  const [selectedTimelineOrder, setSelectedTimelineOrder] = useState<number | null>(null);
  const [timelineData, setTimelineData] = useState<any>(null);
  const [loadingTimeline, setLoadingTimeline] = useState(false);

  // Score Factor Popover State
  const [selectedScoreOrder, setSelectedScoreOrder] = useState<any>(null);

  // AI Order Recovery State
  const [recoveryOrder, setRecoveryOrder] = useState<any>(null);
  const [recoveryData, setRecoveryData] = useState<any>(null);
  const [loadingRecovery, setLoadingRecovery] = useState(false);
  const [applyingRecovery, setApplyingRecovery] = useState(false);

  const fetchOrders = async () => {
    try {
      const response = await api.get('/api/orders');
      setOrders(response.data);
    } catch (error) {
      console.error('Failed to fetch orders', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const handleAllocate = async (orderId: number) => {
    setActionLoading(orderId);
    try {
      await api.post(`/api/orders/${orderId}/allocate`);
      fetchOrders();
    } catch (error) {
      console.error('Failed to allocate', error);
    } finally {
      setActionLoading(null);
    }
  };

  const openTimeline = async (orderId: number) => {
    setSelectedTimelineOrder(orderId);
    setLoadingTimeline(true);
    try {
      const res = await api.get(`/api/orders/${orderId}/timeline`);
      setTimelineData(res.data);
    } catch (e) {
      console.error('Failed to load timeline', e);
    } finally {
      setLoadingTimeline(false);
    }
  };

  const openRecovery = async (order: any) => {
    setRecoveryOrder(order);
    setLoadingRecovery(true);
    try {
      const res = await api.get(`/api/orders/${order.id}/recovery`);
      setRecoveryData(res.data);
    } catch (e) {
      console.error('Failed to load recovery suggestion', e);
    } finally {
      setLoadingRecovery(false);
    }
  };

  const handleApplyRecovery = async () => {
    if (!recoveryData) return;
    setApplyingRecovery(true);
    try {
      await api.post(`/api/orders/${recoveryData.order_id}/apply-recovery`, {
        action_type: recoveryData.action_type
      });
      setRecoveryOrder(null);
      setRecoveryData(null);
      fetchOrders();
    } catch (e) {
      console.error('Failed to apply recovery', e);
    } finally {
      setApplyingRecovery(false);
    }
  };

  const getPriorityBadge = (score: number, urgency: string) => {
    const s = Math.round(score || 0);
    if (score >= 80 || urgency === 'Critical') {
      return <span className="badge badge-danger font-bold text-xs">Critical ({s})</span>;
    }
    if (score >= 60 || urgency === 'High') {
      return <span className="badge badge-warning font-bold text-xs">High ({s})</span>;
    }
    if (score >= 40 || urgency === 'Medium') {
      return <span className="badge badge-info font-bold text-xs">Medium ({s})</span>;
    }
    return <span className="badge bg-surface text-textMuted border border-border text-xs">Low ({s})</span>;
  };

  const getSlaBadge = (status: string, label: string) => {
    switch (status) {
      case 'OVERDUE':
        return <span className="badge badge-danger font-bold text-[10px] uppercase">Overdue ({label})</span>;
      case 'CRITICAL':
        return <span className="badge badge-danger font-bold text-[10px] uppercase flex items-center gap-1 animate-pulse"><AlertTriangle className="w-3 h-3" /> Critical ({label})</span>;
      case 'AT RISK':
        return <span className="badge badge-warning font-semibold text-[10px] uppercase">{label}</span>;
      default:
        return <span className="badge badge-success text-[10px] uppercase">{label || 'On Track'}</span>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-text tracking-tight flex items-center gap-2">
            <ShoppingCart className="text-primary w-7 h-7" />
            Smart Order Priority & SLA Management
          </h2>
          <p className="text-textMuted text-sm mt-1">
            Real-time deadline tracking, SLA breach prevention, and autonomous recovery actions.
          </p>
        </div>
        <button 
          onClick={() => setShowExportModal(true)}
          className="btn-secondary text-xs flex items-center gap-1.5 py-2 px-3.5 font-bold"
        >
          <FileSpreadsheet className="w-4 h-4 text-success" /> Export Orders
        </button>
      </div>

      <div className="glass-panel overflow-hidden shadow-xl">
        {loading ? (
          <div className="p-8 text-center text-textMuted animate-pulse">Calculating SLA horizons and order priority weights...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-surface/50 text-textMuted uppercase text-xs font-semibold border-b border-border/50">
                <tr>
                  <th className="px-6 py-4">Order ID</th>
                  <th className="px-6 py-4">Customer</th>
                  <th className="px-6 py-4">SLA Deadline Horizon</th>
                  <th className="px-6 py-4">AI Priority Score</th>
                  <th className="px-6 py-4">Value</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-center">Lifecycle</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/10">
                {orders.map((order, index) => (
                  <motion.tr 
                    key={order.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: index * 0.02 }}
                    className={`hover:bg-border/10 transition-colors ${order.is_at_risk ? 'bg-danger/5' : ''}`}
                  >
                    <td className="px-6 py-4 font-mono font-bold text-text">ORD-{order.id.toString().padStart(4, '0')}</td>
                    <td className="px-6 py-4 font-medium text-text">{order.customer_name}</td>
                    
                    {/* SLA Status Column */}
                    <td className="px-6 py-4">
                      {getSlaBadge(order.sla_status, order.remaining_label)}
                    </td>

                    {/* Priority Score Column */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        {getPriorityBadge(order.priority_score || 50, order.urgency)}
                        <button
                          onClick={() => setSelectedScoreOrder(order)}
                          className="text-textMuted hover:text-primary transition-colors p-1"
                          title="View Score Breakdown"
                        >
                          <Info className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>

                    <td className="px-6 py-4 font-medium text-text">${order.order_value.toFixed(2)}</td>
                    <td className="px-6 py-4">
                      <span className={`text-xs px-2.5 py-1 rounded font-medium border ${
                        order.status === 'Allocated' ? 'bg-success/10 border-success/30 text-success' :
                        order.status === 'Partially Allocated' ? 'bg-warning/10 border-warning/30 text-warning' :
                        'bg-surface border-border/50 text-textMuted'
                      }`}>
                        {order.status}
                      </span>
                    </td>

                    {/* Timeline button */}
                    <td className="px-6 py-4 text-center">
                      <button 
                        onClick={() => openTimeline(order.id)}
                        className="text-xs text-primary font-semibold hover:underline flex items-center justify-center gap-1 mx-auto"
                      >
                        <History className="w-3.5 h-3.5" /> Timeline
                      </button>
                    </td>

                    {/* Action buttons */}
                    <td className="px-6 py-4 text-right space-x-2">
                      {order.is_at_risk && order.status !== 'Delivered' && (
                        <button
                          onClick={() => openRecovery(order)}
                          className="btn-secondary text-xs px-2.5 py-1 text-danger border-danger/30 hover:bg-danger/10 inline-flex items-center gap-1 font-bold"
                          title="AI Order Recovery"
                        >
                          <Sparkles className="w-3 h-3 text-danger" /> Recovery
                        </button>
                      )}

                      {['Created', 'Prioritized', 'Partially Allocated'].includes(order.status) && (
                        <button 
                          onClick={() => handleAllocate(order.id)}
                          disabled={actionLoading === order.id}
                          className="btn-primary text-xs px-3 py-1 flex items-center gap-1 inline-flex font-bold"
                        >
                          {actionLoading === order.id ? (
                            <Clock className="w-3 h-3 animate-spin" />
                          ) : (
                            <Zap className="w-3 h-3 fill-current" />
                          )}
                          Allocate
                        </button>
                      )}
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 1. SCORE FACTOR EXPLANATION MODAL */}
      <AnimatePresence>
        {selectedScoreOrder && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setSelectedScoreOrder(null)} className="absolute inset-0 bg-background/80 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="relative w-full max-w-lg glass-card p-6 space-y-4 shadow-2xl">
              <div className="flex items-center justify-between border-b border-border/50 pb-3">
                <div>
                  <h3 className="text-base font-bold text-text flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-primary" /> Priority Score Attribution
                  </h3>
                  <p className="text-xs text-textMuted">Order #{selectedScoreOrder.id} — {selectedScoreOrder.customer_name}</p>
                </div>
                <button onClick={() => setSelectedScoreOrder(null)} className="text-textMuted hover:text-text">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-primary/10 border border-primary/20">
                <span className="text-xs font-bold text-primary uppercase">Calculated AI Priority Score:</span>
                <span className="text-xl font-black text-text">{Math.round(selectedScoreOrder.priority_score || 0)} / 100</span>
              </div>

              <div className="space-y-2">
                <h4 className="text-xs font-bold uppercase text-textMuted">Weighted Factors Considered:</h4>
                <div className="space-y-2 text-xs">
                  {selectedScoreOrder.priority_factors ? (
                    JSON.parse(selectedScoreOrder.priority_factors).map((f: any, i: number) => (
                      <div key={i} className="p-3 bg-surface/60 rounded-xl border border-border/50 flex justify-between items-center">
                        <div>
                          <p className="font-bold text-text">{f.factor}</p>
                          <p className="text-[11px] text-textMuted">{f.detail}</p>
                        </div>
                        <span className="font-mono font-bold text-primary">+{f.points} pts</span>
                      </div>
                    ))
                  ) : (
                    <p className="text-textMuted italic">Standard default factor weights applied.</p>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 2. ORDER TIMELINE MODAL */}
      <AnimatePresence>
        {selectedTimelineOrder && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setSelectedTimelineOrder(null)} className="absolute inset-0 bg-background/80 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="relative w-full max-w-2xl glass-card p-6 space-y-6 shadow-2xl max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between border-b border-border/50 pb-3">
                <div>
                  <h3 className="text-lg font-bold text-text flex items-center gap-2">
                    <History className="w-5 h-5 text-primary" /> Complete Operation Timeline
                  </h3>
                  <p className="text-xs text-textMuted">Order #{selectedTimelineOrder} Lifecycle & Immutable Audit Trail</p>
                </div>
                <button onClick={() => setSelectedTimelineOrder(null)} className="text-textMuted hover:text-text">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {loadingTimeline ? (
                <div className="p-8 text-center text-textMuted animate-pulse">Loading journey steps...</div>
              ) : timelineData && (
                <div className="space-y-6">
                  <div className="relative border-l-2 border-primary/30 ml-4 space-y-6 py-2">
                    {timelineData.stages.map((stg: any, i: number) => (
                      <div key={i} className="relative pl-6">
                        <span className={`absolute -left-[9px] top-1 w-4 h-4 rounded-full border-2 ${
                          stg.status === 'Completed' ? 'bg-success border-success' :
                          stg.status === 'In Progress' ? 'bg-primary border-primary animate-ping' :
                          'bg-surface border-border'
                        }`}></span>
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="text-xs font-bold text-text">{stg.stage}</h4>
                            <p className="text-[11px] text-textMuted">{stg.user}</p>
                            {stg.detail && <p className="text-[11px] text-primary font-medium mt-0.5">{stg.detail}</p>}
                          </div>
                          <span className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase ${
                            stg.status === 'Completed' ? 'bg-success/10 text-success' :
                            stg.status === 'In Progress' ? 'bg-primary/10 text-primary' :
                            'bg-surface text-textMuted'
                          }`}>
                            {stg.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>

                  {timelineData.audit_logs?.length > 0 && (
                    <div className="space-y-2 pt-4 border-t border-border/50">
                      <h4 className="text-xs font-bold uppercase text-textMuted">Audit Log Verification:</h4>
                      <div className="space-y-1.5 max-h-36 overflow-y-auto">
                        {timelineData.audit_logs.map((log: any, i: number) => (
                          <div key={i} className="p-2 bg-surface/50 rounded-lg border border-border/50 text-[11px] flex justify-between items-center">
                            <div>
                              <span className="font-bold text-text">{log.action}</span>
                              <span className="text-textMuted"> by {log.user}</span>
                            </div>
                            <span className="text-textMuted font-mono">{new Date(log.timestamp).toLocaleTimeString()}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 3. AI ORDER RECOVERY ACTION MODAL */}
      <AnimatePresence>
        {recoveryOrder && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setRecoveryOrder(null)} className="absolute inset-0 bg-background/80 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="relative w-full max-w-lg glass-card p-6 space-y-4 shadow-2xl border-l-4 border-l-danger">
              <div className="flex items-center justify-between border-b border-border/50 pb-3">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-danger/10 text-danger rounded-xl">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-text">AI Autonomous Order Recovery</h3>
                    <p className="text-xs text-textMuted">Order #{recoveryOrder.id} ({recoveryOrder.customer_name})</p>
                  </div>
                </div>
                <button onClick={() => setRecoveryOrder(null)} className="text-textMuted hover:text-text">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {loadingRecovery ? (
                <div className="p-8 text-center text-textMuted animate-pulse">Synthesizing recovery path...</div>
              ) : recoveryData && (
                <div className="space-y-4 text-xs">
                  <div className="p-3 bg-danger/10 border border-danger/20 rounded-xl space-y-1">
                    <p className="font-bold text-danger uppercase tracking-wider text-[10px]">Detected SLA Crisis:</p>
                    <p className="text-text">{recoveryData.problem}</p>
                  </div>

                  <div className="p-3 bg-primary/10 border border-primary/20 rounded-xl space-y-1">
                    <p className="font-bold text-primary uppercase tracking-wider text-[10px]">Recommended Recovery Action:</p>
                    <p className="text-text font-semibold text-sm">{recoveryData.recommended_recovery}</p>
                  </div>

                  <div className="p-3 bg-surface/60 rounded-xl border border-border/50 flex justify-between items-center">
                    <span className="text-textMuted">Expected Delay Reduction:</span>
                    <span className="font-black text-success text-sm">~{recoveryData.delay_reduction_minutes} minutes faster</span>
                  </div>

                  <div className="pt-3 border-t border-border/50 flex justify-end gap-3">
                    <button onClick={() => setRecoveryOrder(null)} className="btn-secondary text-xs">
                      Cancel
                    </button>
                    <button
                      onClick={handleApplyRecovery}
                      disabled={applyingRecovery}
                      className="btn-primary text-xs font-bold px-5 py-2 flex items-center gap-1.5 shadow-md shadow-primary/20"
                    >
                      {applyingRecovery ? <Clock className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                      {applyingRecovery ? 'Executing Recovery...' : 'Approve & Execute Recovery'}
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <ReportExportModal isOpen={showExportModal} onClose={() => setShowExportModal(false)} defaultReport="orders" />
    </div>
  );
};

export default Orders;
