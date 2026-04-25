import { useEffect, useState } from 'react';
import { ticketsAPI } from '../../services/api';
import { Ticket as TicketIcon, Search, Plus, Filter, AlertCircle } from 'lucide-react';
import { Link } from 'react-router-dom';

const statusColors = { 
  open: 'bg-blue-500/10 text-blue-400 border border-blue-500/20', 
  'in-progress': 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20', 
  resolved: 'bg-green-500/10 text-green-400 border border-green-500/20', 
  closed: 'bg-gray-500/10 text-gray-400 border border-gray-500/20' 
};

export default function Tickets() {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ title: '', description: '', customerName: '', priority: 'medium' });

  useEffect(() => {
    fetchTickets();
  }, []);

  const fetchTickets = () => {
    ticketsAPI.getAll()
      .then(res => setTickets(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await ticketsAPI.create(form);
      setShowModal(false);
      setForm({ title: '', description: '', customerName: '', priority: 'medium' });
      fetchTickets();
    } catch (err) {
      alert('Failed to create ticket');
    }
  };

  const filteredTickets = tickets.filter(t => 
    t.title.toLowerCase().includes(search.toLowerCase()) || 
    t.customerName.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-display font-bold text-white tracking-tight flex items-center gap-3">
            <TicketIcon size={24} className="text-purple-400" /> Support Tickets
          </h2>
          <p className="text-sm text-gray-400 mt-1">Manage and resolve customer issues.</p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn-primary bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-500 hover:to-purple-400 shadow-purple-500/25 px-4 py-2 flex items-center gap-2 text-sm">
          <Plus size={16} /> New Ticket
        </button>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1 group">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-purple-400 transition-colors" size={18} />
          <input type="text" placeholder="Search issues or customers..." value={search} onChange={(e) => setSearch(e.target.value)} className="input-field pl-10 pr-4 py-2.5 focus:ring-purple-500 focus:border-purple-500" />
        </div>
        <button className="flex items-center gap-2 px-4 py-2.5 bg-dark-surface border border-white/10 rounded-lg hover:bg-white/5 transition-colors text-sm font-medium text-gray-300">
          <Filter size={16} /> Filter
        </button>
      </div>

      <div className="glass-panel rounded-xl overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-400">Loading tickets...</div>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-dark-surface/50 border-b border-white/10 text-xs uppercase tracking-wider text-gray-400">
                <th className="px-6 py-4 font-semibold">Issue</th>
                <th className="px-6 py-4 font-semibold">Customer</th>
                <th className="px-6 py-4 font-semibold">Priority</th>
                <th className="px-6 py-4 font-semibold">Status</th>
                <th className="px-6 py-4 font-semibold text-right">Updated</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-sm">
              {filteredTickets.map(t => (
                <tr key={t._id} className="hover:bg-white/[0.02] transition-colors group">
                  <td className="px-6 py-4">
                    <Link to={`/support/tickets/${t._id}`} className="font-semibold text-white hover:text-purple-400 transition-colors block">
                      {t.title}
                    </Link>
                    <p className="text-xs text-gray-400 mt-1 line-clamp-1">{t.description}</p>
                  </td>
                  <td className="px-6 py-4 text-gray-300 font-medium">
                    {t.customerName}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1.5 text-xs font-bold">
                      {t.priority === 'urgent' && <AlertCircle size={12} className="text-red-500" />}
                      <span className={t.priority === 'urgent' ? 'text-red-400' : t.priority === 'high' ? 'text-orange-400' : t.priority === 'medium' ? 'text-yellow-400' : 'text-green-400'}>
                        {t.priority.toUpperCase()}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider rounded-full ${statusColors[t.status]}`}>
                      {t.status.replace('-', ' ')}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right text-gray-400 text-xs">
                    {new Date(t.updatedAt).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in">
          <div className="glass-panel rounded-2xl p-6 w-full max-w-md animate-slide-up border border-white/10 shadow-2xl shadow-black">
            <h3 className="text-xl font-display font-bold text-white mb-6">Create Support Ticket</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Issue Title</label>
                <input type="text" value={form.title} onChange={e => setForm({...form, title: e.target.value})} className="input-field px-4 py-2.5 focus:ring-purple-500 focus:border-purple-500" required />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Customer Name</label>
                <input type="text" value={form.customerName} onChange={e => setForm({...form, customerName: e.target.value})} className="input-field px-4 py-2.5 focus:ring-purple-500 focus:border-purple-500" required />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Description</label>
                <textarea value={form.description} onChange={e => setForm({...form, description: e.target.value})} className="input-field px-4 py-2.5 min-h-[100px] focus:ring-purple-500 focus:border-purple-500" required />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Priority</label>
                <select value={form.priority} onChange={e => setForm({...form, priority: e.target.value})} className="input-field px-4 py-2.5 appearance-none focus:ring-purple-500 focus:border-purple-500">
                  <option value="low" className="bg-dark-bg">Low</option>
                  <option value="medium" className="bg-dark-bg">Medium</option>
                  <option value="high" className="bg-dark-bg">High</option>
                  <option value="urgent" className="bg-dark-bg">Urgent</option>
                </select>
              </div>
              <div className="flex justify-end gap-3 mt-8">
                <button type="button" onClick={() => setShowModal(false)} className="px-5 py-2.5 text-gray-300 hover:bg-white/5 rounded-lg transition-colors text-sm">Cancel</button>
                <button type="submit" className="btn-primary bg-gradient-to-r from-purple-600 to-purple-500 px-5 py-2.5 text-sm">Create Ticket</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
