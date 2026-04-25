import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authAPI } from '../services/api';
import { useAuthStore } from '../store';
import { Lock, Mail, ArrowRight, Activity } from 'lucide-react';

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuthStore();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { data } = await authAPI.login(form);
      login(data.user, data.token);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-dark-bg relative overflow-hidden">
      {/* Background Orbs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-600/20 rounded-full blur-[100px] animate-pulse-slow"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent-purple/20 rounded-full blur-[100px] animate-pulse-slow" style={{animationDelay: '1s'}}></div>
      
      <div className="glass-panel rounded-2xl p-8 w-full max-w-md relative z-10 animate-fade-in border border-white/10">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-xl bg-blue-600/20 text-blue-500 mb-6 border border-blue-500/30">
            <Activity size={32} />
          </div>
          <h1 className="text-3xl font-display font-bold text-white mb-2 tracking-tight">
            Nex<span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-accent-teal">CRM</span>
          </h1>
          <p className="text-gray-400 font-sans text-sm">Intelligent Customer Relationships</p>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/50 text-red-400 p-3 rounded-lg mb-6 text-sm flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-red-400"></div>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Email Address</label>
            <div className="relative group">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-blue-400 transition-colors" size={18} />
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="input-field pl-10 pr-4 py-3 bg-dark-bg/50"
                placeholder="admin@crm.com"
                required
              />
            </div>
          </div>
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider">Password</label>
              <a href="#" className="text-xs text-blue-400 hover:text-blue-300">Forgot?</a>
            </div>
            <div className="relative group">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-blue-400 transition-colors" size={18} />
              <input
                type="password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                className="input-field pl-10 pr-4 py-3 bg-dark-bg/50"
                placeholder="••••••••"
                required
              />
            </div>
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white rounded-lg font-medium shadow-lg shadow-blue-500/25 transition-all duration-300 disabled:opacity-50 flex items-center justify-center gap-2 group mt-2"
          >
            {loading ? 'Authenticating...' : 'Sign In'}
            {!loading && <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />}
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-white/10 text-center">
          <p className="text-xs text-gray-500 mb-2">Admin Login</p>
          <div className="flex justify-center gap-4 text-[11px]">
            <div className="flex flex-col items-center">
              <span className="text-blue-400 font-semibold mb-0.5">Email: admin@crm.com</span>
              <span className="text-gray-400">Password: password</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}