import React, { useEffect, useState } from 'react';
import api from '../api';
import { PackageOpen, Clock, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';

const Allocations = () => {
  const [allocations, setAllocations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAllocations = async () => {
      try {
        const response = await api.get('/api/allocations');
        setAllocations(response.data);
      } catch (error) {
        console.error('Failed to fetch allocations', error);
      } finally {
        setLoading(false);
      }
    };
    fetchAllocations();
  }, []);

  const getStatusBadge = (status: string) => {
    switch(status) {
      case 'Fully Allocated': return <span className="badge badge-success">{status}</span>;
      case 'Partially Allocated': return <span className="badge badge-warning">{status}</span>;
      case 'Backordered': return <span className="badge badge-danger">{status}</span>;
      case 'Released': return <span className="badge badge-info">{status}</span>;
      default: return <span className="badge">{status}</span>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-text tracking-tight flex items-center gap-2">
            <PackageOpen className="text-primary w-6 h-6" />
            Allocation Tracking
          </h2>
          <p className="text-textMuted text-sm mt-1">Monitor order fulfillment statuses, backorders, and inventory distribution.</p>
        </div>
      </div>

      <div className="glass-panel overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-textMuted animate-pulse">Loading allocation data...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-surface/50 text-textMuted uppercase text-xs font-semibold border-b border-border/50">
                <tr>
                  <th className="px-6 py-4">Allocation ID</th>
                  <th className="px-6 py-4">Order ID</th>
                  <th className="px-6 py-4">Product / SKU</th>
                  <th className="px-6 py-4 text-right">Allocated</th>
                  <th className="px-6 py-4 text-right">Backordered</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Priority</th>
                  <th className="px-6 py-4">Zone</th>
                  <th className="px-6 py-4">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/10">
                {allocations.map((alloc, index) => (
                  <motion.tr 
                    key={alloc.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: index * 0.01 }}
                    className="hover:bg-border/10 transition-colors cursor-pointer"
                  >
                    <td className="px-6 py-4 font-medium text-text">ALC-{alloc.id.toString().padStart(5, '0')}</td>
                    <td className="px-6 py-4 text-textMuted">ORD-{alloc.order_id}</td>
                    <td className="px-6 py-4">
                      <p className="font-medium text-text">{alloc.product_name}</p>
                      <p className="text-xs text-textMuted">{alloc.sku}</p>
                    </td>
                    <td className="px-6 py-4 text-right font-bold text-text">{alloc.allocated_quantity}</td>
                    <td className="px-6 py-4 text-right font-bold text-danger">{alloc.backordered_quantity > 0 ? alloc.backordered_quantity : '-'}</td>
                    <td className="px-6 py-4">{getStatusBadge(alloc.status)}</td>
                    <td className="px-6 py-4">{alloc.priority}</td>
                    <td className="px-6 py-4">{alloc.warehouse_zone}</td>
                    <td className="px-6 py-4 text-textMuted text-xs">{new Date(alloc.timestamp).toLocaleString()}</td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default Allocations;
