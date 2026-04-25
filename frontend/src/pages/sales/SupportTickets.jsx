import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MessageSquare, Clock, AlertCircle } from 'lucide-react';

export default function SupportTickets() {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ title: '', customerName: '', customerEmail: '', description: '', priority: 'medium', leadId: '', assignedTo: '' });
  const [leads, setLeads] = useState([]);
  const [supportStaff, setSupportStaff] = useState([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const headers = { 'Authorization': `Bearer ${token}` };
      
      const [ticketsRes, leadsRes, usersRes] = await Promise.all([
        fetch('http://localhost:5001/api/tickets', { headers }).then(r => r.json()),
        fetch('http://localhost:5001/api/leads', { headers }).then(r => r.json()),
        fetch('http://localhost:5001/api/auth/users', { headers }).then(r => r.json()),
      ]);

      setTickets(ticketsRes);
      setLeads(leadsRes.leads || []);
      setSupportStaff(Array.isArray(usersRes) ? usersRes.filter(u => u.role === 'support') : []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const selectedLead = leads.find(l => l._id === form.leadId);
      const data = {
        ...form,
        customerName: selectedLead?.name || form.customerName,
        customerEmail: selectedLead?.email || form.customerEmail,
      };

      const res = await fetch('http://localhost:5001/api/tickets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(data)
      });
      if (!res.ok) throw new Error('Failed to create ticket');
      
      setShowModal(false);
      setForm({ title: '', customerName: '', customerEmail: '', description: '', priority: 'medium', leadId: '', assignedTo: '' });
      fetchData();
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-display font-bold text-white tracking-tight flex items-center gap-3">
            <MessageSquare size={24} className="text-blue-400" /> Support Requests
          </h2>
          <p className="text-sm text-gray-400 mt-1">Track and manage your requests for support help.</p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn-primary px-4 py-2 flex items-center gap-2 text-sm">
          New Support Request
        </button>
      </div>

      <div className="glass-panel rounded-xl overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-400">Loading your requests...</div>
        ) : tickets.length === 0 ? (
          <div className="p-8 text-center text-gray-400">You haven't made any support requests yet.</div>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-dark-surface/50 border-b border-white/10 text-xs uppercase tracking-wider text-gray-400">
                <th className="px-6 py-4 font-semibold">Issue</th>
                <th className="px-6 py-4 font-semibold">Assigned Support Agent</th>
                <th className="px-6 py-4 font-semibold">Status</th>
                <th className="px-6 py-4 font-semibold">Priority</th>
                <th className="px-6 py-4 font-semibold text-right">Requested At</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-sm">
              {tickets.map(ticket => (
                <tr 
                  key={ticket._id} 
                  onClick={() => navigate(`/sales/support/${ticket._id}`)}
                  className="hover:bg-white/[0.02] transition-colors cursor-pointer group"
                >
                  <td className="px-6 py-4">
                    <p className="font-semibold text-white group-hover:text-blue-400 transition-colors">{ticket.title}</p>
                    {ticket.leadId && <p className="text-xs text-gray-500 mt-0.5">Linked to Lead: {ticket.leadId.name}</p>}
                  </td>
                  <td className="px-6 py-4 text-gray-300">
                    {ticket.assignedTo?.name || 'Unassigned'}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider rounded-full ${
                      ticket.status === 'open' ? 'bg-blue-500/10 text-blue-400' :
                      ticket.status === 'in-progress' ? 'bg-yellow-500/10 text-yellow-400' :
                      ticket.status === 'resolved' ? 'bg-green-500/10 text-green-400' :
                      'bg-gray-500/10 text-gray-400'
                    }`}>
                      {ticket.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`flex items-center gap-1.5 text-xs font-medium ${
                      ticket.priority === 'urgent' ? 'text-red-400' :
                      ticket.priority === 'high' ? 'text-orange-400' :
                      ticket.priority === 'medium' ? 'text-yellow-400' :
                      'text-green-400'
                    }`}>
                      <AlertCircle size={14} />
                      <span className="capitalize">{ticket.priority}</span>
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right text-gray-400 text-xs flex items-center justify-end gap-1.5">
                    <Clock size={12} /> {new Date(ticket.createdAt).toLocaleDateString()}
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
            <h3 className="text-xl font-display font-bold text-white mb-6">New Support Request</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Issue Title</label>
                <input type="text" value={form.title} onChange={e => setForm({...form, title: e.target.value})} className="input-field px-4 py-2.5" required />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Description</label>
                <textarea value={form.description} onChange={e => setForm({...form, description: e.target.value})} className="input-field px-4 py-2.5 min-h-[80px]" required></textarea>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Assign To Lead</label>
                  <select value={form.leadId} onChange={e => setForm({...form, leadId: e.target.value})} className="input-field px-4 py-2.5 appearance-none" required>
                    <option value="" disabled className="bg-dark-bg">Select lead...</option>
                    {leads.map(l => <option key={l._id} value={l._id} className="bg-dark-bg">{l.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Support Agent</label>
                  <select value={form.assignedTo} onChange={e => setForm({...form, assignedTo: e.target.value})} className="input-field px-4 py-2.5 appearance-none">
                    <option value="" className="bg-dark-bg">Unassigned (Auto-route)</option>
                    {supportStaff.map(s => <option key={s._id} value={s._id} className="bg-dark-bg">{s.name}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Priority</label>
                <select value={form.priority} onChange={e => setForm({...form, priority: e.target.value})} className="input-field px-4 py-2.5 appearance-none">
                  <option value="low" className="bg-dark-bg">Low</option>
                  <option value="medium" className="bg-dark-bg">Medium</option>
                  <option value="high" className="bg-dark-bg">High</option>
                  <option value="urgent" className="bg-dark-bg">Urgent</option>
                </select>
              </div>
              <div className="flex gap-3 justify-end mt-8 pt-4 border-t border-white/10">
                <button type="button" onClick={() => setShowModal(false)} className="px-5 py-2.5 border border-white/10 rounded-lg text-sm font-medium hover:bg-white/5 transition-colors">Cancel</button>
                <button type="submit" className="btn-primary px-5 py-2.5 text-sm">Submit Request</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
