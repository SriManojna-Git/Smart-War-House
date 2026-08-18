import React, { useEffect, useState } from 'react';
import api from '../api';
import { 
  TrendingUp, 
  Calendar, 
  Sparkles, 
  RefreshCw, 
  Layers, 
  AlertCircle, 
  CheckCircle2, 
  ArrowUpRight, 
  Package
} from 'lucide-react';
import { motion } from 'framer-motion';

const DemandForecast = () => {
  const [period, setPeriod] = useState<number>(30);
  const [forecastData, setForecastData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchForecast = async (p = period) => {
    setLoading(true);
    try {
      const response = await api.get(`/api/analytics/forecast?period_days=${p}`);
      setForecastData(response.data);
    } catch (e) {
      console.error('Failed to load forecast', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchForecast(period);
  }, [period]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-text tracking-tight flex items-center gap-2">
            <TrendingUp className="text-primary w-7 h-7" />
            AI Forward Demand Forecasting Engine
          </h2>
          <p className="text-textMuted text-sm mt-1">
            Machine-learned predictive consumption modeling, velocity seasonality curves, and forward stock replenishment horizon.
          </p>
        </div>

        {/* Period Selector */}
        <div className="flex items-center gap-2 bg-surface border border-border/50 rounded-xl p-1">
          {[7, 14, 30, 60].map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                period === p ? 'bg-primary text-white shadow-md' : 'text-textMuted hover:text-text'
              }`}
            >
              {p} Days Horizon
            </button>
          ))}
        </div>
      </div>

      {/* Forecast Trend Bar & Summary */}
      {forecastData && (
        <div className="glass-panel p-6 space-y-4">
          <div className="flex flex-col md:flex-row justify-between md:items-center gap-3">
            <div>
              <span className="badge badge-info text-[10px] font-bold uppercase flex items-center gap-1 w-fit">
                <Sparkles className="w-3.5 h-3.5" /> Neural Forecast Active
              </span>
              <h3 className="text-xl font-black text-text mt-1">
                Total Projected Demand: <span className="text-primary">{forecastData.total_forecasted_demand} Units</span>
              </h3>
              <p className="text-xs text-textMuted">{forecastData.trend_summary}</p>
            </div>
            <button onClick={() => fetchForecast(period)} className="btn-secondary text-xs px-3 py-1.5 flex items-center gap-1.5 self-start md:self-auto">
              <RefreshCw className="w-3.5 h-3.5" /> Re-evaluate Model
            </button>
          </div>

          {/* Simple Dynamic SVG Curve Chart */}
          <div className="p-4 bg-surface/50 rounded-2xl border border-border/50 space-y-3">
            <div className="flex justify-between items-center text-xs font-bold text-textMuted">
              <span>Forward Trajectory Timeline</span>
              <span>Projected Units Consumption</span>
            </div>
            <div className="grid grid-cols-4 sm:grid-cols-6 gap-2 pt-3">
              {forecastData.forecast_series?.map((pt: any, i: number) => (
                <div key={i} className="flex flex-col items-center gap-1.5">
                  <div className="w-full bg-surface rounded-t-lg h-24 flex items-end justify-center p-1 relative group">
                    <div 
                      className="w-full bg-gradient-to-t from-primary/60 to-primary rounded-t-md transition-all group-hover:bg-primary"
                      style={{ height: `${Math.min(100, (pt.demand / (forecastData.total_forecasted_demand * 0.4 || 100)) * 100)}%` }}
                    />
                  </div>
                  <span className="font-mono font-bold text-text text-[11px]">{pt.demand}</span>
                  <span className="text-[10px] text-textMuted">{pt.day}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Product-Wise Demand Forecast Table */}
      <div className="glass-panel overflow-hidden shadow-xl">
        <div className="p-4 border-b border-border/50 font-bold text-sm text-text flex justify-between items-center">
          <span>SKU-Level Demand Projection Matrix</span>
          <span className="text-xs text-textMuted">Horizon: {period} Days</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs whitespace-nowrap">
            <thead className="bg-surface/50 text-textMuted uppercase font-bold border-b border-border/50">
              <tr>
                <th className="px-6 py-4">SKU / Product</th>
                <th className="px-6 py-4">Daily Velocity</th>
                <th className="px-6 py-4">Current Stock</th>
                <th className="px-6 py-4">{period}D Forecast</th>
                <th className="px-6 py-4">Stock Requirement</th>
                <th className="px-6 py-4">Demand Trend</th>
                <th className="px-6 py-4">Confidence</th>
                <th className="px-6 py-4">AI Recommendation</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/10">
              {forecastData?.product_forecasts?.map((pf: any) => (
                <tr key={pf.product_id} className="hover:bg-border/10 transition-colors">
                  <td className="px-6 py-4">
                    <p className="font-bold text-text">{pf.name}</p>
                    <p className="font-mono text-textMuted text-[10px]">{pf.sku} | {pf.category}</p>
                  </td>
                  <td className="px-6 py-4 font-mono font-bold text-text">{pf.daily_demand} / day</td>
                  <td className="px-6 py-4 font-mono">{pf.current_stock} Units</td>
                  <td className="px-6 py-4 font-mono font-bold text-primary">{pf.forecasted_demand} Units</td>
                  <td className="px-6 py-4">
                    {pf.stock_requirement > 0 ? (
                      <span className="badge badge-danger font-bold text-[10px]">Shortfall: {pf.stock_requirement}</span>
                    ) : (
                      <span className="badge badge-success font-semibold text-[10px]">Sufficient</span>
                    )}
                  </td>
                  <td className="px-6 py-4 font-bold text-text">{pf.trend}</td>
                  <td className="px-6 py-4 font-mono text-success">{pf.confidence_pct}%</td>
                  <td className="px-6 py-4 text-textMuted max-w-xs truncate">{pf.recommendation}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default DemandForecast;
