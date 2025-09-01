import React from 'react';
export default function Modal({ open, onClose, children, title }){
  if(!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={onClose}>
      <div className="card w-[min(560px,92vw)] p-5" onClick={e=>e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-bold">{title}</h3>
          <button className="btn btn-ghost" onClick={onClose}>Close</button>
        </div>
        <hr className="my-4 border-white/10" />
        {children}
      </div>
    </div>
  );
}
