import React, { useState } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import HelmetSEO from '../seo/HelmetSEO';
import { API_BASE } from '../utils/config';

export default function ProSignInPage(){
  const api = API_BASE;
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { login } = useAuth();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  async function submit(e){
    e.preventDefault();
    setLoading(true);
    setError('');
    
    const form = new FormData(e.currentTarget);
    const payload = { phone: form.get('phone'), password: form.get('password') };
    
    try{
      const url = `${api}/api/pro-auth/login`;
      const res = await fetch(url, { 
        method:'POST', 
        headers:{'Content-Type':'application/json'}, 
        body: JSON.stringify(payload)
      });
      
      const data = await res.json();
      
      if(res.ok){
        if(data?.token && data?.pro) {
          // Store auth data using AuthContext
          const userData = {
            role: 'pro',
            id: data.pro.id,
            name: data.pro.name,
            email: data.pro.email,
            trade: data.pro.trade,
            phone: data.pro.phone,
            isAdmin: !!data.pro.isAdmin  // Explicit boolean conversion
          };
          login(data.token, userData);
          
          // Check for redirect parameter
          const redirectPath = searchParams.get('redirect');
          if (redirectPath) {
            navigate(redirectPath);
          } else {
            navigate('/pro/dashboard');
          }
        } else {
          setError('Login failed - invalid response format.');
        }
      } else {
        // Check if password reset is required
        if (data.requiresPasswordReset) {
          setError('Password not set. Please use "Forgot password?" to reset your password.');
        } else {
          setError(data.error || 'Login failed. Please check your credentials.');
        }
      }
    } catch(err) {
      console.error('Login error:', err);
      setError('Could not reach server. Please try again.');
    } finally {
      setLoading(false);
    }
  }
  
  return (<>
    <HelmetSEO title="Pro Sign In | Fixlo" canonicalPathname="/pro/sign-in" />
    <div className="container-xl py-8">
      <div className="max-w-md mx-auto">
        <h1 className="text-2xl font-extrabold mb-6">Pro Sign In</h1>
        
        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-800">
            {error}
          </div>
        )}
        
        <div className="card p-6">
          <form onSubmit={submit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-800 mb-1">Phone Number</label>
              <input 
                name="phone" 
                className="mt-1 w-full rounded-xl border border-slate-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" 
                type="tel" 
                placeholder="(555) 123-4567"
                required
                disabled={loading}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-800 mb-1">Password</label>
              <input 
                name="password" 
                className="mt-1 w-full rounded-xl border border-slate-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" 
                type="password" 
                placeholder="Enter your password"
                required
                disabled={loading}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <Link 
                to="/pro/forgot-password" 
                className="text-sm text-blue-600 hover:text-blue-700 hover:underline"
              >
                Forgot password?
              </Link>
            </div>
            
            <button 
              className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed" 
              disabled={loading}
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>
        </div>
      </div>
    </div>
  </>);
}
