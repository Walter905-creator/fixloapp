import React, { useState } from "react";
import { Link } from "react-router-dom";
import Logo from "./Logo";

export default function Navbar({ onRequestService, onJoinPro }) {
  const [open, setOpen] = useState(false);

  return (
    <header style={{borderBottom: "1px solid #eee", position:"sticky", top:0, background:"#fff", zIndex:50}}>
      <div style={wrap}>
        <Link to="/" style={brand}>
          <Logo className="h-10 w-auto" alt="Fixlo 2025 Logo" />
        </Link>

        {/* Desktop nav */}
        <nav className="nav-desktop" style={navDesktop}>
          <a href="#services" style={navLink}>Services</a>
          <Link to="/how-it-works" style={navLink}>How It Works</Link>
          <Link to="/assistant" style={navLink}>AI Assistant</Link>
          <Link to="/contact" style={navLink}>Contact</Link>
          <Link to="/pro/signin" style={navLink}>Pro Sign In</Link>
          <Link to="/admin" style={navLink}>Admin</Link>
          <Link to="/pro/dashboard" style={navLink}>Pro Dashboard</Link>
          <button onClick={onJoinPro} style={primaryBtn}>Join Now</button>
        </nav>

        {/* Mobile controls */}
        <div className="nav-mobile" style={navMobile}>
          <button aria-label="Menu" onClick={() => setOpen(!open)} style={menuBtn}>☰</button>
        </div>
      </div>

      {/* Mobile drawer */}
      {open && (
        <div style={drawer}>
          <a href="#services" style={item} onClick={()=>setOpen(false)}>Services</a>
          <Link to="/how-it-works" style={item} onClick={()=>setOpen(false)}>How It Works</Link>
          <Link to="/assistant" style={item} onClick={()=>setOpen(false)}>AI Assistant</Link>
          <Link to="/contact" style={item} onClick={()=>setOpen(false)}>Contact</Link>
          <Link to="/pro/signin" style={item} onClick={()=>setOpen(false)}>Pro Sign In</Link>
          <Link to="/admin" style={item} onClick={()=>setOpen(false)}>Admin Dashboard</Link>
          <Link to="/pro/dashboard" style={item} onClick={()=>setOpen(false)}>Pro Dashboard</Link>
          <button onClick={() => { setOpen(false); onJoinPro?.(); }} style={{...primaryBtn, width:"100%"}}>Join Now</button>
        </div>
      )}
    </header>
  );
}

const wrap = {display:"flex", alignItems:"center", justifyContent:"space-between", maxWidth:1100, margin:"0 auto", padding:"12px 16px"};
const brand = {display:"flex", alignItems:"center", gap:10, textDecoration:"none"};
const navDesktop = {display:"flex", gap:16, alignItems:"center"};
const navMobile = {display:"none"};
const navLink = { color: "#0f172a", textDecoration: "none", whiteSpace:"nowrap" };
const primaryBtn = { padding: "8px 12px", borderRadius: 10, background: "#0f172a", color: "white", border: 0, cursor: "pointer", whiteSpace:"nowrap" };
const menuBtn = { padding:"8px 10px", borderRadius:10, background:"#0f172a", color:"#fff", border:0, cursor:"pointer" };

const drawer = {
  display:"none"
};

const item = { display:"block", padding:"12px 16px", borderBottom:"1px solid #eee", textDecoration:"none", color:"#0f172a" };

/* Responsive tweaks via inline class hooks are defined in index.css */
