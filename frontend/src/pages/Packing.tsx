import React, { useEffect, useState } from 'react';
import api from '../api';
import { Box, CheckSquare } from 'lucide-react';
import { motion } from 'framer-motion';

const API_URL = '/api';

const Packing = () => {
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTasks = async () => {
    try {
      const response = await api.get(`${API_URL}/packing`);
      setTasks(response.data);
    } catch (error) {
      console.error('Failed to fetch packing tasks', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  const handleComplete = async (taskId: number) => {
    try {
      await api.post(`${API_URL}/packing/${taskId}/complete`);
      fetchTasks();
    } catch (error) {
      console.error('Failed to complete packing task', error);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-text tracking-tight flex items-center gap-2">
          <Box className="text-primary w-6 h-6" />
          Packing & Consolidation
        </h2>
        <p className="text-textMuted text-sm mt-1">Verify picked items and apply recommended packaging.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
           <div className="text-textMuted p-8">Loading tasks...</div>
        ) : tasks.filter(t => t.status === 'Waiting').length === 0 ? (
           <div className="text-textMuted p-8 glass-panel w-full col-span-full text-center">No pending packing tasks.</div>
        ) : (
          tasks.filter(t => t.status === 'Waiting').map((task, index) => (
            <motion.div 
              key={task.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.1 }}
              className="glass-card flex flex-col"
            >
              <div className="flex justify-between items-start mb-4">
                <div>
                  <span className="text-xs text-textMuted">Task #{task.id}</span>
                  <h3 className="text-lg font-bold text-text">Order {task.order_id}</h3>
                </div>
              </div>
              
              <div className="flex-1 space-y-4">
                <div className="p-4 bg-primary/10 border border-primary/20 rounded-lg">
                  <p className="text-xs text-primary/70 mb-1">Recommended Packaging</p>
                  <p className="text-text font-medium text-lg flex items-center gap-2">
                    <Box className="w-5 h-5 text-primary" />
                    {task.packaging_recommendation}
                  </p>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-border/50">
                <button 
                  onClick={() => handleComplete(task.id)}
                  className="w-full btn-primary flex justify-center items-center gap-2 bg-success hover:bg-success/80 shadow-success/25"
                >
                  <CheckSquare className="w-4 h-4" /> Verify & Pack
                </button>
              </div>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
};

export default Packing;
