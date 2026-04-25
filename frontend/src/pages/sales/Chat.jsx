import { useEffect, useState, useRef } from 'react';
import { messagesAPI, authAPI } from '../../services/api';
import socket, { joinChannel, leaveChannel, startTyping, stopTyping } from '../../socket';
import { useAuthStore } from '../../store';
import { Send, Hash, Plus, X, Users } from 'lucide-react';

export default function Chat() {
  const { user } = useAuthStore();
  const [channels, setChannels] = useState([]);
  const [messages, setMessages] = useState([]);
  const [selectedChannel, setSelectedChannel] = useState(null);
  const [content, setContent] = useState('');
  const [showNewChannel, setShowNewChannel] = useState(false);
  const [newChannelName, setNewChannelName] = useState('');
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesAPI.getChannels().then((res) => setChannels(res.data));

    socket.on('message:received', (msg) => {
      setMessages((prev) => [...prev, msg]);
    });

    return () => socket.off('message:received');
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (selectedChannel) {
      joinChannel(selectedChannel._id);
      messagesAPI.getMessages({ channelId: selectedChannel._id }).then((res) => setMessages(res.data.messages));

      return () => leaveChannel(selectedChannel._id);
    }
  }, [selectedChannel]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!content.trim()) return;

    try {
      await messagesAPI.send({
        channelId: selectedChannel._id,
        content,
        isDirect: false,
      });
      setContent('');
    } catch (err) {
      alert('Failed to send message');
    }
  };

  const handleCreateChannel = async (e) => {
    e.preventDefault();
    if (!newChannelName.trim()) return;

    try {
      const { data } = await messagesAPI.createChannel({ name: newChannelName, type: 'public' });
      setChannels((prev) => [...prev, data]);
      setNewChannelName('');
      setShowNewChannel(false);
      setSelectedChannel(data);
    } catch (err) {
      alert('Failed to create channel');
    }
  };

  return (
    <div className="h-[calc(100vh-8rem)] glass-panel rounded-xl overflow-hidden flex border border-white/10 shadow-2xl">
      <div className="w-72 border-r border-white/10 bg-dark-surface/50 backdrop-blur-md flex flex-col relative z-10">
        <div className="p-5 border-b border-white/10 flex items-center justify-between">
          <h3 className="font-display font-bold text-white flex items-center gap-2">
            <Users size={18} className="text-blue-400" /> Team Chat
          </h3>
          <button onClick={() => setShowNewChannel(true)} className="p-1.5 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white transition-colors" title="New Channel">
            <Plus size={18} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-3 space-y-1 custom-scrollbar">
          <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2 px-3 pt-2">Channels</p>
          {channels.map((channel) => (
            <button
              key={channel._id}
              onClick={() => setSelectedChannel(channel)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-all duration-200 group ${selectedChannel?._id === channel._id ? 'bg-blue-600/20 text-blue-400' : 'text-gray-400 hover:bg-white/5 hover:text-gray-200'}`}
            >
              <Hash size={16} className={`transition-transform group-hover:scale-110 ${selectedChannel?._id === channel._id ? 'text-blue-400' : 'text-gray-500'}`} />
              <span className="font-medium text-sm truncate">{channel.name}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 flex flex-col bg-[#0f131a]/80 backdrop-blur-sm relative">
        {selectedChannel ? (
          <>
            <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between bg-dark-surface/50 backdrop-blur-md z-10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
                  <Hash size={20} />
                </div>
                <div>
                  <h3 className="font-display font-bold text-white">{selectedChannel.name}</h3>
                  <p className="text-xs text-gray-400">Team conversation</p>
                </div>
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
              {messages.map((msg, idx) => {
                const isMe = msg.senderId?._id === user._id;
                const showAvatar = idx === 0 || messages[idx-1].senderId?._id !== msg.senderId?._id;
                
                return (
                  <div key={msg._id} className={`flex gap-4 ${isMe ? 'flex-row-reverse' : ''}`}>
                    {showAvatar ? (
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 border ${isMe ? 'bg-blue-600/20 text-blue-400 border-blue-500/30' : 'bg-purple-600/20 text-purple-400 border-purple-500/30'}`}>
                        {msg.senderId?.name?.charAt(0).toUpperCase() || '?'}
                      </div>
                    ) : (
                      <div className="w-10 flex-shrink-0"></div>
                    )}
                    
                    <div className={`flex flex-col max-w-[70%] ${isMe ? 'items-end' : 'items-start'}`}>
                      {showAvatar && (
                        <div className="flex items-baseline gap-2 mb-1 px-1">
                          <span className={`text-sm font-bold ${isMe ? 'text-blue-400' : 'text-purple-400'}`}>{isMe ? 'You' : msg.senderId?.name || 'Unknown'}</span>
                          <span className="text-[10px] text-gray-500 font-mono">{new Date(msg.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                        </div>
                      )}
                      <div className={`px-4 py-2.5 rounded-2xl text-sm ${isMe ? 'bg-blue-600 text-white rounded-tr-sm shadow-md shadow-blue-900/20' : 'bg-dark-surface border border-white/5 text-gray-200 rounded-tl-sm'}`}>
                        {msg.content}
                      </div>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} className="h-4" />
            </div>
            
            <div className="p-5 border-t border-white/10 bg-dark-surface/50 backdrop-blur-md">
              <form onSubmit={handleSend} className="relative flex items-center">
                <input
                  type="text"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  onKeyDown={() => startTyping(selectedChannel._id)}
                  onBlur={() => stopTyping(selectedChannel._id)}
                  placeholder={`Message #${selectedChannel.name}...`}
                  className="w-full pl-4 pr-14 py-3.5 bg-dark-bg border border-white/10 rounded-xl text-white placeholder-gray-500 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all shadow-inner"
                />
                <button 
                  type="submit" 
                  disabled={!content.trim()}
                  className="absolute right-2 p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-500 disabled:opacity-50 disabled:hover:bg-blue-600 transition-colors"
                >
                  <Send size={18} className={content.trim() ? "translate-x-0.5 -translate-y-0.5 transition-transform" : ""} />
                </button>
              </form>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
            <div className="w-20 h-20 rounded-full bg-dark-surface border border-white/5 flex items-center justify-center mb-4 text-gray-600">
              <Hash size={40} />
            </div>
            <h3 className="text-xl font-display font-bold text-white mb-2">Select a Channel</h3>
            <p className="text-gray-500 max-w-sm">Choose an existing channel from the sidebar or create a new one to start chatting with your team.</p>
          </div>
        )}
      </div>

      {showNewChannel && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in">
          <div className="glass-panel rounded-2xl p-6 w-full max-w-sm animate-slide-up border border-white/10 shadow-2xl shadow-black">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-display font-bold text-white">New Channel</h3>
              <button onClick={() => setShowNewChannel(false)} className="text-gray-400 hover:text-white"><X size={20} /></button>
            </div>
            <form onSubmit={handleCreateChannel}>
              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Channel Name</label>
                <div className="relative">
                  <Hash className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
                  <input type="text" value={newChannelName} onChange={(e) => setNewChannelName(e.target.value)} placeholder="e.g. sales-team" className="input-field pl-9 pr-4 py-2.5 mb-6" required autoFocus />
                </div>
              </div>
              <div className="flex gap-3 justify-end pt-4 border-t border-white/10">
                <button type="button" onClick={() => setShowNewChannel(false)} className="px-5 py-2.5 border border-white/10 rounded-lg text-sm font-medium hover:bg-white/5 transition-colors text-white">Cancel</button>
                <button type="submit" className="btn-primary px-5 py-2.5 text-sm">Create Channel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}