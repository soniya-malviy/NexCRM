import { useEffect, useState } from 'react';
import { dealsAPI } from '../../services/api';
import { useDealStore, useSocketStore } from '../../store';
import socket from '../../socket';
import { Plus, Edit2, Trash2, Clock } from 'lucide-react';
import { DndContext, useDraggable, useDroppable, closestCorners } from '@dnd-kit/core';

const stageLabels = { new: 'New', contacted: 'Contacted', demo: 'Demo', negotiation: 'Negotiation', closed_won: 'Closed Won', closed_lost: 'Closed Lost' };
const stageColors = { new: 'bg-gray-500/10 border-gray-500/20 text-gray-300', contacted: 'bg-yellow-500/10 border-yellow-500/20 text-yellow-300', demo: 'bg-purple-500/10 border-purple-500/20 text-purple-300', negotiation: 'bg-blue-500/10 border-blue-500/20 text-blue-300', closed_won: 'bg-green-500/10 border-green-500/20 text-green-300', closed_lost: 'bg-red-500/10 border-red-500/20 text-red-300' };
const priorityColors = { high: 'bg-red-500/20 text-red-400 border-red-500/30', medium: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30', low: 'bg-green-500/20 text-green-400 border-green-500/30' };

function DealCard({ deal, onEdit, onDelete }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: deal._id,
    data: { deal }
  });
  
  const style = transform ? { 
    transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`, 
    zIndex: 50,
  } : undefined;

  return (
    <div 
      ref={setNodeRef} 
      style={{ ...style, borderLeftColor: deal.priority === 'high' ? '#EF4444' : deal.priority === 'medium' ? '#EAB308' : '#22C55E' }} 
      {...listeners} 
      {...attributes} 
      className={`card group hover:scale-[1.02] cursor-grab active:cursor-grabbing !p-4 border-l-4 ${isDragging ? 'opacity-50 ring-2 ring-blue-500' : ''}`}
    >
      <div className="flex items-start justify-between mb-2">
        <h4 className="font-semibold text-sm text-white line-clamp-2">{deal.title}</h4>
        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button onPointerDown={(e) => { e.stopPropagation(); onEdit(deal); }} className="p-1 hover:bg-white/10 text-gray-400 hover:text-white rounded transition-colors"><Edit2 size={14} /></button>
          <button onPointerDown={(e) => { e.stopPropagation(); onDelete(deal._id); }} className="p-1 hover:bg-red-500/20 text-gray-400 hover:text-red-400 rounded transition-colors"><Trash2 size={14} /></button>
        </div>
      </div>
      {deal.successProbability !== undefined && (
        <div className="mb-2 inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-bold bg-dark-bg border border-white/10">
          <span className={deal.successProbability >= 70 ? 'text-green-400' : deal.successProbability >= 40 ? 'text-yellow-400' : 'text-red-400'}>
            🎯 {deal.successProbability}% Win Rate
          </span>
        </div>
      )}
      <p className="text-lg font-display font-bold text-white mb-3">₹{(deal.value / 100000).toFixed(1)}L</p>
      
      <div className="flex items-center justify-between mt-auto">
        <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${priorityColors[deal.priority]}`}>
          {deal.priority}
        </span>
        <div className="flex items-center gap-1.5 text-xs text-gray-400 bg-white/5 px-2 py-1 rounded border border-white/5">
          <Clock size={12} /> 
          <span className="truncate max-w-[100px]">{deal.leadId?.name || 'Unknown'}</span>
        </div>
      </div>
    </div>
  );
}

function KanbanColumn({ id, stage, deals, onEdit, onDelete }) {
  const { setNodeRef, isOver } = useDroppable({ id });
  
  return (
    <div className="flex-shrink-0 w-80 flex flex-col">
      <div className="bg-dark-surface/80 border border-white/5 rounded-t-xl p-3 flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${stage === 'won' ? 'bg-green-500' : stage === 'lost' ? 'bg-red-500' : 'bg-blue-500'}`}></div>
            <h3 className="font-semibold text-sm text-gray-200">{stageLabels[stage]}</h3>
          </div>
          <span className="text-xs bg-dark-bg border border-white/10 px-2 py-1 rounded text-gray-400 font-mono">{deals.length}</span>
        </div>
        <div className="w-full bg-dark-bg h-1 rounded-full overflow-hidden">
          <div className={`h-full ${stageColors[stage].split(' ')[0]}`} style={{ width: '100%' }}></div>
        </div>
      </div>
      
      <div 
        ref={setNodeRef} 
        className={`flex-1 bg-dark-surface/30 border-x border-b border-white/5 rounded-b-xl p-3 overflow-y-auto custom-scrollbar space-y-3 min-h-[200px] transition-colors ${isOver ? 'bg-white/10 ring-1 ring-white/20' : ''}`}
      >
        {deals.map(deal => (
          <DealCard key={deal._id} deal={deal} onEdit={onEdit} onDelete={onDelete} />
        ))}
      </div>
    </div>
  );
}

export default function Deals() {
  const { deals, setDeals, addDeal, updateDeal, removeDeal } = useDealStore();
  const { connected } = useSocketStore();
  const [showModal, setShowModal] = useState(false);
  const [editDeal, setEditDeal] = useState(null);
  const [form, setForm] = useState({ title: '', value: '', stage: 'new', leadId: '', priority: 'medium' });
  const [leads, setLeads] = useState([]);

  useEffect(() => {
    dealsAPI.getAll().then((res) => setDeals(res.data.deals));
    
    // Import leadsAPI here since we need it
    import('../../services/api').then(({ leadsAPI }) => {
      leadsAPI.getAll().then((res) => setLeads(res.data.leads || []));
    });

    const handleAddDeal = (deal) => {
      const currentUser = JSON.parse(localStorage.getItem('user'));
      if (currentUser?.role === 'admin' || deal.assignedTo === currentUser?._id || deal.assignedTo?._id === currentUser?._id) {
        addDeal(deal);
      }
    };

    socket.on('deal:created', handleAddDeal);
    socket.on('deal:updated', updateDeal);
    socket.on('deal:deleted', (data) => removeDeal(data.id || data));

    return () => {
      socket.off('deal:created', handleAddDeal);
      socket.off('deal:updated', updateDeal);
      socket.off('deal:deleted');
    };
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const data = { ...form, value: parseFloat(form.value) };
      if (editDeal) {
        const { data: updated } = await dealsAPI.update(editDeal._id, data);
        updateDeal(updated);
      } else {
        const { data: created } = await dealsAPI.create(data);
        addDeal(created);
      }
      setShowModal(false);
      setEditDeal(null);
      setForm({ title: '', value: '', stage: 'new', leadId: '', priority: 'medium' });
    } catch (err) {
      alert(err.response?.data?.error || 'Failed');
    }
  };

  const handleEdit = (deal) => {
    setEditDeal(deal);
    setForm({ title: deal.title, value: deal.value, stage: deal.stage, leadId: deal.leadId?._id || deal.leadId, priority: deal.priority });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (confirm('Delete this deal?')) {
      await dealsAPI.delete(id);
      removeDeal(id);
    }
  };

  const handleDragEnd = async (event) => {
    const { active, over } = event;
    if (!over) return;
    
    const dealId = active.id;
    const newStage = over.id;
    const deal = active.data.current.deal;
    
    if (deal.stage !== newStage) {
      const oldDeal = { ...deal };
      updateDeal({ ...deal, stage: newStage });
      try {
        await dealsAPI.updateStage(dealId, newStage);
      } catch (err) {
        updateDeal(oldDeal);
        alert('Failed to move deal');
      }
    }
  };

  const dealsByStage = deals.reduce((acc, deal) => {
    if (!acc[deal.stage]) acc[deal.stage] = [];
    acc[deal.stage].push(deal);
    return acc;
  }, {});

  const stages = ['new', 'contacted', 'demo', 'negotiation', 'closed_won', 'closed_lost'];

  return (
    <div className="space-y-6 h-[calc(100vh-8rem)] flex flex-col">
      <div className="flex items-center justify-between flex-shrink-0">
        <div>
          <h2 className="text-2xl font-display font-bold text-white tracking-tight flex items-center gap-3">
            Deals Pipeline
            {!connected && <span className="text-[10px] bg-red-500/20 border border-red-500/30 text-red-400 px-2 py-0.5 rounded-full flex items-center gap-1"><div className="w-1.5 h-1.5 rounded-full bg-red-400"></div> Offline</span>}
          </h2>
          <p className="text-sm text-gray-400 mt-1">Manage and track your active opportunities.</p>
        </div>
        <button onClick={() => { setEditDeal(null); setForm({ title: '', value: '', stage: 'new', leadId: '', priority: 'medium' }); setShowModal(true); }} className="btn-primary px-4 py-2 flex items-center gap-2 text-sm">
          <Plus size={16} /> New Deal
        </button>
      </div>

      <DndContext collisionDetection={closestCorners} onDragEnd={handleDragEnd}>
        <div className="flex gap-6 overflow-x-auto pb-4 flex-1 custom-scrollbar">
          {stages.map((stage) => (
            <KanbanColumn 
              key={stage} 
              id={stage} 
              stage={stage} 
              deals={dealsByStage[stage] || []} 
              onEdit={handleEdit} 
              onDelete={handleDelete} 
            />
          ))}
        </div>
      </DndContext>

      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in">
          <div className="glass-panel rounded-2xl p-6 w-full max-w-md animate-slide-up border border-white/10 shadow-2xl shadow-black">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-display font-bold text-white">{editDeal ? 'Edit Deal' : 'New Deal'}</h3>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-white"><Plus size={24} className="rotate-45" /></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Deal Title</label>
                <input type="text" placeholder="e.g. Enterprise License" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="input-field px-4 py-2.5" required />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Value (INR)</label>
                  <input type="number" placeholder="500000" value={form.value} onChange={(e) => setForm({ ...form, value: e.target.value })} className="input-field px-4 py-2.5" required />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Related Lead</label>
                  <select value={form.leadId} onChange={(e) => setForm({ ...form, leadId: e.target.value })} className="input-field px-4 py-2.5 appearance-none" required>
                    <option value="" disabled className="bg-dark-bg">Select a lead...</option>
                    {leads.map(lead => (
                      <option key={lead._id} value={lead._id} className="bg-dark-bg">{lead.name} ({lead.company || 'No Company'})</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Stage</label>
                  <select value={form.stage} onChange={(e) => setForm({ ...form, stage: e.target.value })} className="input-field px-4 py-2.5 appearance-none">
                    {Object.entries(stageLabels).map(([val, label]) => <option key={val} value={val} className="bg-dark-bg">{label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Priority</label>
                  <select value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })} className="input-field px-4 py-2.5 appearance-none">
                    <option value="low" className="bg-dark-bg">Low</option>
                    <option value="medium" className="bg-dark-bg">Medium</option>
                    <option value="high" className="bg-dark-bg">High</option>
                  </select>
                </div>
              </div>
              <div className="flex gap-3 justify-end mt-8 pt-4 border-t border-white/10">
                <button type="button" onClick={() => setShowModal(false)} className="px-5 py-2.5 border border-white/10 rounded-lg text-sm font-medium hover:bg-white/5 transition-colors">Cancel</button>
                <button type="submit" className="btn-primary px-5 py-2.5 text-sm">{editDeal ? 'Save Changes' : 'Create Deal'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}