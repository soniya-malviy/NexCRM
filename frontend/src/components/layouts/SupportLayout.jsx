import BaseLayout from '../BaseLayout';
import { Ticket, MessageCircle } from 'lucide-react';

const supportNav = [
  { to: '/support/tickets', icon: Ticket, label: 'Tickets' },
  { to: '/support/chat', icon: MessageCircle, label: 'Chat Channels' },
];

export default function SupportLayout() {
  return <BaseLayout navItems={supportNav} />;
}
