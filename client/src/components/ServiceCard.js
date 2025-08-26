import React from "react";

export default function ServiceCard({ emoji, title, desc, onClick }) {
  return (
    <button onClick={onClick} style={cardBtn} aria-label={title}>
      <div style={emojiWrap}>{emoji}</div>
      <div style={{textAlign:"left"}}>
        <h3 style={{margin:"4px 0", fontSize:18}}>{title}</h3>
        <p style={{color:"#475569", margin:"6px 0 0"}}>{desc}</p>
      </div>
    </button>
  );
}

const cardBtn = { textAlign:"left", width:"100%", display:"flex", gap:12, padding:16, border:"1px solid #e5e7eb", borderRadius:14, background:"#fff", cursor:"pointer" };
const emojiWrap = { fontSize: 24, lineHeight: "24px" };
