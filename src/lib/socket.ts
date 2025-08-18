// src/lib/socket.ts
import { io, Socket } from 'socket.io-client';
import { API_BASE } from './api';

let socket: Socket | null = null;

export function getSocket(): Socket {
  if (!socket) {
    socket = io(API_BASE, { transports: ['websocket'], withCredentials: true });
  }
  return socket!;
}

export function identifyAsStudent(studentId: string) {
  getSocket().emit('identify', { role: 'student', studentId });
}

export function identifyAsVendor(vendorId: string) {
  getSocket().emit('identify', { role: 'vendor', vendorId });
}

export function joinOrderRoom(orderId: string) {
  getSocket().emit('chat:join', orderId);
}

export function sendChat(orderId: string, from: string, text: string) {
  getSocket().emit('chat:message', { orderId, from, text });
}
