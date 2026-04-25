import { useState, useEffect, useRef } from 'react';
import { messagesAPI, authAPI } from '../services/api';
import { useAuthStore } from '../store';
import socket from '../socket';
import { Send, Hash, Users, Activity, MessageCircle } from 'lucide-react';

export default function Chat() {
  const { user } = useAuthStore();
  const [channels, setChannels] = useState([]);
  const [activeChannel, setActiveChannel] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    fetchChannels();
  }, []);

  useEffect(() => {
    if (activeChannel) {
      fetchMessages(activeChannel._id);
      socket.emit('join:channel', activeChannel._id);
    }
    return () => {
      if (activeChannel) socket.emit('leave:channel', activeChannel._id);
    };
  }, [activeChannel]);

  useEffect(() => {
    const handleReceiveMessage = (msg) => {
      if (activeChannel && msg.channelId === activeChannel._id) {
        setMessages(prev => [...prev, msg]);
      }
    };

    socket.on('message:received', handleReceiveMessage);
    return () => {
      socket.off('message:received', handleReceiveMessage);
    };
  }, [activeChannel]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const fetchChannels = async () => {
    try {
      const { data } = await messagesAPI.getChannels();
      setChannels(data);
      if (data.length > 0 && !activeChannel) {
        setActiveChannel(data[0]);
      }
    } catch (err) {
      console.error('Failed to fetch channels', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async (channelId) => {
    try {
      const { data } = await messagesAPI.getMessages({ channelId, limit: 100 });
      setMessages(data.messages);
    } catch (err) {
      console.error('Failed to fetch messages', err);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !activeChannel) return;

    const content = newMessage;
    setNewMessage(''); // optimistic clear
    try {
      await messagesAPI.send({ channelId: activeChannel._id, content, isDirect: false });
      // The socket event will append it to the list
    } catch (err) {
      console.error('Failed to send message', err);
      setNewMessage(content); // revert if failed
    }
  };

  if (loading) return <div className="p-8 text-center text-gray-400">Loading chat...</div>;

  return (
    <div className="flex h-[calc(100vh-8rem)] gap-6">
      {/* Channels Sidebar */}
      <div className="w-64 flex-shrink-0 flex flex-col gap-2">
        <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 px-2">Channels</h3>
        {channels.map(channel => (
          <button
            key={channel._id}
            onClick={() => setActiveChannel(channel)}
            className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
              activeChannel?._id === channel._id 
                ? 'bg-blue-600/20 text-blue-400 font-medium' 
                : 'text-gray-400 hover:bg-white/5 hover:text-gray-300'
            }`}
          >
            <Hash size={16} />
            {channel.name}
          </button>
        ))}
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 glass-panel rounded-xl flex flex-col overflow-hidden border border-white/10">
        {activeChannel ? (
          <>
            <div className="px-6 py-4 border-b border-white/10 bg-dark-surface/50">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Hash size={20} className="text-blue-400" />
                {activeChannel.name}
              </h2>
              <p className="text-xs text-gray-400 mt-1">{activeChannel.description}</p>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
              {messages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-gray-500">
                  <MessageCircle size={48} className="mb-4 opacity-20" />
                  <p>No messages yet. Start the conversation!</p>
                </div>
              ) : (
                messages.map((msg, idx) => {
                  const isMe = msg.senderId?._id === user._id;
                  const showHeader = idx === 0 || messages[idx-1].senderId?._id !== msg.senderId?._id;
                  
                  return (
                    <div key={msg._id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                      {showHeader && (
                        <div className="flex items-baseline gap-2 mb-1 px-1">
                          <span className={`text-xs font-semibold ${isMe ? 'text-blue-400' : 'text-gray-300'}`}>
                            {isMe ? 'You' : msg.senderId?.name}
                          </span>
                          <span className="text-[10px] text-gray-500">
                            {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      )}
                      <div className={`px-4 py-2 rounded-2xl max-w-[75%] ${
                        isMe 
                          ? 'bg-blue-600 text-white rounded-tr-sm' 
                          : 'bg-dark-surface border border-white/10 text-gray-200 rounded-tl-sm'
                      }`}>
                        {msg.content}
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            <div className="p-4 bg-dark-surface/50 border-t border-white/10">
              <form onSubmit={handleSendMessage} className="relative">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder={`Message #${activeChannel.name}...`}
                  className="w-full bg-dark-bg border border-white/10 rounded-xl pl-4 pr-12 py-3 text-sm text-white focus:outline-none focus:border-blue-500/50 transition-colors"
                />
                <button 
                  type="submit"
                  disabled={!newMessage.trim()}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 bg-blue-600 text-white rounded-lg disabled:opacity-50 hover:bg-blue-500 transition-colors"
                >
                  <Send size={16} />
                </button>
              </form>
            </div>
          </>
        ) : (
          <div className="h-full flex items-center justify-center text-gray-500">
            Select a channel to start chatting
          </div>
        )}
      </div>
    </div>
  );
}
