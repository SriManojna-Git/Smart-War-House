import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api';
import { Warehouse, MapPin, Package, Grid, Clock } from 'lucide-react';

export default function Onboarding() {
  const [formData, setFormData] = useState({
    name: 'Main Warehouse',
    location: '',
    capacity: 10000,
    zones_count: 5,
    operating_hours: '9 AM - 5 PM',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { user, checkAuth } = useAuth();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      await api.post('/api/warehouse/setup', formData);
      await checkAuth(); // Refresh user state to reflect setup
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Setup failed.');
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 py-12">
      <div className="max-w-2xl w-full bg-surface rounded-2xl shadow-xl p-8 border border-border/50">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold text-text mb-2">Welcome, {user.full_name}!</h1>
          <p className="text-textMuted">Let's configure your primary warehouse to get started.</p>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/50 text-red-400 p-3 rounded-lg text-sm mb-6 text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-text mb-1">Warehouse Name</label>
              <div className="relative">
                <Warehouse className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-textMuted" />
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full bg-background/50 border border-border rounded-lg py-2.5 pl-10 pr-4 text-text focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-text mb-1">Location</label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-textMuted" />
                <input
                  type="text"
                  name="location"
                  value={formData.location}
                  onChange={handleChange}
                  placeholder="e.g. New York, NY"
                  className="w-full bg-background/50 border border-border rounded-lg py-2.5 pl-10 pr-4 text-text focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-text mb-1">Capacity (Units)</label>
              <div className="relative">
                <Package className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-textMuted" />
                <input
                  type="number"
                  name="capacity"
                  value={formData.capacity}
                  onChange={handleChange}
                  className="w-full bg-background/50 border border-border rounded-lg py-2.5 pl-10 pr-4 text-text focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-text mb-1">Number of Zones</label>
              <div className="relative">
                <Grid className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-textMuted" />
                <input
                  type="number"
                  name="zones_count"
                  value={formData.zones_count}
                  onChange={handleChange}
                  className="w-full bg-background/50 border border-border rounded-lg py-2.5 pl-10 pr-4 text-text focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  required
                />
              </div>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-text mb-1">Operating Hours</label>
              <div className="relative">
                <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-textMuted" />
                <input
                  type="text"
                  name="operating_hours"
                  value={formData.operating_hours}
                  onChange={handleChange}
                  placeholder="e.g. 24/7 or 9 AM - 5 PM"
                  className="w-full bg-background/50 border border-border rounded-lg py-2.5 pl-10 pr-4 text-text focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  required
                />
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-500 disabled:bg-blue-600/50 text-white font-medium py-3 rounded-lg transition-colors shadow-lg shadow-blue-500/20 mt-8"
          >
            {loading ? 'Saving Setup...' : 'Complete Setup & Go to Dashboard'}
          </button>
        </form>
      </div>
    </div>
  );
}
