import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { jsPDF } from 'jspdf';
import { leadsAPI } from '../../services/api';
import { ArrowLeft, User, Building, Mail, Phone, Calendar, Briefcase, FileText, Loader2, CheckCircle, Save, Download, Send, Sparkles } from 'lucide-react';

const statusColors = {
  new: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  contacted: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
  qualified: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
  converted: 'bg-green-500/10 text-green-400 border-green-500/20',
  lost: 'bg-red-500/10 text-red-400 border-red-500/20'
};

export default function LeadDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [lead, setLead] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Editable fields
  const [status, setStatus] = useState('');
  const [newNote, setNewNote] = useState('');
  const [addingNote, setAddingNote] = useState(false);

  const [showSupportModal, setShowSupportModal] = useState(false);
  const [supportIssue, setSupportIssue] = useState('');
  const [supportCreating, setSupportCreating] = useState(false);

  const handleAddNote = async () => {
    if (!newNote.trim()) return;
    setAddingNote(true);
    try {
      const res = await leadsAPI.addNote(id, { text: newNote });
      setLead(res.data);
      setNewNote('');
    } catch (err) {
      console.error(err);
      alert('Failed to add note');
    } finally {
      setAddingNote(false);
    }
  };

  const handleEnhanceNote = async () => {
    if (!newNote.trim()) return;
    try {
      const res = await fetch('http://localhost:8000/ai/enhance-note', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: newNote })
      });
      const data = await res.json();
      if (data.enhanced_text) setNewNote(data.enhanced_text);
    } catch (e) {
      console.error('Failed to enhance note', e);
    }
  };

  const downloadNotesPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(20);
    doc.text(`Lead Notes: ${lead.name}`, 10, 15);
    doc.setFontSize(10);
    doc.text(`Company: ${lead.company || 'N/A'} | Export Date: ${new Date().toLocaleString()}`, 10, 22);
    doc.line(10, 25, 200, 25);
    
    let y = 35;
    const history = [...(lead.noteHistory || [])].reverse();
    
    if (history.length === 0) {
      doc.text("No notes recorded.", 10, y);
    } else {
      history.forEach((note, index) => {
        const date = new Date(note.createdAt).toLocaleString();
        const author = note.author?.name || 'Unknown User';
        
        doc.setFont("helvetica", "bold");
        doc.text(`Note #${history.length - index} - ${date} (${author})`, 10, y);
        doc.setFont("helvetica", "normal");
        y += 6;
        
        const splitText = doc.splitTextToSize(note.text, 180);
        doc.text(splitText, 15, y);
        y += (splitText.length * 6) + 10;
        
        if (y > 270) {
          doc.addPage();
          y = 20;
        }
      });
    }
    
    doc.save(`${lead.name.replace(/\s+/g, '_')}_Notes.pdf`);
  };

  const handleCreateSupportTicket = async (e) => {
    e.preventDefault();
    setSupportCreating(true);
    try {
      await fetch('http://localhost:5001/api/tickets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          title: 'Help Needed: ' + lead.name,
          description: supportIssue,
          customerName: lead.name,
          customerEmail: lead.email,
          priority: 'medium',
          leadId: lead._id
        })
      });
      setShowSupportModal(false);
      setSupportIssue('');
      alert('Support request submitted successfully!');
    } catch (err) {
      alert('Failed to submit support request.');
    } finally {
      setSupportCreating(false);
    }
  };

  useEffect(() => {
    leadsAPI.getOne(id)
      .then(res => {
        setLead(res.data);
        setStatus(res.data.status);
      })
      .catch(err => {
        console.error(err);
        navigate('/sales/leads');
      })
      .finally(() => setLoading(false));
  }, [id, navigate]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await leadsAPI.update(id, { status });
      setLead(res.data);
    } catch (error) {
      console.error(error);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return (
    <div className="flex-1 flex items-center justify-center">
      <Loader2 size={32} className="animate-spin text-blue-500" />
    </div>
  );

  if (!lead) return null;

  return (
    <div className="flex-1 overflow-y-auto p-8 animate-fade-in">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => navigate('/sales/leads')}
              className="p-2 hover:bg-white/5 rounded-lg text-gray-400 hover:text-white transition-colors"
            >
              <ArrowLeft size={20} />
            </button>
            <div>
              <h1 className="text-2xl font-display font-bold text-white tracking-tight flex items-center gap-3">
                {lead.name}
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium border uppercase tracking-wider ${statusColors[lead.status]}`}>
                  {lead.status}
                </span>
                {lead.priority === 'HIGH' && <span className="text-xs bg-red-500/20 text-red-400 px-2 py-1 rounded-full border border-red-500/30">🔥 High Priority</span>}
                {lead.isDuplicate && <span className="text-xs bg-orange-500/20 text-orange-400 px-2 py-1 rounded-full border border-orange-500/30">⚠️ Duplicate</span>}
              </h1>
              <p className="text-sm text-gray-400 mt-1">Added {new Date(lead.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button 
              onClick={downloadNotesPDF}
              className="px-4 py-2 bg-indigo-500 hover:bg-indigo-400 text-white text-sm font-medium rounded-lg transition-colors flex items-center gap-2 shadow-lg shadow-indigo-500/20"
            >
              <Download size={16} />
              Download Notes
            </button>
            <button 
              onClick={() => setShowSupportModal(true)}
              className="px-4 py-2 bg-dark-surface hover:bg-white/5 border border-white/10 text-white text-sm font-medium rounded-lg transition-colors"
            >
              Request Support
            </button>
            <button 
              onClick={handleSave}
              disabled={saving}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50"
            >
              {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
              Save Changes
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Info */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-dark-surface border border-white/5 rounded-xl p-6 shadow-xl">
              <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-6">Contact Information</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-blue-500/10 rounded-lg text-blue-400 mt-1">
                    <User size={16} />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Full Name</p>
                    <p className="text-sm font-medium text-gray-200">{lead.name}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-purple-500/10 rounded-lg text-purple-400 mt-1">
                    <Mail size={16} />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Email Address</p>
                    <a href={`mailto:${lead.email}`} className="text-sm font-medium text-blue-400 hover:underline">{lead.email}</a>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-green-500/10 rounded-lg text-green-400 mt-1">
                    <Phone size={16} />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Phone Number</p>
                    <p className="text-sm font-medium text-gray-200">{lead.phone || 'N/A'}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-yellow-500/10 rounded-lg text-yellow-400 mt-1">
                    <Building size={16} />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Company</p>
                    <p className="text-sm font-medium text-gray-200">{lead.company || 'N/A'}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Note History Section */}
            <div className="bg-dark-surface border border-white/5 rounded-xl p-6 shadow-xl">
              <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-6">Note History</h3>
              <div className="space-y-4 max-h-[500px] overflow-y-auto custom-scrollbar pr-2">
                {lead.noteHistory && lead.noteHistory.length > 0 ? (
                  [...(lead.noteHistory)].reverse().map((note, idx) => (
                    <div key={idx} className="bg-dark-bg/40 border border-white/5 rounded-xl p-5 group hover:border-white/10 transition-colors">
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex items-center gap-3">
                          <div className="w-6 h-6 rounded-full bg-indigo-500/20 flex items-center justify-center text-[10px] font-bold text-indigo-400">
                            {note.author?.name?.charAt(0) || 'U'}
                          </div>
                          <span className="text-xs font-semibold text-gray-300">{note.author?.name || 'Unknown'}</span>
                        </div>
                        <span className="text-[10px] text-gray-500 font-mono">{new Date(note.createdAt).toLocaleString()}</span>
                      </div>
                      <p className="text-sm text-gray-400 whitespace-pre-wrap leading-relaxed">{note.text}</p>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 border-2 border-dashed border-white/5 rounded-2xl">
                    <p className="text-sm text-gray-500 italic">No historical notes found.</p>
                  </div>
                )}
              </div>
            </div>

            {(lead.interest || lead.message) && (
              <div className="bg-dark-surface border border-white/5 rounded-xl p-6 shadow-xl">
                <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-6">Demo Request Details</h3>
                <div className="space-y-6">
                  {lead.interest && (
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-indigo-500/10 rounded-lg text-indigo-400 mt-1">
                        <Briefcase size={16} />
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Area of Interest</p>
                        <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-white/5 text-gray-300 border border-white/10">
                          {lead.interest}
                        </span>
                      </div>
                    </div>
                  )}
                  {lead.message && (
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-pink-500/10 rounded-lg text-pink-400 mt-1">
                        <FileText size={16} />
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Message</p>
                        <p className="text-sm text-gray-300 bg-dark-bg p-4 rounded-lg border border-white/5 leading-relaxed">
                          {lead.message}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <div className="bg-dark-surface border border-white/5 rounded-xl p-6 shadow-xl">
              <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">Lead Status</h3>
              <select 
                value={status}
                onChange={e => setStatus(e.target.value)}
                className="w-full bg-dark-bg border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="new">New</option>
                <option value="contacted">Contacted</option>
                <option value="qualified">Qualified</option>
                <option value="converted">Converted</option>
                <option value="lost">Lost</option>
              </select>
            </div>

            <div className="bg-dark-surface border border-white/5 rounded-xl p-6 shadow-xl relative overflow-hidden">
              <div className="absolute top-0 right-0 p-2 opacity-10">
                <Sparkles size={48} className="text-indigo-400" />
              </div>
              
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">Add New Note</h3>
                <button 
                  onClick={handleEnhanceNote}
                  title="Fix grammar, typos, and improve vocabulary"
                  className="text-[10px] flex items-center gap-1.5 bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500/20 px-2 py-0.5 rounded border border-indigo-500/20 transition-all font-bold"
                >
                  <Sparkles size={10} />
                  AI ENHANCE
                </button>
              </div>
              
              <textarea 
                value={newNote}
                onChange={e => setNewNote(e.target.value)}
                placeholder="Type a new update..."
                className="w-full bg-dark-bg border border-white/10 rounded-lg px-4 py-3 text-sm text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[120px] resize-none mb-4"
              ></textarea>
              
              <button 
                onClick={handleAddNote}
                disabled={addingNote || !newNote.trim()}
                className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-lg flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed uppercase tracking-widest"
              >
                {addingNote ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                Add Note to History
              </button>

              {lead.aiSummary && (
                <div className="mt-6 p-4 bg-blue-500/5 border border-blue-500/10 rounded-xl">
                  <h4 className="text-[10px] font-bold text-blue-400 mb-2 uppercase tracking-widest flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse"></div>
                    Latest AI Insight
                  </h4>
                  <p className="text-xs text-blue-100/80 italic leading-relaxed">{lead.aiSummary}</p>
                </div>
              )}
            </div>
            
            <div className="bg-dark-surface border border-white/5 rounded-xl p-6 shadow-xl">
              <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">Follow-up Schedule</h3>
              <input 
                type="date"
                value={lead.followUpDate ? new Date(lead.followUpDate).toISOString().split('T')[0] : ''}
                onChange={async (e) => {
                  try {
                    const res = await leadsAPI.update(id, { followUpDate: e.target.value });
                    setLead(res.data);
                  } catch (err) {
                    alert('Failed to schedule follow-up');
                  }
                }}
                className="w-full bg-dark-bg border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-xs text-gray-500 mt-2">Required when marked as Contacted.</p>
            </div>

            {lead.assignedTo && (
              <div className="bg-dark-surface border border-white/5 rounded-xl p-6 shadow-xl">
                <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">Assignment</h3>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-500 to-purple-500 flex items-center justify-center text-xs font-bold text-white shadow-lg">
                    {lead.assignedTo.name?.charAt(0) || 'U'}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-200">{lead.assignedTo.name || 'Unknown User'}</p>
                    <p className="text-xs text-gray-500">Sales Representative</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Activity Timeline */}
        <div className="mt-6 bg-dark-surface border border-white/5 rounded-xl p-6 shadow-xl">
          <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-6">Activity Timeline</h3>
          <div className="space-y-4">
            <ActivityTimeline leadId={id} />
          </div>
        </div>
      </div>

      {showSupportModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-dark-surface border border-white/10 rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <h3 className="text-xl font-bold text-white mb-6">Request Support Help</h3>
            <form onSubmit={handleCreateSupportTicket} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Describe the Issue</label>
                <textarea 
                  value={supportIssue} 
                  onChange={(e) => setSupportIssue(e.target.value)} 
                  className="w-full bg-dark-bg border border-white/10 rounded-lg px-4 py-3 text-sm text-white min-h-[120px] resize-y" 
                  required 
                  placeholder="What do you need help with regarding this lead?"
                />
              </div>
              <div className="flex gap-3 justify-end mt-8 pt-4 border-t border-white/10">
                <button type="button" onClick={() => setShowSupportModal(false)} className="px-4 py-2 text-sm text-gray-400 hover:text-white transition-colors">Cancel</button>
                <button type="submit" disabled={supportCreating} className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50">
                  {supportCreating ? 'Submitting...' : 'Submit Request'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function ActivityTimeline({ leadId }) {
  const [activities, setActivities] = useState([]);
  
  useEffect(() => {
    fetch(`/api/leads/${leadId}/activities`, {
      headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
    })
    .then(res => res.json())
    .then(data => setActivities(data))
    .catch(console.error);
  }, [leadId]);

  if (activities.length === 0) {
    return <p className="text-sm text-gray-500 italic">No activities recorded yet.</p>;
  }

  return (
    <div className="relative border-l border-white/10 ml-3 space-y-6">
      {activities.map(activity => (
        <div key={activity._id} className="relative pl-6">
          <div className="absolute w-3 h-3 bg-blue-500 rounded-full -left-[1.5px] top-1.5 ring-4 ring-dark-surface"></div>
          <div className="bg-dark-bg p-3 rounded-lg border border-white/5">
            <div className="flex justify-between items-start mb-1">
              <span className="text-xs font-bold text-blue-400">{activity.actionType}</span>
              <span className="text-[10px] text-gray-500">{new Date(activity.createdAt).toLocaleString()}</span>
            </div>
            <p className="text-sm text-gray-300">{activity.description}</p>
            <p className="text-[10px] text-gray-500 mt-2 uppercase">By: {activity.userId?.name || 'System'}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
