import React, { useState, useEffect } from 'react';
import api from '../api';
import { 
  PlaySquare, 
  ArrowRight, 
  Activity, 
  TrendingUp, 
  AlertOctagon, 
  BrainCircuit, 
  Check, 
  Sliders,
  Users,
  Package,
  Layers,
  Sparkles,
  Zap,
  RotateCcw
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const Simulator = () => {
  const [params, setParams] = useState({
    order_volume: 50,
    urgent_order_pct: 30,
    staff_count: 10,
    inventory_level_pct: 85,
    damaged_items_pct: 3,
    picking_capacity: 100
  });

  const [simulating, setSimulating] = useState(false);
  const [results, setResults] = useState<any>(null);

  const runSimulation = async () => {
    setSimulating(true);
    try {
      const response = await api.post('/api/simulator/evaluate', params);
      setResults(response.data);
    } catch (e) {
      console.error('Simulation error', e);
    } finally {
      setSimulating(false);
    }
  };

  useEffect(() => {
    runSimulation();
  }, []);

  const resetSliders = () => {
    setParams({
      order_volume: 50,
      urgent_order_pct: 30,
      staff_count: 10,
      inventory_level_pct: 85,
      damaged_items_pct: 3,
      picking_capacity: 100
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-text tracking-tight flex items-center gap-2">
            <PlaySquare className="text-primary w-7 h-7" />
            What-If Autonomous Warehouse Simulator
          </h2>
          <p className="text-textMuted text-sm mt-1">
            Dynamically evaluate warehouse throughput, SLA resilience, and route optimization against variable operational shocks.
          </p>
        </div>
        <button onClick={resetSliders} className="btn-secondary text-xs flex items-center gap-1.5 py-2 px-3">
          <RotateCcw className="w-3.5 h-3.5" /> Reset Parameters
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sliders Controller Panel */}
        <div className="lg:col-span-1 glass-panel p-6 space-y-5">
          <div className="flex items-center gap-2 pb-3 border-b border-border/50">
            <Sliders className="w-5 h-5 text-primary" />
            <h3 className="text-sm font-bold text-text uppercase tracking-wider">Simulation Variables</h3>
          </div>

          {/* Slider 1: Order Volume */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs font-semibold">
              <span className="text-textMuted">Order Volume (Shift Load)</span>
              <span className="text-primary font-mono">{params.order_volume} Orders</span>
            </div>
            <input 
              type="range" min="15" max="150" step="5"
              value={params.order_volume}
              onChange={(e) => setParams({...params, order_volume: parseInt(e.target.value)})}
              className="w-full accent-primary cursor-pointer"
            />
          </div>

          {/* Slider 2: Urgent Order % */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs font-semibold">
              <span className="text-textMuted">Urgent / VIP Order Ratio</span>
              <span className="text-danger font-mono">{params.urgent_order_pct}%</span>
            </div>
            <input 
              type="range" min="5" max="75" step="5"
              value={params.urgent_order_pct}
              onChange={(e) => setParams({...params, urgent_order_pct: parseInt(e.target.value)})}
              className="w-full accent-danger cursor-pointer"
            />
          </div>

          {/* Slider 3: Staff Count */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs font-semibold">
              <span className="text-textMuted">Active Pick & Pack Staff</span>
              <span className="text-primary font-mono">{params.staff_count} Workers</span>
            </div>
            <input 
              type="range" min="3" max="25" step="1"
              value={params.staff_count}
              onChange={(e) => setParams({...params, staff_count: parseInt(e.target.value)})}
              className="w-full accent-primary cursor-pointer"
            />
          </div>

          {/* Slider 4: Inventory Level % */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs font-semibold">
              <span className="text-textMuted">Available Inventory Buffer</span>
              <span className="text-success font-mono">{params.inventory_level_pct}%</span>
            </div>
            <input 
              type="range" min="20" max="150" step="5"
              value={params.inventory_level_pct}
              onChange={(e) => setParams({...params, inventory_level_pct: parseInt(e.target.value)})}
              className="w-full accent-success cursor-pointer"
            />
          </div>

          {/* Slider 5: Damaged % */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs font-semibold">
              <span className="text-textMuted">Defect & Damaged Item Rate</span>
              <span className="text-warning font-mono">{params.damaged_items_pct}%</span>
            </div>
            <input 
              type="range" min="0" max="15" step="1"
              value={params.damaged_items_pct}
              onChange={(e) => setParams({...params, damaged_items_pct: parseInt(e.target.value)})}
              className="w-full accent-warning cursor-pointer"
            />
          </div>

          <button 
            onClick={runSimulation}
            disabled={simulating}
            className="w-full btn-primary py-3 flex justify-center items-center gap-2 font-bold shadow-lg shadow-primary/25 mt-4"
          >
            {simulating ? <Activity className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            {simulating ? 'Computing Dynamics...' : 'Run Real-Time Simulation'}
          </button>
        </div>

        {/* Results Comparison View */}
        <div className="lg:col-span-2">
          {results && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 h-full">
              {/* 1. CURRENT STRATEGY */}
              <div className="glass-card flex flex-col justify-between border-l-4 border-l-border/80">
                <div className="space-y-6">
                  <div className="flex items-center justify-between pb-3 border-b border-border/50">
                    <h3 className="text-sm font-bold text-textMuted uppercase tracking-wider">Standard Strategy</h3>
                    <span className="badge bg-surface text-textMuted border border-border">FIFO & Static Paths</span>
                  </div>

                  <div className="space-y-4">
                    <div className="p-3 bg-surface/50 rounded-xl border border-border/50 flex justify-between items-center">
                      <span className="text-xs text-textMuted font-medium">SLA Fulfillment Rate</span>
                      <span className="text-lg font-black text-text">{results.current.fulfillment_rate}</span>
                    </div>

                    <div className="p-3 bg-surface/50 rounded-xl border border-border/50 flex justify-between items-center">
                      <span className="text-xs text-textMuted font-medium">Delayed Orders</span>
                      <span className="text-lg font-black text-danger">{results.current.delayed_orders}</span>
                    </div>

                    <div className="p-3 bg-surface/50 rounded-xl border border-border/50 flex justify-between items-center">
                      <span className="text-xs text-textMuted font-medium">Total Pick Walk Distance</span>
                      <span className="text-lg font-mono font-bold text-text">{results.current.picking_distance}</span>
                    </div>

                    <div className="p-3 bg-surface/50 rounded-xl border border-border/50 flex justify-between items-center">
                      <span className="text-xs text-textMuted font-medium">Order Processing Cycle</span>
                      <span className="text-lg font-mono font-bold text-text">{results.current.processing_time}</span>
                    </div>

                    <div className="p-3 bg-surface/50 rounded-xl border border-border/50 flex justify-between items-center">
                      <span className="text-xs text-textMuted font-medium">Exceptions Generated</span>
                      <span className="text-lg font-bold text-warning">{results.current.exceptions}</span>
                    </div>
                  </div>
                </div>

                <div className="mt-6 pt-3 border-t border-border/50 text-xs text-danger font-semibold">
                  ⚠️ {results.current.impact}
                </div>
              </div>

              {/* 2. AI RECOMMENDED STRATEGY */}
              <div className="glass-card flex flex-col justify-between border-l-4 border-l-primary bg-primary/5 shadow-xl">
                <div className="space-y-6">
                  <div className="flex items-center justify-between pb-3 border-b border-primary/20">
                    <h3 className="text-sm font-black text-primary uppercase tracking-wider flex items-center gap-1.5">
                      <BrainCircuit className="w-4 h-4" /> AI Autonomous Strategy
                    </h3>
                    <span className="badge badge-success font-bold text-[10px]">Optimal</span>
                  </div>

                  <div className="space-y-4">
                    <div className="p-3 bg-primary/10 rounded-xl border border-primary/20 flex justify-between items-center">
                      <span className="text-xs font-semibold text-text">SLA Fulfillment Rate</span>
                      <span className="text-lg font-black text-success">{results.ai.fulfillment_rate}</span>
                    </div>

                    <div className="p-3 bg-primary/10 rounded-xl border border-primary/20 flex justify-between items-center">
                      <span className="text-xs font-semibold text-text">Delayed Orders</span>
                      <span className="text-lg font-black text-success">{results.ai.delayed_orders}</span>
                    </div>

                    <div className="p-3 bg-primary/10 rounded-xl border border-primary/20 flex justify-between items-center">
                      <span className="text-xs font-semibold text-text">Picking Distance</span>
                      <div>
                        <span className="text-lg font-mono font-black text-text">{results.ai.picking_distance}</span>
                        <p className="text-[10px] text-success font-bold text-right">{results.ai.distance_saved}</p>
                      </div>
                    </div>

                    <div className="p-3 bg-primary/10 rounded-xl border border-primary/20 flex justify-between items-center">
                      <span className="text-xs font-semibold text-text">Processing Cycle</span>
                      <div>
                        <span className="text-lg font-mono font-black text-text">{results.ai.processing_time}</span>
                        <p className="text-[10px] text-success font-bold text-right">{results.ai.time_saved}</p>
                      </div>
                    </div>

                    <div className="p-3 bg-primary/10 rounded-xl border border-primary/20 flex justify-between items-center">
                      <span className="text-xs font-semibold text-text">Exceptions</span>
                      <span className="text-lg font-black text-success">{results.ai.exceptions}</span>
                    </div>
                  </div>
                </div>

                <div className="mt-6 pt-3 border-t border-primary/20 text-xs text-success font-bold flex items-center gap-1.5">
                  <Check className="w-4 h-4" /> {results.ai.impact}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Simulator;
