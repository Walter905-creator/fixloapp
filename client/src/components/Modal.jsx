import React from 'react';
export default function Modal({ open, onClose, children, title }){
  if(!open) return null;
  return (<div className="modal-backdrop" onClick={onClose}><div className="modal" onClick={e=>e.stopPropagation()}>
    <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
      <h3>{title}</h3><button className="btn ghost" onClick={onClose}>Close</button>
    </div><hr/>{children}
  </div></div>);
}
