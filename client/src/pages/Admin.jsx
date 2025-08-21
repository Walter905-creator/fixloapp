import { useEffect, useState } from 'react';
import { getJSON } from '../lib/api';

export default function Admin(){
  const [token] = useState(localStorage.getItem('fixlo_admin_token'));
  const [data, setData] = useState(null);
  const [err, setErr] = useState('');

  useEffect(()=>{
    if(!token){ window.location.href='/admin/login'; return; }
    (async ()=>{
      try{
        const res = await getJSON('/admin/pros', token); // sample protected call
        setData(res);
      }catch(e){
        setErr('Unauthorized'); localStorage.removeItem('fixlo_admin_token'); window.location.href='/admin/login';
      }
    })();
  },[token]);

  if(!token) return null;

  return (
    <div className="max-w-6xl mx-auto py-8 px-4">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        <button 
          onClick={() => {
            localStorage.removeItem('fixlo_admin_token');
            window.location.href='/admin/login';
          }}
          className="px-4 py-2 text-red-600 border border-red-600 rounded-lg hover:bg-red-50"
        >
          Logout
        </button>
      </div>
      
      {err && <div className="text-red-600 mb-4 p-4 bg-red-50 rounded-lg">{err}</div>}
      
      {data ? (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Professional Data</h2>
          <pre className="bg-gray-50 p-4 rounded-lg overflow-auto text-sm">
            {JSON.stringify(data, null, 2)}
          </pre>
        </div>
      ) : (
        <div className="flex items-center justify-center py-12">
          <div className="text-gray-500">Loading...</div>
        </div>
      )}
    </div>
  );
}