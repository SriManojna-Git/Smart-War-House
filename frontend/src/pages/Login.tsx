import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import api from '../api';
import { BrainCircuit, Mail, Lock, Sparkles, ArrowRight, ShieldCheck, Sun, Moon, Zap, Layers } from 'lucide-react';
import FuturisticBackground from '../components/FuturisticBackground';
import { motion } from 'framer-motion';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const formData = new URLSearchParams();
      formData.append('username', email);
      formData.append('password', password);

      const response = await api.post('/api/auth/login', formData, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      });
      
      const { access_token } = response.data;
      
      // Fetch user data
      const userResponse = await api.get('/api/auth/me', {
        headers: { Authorization: `Bearer ${access_token}` }
      });
      
      login(access_token, userResponse.data);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Login failed. Please verify your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleDemo = async () => {
    setLoading(true);
    setError('');
    try {
      const formData = new URLSearchParams();
      formData.append('username', 'demo@smartfulfill.ai');
      formData.append('password', 'demo');

      const response = await api.post('/api/auth/login', formData, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      });
      
      const { access_token } = response.data;
      const userResponse = await api.get('/api/auth/me', {
        headers: { Authorization: `Bearer ${access_token}` }
      });
      
      login(access_token, userResponse.data);
      navigate('/dashboard');
    } catch (err) {
      setError('Demo login failed. Make sure the database is active.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center p-4 overflow-hidden select-none">
      <FuturisticBackground variant="login" />

      {/* Top Bar for Theme Toggle */}
      <div className="absolute top-6 right-6 z-20">
        <button
          onClick={toggleTheme}
          className="p-3 glass-panel text-textMuted hover:text-text rounded-2xl hover:border-primary/50 transition-all shadow-lg"
          aria-label="Toggle Theme"
        >
          {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
        </button>
      </div>

      {/* Login Card Container */}
      <motion.div 
        initial={{ opacity: 0, y: 25, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="relative z-10 max-w-md w-full glass-panel p-8 md:p-10 border border-border/80 dark:border-white/10 shadow-2xl space-y-6"
      >
        <div className="flex flex-col items-center text-center space-y-2">
          <div className="h-16 w-16 bg-primary/15 dark:bg-primary/20 rounded-2xl flex items-center justify-center border border-primary/30 shadow-lg shadow-primary/25 relative group">
            <BrainCircuit className="h-9 w-9 text-primary animate-pulse" />
            <div className="absolute inset-0 rounded-2xl bg-primary/20 blur-xl -z-10 group-hover:opacity-100 opacity-60 transition-opacity"></div>
          </div>
          <div>
            <h1 className="text-2xl font-black text-text tracking-tight mt-2">
              SMARTFULFILL <span className="text-primary">AI</span>
            </h1>
            <p className="text-xs text-textMuted font-medium uppercase tracking-wider mt-1">
              Autonomous Warehouse Intelligence
            </p>
          </div>
        </div>

        {error && (
          <div className="bg-danger/10 border border-danger/40 text-danger p-3.5 rounded-xl text-xs font-semibold text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase text-textMuted mb-1.5">Workspace Email</label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-textMuted" />
              <input
                type="text"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-surface/70 border border-border/70 dark:border-white/10 rounded-xl py-3 pl-10 pr-4 text-xs text-text focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all placeholder:text-textMuted"
                placeholder="admin or demo@smartfulfill.ai"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase text-textMuted mb-1.5">Security Password</label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-textMuted" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-surface/70 border border-border/70 dark:border-white/10 rounded-xl py-3 pl-10 pr-4 text-xs text-text focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all placeholder:text-textMuted"
                placeholder="••••••••"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full btn-primary py-3.5 text-xs font-bold flex items-center justify-center gap-2 mt-2 shadow-xl shadow-primary/30"
          >
            {loading ? <Sparkles className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
            {loading ? 'Authenticating...' : 'Sign In to Operations Console'}
          </button>
        </form>

        <div className="relative flex items-center justify-center my-4">
          <div className="border-t border-border/50 dark:border-white/10 w-full"></div>
          <span className="bg-surface/90 px-3 text-[10px] uppercase font-bold text-textMuted tracking-wider absolute">
            Demo Sandbox Access
          </span>
        </div>

        <button
          type="button"
          onClick={handleDemo}
          disabled={loading}
          className="w-full btn-secondary py-3 text-xs font-bold flex items-center justify-center gap-2 border-primary/30 hover:border-primary text-text"
        >
          <Zap className="w-4 h-4 text-amber-500 fill-current" />
          Instant Demo Access (Preloaded Warehouse)
        </button>

        <div className="pt-2 text-center">
          <p className="text-[11px] text-textMuted flex items-center justify-center gap-1.5 font-medium">
            <ShieldCheck className="w-3.5 h-3.5 text-success" />
            Enterprise 256-Bit Role Isolation & Audit Engine
          </p>
        </div>
      </motion.div>
    </div>
  );
}
