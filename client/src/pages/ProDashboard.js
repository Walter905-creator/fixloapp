import React, { useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { api } from "../lib/api";

export default function ProDashboard() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [active, setActive] = useState(true);

  async function fetchJobs() {
    setError("");
    setLoading(true);
    try {
      let data = await api("/api/pro/jobs?status=open");
      if (!Array.isArray(data) && !data?.data) data = await api("/api/jobs/open");
      /* data already loaded above */
      const list = Array.isArray(data) ? data : data.data || [];
      const mapped = list.map(j => ({
        id: j._id || j.id,
        service: j.service || j.type || "Service",
        city: j.city || j.location?.city || "—",
        desc: j.description || j.desc || "",
        createdAt: j.createdAt || j.date || new Date().toISOString()
      }));
      setJobs(mapped);
    } catch (e) {
      setError(e.message || "Failed to load jobs");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { fetchJobs(); }, []);

  async function act(jobId, action) {
    try {
      let res; try { await api(`/api/pro/jobs/${jobId}/${action}`, { method: "POST" }); res = { ok: true }; } catch(e) { res = { ok: false }; }
      if (!res.ok) { await api(`/api/jobs/${jobId}`, { method: "PATCH", headers: {"Content-Type":"application/json"}, body: JSON.stringify({ action }) }); res = { ok: true }; }
      if (!res.ok) throw new Error(action + " failed");
      fetchJobs();
    } catch (e) {
      alert(e.message);
    }
  }

  async function toggleActive() {
    setActive(a => !a);
    try {
      try { await api("/api/pro/active", { method: "POST", headers: {"Content-Type":"application/json"}, body: JSON.stringify({ active: !active }) }); } catch(e) { console.warn("Active toggle endpoint not available"); }
      if (!res.ok) console.warn("Active toggle endpoint not available");
    } catch {}
  }

  return (
    <>
      <Navbar />
      <main style={{maxWidth: 1000, margin:"0 auto", padding:"24px 16px"}}>
        <div style={{display:"flex", alignItems:"center", justifyContent:"space-between", gap:12}}>
          <h1 style={{fontSize: 28, margin:"4px 0"}}>Pro Dashboard</h1>
          <label style={{display:"flex", alignItems:"center", gap:8}}>
            <input type="checkbox" checked={active} onChange={toggleActive} />
            <span>Active for job alerts</span>
          </label>
        </div>

        {loading ? <div>Loading…</div> : error ? <div style={{color:"crimson"}}>{error}</div> : jobs.length === 0 ? (
          <div style={{marginTop: 12, color:"#475569"}}>No open jobs yet. New leads will appear here.</div>
        ) : (
          <div style={{display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(280px, 1fr))", gap:12, marginTop: 12}}>
            {jobs.map(j => (
              <div key={j.id} style={{border:"1px solid #e5e7eb", borderRadius:14, padding:16}}>
                <div style={{fontWeight:700}}>{j.service}</div>
                <div style={{color:"#475569", fontSize:14, marginTop:4}}>{j.city}</div>
                <div style={{color:"#334155", marginTop:8}}>{j.desc}</div>
                <div style={{color:"#94a3b8", fontSize:12, marginTop:8}}>Received {new Date(j.createdAt).toLocaleString()}</div>
                <div style={{display:"flex", gap:8, marginTop:12}}>
                  <button onClick={() => act(j.id, "accept")} style={btn}>Accept</button>
                  <button onClick={() => act(j.id, "decline")} style={btnOutline}>Decline</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
      <Footer />
    </>
  );
}

const btn = { padding:"10px 12px", borderRadius:10, background:"#0f172a", color:"#fff", border:0, cursor:"pointer" };
const btnOutline = { padding:"10px 12px", borderRadius:10, background:"#f1f5f9", color:"#0f172a", border:"1px solid #e5e7eb", cursor:"pointer" };
