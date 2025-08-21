import { useEffect, useState } from 'react';
import { getJSON } from '../lib/api';

export default function ReviewsFeed(){
  const [items,setItems]=useState([]);

  useEffect(()=>{
    (async()=>{
      try{
        const { items } = await getJSON('/reviews/latest');
        setItems(items || []);
      }catch(e){ /* no-op */ }
    })();
  },[]);

  if(!items.length) return null;

  return (
    <section className="container" style={{padding:'2rem 0'}}>
      <h2 className="text-xl font-bold mb-3">Recent reviews</h2>
      <div style={{columns:'300px', columnGap:'1rem'}}>
        {items.map((r,i)=>(
          <div key={i} style={{breakInside:'avoid', marginBottom:'1rem', background:'#fff', borderRadius:'12px', padding:'12px', boxShadow:'0 1px 3px rgba(0,0,0,0.08)'}}>
            {r.photos?.[0]?.url && <img src={r.photos[0].url} alt={r.photos[0].alt||'review photo'} style={{width:'100%', borderRadius:'8px', marginBottom:'8px'}}/>}
            <div className="text-sm text-slate-600 mb-1">⭐ {r.rating}/5</div>
            <div className="text-sm">{r.text}</div>
            {r.homeownerName && <div className="text-xs text-slate-500 mt-2">— {r.homeownerName}</div>}
          </div>
        ))}
      </div>
    </section>
  );
}