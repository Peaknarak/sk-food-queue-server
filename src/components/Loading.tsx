// src/components/Loading.tsx
import React from 'react'

export default function Loading({ label='กำลังโหลด...' }: { label?: string }) {
  return (
    <div className="w-full py-10 flex flex-col items-center gap-3 text-slate-600">
      <div className="h-6 w-6 animate-spin rounded-full border-2 border-slate-300 border-t-slate-500" />
      <div className="text-sm">{label}</div>
    </div>
  )
}
