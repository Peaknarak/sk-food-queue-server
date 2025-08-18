// src/components/OrderChat.tsx
import React, { useEffect, useRef, useState } from 'react';
import { api, ChatMessage } from '../lib/api';
import { getSocket, joinOrderRoom, sendChat } from '../lib/socket';
import { notify } from '../lib/notify';

type Props = { orderId: string; me: string; canClear?: boolean };

export default function OrderChat({ orderId, me, canClear }: Props) {
  const [msgs, setMsgs] = useState<ChatMessage[]>([]);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(false);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    const el = listRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  };

  async function loadLatest() {
    try {
      setLoading(true);
      const res = await api.getMessages(orderId, { limit: 30 });
      setMsgs(res.messages);
      setNextCursor(res.nextCursor);
      setTimeout(scrollToBottom, 0);
    } catch {
      notify.err('โหลดประวัติแชทไม่สำเร็จ');
    } finally {
      setLoading(false);
    }
  }

  async function loadMore() {
    if (!nextCursor) return;
    try {
      setLoading(true);
      const res = await api.getMessages(orderId, { before: nextCursor, limit: 30 });
      if (res.messages.length === 0) { setNextCursor(null); return; }
      const el = listRef.current;
      const prevHeight = el ? el.scrollHeight : 0;
      setMsgs(prev => [...res.messages, ...prev]);
      setNextCursor(res.nextCursor);
      if (el) setTimeout(()=>{ el.scrollTop = el.scrollHeight - prevHeight; },0);
    } catch {
      notify.err('โหลดก่อนหน้าไม่สำเร็จ');
    } finally {
      setLoading(false);
    }
  }

  async function handleClear() {
    if (!confirm('ยืนยันล้างประวัติแชทของออเดอร์นี้?')) return;
    try {
      await api.clearMessages(orderId);
      setMsgs([]); setNextCursor(null);
      notify.ok('ล้างประวัติแล้ว');
    } catch { notify.err('ล้างประวัติไม่สำเร็จ'); }
  }

  useEffect(() => {
    setMsgs([]); setNextCursor(null);
    joinOrderRoom(orderId);
    loadLatest();

    const s = getSocket();
    const onMsg = (m: any) => {
      if (m?.orderId !== orderId) return;
      setMsgs(prev => {
        if (m.id && prev.some(x => x.id === m.id)) return prev;
        return [...prev, { id: m.id || String(Date.now()), from: m.from, text: m.text, ts: m.ts }];
      });
      setTimeout(scrollToBottom, 0);
    };
    const onCleared = (p: any) => { if (p?.orderId===orderId) { setMsgs([]); setNextCursor(null); } };

    s.on('chat:message', onMsg);
    s.on('chat:cleared', onCleared);
    return () => { s.off('chat:message', onMsg); s.off('chat:cleared', onCleared); };
  }, [orderId]);

  async function handleSend() {
    const t = text.trim();
    if (!t || sending) return;
    const tempId = 'tmp_' + Date.now();
    const optimistic: ChatMessage = { id: tempId, from: me, text: t, ts: new Date().toISOString() };
    setMsgs(prev => [...prev, optimistic]); setText(''); setSending(true);
    setTimeout(scrollToBottom, 0);

    try {
      const res = await api.sendMessage(orderId, me, t);
      setMsgs(prev => {
        const filtered = prev.filter(x => x.id !== tempId);
        if (!filtered.some(x => x.id === res.message.id)) filtered.push(res.message);
        return filtered;
      });
    } catch {
      sendChat(orderId, me, t);
      notify.warn('ส่งผ่าน Socket (fallback)');
    } finally { setSending(false); }
  }

  return (
    <div className="card p-4">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-medium">แชท #{orderId.slice(-6).toUpperCase()}</h2>
        <div className="flex gap-2">
          <button className="btn btn-muted" onClick={loadLatest} disabled={loading}>รีเฟรช</button>
          {canClear && <button className="btn btn-danger" onClick={handleClear} disabled={loading}>ล้างประวัติ</button>}
        </div>
      </div>

      {nextCursor && (
        <div className="mb-2 text-center">
          <button className="btn btn-ghost" onClick={loadMore} disabled={loading}>
            {loading ? 'กำลังโหลด...' : 'โหลดก่อนหน้า'}
          </button>
        </div>
      )}

      <div ref={listRef} className="h-56 overflow-auto border rounded-xl p-2 space-y-1 bg-slate-50">
        {msgs.map(m => {
          const mine = m.from === me;
          return (
            <div key={m.id} className={mine ? 'text-right' : 'text-left'}>
              <div className={`inline-block rounded-xl px-3 py-1 ${mine ? 'bg-blue-600 text-white' : 'bg-white border'}`}>
                <div>{m.text}</div>
                <div className={`text-[10px] opacity-70 mt-0.5 ${mine ? 'text-white' : 'text-slate-500'}`}>
                  {new Date(m.ts).toLocaleTimeString('th-TH',{hour:'2-digit',minute:'2-digit'})}
                </div>
              </div>
            </div>
          );
        })}
        {msgs.length === 0 && !loading && <div className="text-center text-sm text-slate-500 py-6">ยังไม่มีข้อความ</div>}
      </div>

      <div className="mt-2 flex gap-2">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e)=>{ if(e.key==='Enter') handleSend(); }}
          className="flex-1 border rounded-xl px-3 py-2"
          placeholder="พิมพ์ข้อความ"
        />
        <button onClick={handleSend} disabled={sending} className="btn btn-primary">
          {sending ? 'กำลังส่ง...' : 'ส่ง'}
        </button>
      </div>
    </div>
  );
}
