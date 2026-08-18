import React, { useEffect, useState } from 'react';
import api from '../api';
import { ShieldCheck, XCircle, CheckCircle } from 'lucide-react';
import { motion } from 'framer-motion';

const API_URL = '/api';

const QualityControl = () => {
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [issueDescription, setIssueDescription] = useState('');
  const [selectedTask, setSelectedTask] = useState<number | null>(null);

  const fetchTasks = async () => {
    try {
      const response = await api.get(`${API_URL}/qc`);
      setTasks(response.data);
    } catch (error) {
      console.error('Failed to fetch QC tasks', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  const handleComplete = async (taskId: number, passed: boolean) => {
    try {
      await api.post(`${API_URL}/qc/${taskId}/complete`, {
        passed,
        issue_description: passed ? '' : issueDescription
      });
      setIssueDescription('');
      setSelectedTask(null);
      fetchTasks();
    } catch (error) {
      console.error('Failed to complete QC task', error);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-text tracking-tight flex items-center gap-2">
          <ShieldCheck className="text-primary w-6 h-6" />
          Quality Control
        </h2>
        <p className="text-textMuted text-sm mt-1">Inspect packed orders for damage, accuracy, and compliance.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
           <div className="text-textMuted p-8">Loading tasks...</div>
        ) : tasks.filter(t => t.status === 'Pending').length === 0 ? (
           <div className="text-textMuted p-8 glass-panel w-full col-span-full text-center">No pending quality checks.</div>
        ) : (
          tasks.filter(t => t.status === 'Pending').map((task, index) => (
            <motion.div 
              key={task.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="glass-card flex flex-col"
            >
              <div className="flex justify-between items-start mb-4">
                <div>
                  <span className="text-xs text-textMuted">Task #{task.id}</span>
                  <h3 className="text-lg font-bold text-text">Order {task.order_id}</h3>
                </div>
              </div>

              {selectedTask === task.id ? (
                <div className="flex-1 space-y-3">
                  <textarea 
                    value={issueDescription}
                    onChange={(e) => setIssueDescription(e.target.value)}
                    placeholder="Describe the issue..."
                    className="w-full bg-surface/50 border border-danger/30 rounded p-2 text-sm text-text focus:outline-none focus:border-danger"
                    rows={3}
                  />
                  <div className="flex gap-2">
                    <button 
                      onClick={() => handleComplete(task.id, false)}
                      className="flex-1 bg-danger hover:bg-danger/80 text-white text-sm py-2 rounded transition-colors"
                    >
                      Confirm Failure
                    </button>
                    <button 
                      onClick={() => setSelectedTask(null)}
                      className="flex-1 bg-surface hover:bg-surface/80 text-text text-sm py-2 rounded transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="mt-auto pt-4 border-t border-border/50 flex gap-3">
                  <button 
                    onClick={() => handleComplete(task.id, true)}
                    className="flex-1 flex justify-center items-center gap-2 bg-success/10 hover:bg-success/20 text-success border border-success/20 py-2 rounded transition-colors"
                  >
                    <CheckCircle className="w-4 h-4" /> Pass
                  </button>
                  <button 
                    onClick={() => setSelectedTask(task.id)}
                    className="flex-1 flex justify-center items-center gap-2 bg-danger/10 hover:bg-danger/20 text-danger border border-danger/20 py-2 rounded transition-colors"
                  >
                    <XCircle className="w-4 h-4" /> Fail
                  </button>
                </div>
              )}
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
};

export default QualityControl;
