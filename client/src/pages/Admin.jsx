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
    <div className="container" style={{padding:'2rem 0'}}>
      <h1 className="text-2xl font-bold mb-4">Admin</h1>
      {err && <div className="text-red-600">{err}</div>}
      {data ? <pre className="bg-slate-50 p-3 rounded">{JSON.stringify(data,null,2)}</pre> : 'Loading...'}
    </div>
  );
}