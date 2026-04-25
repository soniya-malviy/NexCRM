import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store';
import Login from './pages/Login';
import RoleBasedRoute from './components/RoleBasedRoute';

// Layouts
import AdminLayout from './components/layouts/AdminLayout';
import SalesLayout from './components/layouts/SalesLayout';
import SupportLayout from './components/layouts/SupportLayout';

// Admin Pages
import AdminDashboard from './pages/admin/Dashboard';
import UserManagement from './pages/admin/UserManagement';
import AdminLeads from './pages/admin/AdminLeads';
import Reports from './pages/admin/Reports';
import Settings from './pages/admin/Settings';

// Sales Pages
import SalesDashboard from './pages/sales/Dashboard';
import Leads from './pages/sales/Leads';
import LeadDetail from './pages/sales/LeadDetail';
import Deals from './pages/sales/Deals';
import SupportTickets from './pages/sales/SupportTickets';
import SupportTicketDetail from './pages/sales/SupportTicketDetail';

// Support Pages
import Tickets from './pages/support/Tickets';
import TicketDetail from './pages/support/TicketDetail';
import SupportChat from './pages/support/Chat';

import Chat from './pages/Chat';

// Public Pages
import LandingPage from './pages/public/LandingPage';

function RootRedirect() {
  const { user, isAuthenticated } = useAuthStore();
  if (!isAuthenticated) return <Navigate to="/demo" replace />;
  if (user?.role === 'admin') return <Navigate to="/admin/dashboard" replace />;
  if (user?.role === 'sales') return <Navigate to="/sales/dashboard" replace />;
  if (user?.role === 'support') return <Navigate to="/support/tickets" replace />;
  return <Navigate to="/login" replace />;
}

import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught an error", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '20px', color: 'red', backgroundColor: '#fee' }}>
          <h1>Something went wrong.</h1>
          <pre>{this.state.error?.toString()}</pre>
          <pre>{this.state.error?.stack}</pre>
        </div>
      );
    }
    return this.props.children;
  }
}

function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/demo" element={<LandingPage />} />
        <Route path="/" element={<RootRedirect />} />

        {/* Admin Routes */}
        <Route path="/admin" element={<RoleBasedRoute allowedRoles={['admin']} />}>
          <Route element={<AdminLayout />}>
            <Route path="dashboard" element={<AdminDashboard />} />
            <Route path="leads" element={<AdminLeads />} />
            <Route path="users" element={<UserManagement />} />
            <Route path="reports" element={<Reports />} />
            <Route path="settings" element={<Settings />} />
            <Route path="chat" element={<Chat />} />
          </Route>
        </Route>

        {/* Sales Routes */}
        <Route path="/sales" element={<RoleBasedRoute allowedRoles={['sales', 'admin']} />}>
          <Route element={<SalesLayout />}>
            <Route path="dashboard" element={<SalesDashboard />} />
            <Route path="leads" element={<Leads />} />
            <Route path="leads/:id" element={<LeadDetail />} />
            <Route path="deals" element={<Deals />} />
            <Route path="support" element={<SupportTickets />} />
            <Route path="support/:id" element={<SupportTicketDetail />} />
            <Route path="chat" element={<Chat />} />
          </Route>
        </Route>

        {/* Support Routes */}
        <Route path="/support" element={<RoleBasedRoute allowedRoles={['support', 'admin']} />}>
          <Route element={<SupportLayout />}>
            <Route path="tickets" element={<Tickets />} />
            <Route path="tickets/:id" element={<TicketDetail />} />
            <Route path="chat" element={<Chat />} />
          </Route>
        </Route>

      </Routes>
      </BrowserRouter>
    </ErrorBoundary>
  );
}

export default App;