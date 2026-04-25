import { io } from 'socket.io-client';

const socket = io('http://localhost:5001', {
  auth: { token: localStorage.getItem('token') },
  transports: ['websocket', 'polling'],
});

socket.on('connect', () => console.log('Socket connected'));
socket.on('disconnect', () => console.log('Socket disconnected'));
socket.on('connect_error', (err) => console.error('Socket error:', err.message));

export const joinChannel = (channelId) => socket.emit('join:channel', channelId);
export const leaveChannel = (channelId) => socket.emit('leave:channel', channelId);
export const startTyping = (channelId) => socket.emit('typing:start', { channelId });
export const stopTyping = (channelId) => socket.emit('typing:stop', { channelId });

export default socket;