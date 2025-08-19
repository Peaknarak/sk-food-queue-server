// src/components/LoginScreen.tsx
import React, { useState } from 'react';
import { api, User } from '../lib/api';

export default function LoginScreen({ onLoggedIn }: { onLoggedIn: (u: User)=>void }) {
  const [tab, setTab] = useState<'student'|'vendor'|'admin'>('student');
  const [studentId, setStudentId] = useState('');
  const [vendorId, setVendorId] = useState('');
  const [adminKey, setAdminKey] = useState('');
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');

  async function doLogin(){
    try{
      setErr(''); setLoading(true);
      if (tab==='student') {
        const r = await api.loginStudent(studentId.trim());
        onLoggedIn(r.user);
      } else if (tab==='vendor') {
        const r = await api.loginVendor(vendorId.trim());
        onLoggedIn(r.user);
      } else {
        const r = await api.loginAdmin(adminKey.trim());
        onLoggedIn(r.user);
      }
    }catch(e:any){
      setErr(e?.message || 'Login failed');
    }finally{
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen grid place-items-center bg-slate-50">
      <div className="w-full max-w-md card p-6">
        <h1 className="text-xl font-semibold mb-4 text-center">SK Food Queue — Login</h1>

        <div className="flex gap-2 mb-4">
          <button onClick={()=>setTab('student')} className={`btn ${tab==='student'?'btn-primary':'btn-muted'}`}>Student</button>
          <button onClick={()=>setTab('vendor')} className={`btn ${tab==='vendor'?'btn-primary':'btn-muted'}`}>Vendor</button>
          <button onClick={()=>setTab('admin')} className={`btn ${tab==='admin'?'btn-primary':'btn-muted'}`}>Admin</button>
        </div>

        {tab==='student' && (
          <div className="space-y-3">
            <label className="block text-sm">Student ID</label>
            <input className="w-full border rounded-xl px-3 py-2" value={studentId} onChange={e=>setStudentId(e.target.value)} placeholder="เช่น S12345" />
          </div>
        )}
        {tab==='vendor' && (
          <div className="space-y-3">
            <label className="block text-sm">Vendor ID</label>
            <input className="w-full border rounded-xl px-3 py-2" value={vendorId} onChange={e=>setVendorId(e.target.value)} placeholder="เช่น V001" />
            <p className="text-xs text-slate-500">* ถ้าเป็นร้านใหม่ ระบบจะสร้างให้แต่ยังไม่อนุมัติ ต้องรอแอดมิน</p>
          </div>
        )}
        {tab==='admin' && (
          <div className="space-y-3">
            <label className="block text-sm">Admin Key</label>
            <input className="w-full border rounded-xl px-3 py-2" value={adminKey} onChange={e=>setAdminKey(e.target.value)} placeholder="ใส่รหัสลับ (เช่น 123456)" />
          </div>
        )}

        {err && <div className="mt-3 text-sm text-rose-600">{String(err)}</div>}

        <button disabled={loading} onClick={doLogin} className="btn btn-primary w-full mt-5">
          {loading?'กำลังเข้าสู่ระบบ...':'Login'}
        </button>
      </div>
    </div>
  );
}
