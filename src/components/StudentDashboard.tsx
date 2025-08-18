// src/components/StudentDashboard.tsx
import React, { useEffect, useMemo, useState } from 'react';
import { api, User, Vendor, MenuItem, Order } from '../lib/api';
import { getSocket, identifyAsStudent, joinOrderRoom } from '../lib/socket';
import AppHeader from './AppHeader';
import { ShoppingCart, Check, X, MessageSquare, RefreshCw } from 'lucide-react';
import Loading from './Loading';
import { MenuSkeletonGrid } from './Skeleton';
import { notify } from '../lib/notify';
import OrderChat from './OrderChat';

export default function StudentDashboard({ user, onLogout }: { user: User; onLogout: ()=>void }) {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [selectedVendor, setSelectedVendor] = useState<string>('');
  const [menu, setMenu] = useState<MenuItem[]>([]);
  const [cart, setCart] = useState<{ menuItemId: string; qty: number }[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [qr, setQr] = useState<string>('');
  const [activeOrder, setActiveOrder] = useState<Order | null>(null);
  const [bookingOpen, setBookingOpen] = useState<boolean>(true);
  const [testMode, setTestMode] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [timeText, setTimeText] = useState<string>('');

  const [loadingVendors, setLoadingVendors] = useState(true);
  const [loadingMenu, setLoadingMenu] = useState(false);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [creatingOrder, setCreatingOrder] = useState(false);
  const [markingPaid, setMarkingPaid] = useState(false);

  useEffect(()=>{ identifyAsStudent(user.id); },[user.id]);

  useEffect(()=>{
    (async ()=>{
      try {
        setLoadingVendors(true);
        const r = await api.listVendors();
        setVendors(r.vendors);
        if(!selectedVendor && r.vendors[0]) setSelectedVendor(r.vendors[0].id);
      } catch {
        notify.err('โหลดรายชื่อร้านค้าไม่สำเร็จ');
      } finally {
        setLoadingVendors(false);
      }
    })();
  },[]);

  useEffect(()=>{
    if (!selectedVendor) return;
    (async ()=>{
      try {
        setLoadingMenu(true);
        const r = await api.listMenus(selectedVendor);
        setMenu(r.items);
      } catch {
        notify.err('โหลดเมนูไม่สำเร็จ');
      } finally {
        setLoadingMenu(false);
      }
    })();
  },[selectedVendor]);

  useEffect(()=>{
    (async ()=>{
      try {
        setLoadingOrders(true);
        const r = await api.listOrdersByStudent(user.id);
        setOrders(r.orders);
      } catch {
        notify.err('โหลดรายการสั่งซื้อไม่สำเร็จ');
      } finally {
        setLoadingOrders(false);
      }
    })();
  },[user.id]);

  useEffect(()=>{
    api.getConfig().then(cfg=>{
      setBookingOpen(cfg.bookingOpen);
      setTestMode(cfg.testMode);
      setTimeText(new Date(cfg.now).toLocaleString('th-TH', { hour: '2-digit', minute: '2-digit' }));
    }).catch(()=>{});
    const t = setInterval(()=> setTimeText(new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })), 1000);
    return ()=> clearInterval(t);
  },[]);

  useEffect(()=>{
    const s = getSocket();
    s.on('order:update', (o: Order)=>{
      setOrders(prev=>prev.map(x=>x.id===o.id?o:x));
      if (activeOrder && activeOrder.id===o.id) setActiveOrder(o);
    });
    s.on('order:paid', (o: Order)=>{
      setOrders(prev=>[o, ...prev.filter(x=>x.id!==o.id)]);
      notify.ok('ได้รับการชำระเงินแล้ว ส่งออเดอร์ให้ร้านตรวจ');
    });
    return ()=>{ s.off('order:update'); s.off('order:paid'); };
  },[activeOrder]);

  function addToCart(id: string) {
    setCart(prev=>{
      const found = prev.find(x=>x.menuItemId===id);
      if (found) return prev.map(x=>x.menuItemId===id?{...x, qty:x.qty+1}:x);
      return [...prev, { menuItemId:id, qty:1 }];
    });
  }
  function decFromCart(id: string){
    setCart(prev=>{
      const found = prev.find(x=>x.menuItemId===id);
      if (!found) return prev;
      if (found.qty <= 1) return prev.filter(x=>x.menuItemId!==id);
      return prev.map(x=>x.menuItemId===id?{...x, qty:x.qty-1}:x);
    });
  }
  function removeFromCart(id: string){ setCart(prev=>prev.filter(x=>x.menuItemId!==id)); }

  async function createOrder() {
    setErrorMsg('');
    if (!selectedVendor || cart.length===0) return;
    try {
      setCreatingOrder(true);
      const res = await api.createOrder({ studentId: user.id, vendorId: selectedVendor, items: cart });
      setOrders([res.order, ...orders]);
      setActiveOrder(res.order);
      joinOrderRoom(res.order.id);
      const qrRes = await api.createQR(res.order.id);
      setQr(qrRes.qrDataUrl);
      notify.ok('สร้างออเดอร์แล้ว กรุณาชำระเงิน');
      setCart([]);
    } catch (e: any) {
      setErrorMsg(e?.message || 'ไม่สามารถสร้างคำสั่งซื้อได้');
      notify.err('สร้างออเดอร์ไม่สำเร็จ');
    } finally {
      setCreatingOrder(false);
    }
  }

  async function markPaid() {
    if (!activeOrder) return;
    try {
      setMarkingPaid(true);
      const res = await api.markPaid(activeOrder.id);
      setActiveOrder(res.order);
      setQr('');
      notify.ok('แจ้งชำระเงินสำเร็จ กำลังรอร้านยืนยัน');
    } catch {
      notify.err('แจ้งชำระเงินไม่สำเร็จ');
    } finally {
      setMarkingPaid(false);
    }
  }

  const cartTotal = useMemo(()=>{
    return cart.reduce((sum, c)=>{
      const m = menu.find(x=>x.id===c.menuItemId); if(!m) return sum; return sum + m.price*c.qty;
    },0);
  },[cart, menu]);

  const orderButtonDisabled = (!bookingOpen && !testMode) || creatingOrder;

  return (
    <div className="min-h-full">
      <AppHeader
        title={`Student • ${user.name} (${user.id})`}
        timeText={timeText}
        right={
          <span className={`badge ${bookingOpen?'badge-green':'badge-gray'}`}>
            {bookingOpen ? 'เปิดจอง' : 'ปิดจอง'}
          </span>
        }
        onLogout={onLogout}
      />

      <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
        {!bookingOpen && (
          <div className="card p-3">
            <div className="badge badge-yellow mb-2">แจ้งเตือน</div>
            <div className="text-sm text-slate-700">
              ตอนนี้อยู่นอกช่วงเวลาจอง (08:00–10:00) — หากเปิดโหมดทดสอบจากฝั่งเซิร์ฟเวอร์จะสั่งได้
            </div>
          </div>
        )}
        {testMode && (
          <div className="card p-3">
            <div className="badge badge-yellow mb-2">โหมดทดสอบ</div>
            <div className="text-sm text-slate-700">ระบบอนุญาตให้จองนอกช่วงเวลาเพื่อการทดสอบ</div>
          </div>
        )}
        {errorMsg && (
          <div className="card p-3 border-rose-200">
            <div className="badge badge-red mb-2">ผิดพลาด</div>
            <div className="text-sm text-rose-700">{errorMsg}</div>
          </div>
        )}

        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <div className="card p-4">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-lg font-medium">เลือกร้านอาหาร</h2>
                <button
                  className="btn btn-muted"
                  onClick={async ()=>{
                    try{
                      setLoadingVendors(true);
                      const r=await api.listVendors();
                      setVendors(r.vendors);
                      notify.ok('รีเฟรชร้านค้าแล้ว');
                    }catch{ notify.err('รีเฟรชไม่สำเร็จ');}
                    finally{ setLoadingVendors(false); }
                  }}
                >
                  <RefreshCw size={16}/> รีเฟรช
                </button>
              </div>

              {loadingVendors ? <Loading label="กำลังโหลดร้านค้า..." /> : (
                <div className="flex gap-2 flex-wrap">
                  {vendors.map(v=> (
                    <button key={v.id} onClick={()=>setSelectedVendor(v.id)}
                      className={`btn ${selectedVendor===v.id?'btn-primary':'btn-muted'}`}>{v.name}</button>
                  ))}
                  {vendors.length===0 && <div className="text-sm text-slate-500">ยังไม่มีร้านค้า</div>}
                </div>
              )}
            </div>

            {loadingMenu ? <MenuSkeletonGrid/> : (
              <div className="grid sm:grid-cols-2 gap-4">
                {menu.map(m=> (
                  <div key={m.id} className="card p-4 flex items-center justify-between">
                    <div>
                      <div className="font-medium">{m.name}</div>
                      <div className="text-sm text-slate-500">{m.price} บาท</div>
                    </div>
                    <button onClick={()=>addToCart(m.id)} className="btn btn-primary">
                      <ShoppingCart size={16}/> ใส่ตะกร้า
                    </button>
                  </div>
                ))}
                {menu.length===0 && (
                  <div className="sm:col-span-2 text-sm text-slate-500">เลือกร้านเพื่อดูเมนู</div>
                )}
              </div>
            )}
          </div>

          {/* Cart */}
          <div className="space-y-4">
            <div className="card p-4">
              <h2 className="text-lg font-medium mb-3">ตะกร้า</h2>
              {cart.length===0 ? (
                <div className="text-sm text-slate-500">ยังไม่มีสินค้า</div>
              ) : (
                <div className="space-y-3">
                  {cart.map(c=>{
                    const m = menu.find(x=>x.id===c.menuItemId);
                    if(!m) return null;
                    return (
                      <div key={c.menuItemId} className="flex items-center justify-between">
                        <div>
                          <div className="font-medium">{m.name}</div>
                          <div className="text-xs text-slate-500">{m.price} บาท</div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button className="btn btn-ghost" onClick={()=>decFromCart(c.menuItemId)}>-</button>
                          <div className="w-8 text-center">{c.qty}</div>
                          <button className="btn btn-ghost" onClick={()=>addToCart(c.menuItemId)}>+</button>
                          <button className="btn btn-danger" onClick={()=>removeFromCart(c.menuItemId)}><X size={16}/></button>
                        </div>
                      </div>
                    );
                  })}
                  <div className="border-t pt-3 flex items-center justify-between">
                    <div className="font-semibold">รวม</div>
                    <div className="font-semibold">{cartTotal} บาท</div>
                  </div>
                  <button
                    disabled={orderButtonDisabled}
                    onClick={createOrder}
                    className="btn btn-primary w-full disabled:opacity-50"
                  >
                    {creatingOrder ? 'กำลังสร้างออเดอร์...' : 'ยืนยันและชำระเงิน (QR)'}
                  </button>
                </div>
              )}
            </div>

            {qr && (
              <div className="card p-4">
                <h2 className="text-lg font-medium mb-3">สแกนจ่าย</h2>
                <img src={qr} alt="QR" className="w-48 h-48 mx-auto" />
                <div className="mt-3 flex gap-2">
                  <button disabled={markingPaid} onClick={markPaid} className="btn btn-primary flex-1">
                    <Check size={16}/> {markingPaid ? 'กำลังส่งข้อมูล...' : 'ฉันชำระเงินแล้ว'}
                  </button>
                  <button onClick={()=>setQr('')} className="btn btn-muted">ปิด</button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* orders + chat */}
        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 card p-4">
            <h2 className="text-lg font-medium mb-3">รายการของฉัน</h2>
            {loadingOrders ? <Loading label="กำลังโหลดรายการสั่งซื้อ..." /> : (
              <div className="space-y-2">
                {orders.map(o=> (
                  <div key={o.id} className="border rounded-xl p-3">
                    <div className="flex items-center justify-between gap-3 flex-wrap">
                      <div>#{o.id.slice(-6).toUpperCase()}</div>
                      <div className="flex items-center gap-2">
                        <StatusChip status={o.status} />
                        {o.queueNumber ? <span className="badge badge-green">คิวที่ {o.queueNumber}</span> : null}
                      </div>
                      <button onClick={()=>{setActiveOrder(o); joinOrderRoom(o.id);}} className="btn btn-muted">
                        <MessageSquare size={16}/> แชท
                      </button>
                    </div>
                  </div>
                ))}
                {orders.length===0 && <div className="text-sm text-slate-500">ยังไม่มีรายการสั่งซื้อ</div>}
              </div>
            )}
          </div>

          {activeOrder && (
            <OrderChat orderId={activeOrder.id} me={user.id} />
          )}
        </div>
      </div>
    </div>
  );
}

function StatusChip({ status }: { status: Order['status'] }) {
  if (status==='accepted') return <span className="badge badge-green">ยืนยันแล้ว</span>;
  if (status==='pending_vendor_confirmation') return <span className="badge badge-yellow">รอร้านยืนยัน</span>;
  if (status==='rejected') return <span className="badge badge-red">ถูกปฏิเสธ</span>;
  return <span className="badge badge-gray">สร้างคำสั่งซื้อ</span>;
}
