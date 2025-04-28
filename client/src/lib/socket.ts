import { io } from 'socket.io-client';

const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
const hostAndPort = window.location.host;
const socketPath = '/socket.io';

export const socketIo = io({
  path: socketPath,
  transports: ['websocket', 'polling'],
  reconnection: true,
  reconnectionAttempts: 10,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 5000,
});

export default socketIo;