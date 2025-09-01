import React from 'react';
import HelmetSEO from '../seo/HelmetSEO';
import CloudinaryUploader from '../components/CloudinaryUploader';
export default function ProDashboardPage(){
  const api = import.meta.env.VITE_API_BASE || '';
  const [leads, setLeads] = React.useState([]);
  const [loaded, setLoaded] = React.useState(false);
  React.useEffect(()=>{
    async function load(){
      if(!api) { setLoaded(true); return; } // if no backend, skip fetch
      try{
        const res = await fetch(`${api}/api/pros/leads`, { credentials:'include' });
        if(res.ok){
          const data = await res.json();
          setLeads(Array.isArray(data) ? data : (data?.leads || []));
        }
      }catch(e){}
      setLoaded(true);
    }
    load();
  }, [api]);
  return (<>
    <HelmetSEO title="Pro Dashboard | Fixlo" canonicalPathname="/pro/dashboard" />
    <div className="container-xl py-8">
      <h1 className="text-2xl font-extrabold">Pro Dashboard</h1>
      <div className="grid md:grid-cols-3 gap-4 mt-4">
        <div className="card p-5 md:col-span-2">
          <h3 className="font-semibold">Leads</h3>
          {!loaded ? <div className="text-sm text-slate-400">Loading...</div> :
            (leads.length ? (
              <ul className="mt-2 space-y-2">
                {leads.map((l,i)=>(<li key={i} className="border border-white/10 rounded-xl p-3">
                  <div className="font-semibold">{l.service || 'Service'}</div>
                  <div className="text-sm text-slate-400">{l.name || '—'} • {l.phone || ''} • {l.city || ''}</div>
                </li>))}
              </ul>
            ) : <div className="text-sm text-slate-400">No leads yet.</div>)
          }
        </div>
        <div className="card p-5">
          <h3 className="font-semibold">Upload Insurance / License</h3>
          <p className="text-sm text-slate-400 mb-2">Uses Cloudinary if <code>VITE_CLOUDINARY_*</code> env vars are set.</p>
          <CloudinaryUploader onUploaded={(out)=>console.log('Uploaded:', out.secure_url)} />
        </div>
      </div>
    </div>
  </>);
}
