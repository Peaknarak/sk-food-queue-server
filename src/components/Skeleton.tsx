// src/components/Skeleton.tsx
import React from 'react'
export function Skel({ className='' }: { className?: string }) {
  return <div className={`animate-pulse bg-slate-200 rounded ${className}`} />
}
export function MenuSkeletonGrid() {
  return (
    <div className="grid sm:grid-cols-2 gap-4">
      {[...Array(4)].map((_,i)=>(
        <div key={i} className="card p-4 flex items-center justify-between">
          <div className="flex-1">
            <Skel className="h-4 w-40 mb-2" />
            <Skel className="h-3 w-24" />
          </div>
          <Skel className="h-9 w-28" />
        </div>
      ))}
    </div>
  )
}
