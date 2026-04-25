import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { leadsAPI } from '../../services/api';
import { useLeadStore, useSocketStore } from '../../store';
import socket from '../../socket';
import { Plus, Search, Edit2, Trash2, Phone, Mail, Sparkles, Filter } from 'lucide-react';

const statusColors = { new: 'bg-blue-500/10 text-blue-400 border border-blue-500/20', contacted: 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20', qualified: 'bg-green-500/10 text-green-400 border border-green-500/20', converted: 'bg-purple-500/10 text-purple-400 border border-purple-500/20', lost: 'bg-red-500/10 text-red-400 border border-red-500/20' };
const statusLabels = { new: 'New', contacted: 'Contacted', qualified: 'Qualified', converted: 'Converted', lost: 'Lost' };

export default function Leads() {
  const navigate = useNavigate();
  const { leads, setLeads, addLead, updateLead, removeLead } = useLeadStore();
  const { connected } = useSocketStore();
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editLead, setEditLead] = useState(null);
  const [form, setForm] = useState({ name: '', email: '', phone: '', company: '', status: 'new', source: 'website' });

  useEffect(() => {
    leadsAPI.getAll().then((res) => setLeads(res.data.leads || res.data || []));

    const handleAddLead = (lead) => {
      const currentUser = JSON.parse(localStorage.getItem('user'));
      if (currentUser?.role === 'admin' || lead.assignedTo === currentUser?._id || lead.assignedTo?._id === currentUser?._id) {
        addLead(lead);
      }
    };

    socket.on('lead:created', handleAddLead);
    socket.on('lead:updated', updateLead);
    socket.on('lead:deleted', (data) => removeLead(data.id));

    return () => {
      socket.off('lead:created', handleAddLead);
      socket.off('lead:updated', updateLead);
      socket.off('lead:deleted');
    };
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editLead) {
        const { data } = await leadsAPI.update(editLead._id, form);
        updateLead(data);
      } else {
        const { data } = await leadsAPI.create(form);
        addLead(data);
      }
      setShowModal(false);
      setEditLead(null);
      setForm({ name: '', email: '', phone: '', company: '', status: 'new', source: 'website' });
    } catch (err) {
      alert(err.response?.data?.error || 'Failed');
    }
  };

  const handleEdit = (lead) => {
    setEditLead(lead);
    setForm({ name: lead.name, email: lead.email, phone: lead.phone || '', company: lead.company || '', status: lead.status, source: lead.source });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (confirm('Delete this lead?')) {
      await leadsAPI.delete(id);
      removeLead(id);
    }
  };

  const filteredLeads = leads.filter((l) => l.name.toLowerCase().includes(search.toLowerCase()) || l.email.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-display font-bold text-white tracking-tight flex items-center gap-3">
            Lead Management
            {!connected && <span className="text-[10px] bg-red-500/20 border border-red-500/30 text-red-400 px-2 py-0.5 rounded-full flex items-center gap-1"><div className="w-1.5 h-1.5 rounded-full bg-red-400"></div> Offline</span>}
          </h2>
          <p className="text-sm text-gray-400 mt-1">{leads.length} total leads recorded.</p>
        </div>
        <button onClick={() => { setEditLead(null); setForm({ name: '', email: '', phone: '', company: '', status: 'new', source: 'website' }); setShowModal(true); }} className="btn-primary px-4 py-2 flex items-center gap-2 text-sm">
          <Plus size={16} /> Add Lead
        </button>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1 group">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-blue-400 transition-colors" size={18} />
          <input type="text" placeholder="Search by name or email..." value={search} onChange={(e) => setSearch(e.target.value)} className="input-field pl-10 pr-4 py-2.5" />
        </div>
        <button className="flex items-center gap-2 px-4 py-2.5 bg-dark-surface border border-white/10 rounded-lg hover:bg-white/5 transition-colors text-sm font-medium text-gray-300">
          <Filter size={16} /> Filter
        </button>
      </div>

      <div className="glass-panel rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-dark-surface/50 border-b border-white/10 text-xs uppercase tracking-wider text-gray-400">
                <th className="px-6 py-4 font-semibold">Lead Contact</th>
                <th className="px-6 py-4 font-semibold">Company</th>
                <th className="px-6 py-4 font-semibold">Status</th>
                <th className="px-6 py-4 font-semibold flex items-center gap-1.5"><Sparkles size={14} className="text-accent-teal" /> AI Score</th>
                <th className="px-6 py-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-sm">
              {filteredLeads.map((lead) => (
                <tr key={lead._id} onClick={(e) => { if(!e.target.closest('button')) navigate(`/sales/leads/${lead._id}`); }} className="hover:bg-white/[0.02] transition-colors group cursor-pointer">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500/20 to-purple-500/20 border border-white/10 flex items-center justify-center text-white font-bold text-lg">
                        {lead.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-semibold text-white flex items-center gap-2">
                          {lead.name}
                          {lead.priority === 'HIGH' && <span title="High Priority Lead" className="text-[10px] bg-red-500/20 text-red-400 px-1.5 py-0.5 rounded border border-red-500/30">🔥 High</span>}
                          {lead.priority === 'MEDIUM' && <span title="Medium Priority Lead" className="text-[10px] bg-yellow-500/20 text-yellow-400 px-1.5 py-0.5 rounded border border-yellow-500/30">⚡ Med</span>}
                          {lead.priority === 'LOW' && <span title="Low Priority Lead" className="text-[10px] bg-gray-500/20 text-gray-400 px-1.5 py-0.5 rounded border border-gray-500/30">💤 Low</span>}
                          {lead.isDuplicate && <span title="Possible Duplicate" className="text-[10px] bg-orange-500/20 text-orange-400 px-1.5 py-0.5 rounded border border-orange-500/30">⚠️ Dup</span>}
                        </p>
                        <div className="flex items-center gap-3 mt-1">
                          <span className="flex items-center gap-1 text-xs text-gray-400 hover:text-blue-400 cursor-pointer"><Mail size={12} /> {lead.email}</span>
                          {lead.phone && <span className="flex items-center gap-1 text-xs text-gray-400"><Phone size={12} /> {lead.phone}</span>}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-gray-300 font-medium">{lead.company || <span className="text-gray-600 italic">None</span>}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider rounded-full ${statusColors[lead.status]}`}>
                      {statusLabels[lead.status]}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-24 h-1.5 bg-dark-bg rounded-full overflow-hidden border border-white/5">
                        <div className={`h-full relative ${lead.score >= 70 ? 'bg-gradient-to-r from-green-500 to-green-400' : lead.score >= 40 ? 'bg-gradient-to-r from-yellow-500 to-yellow-400' : 'bg-gradient-to-r from-red-500 to-red-400'}`} style={{ width: `${lead.score}%` }}></div>
                      </div>
                      <span className="font-mono text-gray-300 font-bold">{lead.score}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => handleEdit(lead)} className="p-1.5 hover:bg-white/10 text-gray-400 hover:text-white rounded transition-colors"><Edit2 size={16} /></button>
                      <button onClick={() => handleDelete(lead._id)} className="p-1.5 hover:bg-red-500/20 text-gray-400 hover:text-red-400 rounded transition-colors"><Trash2 size={16} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredLeads.length === 0 && (
            <div className="text-center py-16">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-dark-surface border border-white/5 mb-4 text-gray-500">
                <Search size={24} />
              </div>
              <h3 className="text-white font-semibold mb-1">No leads found</h3>
              <p className="text-sm text-gray-500">Try adjusting your search criteria or add a new lead.</p>
            </div>
          )}
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in">
          <div className="glass-panel rounded-2xl p-6 w-full max-w-md animate-slide-up border border-white/10 shadow-2xl shadow-black">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-display font-bold text-white">{editLead ? 'Edit Lead' : 'New Lead'}</h3>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-white"><Plus size={24} className="rotate-45" /></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Full Name</label>
                <input type="text" placeholder="John Doe" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="input-field px-4 py-2.5" required />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Email Address</label>
                <input type="email" placeholder="john@example.com" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="input-field px-4 py-2.5" required />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Phone</label>
                  <input type="text" placeholder="+1..." value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="input-field px-4 py-2.5" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Company</label>
                  <input type="text" placeholder="Acme Inc" value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} className="input-field px-4 py-2.5" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Status</label>
                <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} className="input-field px-4 py-2.5 appearance-none">
                  {Object.entries(statusLabels).map(([val, label]) => <option key={val} value={val} className="bg-dark-bg">{label}</option>)}
                </select>
              </div>
              <div className="flex gap-3 justify-end mt-8 pt-4 border-t border-white/10">
                <button type="button" onClick={() => setShowModal(false)} className="px-5 py-2.5 border border-white/10 rounded-lg text-sm font-medium hover:bg-white/5 transition-colors">Cancel</button>
                <button type="submit" className="btn-primary px-5 py-2.5 text-sm">{editLead ? 'Save Changes' : 'Create Lead'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}