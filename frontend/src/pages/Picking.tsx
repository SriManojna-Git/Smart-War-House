import React, { useEffect, useState } from 'react';
import api from '../api';
import { PackageOpen, Map, Check } from 'lucide-react';
import { motion } from 'framer-motion';

const API_URL = '/api';

const Picking = () => {
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTasks = async () => {
    try {
      const response = await api.get(`${API_URL}/picking`);
      setTasks(response.data);
    } catch (error) {
      console.error('Failed to fetch picking tasks', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  const handleComplete = async (taskId: number) => {
    try {
      await api.post(`${API_URL}/picking/${taskId}/complete`);
      fetchTasks();
    } catch (error) {
      console.error('Failed to complete task', error);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-text tracking-tight flex items-center gap-2">
          <PackageOpen className="text-primary w-6 h-6" />
          Picking Operations
        </h2>
        <p className="text-textMuted text-sm mt-1">Optimized warehouse routing and task assignment.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
           <div className="text-textMuted p-8">Loading tasks...</div>
        ) : tasks.filter(t => t.status === 'Pending').length === 0 ? (
           <div className="text-textMuted p-8 glass-panel w-full col-span-full text-center">No pending picking tasks.</div>
        ) : (
          tasks.filter(t => t.status === 'Pending').map((task, index) => (
            <motion.div 
              key={task.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="glass-card flex flex-col relative overflow-hidden"
            >
              <div className="flex justify-between items-start mb-4">
                <div>
                  <span className="text-xs text-textMuted">Task #{task.id}</span>
                  <h3 className="text-lg font-bold text-text">Order {task.order_id}</h3>
                </div>
                <span className="badge badge-info"><Map className="w-3 h-3 inline mr-1" /> Route Generated</span>
              </div>
              
              <div className="space-y-3 flex-1">
                <div className="bg-surface/50 p-3 rounded-lg border border-border/50">
                  <p className="text-xs text-textMuted">Estimated Time</p>
                  <p className="text-text font-medium">{task.estimated_time.toFixed(1)} mins</p>
                </div>
                <div className="bg-surface/50 p-3 rounded-lg border border-border/50">
                  <p className="text-xs text-textMuted">Assigned Picker</p>
                  <p className="text-text font-medium">{task.assigned_picker}</p>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-border/50">
                <button 
                  onClick={() => handleComplete(task.id)}
                  className="w-full btn-primary flex justify-center items-center gap-2"
                >
                  <Check className="w-4 h-4" /> Complete Pick
                </button>
              </div>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
};

export default Picking;
