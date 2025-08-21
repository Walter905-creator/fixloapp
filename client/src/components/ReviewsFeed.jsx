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
    <section className="py-16 bg-gray-50">
      <div className="max-w-6xl mx-auto px-4">
        <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">Recent Reviews</h2>
        <div className="columns-1 md:columns-2 lg:columns-3 xl:columns-4 gap-6">
          {items.map((r,i)=>(
            <div key={i} className="break-inside-avoid mb-6 bg-white rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow">
              {r.photos?.[0]?.url && (
                <img 
                  src={r.photos[0].url} 
                  alt={r.photos[0].alt||'review photo'} 
                  className="w-full rounded-lg mb-4 aspect-video object-cover"
                />
              )}
              <div className="flex items-center mb-2">
                <div className="flex text-yellow-400">
                  {[...Array(5)].map((_, idx) => (
                    <span key={idx} className={idx < r.rating ? 'text-yellow-400' : 'text-gray-300'}>
                      ★
                    </span>
                  ))}
                </div>
                <span className="ml-2 text-sm text-gray-600">{r.rating}/5</span>
              </div>
              <p className="text-gray-700 text-sm mb-3 leading-relaxed">{r.text}</p>
              {r.homeownerName && (
                <div className="text-xs text-gray-500 font-medium">
                  — {r.homeownerName}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}