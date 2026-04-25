import { useEffect, useState } from 'react';
import { dashboardAPI } from '../../services/api';
import { Users, DollarSign, TrendingUp, Target, Activity } from 'lucide-react';

const statusLabels = { new: 'New', contacted: 'Contacted', qualified: 'Qualified', converted: 'Converted', lost: 'Lost' };
const stageLabels = { inquiry: 'Inquiry', proposal: 'Proposal', negotiation: 'Negotiation', won: 'Won', lost: 'Lost' };

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = () => {
      dashboardAPI.getStats()
        .then((res) => setStats(res.data))
        .catch(console.error)
        .finally(() => setLoading(false));
    };

    fetchStats();

    import('../../socket').then(({ default: socket }) => {
      socket.on('lead:created', fetchStats);
      socket.on('lead:updated', fetchStats);
      socket.on('deal:updated', fetchStats);
    });

    return () => {
      import('../../socket').then(({ default: socket }) => {
        socket.off('lead:created', fetchStats);
        socket.off('lead:updated', fetchStats);
        socket.off('deal:updated', fetchStats);
      });
    };
  }, []);

  if (loading) return (
    <div className="animate-pulse space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1,2,3,4].map(i => <div key={i} className="h-32 bg-dark-surface rounded-xl border border-white/5"></div>)}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="h-64 bg-dark-surface rounded-xl border border-white/5"></div>
        <div className="h-64 bg-dark-surface rounded-xl border border-white/5"></div>
      </div>
    </div>
  );

  const cards = [
    { label: 'Total Leads', value: stats?.totalLeads || 0, icon: Users, color: 'text-blue-400', bg: 'bg-blue-400/10' },
    { label: 'Active Deals', value: stats?.totalDeals || 0, icon: Target, color: 'text-accent-teal', bg: 'bg-accent-teal/10' },
    { label: 'Pipeline Value', value: `₹${((stats?.totalDealValue || 0) / 100000).toFixed(1)}L`, icon: DollarSign, color: 'text-accent-purple', bg: 'bg-accent-purple/10' },
    { label: 'Won Value', value: `₹${((stats?.wonDealsValue || 0) / 100000).toFixed(1)}L`, icon: TrendingUp, color: 'text-green-400', bg: 'bg-green-400/10' },
  ];

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-display font-bold text-white tracking-tight">Overview</h2>
          <p className="text-sm text-gray-400 mt-1">Here's what's happening today.</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-dark-surface border border-white/10 rounded-lg hover:bg-white/5 transition-colors text-sm font-medium">
          <Activity size={16} className="text-blue-400" /> Generate Report
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className="card group relative overflow-hidden">
            <div className={`absolute top-0 right-0 w-32 h-32 ${bg} blur-[40px] -mr-10 -mt-10 rounded-full transition-transform group-hover:scale-150`}></div>
            <div className="relative z-10 flex items-center gap-4">
              <div className={`${bg} ${color} p-3 rounded-xl border border-white/5 shadow-lg`}>
                <Icon size={24} />
              </div>
              <div>
                <p className="text-gray-400 text-xs font-semibold uppercase tracking-wider mb-1">{label}</p>
                <p className="text-2xl font-display font-bold text-white">{value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <h3 className="font-display font-semibold text-white mb-6 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-blue-500"></span> Leads by Status
          </h3>
          <div className="space-y-5">
            {Object.entries(stats?.leadsByStatus || {}).map(([status, count]) => (
              <div key={status} className="flex flex-col gap-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-400 font-medium">{statusLabels[status] || status}</span>
                  <span className="text-white font-bold">{count}</span>
                </div>
                <div className="w-full h-1.5 bg-dark-bg rounded-full overflow-hidden border border-white/5">
                  <div className="h-full bg-gradient-to-r from-blue-600 to-blue-400 relative" style={{ width: `${(count / (stats?.totalLeads || 1)) * 100}%` }}>
                    <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
                  </div>
                </div>
              </div>
            ))}
            {Object.keys(stats?.leadsByStatus || {}).length === 0 && <div className="text-sm text-gray-500 text-center py-4">No data available</div>}
          </div>
        </div>

        <div className="card">
          <h3 className="font-display font-semibold text-white mb-6 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-accent-purple"></span> Deals by Stage
          </h3>
          <div className="space-y-5">
            {Object.entries(stats?.dealsByStage || {}).map(([stage, data]) => (
              <div key={stage} className="flex flex-col gap-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-400 font-medium">{stageLabels[stage] || stage}</span>
                  <span className="text-white font-bold text-xs bg-white/5 px-2 py-0.5 rounded border border-white/5">
                    {data.count} · ₹{(data.value / 100000).toFixed(1)}L
                  </span>
                </div>
                <div className="w-full h-1.5 bg-dark-bg rounded-full overflow-hidden border border-white/5">
                  <div className={`h-full relative ${stage === 'won' ? 'bg-gradient-to-r from-green-600 to-green-400' : stage === 'lost' ? 'bg-gradient-to-r from-red-600 to-red-400' : 'bg-gradient-to-r from-accent-purple to-blue-400'}`} style={{ width: `${(data.count / (stats?.totalDeals || 1)) * 100}%` }}>
                  </div>
                </div>
              </div>
            ))}
            {Object.keys(stats?.dealsByStage || {}).length === 0 && <div className="text-sm text-gray-500 text-center py-4">No data available</div>}
          </div>
        </div>
      </div>
    </div>
  );
}