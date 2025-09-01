import React, { useState } from "react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

export default function AIAssistant() {
  const [messages, setMessages] = useState([
    {
      type: 'assistant',
      content: "Hi! I'm Fixlo's AI Assistant. I can help you with home improvement advice, suggest what type of professional you might need, and answer questions about common maintenance tasks. What can I help you with today?"
    }
  ]);
  const [inputMessage, setInputMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!inputMessage.trim() || isLoading) return;

    const userMessage = inputMessage.trim();
    setInputMessage("");
    setIsLoading(true);

    // Add user message
    setMessages(prev => [...prev, { type: 'user', content: userMessage }]);

    try {
      const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:3001';
      const response = await fetch(`${apiUrl}/api/ai/ask`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message: userMessage }),
      });

      const data = await response.json();

      if (data.success) {
        setMessages(prev => [...prev, { 
          type: 'assistant', 
          content: data.response 
        }]);
      } else {
        setMessages(prev => [...prev, { 
          type: 'assistant', 
          content: "Sorry, I'm having trouble right now. Please try again or contact our support team for help." 
        }]);
      }
    } catch (error) {
      setMessages(prev => [...prev, { 
        type: 'assistant', 
        content: "I'm experiencing some technical difficulties. Please try again in a moment or reach out to our support team." 
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Navbar />
      <main style={{ maxWidth: 900, margin: "0 auto", padding: "24px 16px" }}>
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <h1 style={{ fontSize: 32, margin: "4px 0" }}>🤖 AI Assistant</h1>
          <p style={{ color: "#475569", fontSize: 18 }}>
            Get instant help with home improvement advice and professional recommendations
          </p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 32 }}>
          <div style={{ background: "#f8fafc", borderRadius: 16, padding: 24, height: "70vh", display: "flex", flexDirection: "column" }}>
            <div style={{ flex: 1, overflowY: "auto", marginBottom: 16 }}>
              {messages.map((message, index) => (
                <div
                  key={index}
                  style={{
                    marginBottom: 16,
                    display: "flex",
                    justifyContent: message.type === 'user' ? 'flex-end' : 'flex-start'
                  }}
                >
                  <div
                    style={{
                      maxWidth: "80%",
                      padding: "12px 16px",
                      borderRadius: 16,
                      background: message.type === 'user' ? '#0f172a' : '#ffffff',
                      color: message.type === 'user' ? '#ffffff' : '#0f172a',
                      border: message.type === 'assistant' ? '1px solid #e5e7eb' : 'none',
                      whiteSpace: "pre-wrap"
                    }}
                  >
                    {message.content}
                  </div>
                </div>
              ))}
              {isLoading && (
                <div style={{ display: "flex", justifyContent: 'flex-start', marginBottom: 16 }}>
                  <div style={{
                    padding: "12px 16px",
                    borderRadius: 16,
                    background: '#ffffff',
                    border: '1px solid #e5e7eb',
                    color: '#475569'
                  }}>
                    Thinking...
                  </div>
                </div>
              )}
            </div>
            
            <form onSubmit={handleSubmit} style={{ display: "flex", gap: 8 }}>
              <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                placeholder="Ask me about home improvement, repairs, or what professional you need..."
                style={{
                  flex: 1,
                  padding: "12px 16px",
                  border: "1px solid #d1d5db",
                  borderRadius: 8,
                  fontSize: 16,
                  outline: "none"
                }}
                disabled={isLoading}
              />
              <button
                type="submit"
                disabled={isLoading || !inputMessage.trim()}
                style={{
                  padding: "12px 20px",
                  background: "#0f172a",
                  color: "white",
                  border: 0,
                  borderRadius: 8,
                  cursor: isLoading || !inputMessage.trim() ? "not-allowed" : "pointer",
                  opacity: isLoading || !inputMessage.trim() ? 0.6 : 1
                }}
              >
                Send
              </button>
            </form>
          </div>

          <div>
            <h2 style={{ fontSize: 20, marginBottom: 16 }}>💡 Sample Questions</h2>
            <div style={{ display: "grid", gap: 12 }}>
              {sampleQuestions.map((question, index) => (
                <button
                  key={index}
                  onClick={() => setInputMessage(question)}
                  style={{
                    padding: "12px 16px",
                    background: "#ffffff",
                    border: "1px solid #e5e7eb",
                    borderRadius: 8,
                    textAlign: "left",
                    cursor: "pointer",
                    fontSize: 14,
                    transition: "all 0.2s"
                  }}
                  onMouseOver={(e) => e.target.style.background = "#f1f5f9"}
                  onMouseOut={(e) => e.target.style.background = "#ffffff"}
                >
                  {question}
                </button>
              ))}
            </div>

            <div style={{ marginTop: 32 }}>
              <h3 style={{ fontSize: 18, marginBottom: 12 }}>🔧 What I Can Help With</h3>
              <ul style={{ color: "#475569", lineHeight: 1.6, paddingLeft: 20 }}>
                <li>Home repair and maintenance advice</li>
                <li>When to DIY vs hire a professional</li>
                <li>Safety guidelines for home projects</li>
                <li>Matching you with the right type of pro</li>
                <li>Project planning and preparation</li>
                <li>Cost estimation guidance</li>
              </ul>
            </div>

            <div style={{ marginTop: 24, padding: 16, background: "#fef3c7", borderRadius: 8, border: "1px solid #fcd34d" }}>
              <p style={{ margin: 0, fontSize: 14, color: "#92400e" }}>
                <strong>Safety First:</strong> For electrical, plumbing, or structural work, I always recommend consulting licensed professionals.
              </p>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}

const sampleQuestions = [
  "How do I fix a leaky faucet?",
  "What type of pro do I need for electrical work?",
  "How much should kitchen renovation cost?",
  "When should I replace my HVAC system?",
  "How do I prepare for a bathroom remodel?",
  "What are signs I need a plumber?",
  "How do I choose the right contractor?",
  "What permits do I need for home additions?"
];