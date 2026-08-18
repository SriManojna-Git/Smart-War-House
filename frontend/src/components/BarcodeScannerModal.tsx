import React, { useState } from 'react';
import { 
  Scan, 
  Search, 
  X, 
  Package, 
  MapPin, 
  Layers, 
  History, 
  CheckCircle2, 
  AlertTriangle, 
  Sparkles,
  Camera,
  RotateCcw
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../api';

interface BarcodeScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const BarcodeScannerModal: React.FC<BarcodeScannerModalProps> = ({ isOpen, onClose }) => {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [scanResult, setScanResult] = useState<any>(null);
  const [scanningCamera, setScanningCamera] = useState(false);

  const handleScan = async (codeToSearch?: string) => {
    const target = codeToSearch || query;
    if (!target.trim()) return;
    setLoading(true);
    try {
      const res = await api.get(`/api/inventory/scan/${encodeURIComponent(target.trim())}`);
      setScanResult(res.data);
    } catch (e) {
      console.error('Scan error', e);
      setScanResult({ found: false, query: target });
    } finally {
      setLoading(false);
    }
  };

  const simulateCameraScan = (demoCode: string) => {
    setScanningCamera(true);
    setTimeout(() => {
      setScanningCamera(false);
      setQuery(demoCode);
      handleScan(demoCode);
    }, 1200);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="absolute inset-0 bg-background/80 backdrop-blur-md" />
      <motion.div initial={{ opacity: 0, scale: 0.95, y: 15 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 15 }} className="relative w-full max-w-2xl glass-card p-6 space-y-5 shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-border/50 pb-3">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-primary/10 text-primary rounded-xl">
              <Scan className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-text">Barcode & QR Smart Scanner</h3>
              <p className="text-xs text-textMuted">Instant SKU resolution, bin slot identification, and batch history.</p>
            </div>
          </div>
          <button onClick={onClose} className="text-textMuted hover:text-text">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scanner Input & Camera Simulator */}
        <div className="space-y-3">
          <div className="relative rounded-2xl overflow-hidden border border-border/60 bg-surface/40 p-4 text-center space-y-3">
            <div className="h-32 rounded-xl bg-black/40 border-2 border-dashed border-primary/40 flex flex-col items-center justify-center relative overflow-hidden">
              {scanningCamera && (
                <div className="absolute inset-x-0 h-1 bg-gradient-to-r from-transparent via-cyan-400 to-transparent animate-bounce shadow-lg shadow-cyan-400/50"></div>
              )}
              <Camera className="w-8 h-8 text-primary/60 mb-2" />
              <p className="text-xs text-textMuted">Optical Sensor Ready — Point at product barcode / QR</p>
              <div className="flex gap-2 mt-2">
                <button onClick={() => simulateCameraScan('SKU-0001')} className="btn-secondary text-[10px] py-1 px-2.5">Scan SKU-0001</button>
                <button onClick={() => simulateCameraScan('SKU-0002')} className="btn-secondary text-[10px] py-1 px-2.5">Scan SKU-0002</button>
                <button onClick={() => simulateCameraScan('BAT-2026-100')} className="btn-secondary text-[10px] py-1 px-2.5">Scan Batch #</button>
              </div>
            </div>

            <div className="flex gap-2">
              <div className="flex-1 flex items-center gap-2 bg-surface/70 border border-border/70 rounded-xl px-3 py-2">
                <Search className="w-4 h-4 text-textMuted" />
                <input 
                  type="text" 
                  placeholder="Enter barcode, SKU (e.g. SKU-0001), or product name..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleScan()}
                  className="bg-transparent border-none outline-none text-xs text-text w-full placeholder:text-textMuted"
                />
              </div>
              <button 
                onClick={() => handleScan()}
                disabled={loading}
                className="btn-primary text-xs px-5 py-2 font-bold flex items-center gap-1.5"
              >
                {loading ? <Sparkles className="w-3.5 h-3.5 animate-spin" /> : <Scan className="w-3.5 h-3.5" />}
                Lookup
              </button>
            </div>
          </div>
        </div>

        {/* Scan Results View */}
        {scanResult && (
          <div className="space-y-4 pt-2">
            {scanResult.found ? (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
                {/* Product Summary Header */}
                <div className="p-4 rounded-xl bg-primary/10 border border-primary/30 flex flex-col sm:flex-row justify-between sm:items-center gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="badge badge-info font-mono text-[10px] font-bold">{scanResult.product.sku}</span>
                      <span className="badge badge-success text-[10px] font-semibold">{scanResult.product.status}</span>
                    </div>
                    <h4 className="text-base font-black text-text mt-1">{scanResult.product.name}</h4>
                    <p className="text-xs text-textMuted">Category: {scanResult.product.category} | Zone: {scanResult.product.zone}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-textMuted font-medium">Available Stock</p>
                    <p className="text-2xl font-black text-text">{scanResult.product.available_stock} Units</p>
                  </div>
                </div>

                {/* Storage Locations & Batches */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  <div className="glass-panel p-4 space-y-2">
                    <h5 className="font-bold text-text flex items-center gap-1.5">
                      <MapPin className="w-4 h-4 text-primary" /> Assigned Storage Bins
                    </h5>
                    {scanResult.storage_locations?.length > 0 ? (
                      scanResult.storage_locations.map((loc: any, i: number) => (
                        <div key={i} className="p-2 bg-surface/50 rounded-lg border border-border/50 flex justify-between items-center">
                          <span className="font-mono font-bold text-text">{loc.location_code}</span>
                          <span className="text-textMuted">{loc.occupied}/{loc.capacity} Units</span>
                        </div>
                      ))
                    ) : (
                      <p className="text-textMuted italic">Assigned to Zone A Primary Rack</p>
                    )}
                  </div>

                  <div className="glass-panel p-4 space-y-2">
                    <h5 className="font-bold text-text flex items-center gap-1.5">
                      <Layers className="w-4 h-4 text-primary" /> Active Product Batches
                    </h5>
                    {scanResult.batches?.length > 0 ? (
                      scanResult.batches.map((b: any, i: number) => (
                        <div key={i} className="p-2 bg-surface/50 rounded-lg border border-border/50 flex justify-between items-center">
                          <div>
                            <p className="font-mono font-bold text-text">{b.batch_number}</p>
                            <p className="text-[10px] text-textMuted">Exp: {b.expiry_date}</p>
                          </div>
                          <span className="badge badge-info text-[10px]">{b.quantity} Units</span>
                        </div>
                      ))
                    ) : (
                      <p className="text-textMuted italic">No batch restrictions recorded.</p>
                    )}
                  </div>
                </div>

                {/* Recent Movements */}
                {scanResult.recent_movements?.length > 0 && (
                  <div className="glass-panel p-4 space-y-2 text-xs">
                    <h5 className="font-bold text-text flex items-center gap-1.5">
                      <History className="w-4 h-4 text-primary" /> Recent Stock Movements
                    </h5>
                    <div className="space-y-1.5">
                      {scanResult.recent_movements.map((m: any, i: number) => (
                        <div key={i} className="p-2 bg-surface/50 rounded-lg border border-border/50 flex justify-between items-center">
                          <div>
                            <span className="font-bold text-text">{m.type} ({m.quantity > 0 ? `+${m.quantity}` : m.quantity})</span>
                            <span className="text-textMuted text-[11px]"> by {m.user}</span>
                          </div>
                          <span className="text-textMuted font-mono text-[10px]">{m.timestamp}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </motion.div>
            ) : (
              <div className="p-8 text-center text-danger font-medium text-xs glass-panel">
                <AlertTriangle className="w-8 h-8 text-danger mx-auto mb-2 opacity-60" />
                No product found matching barcode "{scanResult.query}". Please check the SKU or batch code.
              </div>
            )}
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default BarcodeScannerModal;
