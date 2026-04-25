import { useEffect, useState } from 'react';
import { leadsAPI, authAPI } from '../../services/api';
import { Users, Search, AlertCircle } from 'lucide-react';

const statusColors = {
  new: 'bg-blue-500/10 text-blue-400',
  contacted: 'bg-yellow-500/10 text-yellow-400',
  qualified: 'bg-purple-500/10 text-purple-400',
  converted: 'bg-green-500/10 text-green-400',
  lost: 'bg-red-500/10 text-red-400'
};

export default function AdminLeads() {
  const [leads, setLeads] = useState([]);
  const [salesStaff, setSalesStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    let leadsLoaded = false;
    let usersLoaded = false;

    const checkDone = () => {
      if (leadsLoaded && usersLoaded) setLoading(false);
    };

    leadsAPI.getAll()
      .then(res => setLeads(res.data.leads || res.data || []))
      .catch(err => console.error('AdminLeads Error:', err))
      .finally(() => { leadsLoaded = true; checkDone(); });

    authAPI.getUsers()
      .then(res => setSalesStaff(Array.isArray(res.data) ? res.data.filter(u => u.role === 'sales') : []))
      .catch(err => console.error('AdminUsers Error:', err))
      .finally(() => { usersLoaded = true; checkDone(); });

  }, []);

  const handleAssign = async (leadId, newAssignedTo) => {
    try {
      const res = await leadsAPI.update(leadId, { assignedTo: newAssignedTo });
      setLeads(leads.map(l => l._id === leadId ? res.data : l));
    } catch (err) {
      alert('Failed to reassign lead');
    }
  };

  const filteredLeads = leads.filter(l => 
    l.name.toLowerCase().includes(search.toLowerCase()) || 
    l.email.toLowerCase().includes(search.toLowerCase()) ||
    l.company?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-display font-bold text-white tracking-tight flex items-center gap-3">
            <Users size={24} className="text-blue-400" /> Lead Management & Assignment
          </h2>
          <p className="text-sm text-gray-400 mt-1">Globally oversee leads and assign them to your sales staff.</p>
        </div>
      </div>

      <div className="relative group max-w-md">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-blue-400 transition-colors" size={18} />
        <input 
          type="text" 
          placeholder="Search leads by name, email, or company..." 
          value={search} 
          onChange={(e) => setSearch(e.target.value)} 
          className="input-field pl-10 pr-4 py-2.5 w-full" 
        />
      </div>

      <div className="glass-panel rounded-xl overflow-hidden shadow-2xl">
        {loading ? (
          <div className="p-8 text-center text-gray-400">Loading leads...</div>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-dark-surface/50 border-b border-white/10 text-xs uppercase tracking-wider text-gray-400">
                <th className="px-6 py-4 font-semibold">Lead Information</th>
                <th className="px-6 py-4 font-semibold">Status</th>
                <th className="px-6 py-4 font-semibold">Assignment</th>
                <th className="px-6 py-4 font-semibold text-right">Created</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-sm">
              {filteredLeads.map(lead => (
                <tr key={lead._id} className="hover:bg-white/[0.02] transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-dark-bg border border-white/10 flex items-center justify-center text-blue-400 font-bold text-lg">
                        {lead.name.charAt(0)}
                      </div>
                      <div>
                        <p className="font-semibold text-white">{lead.name}</p>
                        <p className="text-xs text-gray-400">{lead.company || 'No Company'}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider rounded-full ${statusColors[lead.status]}`}>
                      {lead.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <select 
                      value={lead.assignedTo?._id || lead.assignedTo || ''}
                      onChange={(e) => handleAssign(lead._id, e.target.value)}
                      className="bg-dark-bg border border-white/10 text-white text-xs rounded-lg px-3 py-2 w-48 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    >
                      <option value="" disabled>-- Unassigned --</option>
                      {salesStaff.map(staff => (
                        <option key={staff._id} value={staff._id}>{staff.name}</option>
                      ))}
                    </select>
                    {!lead.assignedTo && (
                      <span className="flex items-center gap-1 text-[10px] text-yellow-500 mt-1.5 ml-1 uppercase tracking-wider font-semibold">
                        <AlertCircle size={10} /> Needs Assignment
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right text-gray-400 text-xs">
                    {new Date(lead.createdAt).toLocaleDateString()}
                  </td>
                </tr>
              ))}
              {filteredLeads.length === 0 && (
                <tr>
                  <td colSpan="4" className="px-6 py-8 text-center text-gray-500 italic">No leads found matching your search.</td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
