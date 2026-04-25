import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ticketsAPI } from '../../services/api';
import { ArrowLeft, User, Clock, AlertCircle } from 'lucide-react';

const statusColors = { 
  open: 'bg-blue-500/10 text-blue-400 border border-blue-500/20', 
  'in-progress': 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20', 
  resolved: 'bg-green-500/10 text-green-400 border border-green-500/20', 
  closed: 'bg-gray-500/10 text-gray-400 border border-gray-500/20' 
};

export default function TicketDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [ticket, setTicket] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    ticketsAPI.getOne(id)
      .then(res => setTicket(res.data))
      .catch(() => navigate('/support/tickets'))
      .finally(() => setLoading(false));
  }, [id, navigate]);

  const handleStatusChange = async (e) => {
    const newStatus = e.target.value;
    try {
      const { data } = await ticketsAPI.update(id, { status: newStatus });
      setTicket(data);
    } catch (err) {
      alert('Failed to update status');
    }
  };

  if (loading) return <div className="p-8 text-center text-gray-400 animate-pulse">Loading ticket...</div>;
  if (!ticket) return null;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <button onClick={() => navigate('/support/tickets')} className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors">
        <ArrowLeft size={16} /> Back to Tickets
      </button>

      <div className="glass-panel p-8 rounded-xl border border-white/10 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500/10 blur-[80px] rounded-full pointer-events-none -mr-20 -mt-20"></div>
        
        <div className="flex items-start justify-between mb-8 relative z-10">
          <div>
            <h1 className="text-2xl font-display font-bold text-white mb-2">{ticket.title}</h1>
            <div className="flex items-center gap-4 text-sm text-gray-400">
              <span className="flex items-center gap-1.5"><Clock size={14} /> Opened {new Date(ticket.createdAt).toLocaleDateString()}</span>
              <span className="flex items-center gap-1.5">
                {ticket.priority === 'urgent' && <AlertCircle size={14} className="text-red-500" />}
                Priority: <span className="font-semibold text-white capitalize">{ticket.priority}</span>
              </span>
            </div>
          </div>
          
          <div>
            <select value={ticket.status} onChange={handleStatusChange} className={`appearance-none font-bold uppercase tracking-wider text-xs px-4 py-2 rounded-lg cursor-pointer outline-none transition-colors ${statusColors[ticket.status]} focus:ring-2 focus:ring-purple-500`}>
              <option value="open" className="bg-dark-bg text-blue-400">OPEN</option>
              <option value="in-progress" className="bg-dark-bg text-yellow-400">IN PROGRESS</option>
              <option value="resolved" className="bg-dark-bg text-green-400">RESOLVED</option>
              <option value="closed" className="bg-dark-bg text-gray-400">CLOSED</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative z-10">
          <div className="col-span-2 space-y-6">
            <div>
              <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">Description</h3>
              <div className="bg-dark-surface/50 border border-white/5 p-5 rounded-xl text-gray-300 leading-relaxed whitespace-pre-wrap">
                {ticket.description}
              </div>
            </div>
            
            <TicketMessages ticketId={ticket._id} messages={ticket.messages} setTicket={setTicket} />
          </div>

          <div className="space-y-6">
            <div className="bg-dark-surface/50 border border-white/5 p-5 rounded-xl">
              <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                <User size={16} /> Customer Info
              </h3>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-purple-500/30 flex items-center justify-center text-purple-400 font-bold">
                  {ticket.customerName.charAt(0)}
                </div>
                <div>
                  <p className="font-semibold text-white">{ticket.customerName}</p>
                  <p className="text-xs text-gray-400">{ticket.customerEmail || 'No email provided'}</p>
                </div>
              </div>
              {ticket.createdBy && (
                <div className="border-t border-white/10 pt-4 mt-4">
                  <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">Requested By (Sales)</p>
                  <p className="text-sm font-medium text-blue-400">{ticket.createdBy.name}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function TicketMessages({ ticketId, messages, setTicket }) {
  const [content, setContent] = useState('');
  const [sending, setSending] = useState(false);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!content.trim()) return;
    setSending(true);
    try {
      const res = await fetch(`http://localhost:5001/api/tickets/${ticketId}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ content })
      });
      if (res.ok) {
        const updatedTicket = await res.json();
        setTicket(updatedTicket);
        setContent('');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="mt-8 border-t border-white/10 pt-8">
      <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-6">Conversation Thread</h3>
      
      <div className="space-y-4 mb-6 max-h-[400px] overflow-y-auto custom-scrollbar pr-2">
        {(!messages || messages.length === 0) && (
          <p className="text-sm text-gray-500 italic text-center py-4">No messages yet. Reply below to start the conversation.</p>
        )}
        {messages?.map(msg => (
          <div key={msg._id} className="bg-dark-bg border border-white/5 p-4 rounded-xl">
            <div className="flex justify-between items-start mb-2">
              <div className="flex items-center gap-2">
                <span className={`font-semibold text-sm ${msg.sender?.role === 'support' || msg.sender?.role === 'admin' ? 'text-green-400' : 'text-blue-400'}`}>
                  {msg.sender?.name || 'Unknown'}
                </span>
                <span className="text-[10px] uppercase tracking-wider text-gray-500 bg-white/5 px-2 py-0.5 rounded">
                  {msg.sender?.role || 'user'}
                </span>
              </div>
              <span className="text-xs text-gray-500">{new Date(msg.createdAt).toLocaleString()}</span>
            </div>
            <p className="text-sm text-gray-300 whitespace-pre-wrap">{msg.content}</p>
          </div>
        ))}
      </div>

      <form onSubmit={handleSend} className="relative">
        <textarea 
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Type your reply..."
          className="w-full bg-dark-bg border border-white/10 rounded-xl pl-4 pr-24 py-3 text-sm text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-purple-500 min-h-[100px] resize-y"
        />
        <button 
          type="submit" 
          disabled={sending || !content.trim()}
          className="absolute bottom-3 right-3 px-4 py-1.5 bg-purple-600 hover:bg-purple-500 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
        >
          {sending ? 'Sending...' : 'Reply'}
        </button>
      </form>
    </div>
  );
}
