import { create } from 'zustand';

export const useAuthStore = create((set) => ({
  user: JSON.parse(localStorage.getItem('user') || 'null'),
  token: localStorage.getItem('token') || null,
  isAuthenticated: !!localStorage.getItem('token'),

  login: (user, token) => {
    localStorage.setItem('user', JSON.stringify(user));
    localStorage.setItem('token', token);
    set({ user, token, isAuthenticated: true });
  },

  logout: () => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    set({ user: null, token: null, isAuthenticated: false });
  },
}));

export const useLeadStore = create((set, get) => ({
  leads: [],
  loading: false,
  setLeads: (leads) => set({ leads }),
  addLead: (lead) => set((state) => ({ 
    leads: state.leads.some(l => l._id === lead._id) ? state.leads : [lead, ...state.leads] 
  })),
  updateLead: (lead) => set((state) => ({
    leads: state.leads.map((l) => l._id === lead._id ? lead : l),
  })),
  removeLead: (id) => set((state) => ({ leads: state.leads.filter((l) => l._id !== id) })),
}));

export const useDealStore = create((set) => ({
  deals: [],
  loading: false,
  setDeals: (deals) => set({ deals }),
  addDeal: (deal) => set((state) => ({ 
    deals: state.deals.some(d => d._id === deal._id) ? state.deals : [deal, ...state.deals] 
  })),
  updateDeal: (deal) => set((state) => ({
    deals: state.deals.map((d) => d._id === deal._id ? deal : d),
  })),
  removeDeal: (id) => set((state) => ({ deals: state.deals.filter((d) => d._id !== id) })),
}));

export const useNotificationStore = create((set) => ({
  notifications: [],
  unreadCount: 0,
  setNotifications: (notifications, unreadCount) => set({ notifications, unreadCount }),
  addNotification: (notification) => set((state) => ({
    notifications: [notification, ...state.notifications],
    unreadCount: state.unreadCount + 1,
  })),
  markAllRead: () => set((state) => ({
    notifications: state.notifications.map((n) => ({ ...n, read: true })),
    unreadCount: 0,
  })),
}));

export const useSocketStore = create((set) => ({
  connected: false,
  setConnected: (connected) => set({ connected }),
}));