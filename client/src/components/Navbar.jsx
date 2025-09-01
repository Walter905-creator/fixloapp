import React from 'react';
import { Link, NavLink } from 'react-router-dom';
const items=[
  {to:'/',label:'Home'},{to:'/services',label:'Services'},{to:'/how-it-works',label:'How It Works'},
  {to:'/assistant',label:'AI Assistant'},{to:'/contact',label:'Contact'},{to:'/pricing',label:'Pricing'},
  {to:'/pro/sign-in',label:'Pro Sign In'},{to:'/admin',label:'Admin'},{to:'/pro/dashboard',label:'Pro Dashboard'},{to:'/join',label:'Join Now'}
];
export default function Navbar(){
  return(<nav className="nav"><div className="brand"><Link to="/">Fixlo</Link></div><div style={{display:'flex',flexWrap:'wrap'}}>
    {items.map(i=>(<NavLink key={i.to} to={i.to} style={({isActive})=>({margin:'0 10px',fontWeight:isActive?800:600})}>{i.label}</NavLink>))}
  </div></nav>);
}
