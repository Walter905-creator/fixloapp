import React, { useState } from 'react';
import HelmetSEO from '../seo/HelmetSEO';
import { API_BASE } from '../utils/config';

export default function AssistantPage() {
  const [q, setQ] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [messages, setMessages] = useState([{
    role: 'assistant', 
    content: `I'm Fixlo AI Home Expert.

I help homeowners decide whether a project is safe to do themselves and guide them step by step — or recommend a professional when it's not.

What are you working on today?`
  }]);
  
  const send = async (e) => {
    e.preventDefault();
    const prompt = q.trim();
    if (!prompt || sending) return;
    
    // Add user message to chat
    const userMessage = { role: 'user', content: prompt };
    setMessages(m => [...m, userMessage]);
    setQ('');
    setSending(true);
    setError('');

    try {
      const response = await fetch(`${API_BASE}/api/ai/ask`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ message: prompt })
      });

      const data = await response.json().catch(() => ({}));
      const failureMessage = data?.error || data?.fallback || data?.message || 'Unable to load AI guidance right now.';
      if (!response.ok || !data?.response) {
        throw new Error(failureMessage);
      }

      setMessages((m) => [...m, {
        role: 'assistant',
        content: data.response
      }]);
    } catch (err) {
      setError(err.message || 'Unable to load AI guidance right now.');
      setMessages((m) => [...m, {
        role: 'assistant',
        content: 'I’m unable to respond right now. Please try again in a moment or request help from a Fixlo professional.'
      }]);
    } finally {
      setSending(false);
    }
  };
  
  return (
    <>
      <HelmetSEO title="Fixlo AI Home Expert | Professional Home Repair Guidance" canonicalPathname="/assistant" />
      <div className="container-xl py-8">
        <h1 className="text-2xl font-extrabold">Fixlo AI Home Expert</h1>
        <div className="card p-5">
          <div className="min-h-40 space-y-3">
            {messages.map((m, i) => (
              <div key={i}>
                <strong>{m.role === 'user' ? 'You' : 'Fixlo AI Home Expert'}</strong>
                <div className="text-sm text-slate-700 whitespace-pre-line">{m.content}</div>
              </div>
            ))}
            {sending ? <div className="text-sm text-slate-500">Fixlo AI Home Expert is reviewing your project…</div> : null}
          </div>
          {error ? <p className="mt-4 text-sm text-red-600">{error}</p> : null}
          <form onSubmit={send} className="mt-4 flex gap-2">
            <input 
              className="flex-1 rounded-xl border border-slate-300 bg-white px-3 py-2" 
              value={q} 
              onChange={e => setQ(e.target.value)} 
              placeholder="Describe your home repair project..." 
              disabled={sending}
            />
            <button className="btn btn-primary" type="submit" disabled={sending}>
              {sending ? 'Sending…' : 'Send'}
            </button>
          </form>
        </div>
      </div>
    </>
  );
}
