import React, { useState } from 'react';
import HelmetSEO from '../seo/HelmetSEO';

export default function AssistantPage() {
  const [q, setQ] = useState('');
  const [messages, setMessages] = useState([{
    role: 'assistant', 
    content: `I'm Fixlo AI Home Expert.

I help homeowners decide whether a project is safe to do themselves and guide them step by step — or recommend a professional when it's not.

What are you working on today?`
  }]);
  
  const send = async (e) => {
    e.preventDefault();
    if (!q.trim()) return;
    
    // Add user message to chat
    const userMessage = { role: 'user', content: q };
    setMessages(m => [...m, userMessage]);
    setQ('');
    
    // TODO: Replace with actual API call to /api/ai/ask
    // For now, provide a professional placeholder response
    const assistantMessage = {
      role: 'assistant',
      content: 'I understand you need help with this project. To provide accurate guidance, I need to gather more information first.\n\nCould you tell me more about:\n1. What specific issue or project you\'re working on?\n2. Have you noticed any visual damage or symptoms?\n3. Do you have the necessary tools and materials?\n4. What is your level of experience with this type of work?\n\nThis information will help me determine if this is safe for DIY or if I should recommend a professional.'
    };
    
    setMessages(m => [...m, assistantMessage]);
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
          </div>
          <form onSubmit={send} className="mt-4 flex gap-2">
            <input 
              className="flex-1 rounded-xl border border-slate-300 bg-white px-3 py-2" 
              value={q} 
              onChange={e => setQ(e.target.value)} 
              placeholder="Describe your home repair project..." 
            />
            <button className="btn btn-primary" type="submit">Send</button>
          </form>
        </div>
      </div>
    </>
  );
}
