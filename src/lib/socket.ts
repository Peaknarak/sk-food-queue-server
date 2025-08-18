// src/lib/socket.ts
import { io, Socket } from 'socket.io-client';
import { API_BASE } from './api';

let socket: Socket | null = null;

// state สำหรับ reconnect
let lastIdentity:
  | { role: 'student'; studentId: string }
  | { role: 'vendor'; vendorId: string }
  | null = null;

const joinedRooms = new Set<string>(); // orderId ที่เคย join แล้ว

function createSocket(): Socket {
  const s = io(API_BASE, {
    transports: ['websocket'],
    withCredentials: true,
    reconnection: true,
    reconnectionAttempts: Infinity,
    reconnectionDelay: 1000,
    timeout: 20000,
  });

  s.on('connect', () => {
    // ใส่ตัวตนใหม่ทุกครั้งที่เชื่อมต่อ
    if (lastIdentity) s.emit('identify', lastIdentity);
    // join ห้องที่เคยเข้าทั้งหมด (ในกรณี reconnect)
    joinedRooms.forEach((ord) => s.emit('chat:join', ord));
  });

  // ช่วยดีบักเวลามีปัญหา
  s.on('connect_error', (err) => {
    console.warn('[socket] connect_error:', err?.message || err);
  });
  s.on('error', (err) => {
    console.warn('[socket] error:', err);
  });

  return s;
}

export function getSocket(): Socket {
  if (!socket) socket = createSocket();
  return socket!;
}

export function identifyAsStudent(studentId: string) {
  lastIdentity = { role: 'student', studentId };
  getSocket().emit('identify', lastIdentity);
}

export function identifyAsVendor(vendorId: string) {
  lastIdentity = { role: 'vendor', vendorId };
  getSocket().emit('identify', lastIdentity);
}

export function joinOrderRoom(orderId: string) {
  joinedRooms.add(orderId);
  getSocket().emit('chat:join', orderId);
}

export function leaveOrderRoom(orderId: string) {
  joinedRooms.delete(orderId);
  // (ฝั่ง server ตอนนี้ยังไม่มี 'chat:leave' แต่เก็บไว้เผื่ออนาคต)
  // getSocket().emit('chat:leave', orderId);
}

export function sendChat(orderId: string, from: string, text: string) {
  getSocket().emit('chat:message', { orderId, from, text });
}
