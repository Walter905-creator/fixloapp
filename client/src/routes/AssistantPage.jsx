import React, { useState } from 'react';
import HelmetSEO from '../seo/HelmetSEO';
export default function AssistantPage(){
  const [q, setQ] = useState('');
  const [messages, setMessages] = useState([{role:'assistant', content:'Hi! Ask me about services, pricing, or scheduling.'}]);
  const send = (e)=>{ e.preventDefault(); if(!q.trim()) return; setMessages(m=>[...m,{role:'user',content:q},{role:'assistant',content:'(Demo) Thanks! A team member will follow up by SMS.'}]); setQ(''); };
  return (<>
    <HelmetSEO title="AI Assistant | Fixlo" canonicalPathname="/assistant" />
    <div className="container-xl py-8">
      <h1 className="text-2xl font-extrabold">Assistant</h1>
      <div className="card p-5">
        <div className="min-h-40 space-y-3">
          {messages.map((m,i)=>(<div key={i}><strong>{m.role==='user'?'You':'Fixlo'}</strong><div className="text-sm text-slate-700">{m.content}</div></div>))}
        </div>
        <form onSubmit={send} className="mt-4 flex gap-2">
          <input className="flex-1 rounded-xl border border-slate-300 bg-white px-3 py-2" value={q} onChange={e=>setQ(e.target.value)} placeholder="Ask anything..." />
          <button className="btn btn-primary" type="submit">Send</button>
        </form>
      </div>
    </div>
  </>);
}
