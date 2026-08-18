import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api';
import { Shield, User, Mail, Lock, Building, Warehouse } from 'lucide-react';

export default function SignUp() {
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    password: '',
    organization_name: '',
    warehouse_name: '',
    role: 'ADMIN',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const navigate = useNavigate();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      // 1. Register User & Create Warehouse
      await api.post('/api/auth/register', formData);
      
      // 2. Automatically login after registration
      const loginData = new URLSearchParams();
      loginData.append('username', formData.email);
      loginData.append('password', formData.password);

      const response = await api.post('/api/auth/login', loginData, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      });
      
      // 3. We have access token, now we need to redirect them to login page or just log them in
      // Let's redirect to login for simplicity with a success message, or directly login. Let's directly login.
      navigate('/login');
      
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 py-12">
      <div className="max-w-xl w-full bg-surface rounded-2xl shadow-xl p-8 border border-border/50">
        <div className="flex flex-col items-center mb-8">
          <div className="h-16 w-16 bg-blue-500/20 rounded-2xl flex items-center justify-center mb-4 border border-blue-500/30">
            <Shield className="h-8 w-8 text-blue-400" />
          </div>
          <h1 className="text-2xl font-bold text-text">Create your Workspace</h1>
          <p className="text-textMuted mt-2">Setup SmartFulfill AI for your organization</p>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/50 text-red-400 p-3 rounded-lg text-sm mb-6 text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSignUp} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-text mb-1">Full Name</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-textMuted" />
                <input
                  type="text"
                  name="full_name"
                  value={formData.full_name}
                  onChange={handleChange}
                  className="w-full bg-background/50 border border-border rounded-lg py-2.5 pl-10 pr-4 text-text focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-text mb-1">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-textMuted" />
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full bg-background/50 border border-border rounded-lg py-2.5 pl-10 pr-4 text-text focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  required
                />
              </div>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-text mb-1">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-textMuted" />
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className="w-full bg-background/50 border border-border rounded-lg py-2.5 pl-10 pr-4 text-text focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-text mb-1">Organization Name</label>
              <div className="relative">
                <Building className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-textMuted" />
                <input
                  type="text"
                  name="organization_name"
                  value={formData.organization_name}
                  onChange={handleChange}
                  className="w-full bg-background/50 border border-border rounded-lg py-2.5 pl-10 pr-4 text-text focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-text mb-1">Warehouse Name</label>
              <div className="relative">
                <Warehouse className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-textMuted" />
                <input
                  type="text"
                  name="warehouse_name"
                  value={formData.warehouse_name}
                  onChange={handleChange}
                  className="w-full bg-background/50 border border-border rounded-lg py-2.5 pl-10 pr-4 text-text focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  required
                />
              </div>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-text mb-1">Role</label>
              <select
                name="role"
                value={formData.role}
                onChange={handleChange}
                className="w-full bg-background/50 border border-border rounded-lg py-2.5 px-4 text-text focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 appearance-none"
              >
                <option value="ADMIN">Administrator</option>
                <option value="WAREHOUSE_MANAGER">Warehouse Manager</option>
                <option value="INVENTORY_MANAGER">Inventory Manager</option>
                <option value="PICKER">Picker / Operator</option>
                <option value="VIEWER">Viewer</option>
              </select>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-500 disabled:bg-blue-600/50 text-white font-medium py-3 rounded-lg transition-colors shadow-lg shadow-blue-500/20 mt-6"
          >
            {loading ? 'Creating workspace...' : 'Sign Up'}
          </button>
        </form>

        <p className="mt-8 text-center text-sm text-textMuted">
          Already have an account?{' '}
          <Link to="/login" className="text-blue-400 hover:text-blue-300 transition-colors font-medium">
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
}
