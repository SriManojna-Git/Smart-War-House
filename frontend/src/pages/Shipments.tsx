import React, { useEffect, useState } from 'react';
import api from '../api';
import { 
  Truck, 
  Search, 
  ArrowUpRight, 
  ArrowDownLeft, 
  CheckCircle2, 
  Clock, 
  MapPin, 
  RefreshCw,
  Calendar
} from 'lucide-react';
import { motion } from 'framer-motion';

const Shipments = () => {
  const [shipments, setShipments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'All' | 'Inbound' | 'Outbound'>('All');

  const fetchShipments = async () => {
    try {
      const response = await api.get('/api/shipments');
      setShipments(response.data);
    } catch (e) {
      console.error('Failed to load shipments', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchShipments();
  }, []);

  const filteredShipments = shipments.filter(s => {
    if (activeTab === 'All') return true;
    return s.type === activeTab;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-text tracking-tight flex items-center gap-2">
            <Truck className="text-primary w-7 h-7" />
            Inbound & Outbound Shipment Tracking
          </h2>
          <p className="text-textMuted text-sm mt-1">
            Carrier freight telemetry, supplier PO intake, customer dispatch tracking, and delivery confirmations.
          </p>
        </div>
        <button onClick={fetchShipments} className="btn-secondary p-2.5 rounded-xl">
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-3 border-b border-border/50 pb-2">
        {['All', 'Inbound', 'Outbound'].map((tab: any) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === tab ? 'bg-primary text-white shadow-md' : 'text-textMuted hover:text-text'
            }`}
          >
            {tab === 'Inbound' && <ArrowDownLeft className="w-3.5 h-3.5" />}
            {tab === 'Outbound' && <ArrowUpRight className="w-3.5 h-3.5" />}
            {tab} Shipments ({tab === 'All' ? shipments.length : shipments.filter(s => s.type === tab).length})
          </button>
        ))}
      </div>

      {/* Shipments List */}
      <div className="glass-panel overflow-hidden shadow-xl">
        {loading ? (
          <div className="p-12 text-center text-textMuted animate-pulse">Tracking active carrier manifests...</div>
        ) : filteredShipments.length === 0 ? (
          <div className="p-16 text-center text-textMuted">No shipments found for this filter.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs whitespace-nowrap">
              <thead className="bg-surface/50 text-textMuted uppercase font-bold border-b border-border/50">
                <tr>
                  <th className="px-6 py-4">Shipment #</th>
                  <th className="px-6 py-4">Type</th>
                  <th className="px-6 py-4">Carrier & Tracking</th>
                  <th className="px-6 py-4">Origin → Destination</th>
                  <th className="px-6 py-4">Expected Date</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/10">
                {filteredShipments.map((s) => (
                  <tr key={s.id} className="hover:bg-border/10 transition-colors">
                    <td className="px-6 py-4 font-mono font-bold text-text">{s.shipment_number}</td>
                    <td className="px-6 py-4">
                      <span className={`badge ${s.type === 'Inbound' ? 'badge-info' : 'badge-warning'} font-bold text-[10px]`}>
                        {s.type}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-bold text-text">{s.carrier}</p>
                      <p className="font-mono text-textMuted text-[10px]">{s.tracking_number}</p>
                    </td>
                    <td className="px-6 py-4 text-text font-medium">
                      {s.origin} <span className="text-textMuted">→</span> {s.destination}
                    </td>
                    <td className="px-6 py-4 text-textMuted font-mono">
                      {new Date(s.expected_date).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`badge ${
                        s.status === 'Delivered' || s.status === 'Received' ? 'badge-success' :
                        s.status === 'Out for Delivery' ? 'badge-info' : 'badge-warning'
                      } font-bold text-[10px] uppercase`}>
                        {s.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className="text-primary font-bold text-[11px] hover:underline cursor-pointer">Track Telemetry →</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default Shipments;
