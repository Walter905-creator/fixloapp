import { useState } from 'react';
import { postJSON } from '../lib/api';

export default function AdminLogin() {
  const [email, setEmail] = useState('');
  const [password,setPassword] = useState('');
  const [err,setErr] = useState('');

  async function onSubmit(e){
    e.preventDefault();
    setErr('');
    try{
      const { token } = await postJSON('/auth/login', { email, password });
      localStorage.setItem('fixlo_admin_token', token);
      window.location.href='/admin';
    }catch(e){ setErr('Login failed');}
  }

  return (
    <div className="max-w-md mx-auto py-16 px-4">
      <h1 className="text-2xl font-bold mb-4">Admin sign in</h1>
      {err && <div className="text-red-600 mb-2">{err}</div>}
      <form onSubmit={onSubmit} className="space-y-3">
        <input 
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" 
          placeholder="Email" 
          type="email"
          value={email} 
          onChange={e=>setEmail(e.target.value)} 
        />
        <input 
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" 
          type="password" 
          placeholder="Password" 
          value={password} 
          onChange={e=>setPassword(e.target.value)} 
        />
        <button className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition-colors">
          Sign in
        </button>
      </form>
    </div>
  );
}