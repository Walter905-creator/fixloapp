import React, { useState } from "react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import Hero from "../components/Hero";
import ServiceCard from "../components/ServiceCard";
import Modal from "../components/Modal";
import ServiceRequestForm from "../components/ServiceRequestForm";
import ProSignupForm from "../components/ProSignupForm";
import ExitIntentModal from "../components/ExitIntentModal";

const services = [
  { emoji: "🔧", title: "Plumbing", desc: "Fix leaks, install fixtures, and drain cleaning" },
  { emoji: "⚡", title: "Electrical", desc: "Safe wiring, outlets, and lighting installation" },
  { emoji: "🔨", title: "Carpentry", desc: "Custom builds, repairs, and woodworking" },
  { emoji: "🎨", title: "Painting", desc: "Interior and exterior painting services" },
  { emoji: "❄️", title: "HVAC", desc: "Heating, cooling, and ventilation services" },
  { emoji: "🏠", title: "Roofing", desc: "Roof repairs, installation, and inspection" },
  { emoji: "🧽", title: "House Cleaning", desc: "Professional home cleaning services" },
  { emoji: "🗑️", title: "Junk Removal", desc: "Efficient junk and debris removal" },
  { emoji: "🌿", title: "Landscaping", desc: "Lawn care, gardening, and outdoor design" }
];

const popular = [
  { city: "Miami", queries: ["plumbing", "electrical", "hvac"] },
  { city: "New York", queries: ["plumbing", "electrical", "hvac"] },
  { city: "Los Angeles", queries: ["plumbing", "electrical", "hvac"] },
  { city: "Chicago", queries: ["plumbing", "electrical", "hvac"] },
  { city: "Houston", queries: ["plumbing", "electrical", "hvac"] },
  { city: "Phoenix", queries: ["plumbing", "electrical", "hvac"] }
];

export default function Home() {
  const [showServiceForm, setShowServiceForm] = useState(false);
  const [showProForm, setShowProForm] = useState(false);
  const [preset, setPreset] = useState({ service: "", city: "" });

  function openService(service = "", city = "") {
    setPreset({ service, city });
    setShowServiceForm(true);
  }

  return (
    <>
      <Navbar onRequestService={() => openService()} onJoinPro={() => setShowProForm(true)} />
      <main>
        <Hero onRequestService={() => openService()} />

        <section id="services" style={{maxWidth:1100, margin:"0 auto", padding:"24px 16px"}}>
          <h2 style={{fontSize:24, marginBottom:12}}>Select a Service</h2>
          <div style={{display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(280px, 1fr))", gap: 12}}>
            {services.map(s => (
              <ServiceCard key={s.title} emoji={s.emoji} title={s.title} desc={s.desc} onClick={() => openService(s.title)} />
            ))}
          </div>
        </section>

        <section id="popular" style={{maxWidth:1100, margin:"0 auto", padding:"24px 16px"}}>
          <h2 style={{fontSize:24, marginBottom:12}}>Popular Service Areas</h2>
          <div style={{display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(240px, 1fr))", gap: 12}}>
            {popular.map((p) => (
              <div key={p.city} style={{border:"1px solid #e5e7eb", borderRadius:14, padding:16}}>
                <h3 style={{margin:"4px 0"}}>{p.city}</h3>
                <div style={{display:"flex", flexDirection:"column", gap:8}}>
                  {p.queries.map(q => (
                    <button key={q} onClick={() => openService(q.charAt(0).toUpperCase()+q.slice(1), p.city)} style={{textAlign:"left", background:"#f8fafc", border:"1px solid #e5e7eb", borderRadius:10, padding:"8px 10px", cursor:"pointer"}}>
                      {q} in {p.city}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>

        <section id="join" style={{maxWidth:1100, margin:"0 auto", padding:"24px 16px"}}>
          <div style={{display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(240px, 1fr))", gap:12}}>
            <Feature emoji="✅" title="Background Checked" desc="Verified professionals you can trust" />
            <Feature emoji="📱" title="Real-time SMS" desc="Instant notifications for new jobs" />
            <Feature emoji="🤖" title="AI Assistant" desc="Smart tools to grow your business" />
            <Feature emoji="💳" title="Secure Payments" desc="Fast, secure payment processing" />
          </div>
          <div style={{marginTop:16}}>
            <button onClick={() => setShowProForm(true)} style={{padding:"12px 16px", borderRadius:10, background:"#0f172a", color:"white", border:0, cursor:"pointer"}}>
              Join Fixlo's Professional Network
            </button>
          </div>
        </section>
      </main>
      <Footer/>
      <ExitIntentModal/>

      <Modal open={showServiceForm} onClose={() => setShowServiceForm(false)} title="Request Service">
        <ServiceRequestForm presetService={preset.service} presetCity={preset.city} onSubmitted={() => {}} />
      </Modal>

      <Modal open={showProForm} onClose={() => setShowProForm(false)} title="Join as a Professional">
        <ProSignupForm onSubmitted={() => {}} />
      </Modal>
    </>
  );
}

function Feature({ emoji, title, desc }) {
  return (
    <div style={{display:"flex", gap:12, border:"1px solid #e5e7eb", borderRadius:14, padding:16}}>
      <div style={{fontSize:22}}>{emoji}</div>
      <div>
        <h3 style={{margin:"4px 0", fontSize:18}}>{title}</h3>
        <p style={{color:"#475569", margin:"6px 0 0"}}>{desc}</p>
      </div>
    </div>
  );
}
