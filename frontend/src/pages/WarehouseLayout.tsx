import React, { useEffect, useState } from 'react';
import api from '../api';
import { 
  Layers, 
  MapPin, 
  Activity, 
  RefreshCw, 
  Info, 
  Flame, 
  Zap, 
  Snowflake,
  Package,
  X
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const WarehouseLayout = () => {
  const [heatmapData, setHeatmapData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedZoneKey, setSelectedZoneKey] = useState<string>('Zone A');
  const [selectedBin, setSelectedBin] = useState<any>(null);

  const fetchHeatmap = async () => {
    try {
      const response = await api.get('/api/warehouse/interactive-heatmap');
      setHeatmapData(response.data);
    } catch (e) {
      console.error('Failed to load heatmap data', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHeatmap();
  }, []);

  const activeZone = heatmapData?.zones?.[selectedZoneKey];

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-text tracking-tight flex items-center gap-2">
            <Layers className="text-primary w-7 h-7" />
            Interactive Warehouse 2D Layout & Density Heatmap
          </h2>
          <p className="text-textMuted text-sm mt-1">
            Real-time rack occupancy, storage bin utilization, zone activity densities, and capacity telemetry.
          </p>
        </div>
        <button onClick={fetchHeatmap} className="btn-secondary p-2.5 rounded-xl">
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Global Utilization KPI Bar */}
      {heatmapData && (
        <div className="glass-panel p-5 grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-surface/50 p-3.5 rounded-xl border border-border/50">
            <p className="text-[10px] text-textMuted font-bold uppercase">TOTAL CAPACITY</p>
            <h4 className="text-xl font-black text-text mt-1">{heatmapData.total_warehouse_capacity} Units</h4>
          </div>
          <div className="bg-surface/50 p-3.5 rounded-xl border border-border/50">
            <p className="text-[10px] text-textMuted font-bold uppercase">OCCUPIED SLOTS</p>
            <h4 className="text-xl font-black text-primary mt-1">{heatmapData.total_warehouse_occupied} Units</h4>
          </div>
          <div className="bg-surface/50 p-3.5 rounded-xl border border-border/50">
            <p className="text-[10px] text-textMuted font-bold uppercase">OVERALL UTILIZATION</p>
            <h4 className="text-xl font-black text-success mt-1">{heatmapData.overall_utilization_pct}%</h4>
          </div>
          <div className="bg-surface/50 p-3.5 rounded-xl border border-border/50">
            <p className="text-[10px] text-textMuted font-bold uppercase">ACTIVE ZONES</p>
            <h4 className="text-xl font-black text-text mt-1">5 Operational Zones</h4>
          </div>
        </div>
      )}

      {/* Zone Selector Pills */}
      {heatmapData && (
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {Object.entries(heatmapData.zones || {}).map(([zKey, zData]: [string, any]) => (
            <button
              key={zKey}
              onClick={() => setSelectedZoneKey(zKey)}
              className={`p-4 rounded-xl border text-left transition-all relative overflow-hidden ${
                selectedZoneKey === zKey
                  ? 'bg-primary text-white border-primary shadow-lg shadow-primary/25'
                  : 'glass-panel hover:border-primary/40'
              }`}
            >
              <div className="flex justify-between items-center mb-1">
                <span className="font-black text-sm">{zKey}</span>
                <span className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase ${
                  selectedZoneKey === zKey ? 'bg-white/20 text-white' : 'badge badge-info'
                }`}>
                  {zData.occupancy_percentage}%
                </span>
              </div>
              <p className={`text-[11px] ${selectedZoneKey === zKey ? 'text-white/80' : 'text-textMuted'}`}>
                {zData.occupied_units} / {zData.total_capacity} Units
              </p>
            </button>
          ))}
        </div>
      )}

      {/* Zone Rack & Bin Visual Grid Matrix */}
      {activeZone && (
        <div className="glass-panel p-6 space-y-4">
          <div className="flex justify-between items-center border-b border-border/50 pb-3">
            <div>
              <h3 className="text-base font-bold text-text flex items-center gap-2">
                <MapPin className="w-4 h-4 text-primary" /> {selectedZoneKey} Storage Rack Matrix
              </h3>
              <p className="text-xs text-textMuted">Click any bin to view product slotting, occupied capacity, and inventory telemetry.</p>
            </div>
            <div className="flex items-center gap-3 text-xs">
              <span className="flex items-center gap-1 text-danger font-medium"><Flame className="w-3.5 h-3.5" /> Dense (&gt;80%)</span>
              <span className="flex items-center gap-1 text-primary font-medium"><Zap className="w-3.5 h-3.5" /> Optimal (40-80%)</span>
              <span className="flex items-center gap-1 text-textMuted font-medium"><Snowflake className="w-3.5 h-3.5" /> Underutilized (&lt;40%)</span>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {activeZone.bins?.map((b: any) => (
              <button
                key={b.id}
                onClick={() => setSelectedBin(b)}
                className={`p-3.5 rounded-xl border text-left transition-all relative overflow-hidden group ${
                  b.utilization_pct >= 80 ? 'bg-danger/10 border-danger/40 hover:border-danger' :
                  b.utilization_pct >= 40 ? 'bg-primary/10 border-primary/40 hover:border-primary' :
                  'bg-surface/60 border-border/50 hover:border-border'
                }`}
              >
                <div className="flex justify-between items-center">
                  <span className="font-mono font-bold text-xs text-text">{b.location_code}</span>
                  <span className={`text-[10px] font-bold ${
                    b.utilization_pct >= 80 ? 'text-danger' : b.utilization_pct >= 40 ? 'text-primary' : 'text-textMuted'
                  }`}>
                    {b.utilization_pct}%
                  </span>
                </div>
                <p className="text-[11px] font-medium text-text mt-1 truncate">{b.product_name}</p>
                <div className="w-full bg-surface rounded-full h-1.5 mt-2 overflow-hidden border border-border/30">
                  <div 
                    className={`h-full rounded-full ${
                      b.utilization_pct >= 80 ? 'bg-danger' : b.utilization_pct >= 40 ? 'bg-primary' : 'bg-textMuted'
                    }`} 
                    style={{ width: `${Math.min(100, b.utilization_pct)}%` }}
                  />
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Bin Telemetry Details Modal */}
      <AnimatePresence>
        {selectedBin && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setSelectedBin(null)} className="absolute inset-0 bg-background/80 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="relative w-full max-w-md glass-card p-6 space-y-4 shadow-2xl">
              <div className="flex justify-between items-center border-b border-border/50 pb-3">
                <div>
                  <h3 className="text-base font-bold text-text flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-primary" /> Bin Slot Telemetry: {selectedBin.location_code}
                  </h3>
                  <p className="text-xs text-textMuted">Rack {selectedBin.rack} | Shelf {selectedBin.shelf} | Bin {selectedBin.bin}</p>
                </div>
                <button onClick={() => setSelectedBin(null)} className="text-textMuted hover:text-text"><X className="w-5 h-5" /></button>
              </div>

              <div className="space-y-3 text-xs">
                <div className="p-3 bg-primary/10 border border-primary/20 rounded-xl">
                  <p className="text-[10px] uppercase font-bold text-primary">Assigned Product / Item:</p>
                  <p className="text-sm font-bold text-text mt-0.5">{selectedBin.product_name}</p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 bg-surface/50 rounded-xl border border-border/50">
                    <p className="text-[10px] text-textMuted font-bold">OCCUPIED</p>
                    <p className="text-base font-bold text-text">{selectedBin.occupied} Units</p>
                  </div>
                  <div className="p-3 bg-surface/50 rounded-xl border border-border/50">
                    <p className="text-[10px] text-textMuted font-bold">TOTAL CAPACITY</p>
                    <p className="text-base font-bold text-text">{selectedBin.capacity} Units</p>
                  </div>
                </div>

                <div className="p-3 bg-surface/50 rounded-xl border border-border/50 flex justify-between items-center">
                  <span className="text-textMuted">Utilization Index:</span>
                  <span className="font-bold text-text">{selectedBin.utilization_pct}% ({selectedBin.status})</span>
                </div>
              </div>

              <div className="pt-2 border-t border-border/50 flex justify-end">
                <button onClick={() => setSelectedBin(null)} className="btn-primary text-xs px-4 py-2">
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

export default WarehouseLayout;
