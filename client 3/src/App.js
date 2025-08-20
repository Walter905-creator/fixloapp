import React from 'react';
import { Routes, Route, NavLink } from 'react-router-dom';
import Home from './pages/Home';
import Signup from './pages/Signup';
import Services from './pages/Services';
import ProSignup from './pages/ProSignup';
import ProGallery from './pages/ProGallery';

export default function App(){
  return (
    <div style={{minHeight:'100vh', display:'flex', flexDirection:'column'}}>
      <nav style={{borderBottom:'1px solid #e5e7eb'}}>
        <div className="container" style={{display:'flex', alignItems:'center', justifyContent:'space-between'}}>
          <div className="logo">FIXLO</div>
          <div>
            <NavLink to="/" end>Home</NavLink>
            <NavLink to="/services">Services</NavLink>
            <NavLink to="/signup">Sign up</NavLink>
            <NavLink to="/pro/signup">Pro signup</NavLink>
            <NavLink to="/pro/gallery">Pro gallery</NavLink>
          </div>
        </div>
      </nav>
      <main className="container" style={{flex:1}}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/services" element={<Services />} />
          <Route path="/pro/signup" element={<ProSignup />} />
          <Route path="/pro/gallery" element={<ProGallery />} />
          <Route path="*" element={<Home />} />
        </Routes>
      </main>
      <footer className="container">© {new Date().getFullYear()} Fixlo · All rights reserved.</footer>
    </div>
  );
}
