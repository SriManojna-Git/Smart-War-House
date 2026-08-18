import React, { useState } from 'react';
import { Download, FileSpreadsheet, X, Check, Clock, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../api';

interface ReportExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultReport?: string;
}

const ReportExportModal: React.FC<ReportExportModalProps> = ({ isOpen, onClose, defaultReport = 'inventory' }) => {
  const [selectedReport, setSelectedReport] = useState(defaultReport);
  const [exporting, setExporting] = useState(false);
  const [exported, setExported] = useState(false);

  const reports = [
    { id: 'inventory', name: 'Inventory & Stockout Report', desc: 'Current, available, reserved stock, daily demand velocity, and predictive stockout risks.' },
    { id: 'orders', name: 'Orders & SLA Fulfillment Report', desc: 'Order values, customer priority tiers, AI priority scores, SLA deadlines, and stage progression.' },
    { id: 'allocations', name: 'Allocation & Backorder Report', desc: 'Detailed log of allocated vs backordered units and warehouse zones.' },
    { id: 'exceptions', name: 'Exception & Quality Report', desc: 'Operational anomalies, severity levels, AI root-cause analysis, and resolution records.' },
    { id: 'analytics', name: 'Executive Operations Impact Summary', desc: 'SLA recovery metrics, picking distance saved, stockouts prevented, and decision acceptance.' }
  ];

  const handleDownload = async () => {
    setExporting(true);
    try {
      const response = await api.get(`/api/reports/${selectedReport}/export`, {
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `smartfulfill_${selectedReport}_report_${new Date().toISOString().slice(0,10)}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      
      setExported(true);
      setTimeout(() => setExported(false), 3000);
    } catch (e) {
      console.error('Export failed', e);
    } finally {
      setExporting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="absolute inset-0 bg-background/80 backdrop-blur-sm" />
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="relative w-full max-w-lg glass-card p-6 space-y-4 shadow-2xl">
        <div className="flex items-center justify-between border-b border-border/50 pb-3">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-primary/10 text-primary rounded-xl">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-text">Enterprise Report Export Hub</h3>
              <p className="text-xs text-textMuted">Generate verified operational CSV datasets for external analysis.</p>
            </div>
          </div>
          <button onClick={onClose} className="text-textMuted hover:text-text">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-2.5">
          <label className="block text-xs font-bold uppercase text-textMuted">Select Report Type:</label>
          <div className="space-y-2">
            {reports.map((r) => (
              <button
                key={r.id}
                onClick={() => setSelectedReport(r.id)}
                className={`w-full text-left p-3 rounded-xl border transition-all ${
                  selectedReport === r.id
                    ? 'bg-primary/15 border-primary shadow-sm'
                    : 'bg-surface/60 border-border/50 hover:border-border text-textMuted hover:text-text'
                }`}
              >
                <div className="flex justify-between items-center">
                  <h4 className={`text-xs font-bold ${selectedReport === r.id ? 'text-text' : ''}`}>{r.name}</h4>
                  {selectedReport === r.id && <span className="badge badge-success text-[10px]">Selected</span>}
                </div>
                <p className="text-[11px] text-textMuted mt-0.5 leading-relaxed">{r.desc}</p>
              </button>
            ))}
          </div>
        </div>

        <div className="pt-3 border-t border-border/50 flex justify-between items-center">
          <span className="text-[11px] text-textMuted">
            Format: Standard CSV (Excel / BI Compatible)
          </span>
          <div className="flex gap-2">
            <button onClick={onClose} className="btn-secondary text-xs">
              Cancel
            </button>
            <button
              onClick={handleDownload}
              disabled={exporting}
              className="btn-primary text-xs font-bold px-4 py-2 flex items-center gap-1.5 shadow-md shadow-primary/20"
            >
              {exporting ? (
                <Clock className="w-3.5 h-3.5 animate-spin" />
              ) : exported ? (
                <Check className="w-3.5 h-3.5 text-success" />
              ) : (
                <Download className="w-3.5 h-3.5" />
              )}
              {exporting ? 'Generating Report...' : exported ? 'Report Downloaded!' : 'Download CSV Report'}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default ReportExportModal;
