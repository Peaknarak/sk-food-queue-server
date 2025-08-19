// src/components/VendorDashboard.tsx
import React, { useEffect, useMemo, useState } from 'react';
import { api, Order, User, MenuItem } from '../lib/api';
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

  // menus
  const vendorId = user.vendorId || user.id; // เราสร้าง user.vendorId เป็น id ร้าน ถ้าไม่มีใช้ user.id (กรณีเดิม)
  const [menus, setMenus] = useState<MenuItem[]>([]);
  const [loadingMenus, setLoadingMenus] = useState(true);
  const [newName, setNewName] = useState('');
  const [newPrice, setNewPrice] = useState<number>(40);

  useEffect(()=>{ identifyAsVendor(user.id); },[user.id]);

  async function loadMenus(){
    try {
      setLoadingMenus(true);
      const r = await api.vendorListMenus(vendorId);
      setMenus(r.items);
    } catch {
      notify.err('โหลดเมนูไม่สำเร็จ');
    } finally {
      setLoadingMenus(false);
    }
  }

  useEffect(()=>{ loadMenus(); },[vendorId]);

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

  async function addMenu(){
    try{
      if (!newName.trim() || !Number.isFinite(newPrice)) return;
      await api.vendorCreateMenu({ vendorId, name: newName.trim(), price: Number(newPrice) });
      setNewName(''); setNewPrice(40);
      await loadMenus();
      notify.ok('เพิ่มเมนูแล้ว');
    }catch(e:any){
      notify.err(e?.message || 'เพิ่มเมนูไม่สำเร็จ (ร้านอาจยังไม่อนุมัติ)');
    }
  }
  async function updateMenu(it: MenuItem, name?: string, price?: number){
    await api.vendorUpdateMenu(it.id, { name, price });
    await loadMenus();
    notify.ok('อัปเดตแล้ว');
  }
  async function deleteMenu(it: MenuItem){
    await api.vendorDeleteMenu(it.id);
    await loadMenus();
    notify.warn('ลบเมนูแล้ว');
  }

  const pending = useMemo(()=>orders.filter(o=>o.status==='pending_vendor_confirmation'),[orders]);
  const accepted = useMemo(()=>orders.filter(o=>o.status==='accepted'),[orders]);
  const rejected = useMemo(()=>orders.filter(o=>o.status==='rejected'),[orders]);

  return (
    <div className="min-h-full">
      <AppHeader title={`Vendor • ${user.name} (${user.id})`} onLogout={onLogout} />

      <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">

        {/* --- จัดการเมนู --- */}
        <section className="card p-4 space-y-4">
          <h2 className="text-lg font-medium">จัดการเมนูของร้าน</h2>
          <div className="grid sm:grid-cols-3 gap-3">
            <input className="border rounded-xl px-3 py-2" placeholder="ชื่อเมนู" value={newName} onChange={e=>setNewName(e.target.value)} />
            <input className="border rounded-xl px-3 py-2" placeholder="ราคา" type="number" value={String(newPrice)} onChange={e=>setNewPrice(Number(e.target.value))} />
            <button className="btn btn-primary" onClick={addMenu}>เพิ่มเมนู</button>
          </div>

          {loadingMenus ? <div>กำลังโหลดเมนู...</div> : (
            <div className="space-y-2">
              {menus.map(it=>(
                <div key={it.id} className="border rounded-xl p-3 flex items-center justify-between gap-3">
                  <div>
                    <div className="font-medium">{it.name}</div>
                    <div className="text-sm text-slate-500">{it.price} บาท</div>
                  </div>
                  <div className="flex gap-2">
                    <button className="btn btn-muted" onClick={async ()=> {
                      const name = prompt('ชื่อเมนูใหม่', it.name) ?? it.name;
                      const priceStr = prompt('ราคาใหม่', String(it.price)) ?? String(it.price);
                      const price = Number(priceStr);
                      if (name && Number.isFinite(price)) await updateMenu(it, name, price);
                    }}>แก้ไข</button>
                    <button className="btn btn-danger" onClick={()=>deleteMenu(it)}>ลบ</button>
                  </div>
                </div>
              ))}
              {menus.length===0 && <div className="text-sm text-slate-500">ยังไม่มีเมนู</div>}
            </div>
          )}
        </section>

        {/* --- คอลัมน์ออเดอร์เดิม --- */}
        {loadingOrders ? <Loading label="กำลังโหลดรายการ..." /> : (
          <div className="grid md:grid-cols-3 gap-6">
            <Column title="รอการยืนยัน" highlight="badge-yellow" actions={(o)=>(<>
              <button onClick={async()=>{ const r=await api.acceptOrder(o.id); setOrders(prev=>prev.map(x=>x.id===o.id?r.order:x)); setActiveOrder(r.order); }} className="btn btn-primary"><Check size={16}/> รับคิว</button>
              <button onClick={async()=>{ const r=await api.rejectOrder(o.id); setOrders(prev=>prev.map(x=>x.id===o.id?r.order:x)); setActiveOrder(r.order); }} className="btn btn-danger"><X size={16}/> ปฏิเสธ</button>
            </>)} orders={pending} onChat={(o)=>{ setActiveOrder(o); joinOrderRoom(o.id); }} />
            <Column title="ยืนยันแล้ว" highlight="badge-green" orders={accepted} onChat={(o)=>{ setActiveOrder(o); joinOrderRoom(o.id); }} />
            <Column title="ถูกปฏิเสธ" highlight="badge-red" orders={rejected} onChat={(o)=>{ setActiveOrder(o); joinOrderRoom(o.id); }} />
          </div>
        )}

        {activeOrder && (
          <OrderChat orderId={activeOrder.id} me={user.id} />
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
