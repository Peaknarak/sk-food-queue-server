// src/components/AppHeader.tsx
import React from 'react';
import { LogOut, Clock } from 'lucide-react';

export default function AppHeader({
  title,
  right,
  timeText,
  onLogout,
}: {
  title: string;
  timeText?: string;
  right?: React.ReactNode;
  onLogout?: () => void;
}) {
  return (
    <div className="w-full bg-white border-b">
      <div className="max-w-6xl mx-auto h-14 px-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="font-semibold">SK Canteen</div>
          <div className="text-slate-400">/</div>
          <div className="font-medium text-slate-700">{title}</div>
        </div>

        <div className="flex items-center gap-3">
          {timeText && (
            <div className="hidden md:flex items-center gap-1 text-sm text-slate-600">
              <Clock size={16} />
              <span>{timeText}</span>
            </div>
          )}
          {right}
          {onLogout && (
            <button className="btn btn-muted" onClick={onLogout}>
              <LogOut size={16} /> ออกจากระบบ
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
