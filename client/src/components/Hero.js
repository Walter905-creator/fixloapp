import React from "react";

export default function Hero({ onRequestService }) {
  return (
    <section style={{background:"#f8fafc", borderBottom:"1px solid #eee"}}>
      <div style={{maxWidth:1100, margin:"0 auto", padding:"40px 16px"}}>
        <h1 style={{fontSize: 36, margin: 0}}>Welcome to Fixlo</h1>
        <p style={{color:"#475569", marginTop: 8}}>
          Your one-stop hub for connecting with trusted home service professionals. From plumbing to electrical, we've got you covered.
        </p>
        <div style={{display:"flex", gap:12, marginTop: 16}}>
          <button onClick={onRequestService} style={primaryBtn}>Request Service</button>
        </div>
      </div>
    </section>
  );
}

const primaryBtn = { padding: "12px 16px", borderRadius: 10, background: "#0f172a", color: "white", border: 0, cursor: "pointer" };
