import { useEffect, useState } from 'react';
import { authAPI } from '../../services/api';
import { Users, Plus, Edit2, Trash2, Search } from 'lucide-react';
import axios from 'axios';

export default function UserManagement() {
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [activeTab, setActiveTab] = useState('sales');
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'sales' });

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = () => {
    authAPI.getUsers()
      .then(res => {
        setUsers(Array.isArray(res.data) ? res.data : []);
      })
      .catch(err => {
        console.error('UserManagement Error:', err);
        alert('Failed to fetch users: ' + (err.response?.data?.error || err.message));
      })
      .finally(() => setLoading(false));
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    try {
      await axios.post('http://localhost:5001/api/auth/register-staff', form, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      setShowModal(false);
      setForm({ name: '', email: '', password: '', role: activeTab });
      fetchUsers();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to create user');
    }
  };

  const openModal = () => {
    setForm({ name: '', email: '', password: '', role: activeTab });
    setShowModal(true);
  };

  const filteredUsers = users.filter(u => 
    u.role === activeTab && 
    (u.name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="space-y-6 relative h-full">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-display font-bold text-white tracking-tight flex items-center gap-3">
            <Users size={24} className="text-blue-400" /> User Management
          </h2>
          <p className="text-sm text-gray-400 mt-1">Manage team access and roles.</p>
        </div>
        <button onClick={openModal} className="btn-primary px-4 py-2 flex items-center gap-2 text-sm capitalize">
          <Plus size={16} /> Add {activeTab} Staff
        </button>
      </div>

      <div className="flex items-center justify-between border-b border-white/10 pb-4">
        <div className="flex gap-4">
          {['sales', 'support', 'admin'].map((role) => (
            <button
              key={role}
              onClick={() => setActiveTab(role)}
              className={`px-4 py-2 text-sm font-medium capitalize rounded-lg transition-colors ${
                activeTab === role 
                  ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' 
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              {role} Team
            </button>
          ))}
        </div>
        
        <div className="relative group w-64">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-blue-400 transition-colors" size={18} />
          <input 
            type="text" 
            placeholder="Search users..." 
            value={search} 
            onChange={(e) => setSearch(e.target.value)} 
            className="input-field pl-10 pr-4 py-2.5 w-full" 
          />
        </div>
      </div>

      <div className="glass-panel rounded-xl overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-400">Loading users...</div>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-dark-surface/50 border-b border-white/10 text-xs uppercase tracking-wider text-gray-400">
                <th className="px-6 py-4 font-semibold">User</th>
                <th className="px-6 py-4 font-semibold">Role</th>
                <th className="px-6 py-4 font-semibold">Status</th>
                <th className="px-6 py-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-sm">
              {filteredUsers.map(u => (
                <tr key={u._id} className="hover:bg-white/[0.02] transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500/20 to-purple-500/20 border border-white/10 flex items-center justify-center text-white font-bold text-sm">
                        {u.name.charAt(0)}
                      </div>
                      <div>
                        <p className="font-semibold text-white">{u.name}</p>
                        <p className="text-xs text-gray-400">{u.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider rounded-full ${
                      u.role === 'admin' ? 'bg-purple-500/10 text-purple-400' :
                      u.role === 'sales' ? 'bg-blue-500/10 text-blue-400' :
                      'bg-green-500/10 text-green-400'
                    }`}>
                      {u.role}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="flex items-center gap-1.5 text-xs text-gray-300">
                      <span className={`w-1.5 h-1.5 rounded-full ${u.isActive ? 'bg-green-500' : 'bg-red-500'}`}></span>
                      {u.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button className="p-1.5 hover:bg-white/10 text-gray-400 hover:text-white rounded transition-colors"><Edit2 size={16} /></button>
                      <button className="p-1.5 hover:bg-red-500/20 text-gray-400 hover:text-red-400 rounded transition-colors"><Trash2 size={16} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-dark-surface border border-white/10 rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <h3 className="text-xl font-bold text-white mb-6">Add New Staff Member</h3>
            <form onSubmit={handleCreateUser} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Full Name</label>
                <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full bg-dark-bg border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white" required />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Email</label>
                <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="w-full bg-dark-bg border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white" required />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Password</label>
                <input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} className="w-full bg-dark-bg border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white" required minLength="6" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Role</label>
                <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} className="w-full bg-dark-bg border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white">
                  <option value="sales">Sales</option>
                  <option value="support">Support</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <div className="flex gap-3 justify-end mt-8 pt-4 border-t border-white/10">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 text-sm text-gray-400 hover:text-white transition-colors">Cancel</button>
                <button type="submit" className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">Create User</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
