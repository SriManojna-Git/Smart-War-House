import React, { useEffect, useState } from 'react';
import { NavLink } from 'react-router-dom';
import api from '../api';
import { 
  Bell, 
  AlertCircle, 
  Info, 
  AlertTriangle, 
  CheckCircle2, 
  ArrowRight, 
  Check,
  Filter,
  Layers,
  Sparkles,
  RefreshCw
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const Alerts = () => {
  const [alerts, setAlerts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [severityFilter, setSeverityFilter] = useState('All');
  const [selectedAlertDetails, setSelectedAlertDetails] = useState<any>(null);

  const fetchAlerts = async () => {
    try {
      const response = await api.get('/api/alerts');
      setAlerts(response.data);
    } catch (error) {
      console.error('Failed to fetch alerts', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlerts();
  }, []);

  const handleMarkRead = async (alertId: number) => {
    try {
      await api.post(`/api/alerts/${alertId}/read`);
      setAlerts(alerts.filter(a => a.id !== alertId));
    } catch (e) {
      console.error('Failed to mark read', e);
    }
  };

  const getAlertIcon = (severity: string) => {
    switch(severity) {
      case 'Critical': return <AlertCircle className="w-5 h-5 text-danger animate-pulse" />;
      case 'Warning': return <AlertTriangle className="w-5 h-5 text-warning" />;
      default: return <Info className="w-5 h-5 text-info" />;
    }
  };

  const filteredAlerts = alerts.filter(a => {
    if (severityFilter === 'All') return true;
    return a.severity?.toLowerCase() === severityFilter.toLowerCase();
  });

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-text tracking-tight flex items-center gap-2">
            <Bell className="text-primary w-7 h-7" />
            Smart Notification & Anomaly Center
          </h2>
          <p className="text-textMuted text-sm mt-1">
            Real-time event streaming for SLA breaches, stockout risks, zone bottlenecks, and QC anomalies.
          </p>
        </div>
        <button onClick={fetchAlerts} className="btn-secondary p-2.5 rounded-xl self-start sm:self-auto">
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Severity Filter Strip */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {['All', 'Critical', 'Warning', 'Info'].map((sev) => (
          <button
            key={sev}
            onClick={() => setSeverityFilter(sev)}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
              severityFilter === sev
                ? 'bg-primary text-white shadow-md'
                : 'glass-panel text-textMuted hover:text-text'
            }`}
          >
            {sev}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="animate-pulse space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-24 bg-surface rounded-xl"></div>
          ))}
        </div>
      ) : filteredAlerts.length === 0 ? (
        <div className="glass-panel p-16 text-center flex flex-col items-center justify-center">
          <CheckCircle2 className="w-16 h-16 text-success mb-3 opacity-50" />
          <h3 className="text-lg font-bold text-text mb-1">Zero Active Anomaly Notifications</h3>
          <p className="text-textMuted text-xs max-w-sm">All operations are running smoothly within nominal tolerances.</p>
        </div>
      ) : (
        <div className="space-y-4">
          <AnimatePresence>
            {filteredAlerts.map((alert, idx) => (
              <motion.div 
                key={alert.id}
                initial={{ opacity: 0, x: -15 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ delay: idx * 0.04 }}
                className={`glass-panel p-5 flex gap-4 items-start border-l-4 ${
                  alert.severity === 'Critical' ? 'border-l-danger bg-danger/5' :
                  alert.severity === 'Warning' ? 'border-l-warning bg-warning/5' : 'border-l-primary'
                }`}
              >
                <div className="mt-1">
                  {getAlertIcon(alert.severity)}
                </div>
                <div className="flex-1 space-y-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                        alert.severity === 'Critical' ? 'bg-danger text-white' :
                        alert.severity === 'Warning' ? 'bg-warning text-black font-bold' : 'bg-primary text-white'
                      }`}>
                        {alert.severity}
                      </span>
                      <h4 className="text-text font-bold text-sm mt-1">{alert.message}</h4>
                    </div>
                    <span className="text-xs text-textMuted font-mono">{new Date(alert.created_at).toLocaleTimeString()}</span>
                  </div>
                  
                  <p className="text-xs text-text/80 leading-relaxed">
                    <strong>Problem:</strong> {alert.reason}
                  </p>
                  
                  {alert.recommended_action && (
                    <div className="bg-surface/70 border border-border/50 rounded-xl p-3 text-xs flex flex-col sm:flex-row justify-between sm:items-center gap-3">
                      <div>
                        <span className="text-primary font-bold mr-1.5 uppercase tracking-wider text-[10px]">Recommended Action:</span>
                        <span className="text-text font-medium">{alert.recommended_action}</span>
                      </div>
                      <NavLink to="/decisions" className="btn-primary text-[11px] py-1.5 px-3 whitespace-nowrap flex items-center gap-1 font-bold self-end sm:self-auto">
                        Resolve in AI Center <ArrowRight className="w-3 h-3" />
                      </NavLink>
                    </div>
                  )}

                  <div className="flex justify-between items-center pt-1 text-xs">
                    <button
                      onClick={() => setSelectedAlertDetails(alert)}
                      className="text-primary hover:underline font-semibold"
                    >
                      View Incident Details
                    </button>
                    <button
                      onClick={() => handleMarkRead(alert.id)}
                      className="text-textMuted hover:text-text flex items-center gap-1 transition-colors"
                    >
                      <Check className="w-3.5 h-3.5" /> Mark as Read
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Incident Details Modal */}
      <AnimatePresence>
        {selectedAlertDetails && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setSelectedAlertDetails(null)} className="absolute inset-0 bg-background/80 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="relative w-full max-w-md glass-card p-6 space-y-4 shadow-2xl">
              <div className="flex items-center justify-between border-b border-border/50 pb-3">
                <h3 className="text-base font-bold text-text">Incident Notification Detail</h3>
                <button onClick={() => setSelectedAlertDetails(null)} className="text-textMuted hover:text-text">✕</button>
              </div>

              <div className="space-y-3 text-xs">
                <div className="p-3 bg-surface/50 rounded-xl border border-border/50 space-y-1">
                  <span className="text-[10px] uppercase font-bold text-textMuted">Incident Summary:</span>
                  <p className="font-bold text-text">{selectedAlertDetails.message}</p>
                </div>
                <div className="p-3 bg-surface/50 rounded-xl border border-border/50 space-y-1">
                  <span className="text-[10px] uppercase font-bold text-textMuted">Root Cause / Problem:</span>
                  <p className="text-text">{selectedAlertDetails.reason}</p>
                </div>
                <div className="p-3 bg-surface/50 rounded-xl border border-border/50 space-y-1">
                  <span className="text-[10px] uppercase font-bold text-textMuted">Prescribed Action:</span>
                  <p className="text-primary font-bold">{selectedAlertDetails.recommended_action || 'Review queue status'}</p>
                </div>
                <div className="p-3 bg-surface/50 rounded-xl border border-border/50 flex justify-between">
                  <span className="text-textMuted">Timestamp:</span>
                  <span className="font-mono text-text">{new Date(selectedAlertDetails.created_at).toLocaleString()}</span>
                </div>
              </div>

              <div className="pt-2 border-t border-border/50 flex justify-end">
                <button onClick={() => setSelectedAlertDetails(null)} className="btn-primary text-xs px-4 py-2">
                  Close
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Alerts;
