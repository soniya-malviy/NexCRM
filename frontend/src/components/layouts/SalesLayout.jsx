import BaseLayout from '../BaseLayout';
import { LayoutDashboard, Users, DollarSign, MessageSquare, MessageCircle } from 'lucide-react';

const salesNav = [
  { to: '/sales/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/sales/leads', icon: Users, label: 'Leads' },
  { to: '/sales/deals', icon: DollarSign, label: 'Pipeline' },
  { to: '/sales/support', icon: MessageSquare, label: 'Support Requests' },
  { to: '/sales/chat', icon: MessageCircle, label: 'Chat Channels' },
];

export default function SalesLayout() {
  return <BaseLayout navItems={salesNav} />;
}
