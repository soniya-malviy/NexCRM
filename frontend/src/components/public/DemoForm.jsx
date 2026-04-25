import { useState } from 'react';
import api from '../../services/api';
import { Loader2, CheckCircle, AlertCircle } from 'lucide-react';

export default function DemoForm() {
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    company: '',
    interest: '',
    message: '',
  });
  
  const [status, setStatus] = useState('idle'); // idle, loading, success, error
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus('loading');
    setErrorMsg('');

    try {
      const payload = {
        ...form,
        source: 'website',
      };
      
      await api.post('/leads/public', payload);
      
      setStatus('success');
      setForm({ name: '', email: '', phone: '', company: '', interest: '', message: '' });
      
      // Auto reset success message after 5 seconds
      setTimeout(() => setStatus('idle'), 5000);
    } catch (err) {
      console.error(err);
      setStatus('error');
      setErrorMsg(err.response?.data?.error || 'Something went wrong. Please try again.');
    }
  };

  if (status === 'success') {
    return (
      <div className="bg-green-500/10 border border-green-500/20 rounded-2xl p-8 text-center animate-fade-in">
        <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4 text-green-400">
          <CheckCircle size={32} />
        </div>
        <h3 className="text-xl font-display font-bold text-white mb-2">Request Received!</h3>
        <p className="text-gray-400">Thanks! Our team will contact you soon.</p>
        <button 
          onClick={() => setStatus('idle')}
          className="mt-6 px-6 py-2.5 bg-dark-surface border border-white/10 rounded-lg text-sm text-gray-300 hover:text-white hover:bg-white/5 transition-colors"
        >
          Submit another request
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="bg-dark-surface/50 backdrop-blur-xl border border-white/10 rounded-2xl p-8 shadow-2xl">
      <h3 className="text-2xl font-display font-bold text-white mb-6">Request a Demo</h3>
      
      {status === 'error' && (
        <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg flex items-start gap-3">
          <AlertCircle size={20} className="text-red-400 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-400">{errorMsg}</p>
        </div>
      )}

      <div className="space-y-5">
        <div>
          <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Full Name *</label>
          <input 
            type="text" 
            required 
            placeholder="Jane Doe"
            value={form.name}
            onChange={e => setForm({...form, name: e.target.value})}
            className="w-full bg-dark-bg border border-white/10 rounded-lg px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Email *</label>
            <input 
              type="email" 
              required 
              placeholder="jane@company.com"
              value={form.email}
              onChange={e => setForm({...form, email: e.target.value})}
              className="w-full bg-dark-bg border border-white/10 rounded-lg px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Phone *</label>
            <input 
              type="tel" 
              required 
              placeholder="+1 (555) 000-0000"
              value={form.phone}
              onChange={e => setForm({...form, phone: e.target.value})}
              className="w-full bg-dark-bg border border-white/10 rounded-lg px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Company Name</label>
          <input 
            type="text" 
            placeholder="Acme Corp"
            value={form.company}
            onChange={e => setForm({...form, company: e.target.value})}
            className="w-full bg-dark-bg border border-white/10 rounded-lg px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Area of Interest *</label>
          <select 
            required
            value={form.interest}
            onChange={e => setForm({...form, interest: e.target.value})}
            className="w-full bg-dark-bg border border-white/10 rounded-lg px-4 py-3 text-white appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
          >
            <option value="" disabled>Select an option</option>
            <option value="AI Course">AI Course</option>
            <option value="Web Dev">Web Development</option>
            <option value="Data Science">Data Science</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Message</label>
          <textarea 
            placeholder="How can we help you?"
            value={form.message}
            onChange={e => setForm({...form, message: e.target.value})}
            className="w-full bg-dark-bg border border-white/10 rounded-lg px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all min-h-[100px]"
          ></textarea>
        </div>

        <button 
          type="submit" 
          disabled={status === 'loading'}
          className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-bold py-3.5 px-6 rounded-lg transition-all transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-70 disabled:hover:scale-100 flex items-center justify-center gap-2 shadow-lg shadow-blue-500/25 mt-4"
        >
          {status === 'loading' ? (
            <>
              <Loader2 size={20} className="animate-spin" /> Processing...
            </>
          ) : (
            'Request Demo'
          )}
        </button>
      </div>
    </form>
  );
}
