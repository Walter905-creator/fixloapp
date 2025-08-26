import React from "react";
import { Link } from "react-router-dom";
import Logo from "./Logo";

export default function Navbar({ onRequestService, onJoinPro }) {
  return (
    <header style={{borderBottom: "1px solid #eee"}}>
      <div style={{display:"flex", alignItems:"center", justifyContent:"space-between", maxWidth:1100, margin:"0 auto", padding:"12px 16px"}}>
        <Link to="/" style={{display:"flex", alignItems:"center", gap:10, textDecoration:"none"}}>
          <Logo className="h-10 w-auto" alt="Fixlo 2025 Logo" />
        </Link>
        <nav style={{display:"flex", gap:16, alignItems:"center"}}>
          <a href="#services" style={navLink}>Services</a>
          <a href="#how" style={navLink}>How It Works</a>
          <Link to="/assistant" style={navLink}>AI Assistant</Link>
          <Link to="/contact" style={navLink}>Contact</Link>
          <Link to="/pro/signin" style={navLink}>Pro Sign In</Link>
          <button onClick={onJoinPro} style={primaryBtn}>Join Now</button>
        </nav>
      </div>
    </header>
  );
}

const navLink = { color: "#0f172a", textDecoration: "none" };
const primaryBtn = { padding: "8px 12px", borderRadius: 10, background: "#0f172a", color: "white", border: 0, cursor: "pointer" };
