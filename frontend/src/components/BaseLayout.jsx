import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { Bell, LogOut, Activity, Search } from 'lucide-react';
import { useAuthStore, useNotificationStore, useSocketStore } from '../store';
import socket from '../socket';
import { useEffect, useState } from 'react';
import { notificationsAPI } from '../services/api';

export default function BaseLayout({ navItems }) {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const { notifications = [], unreadCount, setNotifications } = useNotificationStore();
  const { connected, setConnected } = useSocketStore();

  useEffect(() => {
    socket.connect();
    socket.on('connect', () => setConnected(true));
    socket.on('disconnect', () => setConnected(false));

    notificationsAPI.getAll().then((res) => setNotifications(res.data.notifications, res.data.unreadCount));

    return () => socket.disconnect();
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleNotificationClick = async (notification) => {
    try {
      if (!notification.read) {
        await notificationsAPI.markAsRead(notification._id);
        const res = await notificationsAPI.getAll();
        setNotifications(res.data.notifications, res.data.unreadCount);
      }
      setShowNotifications(false);
      if (notification.link) navigate(notification.link);
    } catch (error) {
      console.error(error);
    }
  };

  const [showNotifications, setShowNotifications] = useState(false);

  return (
    <div className="flex h-screen bg-dark-bg text-gray-300">
      {/* Sidebar */}
      <aside className="sidebar w-64 flex flex-col z-20">
        <div className="p-6 border-b border-white/5 flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center shadow-lg shadow-blue-500/20">
            <Activity size={18} className="text-white" />
          </div>
          <div>
            <h1 className="text-lg font-display font-bold text-white tracking-tight">NexCRM</h1>
            <p className="text-[10px] uppercase tracking-wider text-blue-400 font-semibold">{user?.role}</p>
          </div>
        </div>
        
        <div className="px-4 py-6">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 px-3">Main Menu</p>
          <nav className="space-y-1">
            {navItems.map(({ to, icon: Icon, label }) => (
              <NavLink
                key={to}
                to={to}
                end={to === '/'}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group font-medium text-sm
                  ${isActive 
                    ? 'bg-blue-600/10 text-blue-400' 
                    : 'text-gray-400 hover:bg-white/5 hover:text-gray-200'
                  }`
                }
              >
                <Icon size={18} className="transition-transform group-hover:scale-110" />
                <span>{label}</span>
              </NavLink>
            ))}
          </nav>
        </div>

        <div className="mt-auto p-4 border-t border-white/5">
          <div className="glass-panel rounded-xl p-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-purple-500 to-blue-500 p-[2px]">
                <div className="w-full h-full rounded-full bg-dark-surface flex items-center justify-center text-sm font-bold text-white">
                  {user?.name?.charAt(0)}
                </div>
              </div>
              <div>
                <p className="text-sm font-semibold text-white leading-none mb-1">{user?.name}</p>
                <div className="flex items-center gap-1.5">
                  <span className={`w-1.5 h-1.5 rounded-full ${connected ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]' : 'bg-red-500'}`}></span>
                  <span className="text-[10px] text-gray-400">{connected ? 'Online' : 'Offline'}</span>
                </div>
              </div>
            </div>
            <button onClick={handleLogout} className="p-2 text-gray-400 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors" title="Logout">
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        {/* Top Header */}
        <header className="h-16 border-b border-white/5 bg-dark-surface/50 backdrop-blur-md flex items-center justify-between px-8 sticky top-0 z-10">
          <div className="flex items-center gap-4">
            <div className="relative group hidden md:block">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
              <input 
                type="text" 
                placeholder="Search anything..." 
                className="bg-dark-bg border border-white/5 rounded-full pl-9 pr-4 py-1.5 text-sm w-64 focus:w-80 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all duration-300 text-white"
              />
            </div>
          </div>
          <div className="flex items-center gap-4 relative">
            <button 
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative p-2 text-gray-400 hover:text-white transition-colors bg-dark-bg border border-white/5 rounded-full hover:border-white/20"
            >
              <Bell size={18} />
              {unreadCount > 0 && (
                <span className="absolute 0 right-0 bg-red-500 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center border border-dark-bg animate-pulse">
                  {unreadCount}
                </span>
              )}
            </button>
            
            {showNotifications && (
              <div className="absolute top-12 right-0 w-80 bg-dark-surface border border-white/10 rounded-xl shadow-2xl z-50 overflow-hidden animate-fade-in">
                <div className="p-4 border-b border-white/10 flex items-center justify-between bg-dark-bg">
                  <h3 className="font-semibold text-white">Notifications</h3>
                  <button className="text-xs text-blue-400 hover:text-blue-300">Mark all read</button>
                </div>
                <div className="max-h-96 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <div className="p-4 text-center text-sm text-gray-500">No notifications yet.</div>
                  ) : (
                    notifications.map(n => (
                      <div 
                        key={n._id}
                        onClick={() => handleNotificationClick(n)}
                        className={`p-4 text-sm border-b border-white/5 hover:bg-white/5 transition-colors cursor-pointer ${!n.read ? 'bg-blue-500/5' : ''}`}
                      >
                        <p className={`font-medium mb-1 ${!n.read ? 'text-blue-400' : 'text-gray-300'}`}>{n.title}</p>
                        <p className="text-xs text-gray-400">{n.message}</p>
                        <p className="text-[10px] text-gray-500 mt-2">{new Date(n.createdAt).toLocaleDateString()} {new Date(n.createdAt).toLocaleTimeString()}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        </header>

        {/* Page Content */}
        <div className="flex-1 overflow-auto p-8 animate-fade-in relative z-0">
          <div className="max-w-7xl mx-auto">
            <Outlet />
          </div>
        </div>
      </main>
    </div>
  );
}