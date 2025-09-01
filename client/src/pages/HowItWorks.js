import React from "react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import HelmetSEO from "../seo/HelmetSEO";

export default function HowItWorks() {
  const steps = [
    { n: 1, title: "Tell us what you need", desc: "Pick your service, describe the job, and choose your preferred time." },
    { n: 2, title: "We match you with pros", desc: "Our system alerts vetted local pros within your radius instantly." },
    { n: 3, title: "Get quotes fast", desc: "Pros text you back, confirm details, and give a price estimate." },
    { n: 4, title: "Get it done", desc: "Approve the job and relax—payment and updates are handled securely." }
  ];

  return (
    <>
      <HelmetSEO 
        title="How Fixlo Works – Fast, Safe Home Service Booking | Fixlo"
        description="Learn how Fixlo connects you with vetted local professionals in 4 simple steps. From request to completion, get fast quotes and quality service."
        canonicalPathname="/how-it-works"
      />
      <Navbar />
      <main style={{maxWidth: 1000, margin: "0 auto", padding: "24px 16px"}}>
        <h1 style={{fontSize: 32, margin: "4px 0"}}>How Fixlo Works</h1>
        <p style={{color:"#475569"}}>Fast, safe, and simple — from request to completion.</p>
        <div style={{display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(240px, 1fr))", gap: 12, marginTop: 16}}>
          {steps.map(s => (
            <div key={s.n} style={{border:"1px solid #e5e7eb", borderRadius: 14, padding: 16}}>
              <div style={{fontSize: 22, fontWeight: 700, marginBottom: 6}}>Step {s.n}</div>
              <div style={{fontWeight: 600}}>{s.title}</div>
              <div style={{color:"#475569", marginTop: 6}}>{s.desc}</div>
            </div>
          ))}
        </div>

        <section style={{marginTop: 24}}>
          <h2 style={{fontSize: 24}}>Questions</h2>
          <details style={faq}><summary style={sum}>Is Fixlo free for homeowners?</summary><div style={ans}>Yes. Homeowners can request quotes and book jobs for free.</div></details>
          <details style={faq}><summary style={sum}>How are professionals vetted?</summary><div style={ans}>Pros complete identity and background checks and maintain good ratings.</div></details>
          <details style={faq}><summary style={sum}>How do payments work?</summary><div style={ans}>Payments are processed securely and you receive receipts automatically.</div></details>
        </section>
      </main>
      <Footer />
    </>
  );
}

const faq = {border:"1px solid #e5e7eb", borderRadius:12, padding:12, marginTop:10};
const sum = {cursor:"pointer", fontWeight:600};
const ans = {marginTop:8, color:"#475569"};
