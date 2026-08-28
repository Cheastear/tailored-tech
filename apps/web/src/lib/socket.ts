import { io } from 'socket.io-client';
import { apiBase } from './api';

const socketUrl = apiBase.replace(/\/api$/, '');

export const socket = io(socketUrl, {
  withCredentials: true,
  autoConnect: false,
});
