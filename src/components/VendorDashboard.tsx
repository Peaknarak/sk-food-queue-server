// src/components/VendorDashboard.tsx
import React, { useEffect, useMemo, useState } from 'react';
import { api, Order, User } from '../lib/api';
import { getSocket, identifyAsVendor, joinOrderRoom } from '../lib/socket';
import AppHeader from './AppHeader';
import { Check, X, MessageSquare } from 'lucide-react';
import Loading from './Loading';
import { notify } from '../lib/notify';
import OrderChat from './OrderChat';

export default function VendorDashboard({ user, onLogout }: { user: User; onLogout: ()=>void }){
  const [orders, setOrders] = useState<Order[]>([]);
  const [activeOrder, setActiveOrder] = useState<Order | null>(null);
  const [loadingOrders, setLoadingOrders] = useState(true);

  useEffect(()=>{ identifyAsVendor(user.id); },[user.id]);

  useEffect(()=>{
    (async ()=>{
      try {
        setLoadingOrders(true);
        const r = await api.listOrdersByVendor(user.id);
        setOrders(r.orders);
      } catch {
        notify.err('โหลดรายการไม่สำเร็จ');
      } finally {
        setLoadingOrders(false);
      }
    })();
  },[user.id]);

  useEffect(()=>{
    const s = getSocket();
    s.on('order:new', (o: Order)=>{ if(o.vendorId===user.id) { setOrders(prev=>[o, ...prev]); notify.info('มีออเดอร์ใหม่'); }}); 
    s.on('order:paid', (o: Order)=>{ if(o.vendorId===user.id) setOrders(prev=>prev.map(x=>x.id===o.id?o:x)); });
    s.on('order:update', (o: Order)=>{ if(o.vendorId===user.id) setOrders(prev=>prev.map(x=>x.id===o.id?o:x)); });
    return ()=>{ s.off('order:new'); s.off('order:paid'); s.off('order:update'); };
  },[user.id]);

  async function accept(id: string){
    try{
      const res = await api.acceptOrder(id);
      setOrders(prev=>prev.map(x=>x.id===id?res.order:x));
      setActiveOrder(res.order);
      notify.ok(`รับคิวแล้ว • หมายเลขคิว ${res.order.queueNumber}`);
    }catch{ notify.err('รับคิวไม่สำเร็จ'); }
  }
  async function reject(id: string){
    try{
      const res = await api.rejectOrder(id);
      setOrders(prev=>prev.map(x=>x.id===id?res.order:x));
      setActiveOrder(res.order);
      notify.warn('ปฏิเสธออเดอร์แล้ว');
    }catch{ notify.err('ปฏิเสธออเดอร์ไม่สำเร็จ'); }
  }

  const pending = useMemo(()=>orders.filter(o=>o.status==='pending_vendor_confirmation'),[orders]);
  const accepted = useMemo(()=>orders.filter(o=>o.status==='accepted'),[orders]);
  const rejected = useMemo(()=>orders.filter(o=>o.status==='rejected'),[orders]);

  return (
    <div className="min-h-full">
      <AppHeader title={`Vendor • ${user.name} (${user.id})`} onLogout={onLogout} />

      <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
        {loadingOrders ? <Loading label="กำลังโหลดรายการ..." /> : (
          <div className="grid md:grid-cols-3 gap-6">
            <Column title="รอการยืนยัน" highlight="badge-yellow" actions={(o)=>(<>
              <button onClick={()=>accept(o.id)} className="btn btn-primary"><Check size={16}/> รับคิว</button>
              <button onClick={()=>reject(o.id)} className="btn btn-danger"><X size={16}/> ปฏิเสธ</button>
            </>)} orders={pending} onChat={(o)=>{ setActiveOrder(o); joinOrderRoom(o.id); }} />

            <Column title="ยืนยันแล้ว" highlight="badge-green" orders={accepted} onChat={(o)=>{ setActiveOrder(o); joinOrderRoom(o.id); }} />

            <Column title="ถูกปฏิเสธ" highlight="badge-red" orders={rejected} onChat={(o)=>{ setActiveOrder(o); joinOrderRoom(o.id); }} />
          </div>
        )}

        {activeOrder && (
          <OrderChat orderId={activeOrder.id} me={user.id} canClear />
        )}
      </div>
    </div>
  );
}

function Column({
  title, highlight, orders, actions, onChat
}:{
  title: string;
  highlight: 'badge-yellow' | 'badge-green' | 'badge-red';
  orders: Order[];
  actions?: (o: Order)=>React.ReactNode;
  onChat: (o: Order)=>void;
}){
  return (
    <section className="card p-4">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-medium">{title}</h2>
        <span className={`badge ${highlight}`}>{orders.length} รายการ</span>
      </div>
      <div className="space-y-3">
        {orders.length===0 && <div className="text-sm text-slate-500">ไม่มีรายการ</div>}
        {orders.map(o=> (
          <div key={o.id} className="border rounded-xl p-3 space-y-2">
            <div className="flex items-center justify-between">
              <div className="font-medium">#{o.id.slice(-6).toUpperCase()}</div>
              <div className="flex gap-2">
                <button onClick={()=>onChat(o)} className="btn btn-muted"><MessageSquare size={16}/> แชท</button>
                {actions && o.status==='pending_vendor_confirmation' && actions(o)}
              </div>
            </div>
            <ul className="text-sm text-slate-700 list-disc ml-5">
              {o.items.map((it,i)=> (<li key={i}>{it.name} × {it.qty} — {it.price*it.qty} บาท</li>))}
            </ul>
            {o.queueNumber && (
              <div className="text-sm"><span className="badge badge-green">คิวที่ {o.queueNumber}</span></div>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
