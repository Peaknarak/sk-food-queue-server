// src/components/LoginScreen.tsx
import React, { useState } from 'react';
import { api, User } from '../lib/api';
import { GraduationCap, Store } from 'lucide-react';

export default function LoginScreen({ onLoggedIn }: { onLoggedIn: (u: User) => void }) {
  const [mode, setMode] = useState<'student' | 'vendor'>('student');
  const [id, setId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleLogin() {
    setLoading(true); setError('');
    try {
      const res = mode === 'student'
        ? await api.loginStudent(id)
        : await api.loginVendor(id);
      onLoggedIn(res.user);
    } catch (e: any) {
      setError(e?.message || 'เข้าสู่ระบบไม่สำเร็จ');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-full grid place-items-center p-6">
      <div className="w-full max-w-md card p-6 space-y-5">
        <div className="space-y-1 text-center">
          <h1 className="text-2xl font-semibold">Suankularb Canteen</h1>
          <p className="text-slate-500 text-sm">ระบบจองคิวอาหารสำหรับนักเรียนและร้านค้า</p>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <button
            className={`btn ${mode==='student' ? 'btn-primary' : 'btn-muted'}`}
            onClick={()=>setMode('student')}
          >
            <GraduationCap size={16}/> นักเรียน
          </button>
          <button
            className={`btn ${mode==='vendor' ? 'btn-primary' : 'btn-muted'}`}
            onClick={()=>setMode('vendor')}
          >
            <Store size={16}/> ร้านค้า
          </button>
        </div>

        <div className="space-y-2">
          <label className="text-sm text-slate-600">
            {mode==='student' ? 'รหัสนักเรียน' : 'รหัสร้านค้า'}
          </label>
          <input
            className="w-full border rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-200"
            value={id}
            onChange={e=>setId(e.target.value)}
            placeholder={mode==='student' ? 'เช่น S12345' : 'เช่น V001'}
          />
        </div>

        {error && <div className="text-rose-600 text-sm">{error}</div>}

        <button
          disabled={loading || !id}
          onClick={handleLogin}
          className="btn btn-primary w-full disabled:opacity-50"
        >
          {loading ? 'กำลังเข้าสู่ระบบ...' : 'เข้าสู่ระบบ'}
        </button>

        <div className="text-[12px] text-slate-500 text-center">
          * ช่วงเวลาจอง 08:00–10:00 น. (เปิดโหมดทดสอบได้จากฝั่งเซิร์ฟเวอร์)
        </div>
      </div>
    </div>
  );
}
