import BaseLayout from '../BaseLayout';
import { LayoutDashboard, Users, Settings, PieChart, MessageCircle } from 'lucide-react';

const adminNav = [
  { to: '/admin/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/admin/leads', icon: Users, label: 'Lead Management' },
  { to: '/admin/users', icon: Users, label: 'Staff Management' },
  { to: '/admin/chat', icon: MessageCircle, label: 'Chat Channels' },
  { to: '/admin/reports', icon: PieChart, label: 'Reports' },
  { to: '/admin/settings', icon: Settings, label: 'Settings' },
];

export default function AdminLayout() {
  return <BaseLayout navItems={adminNav} />;
}
