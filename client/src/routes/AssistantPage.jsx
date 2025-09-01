import React, { useState } from 'react';
import HelmetSEO from '../seo/HelmetSEO';
export default function AssistantPage(){
  const [q, setQ] = useState('');
  const [messages, setMessages] = useState([{role:'assistant', content:'Hi! Ask me about services, pricing, or scheduling.'}]);
  const send = async (e)=>{ e.preventDefault(); if(!q.trim()) return; setMessages(m=>[...m,{role:'user',content:q},{role:'assistant',content:'(Demo) Thanks! A team member will follow up by SMS.'}]); setQ(''); };
  return (<>
    <HelmetSEO title="AI Assistant | Fixlo" canonicalPathname="/assistant" />
    <div className="container">
      <h1>Assistant</h1>
      <div className="card">
        <div style={{minHeight:180}}>
          {messages.map((m,i)=>(<div key={i} style={{margin:'8px 0'}}><strong>{m.role==='user'?'You':'Fixlo'}</strong><br/><span className="small">{m.content}</span></div>))}
        </div>
        <form onSubmit={send} style={{display:'flex', gap:8, marginTop:12}}>
          <input value={q} onChange={e=>setQ(e.target.value)} placeholder="Ask anything..." />
          <button className="btn" type="submit">Send</button>
        </form>
      </div>
    </div>
  </>);
}
