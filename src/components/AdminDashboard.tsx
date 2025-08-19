// src/components/AdminDashboard.tsx
import React, { useEffect, useState } from 'react';
import { api, User, Vendor } from '../lib/api';
import AppHeader from './AppHeader';

export default function AdminDashboard({ user, onLogout }: { user: User; onLogout: ()=>void }) {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);

  const [id, setId] = useState('');
  const [name, setName] = useState('');
  const [approved, setApproved] = useState(true);
  const adminKey = '123456'; // ในโปรดักชันแนะนำทำช่องกรอก/ดึงจาก state กลาง

  async function load(){
    try{
      setLoading(true);
      const r = await api.adminListVendors(adminKey);
      setVendors(r.vendors);
    } finally {
      setLoading(false);
    }
  }

  useEffect(()=>{ load(); },[]);

  async function createOrUpdate(){
    await api.adminUpsertVendor(adminKey, { id: id.trim(), name: name.trim(), approved });
    setId(''); setName('');
    await load();
  }

  return (
    <div className="min-h-full">
      <AppHeader title={`Admin • ${user.name}`} onLogout={onLogout} />

      <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        <section className="card p-4 space-y-3">
          <h2 className="text-lg font-medium">สร้าง/แก้ไข ร้านค้า</h2>
          <div className="grid sm:grid-cols-2 gap-3">
            <input className="border rounded-xl px-3 py-2" placeholder="Vendor ID (เช่น V001)" value={id} onChange={e=>setId(e.target.value)} />
            <input className="border rounded-xl px-3 py-2" placeholder="Vendor Name" value={name} onChange={e=>setName(e.target.value)} />
          </div>
          <label className="inline-flex items-center gap-2">
            <input type="checkbox" checked={approved} onChange={e=>setApproved(e.target.checked)} />
            อนุมัติทันที
          </label>
          <div>
            <button className="btn btn-primary" onClick={createOrUpdate}>บันทึก</button>
          </div>
        </section>

        <section className="card p-4">
          <h2 className="text-lg font-medium mb-3">รายการร้านทั้งหมด</h2>
          {loading ? <div>กำลังโหลด...</div> : (
            <div className="space-y-2">
              {vendors.map(v=> (
                <div key={v.id} className="border rounded-xl p-3 flex items-center justify-between">
                  <div>
                    <div className="font-medium">{v.name} <span className="text-slate-500">({v.id})</span></div>
                    <div className={`badge ${v.approved?'badge-green':'badge-gray'}`}>{v.approved?'Approved':'Pending'}</div>
                  </div>
                  <div className="flex gap-2">
                    {!v.approved ? (
                      <button className="btn btn-primary" onClick={async ()=>{ await api.adminApproveVendor(adminKey, v.id); await load(); }}>อนุมัติ</button>
                    ) : (
                      <button className="btn btn-muted" onClick={async ()=>{ await api.adminRejectVendor(adminKey, v.id); await load(); }}>ยกเลิกอนุมัติ</button>
                    )}
                    <button className="btn btn-danger" onClick={async ()=>{ await api.adminDeleteVendor(adminKey, v.id); await load(); }}>ลบ</button>
                  </div>
                </div>
              ))}
              {vendors.length===0 && <div className="text-sm text-slate-500">ยังไม่มีร้าน</div>}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
