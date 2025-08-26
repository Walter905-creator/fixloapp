import React, { useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { api } from "../lib/api";

export default function AdminDashboard() {
  const [pros, setPros] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");

  async function fetchPros() {
    setError("");
    setLoading(true);
    try {
      let data = await api("/api/admin/professionals");
      if (!Array.isArray(data) && !data?.data) data = await api("/api/professionals");
      /* data already loaded above */
      const list = Array.isArray(data) ? data : data.data || [];
      const safe = list.map(p => ({
        id: p._id || p.id,
        name: [p.firstName, p.lastName].filter(Boolean).join(" ") || p.name || "—",
        trade: p.primaryService || p.trade || "—",
        email: p.email || "—",
        phone: p.phone || "—",
        city: p.location?.address?.split(",")[0] || "—",
        isVerified: !!p.isVerified,
        verificationStatus: p.verificationStatus || "unverified",
        joinedDate: p.joinedDate || p.createdAt
      }));
      setPros(safe);
    } catch (e) {
      setError(e.message || "Failed to load professionals");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { fetchPros(); }, []);

  async function toggleVerify(pro) {
    try {
      const urlA = `/api/admin/professionals/${pro.id}/${pro.isVerified ? "unverify" : "verify"}`;
      const urlB = `/api/admin/professionals/${pro.id}`;
      let res = await fetch(urlA, { method: "POST", credentials: "include" });
      if (!res.ok) res = await fetch(urlB, { method: "PATCH", credentials: "include", headers: {"Content-Type":"application/json"}, body: JSON.stringify({ isVerified: !pro.isVerified }) });
      if (!res.ok) throw new Error("Verify failed");
      fetchPros();
    } catch (e) {
      alert(e.message);
    }
  }

  const filtered = query ? pros.filter(p => (p.name+p.trade+p.email+p.phone).toLowerCase().includes(query.toLowerCase())) : pros;

  return (
    <>
      <Navbar />
      <main style={{maxWidth: 1100, margin:"0 auto", padding:"24px 16px"}}>
        <h1 style={{fontSize: 28, margin:"4px 0"}}>Admin Dashboard</h1>
        <div style={{display:"flex", gap:12, margin:"12px 0"}}>
          <input placeholder="Search professionals…" value={query} onChange={e=>setQuery(e.target.value)} style={{flex:1, padding:"10px 12px", borderRadius:10, border:"1px solid #e5e7eb"}}/>
          <button onClick={fetchPros} style={btn}>Refresh</button>
        </div>

        {loading ? <div>Loading…</div> : error ? <div style={{color:"crimson"}}>{error}</div> : (
          <div style={{overflowX:"auto"}}>
            <table style={{minWidth: 800, width:"100%"}}>
              <thead>
                <tr>
                  <th style={th}>Name</th><th style={th}>Trade</th><th style={th}>Email</th><th style={th}>Phone</th><th style={th}>City</th><th style={th}>Verified</th><th style={th}>Joined</th><th style={th}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(p => (
                  <tr key={p.id} style={{borderTop:"1px solid #eee"}}>
                    <td style={td}>{p.name}</td>
                    <td style={td}>{p.trade}</td>
                    <td style={td}>{p.email}</td>
                    <td style={td}>{p.phone}</td>
                    <td style={td}>{p.city}</td>
                    <td style={td}>{p.isVerified ? "Yes" : p.verificationStatus}</td>
                    <td style={td}>{p.joinedDate ? new Date(p.joinedDate).toLocaleDateString() : "—"}</td>
                    <td style={td}><button onClick={() => toggleVerify(p)} style={btnSmall}>{p.isVerified ? "Unverify" : "Verify"}</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
      <Footer />
    </>
  );
}

const btn = { padding:"10px 12px", borderRadius:10, background:"#0f172a", color:"#fff", border:0, cursor:"pointer" };
const btnSmall = { padding:"6px 8px", borderRadius:8, background:"#0f172a", color:"#fff", border:0, cursor:"pointer" };
const th = { textAlign:"left", padding:"10px 8px", fontWeight:600, color:"#0f172a" };
const td = { padding:"10px 8px" };
