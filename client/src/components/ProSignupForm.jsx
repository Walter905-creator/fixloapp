import React, { useState } from "react";

export default function ProSignupForm({ onSubmitted }) {
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    phone: "",
    email: "",
    trade: "",
    city: "",
    smsConsent: false
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [ok, setOk] = useState(false);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  async function submit() {
    setError("");
    if (!form.firstName || !form.lastName || !form.phone || !form.trade) {
      setError("Please complete name, phone, and trade.");
      return;
    }
    if (!form.smsConsent) {
      setError("You must agree to receive SMS updates to proceed.");
      return;
    }
    setLoading(true);
    try {
      const payload = { ...form, role: "pro" };
      async function postTo(url) {
        const res = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
          credentials: "include"
        });
        return res;
      }
      // Try common endpoints
      let res = await postTo("/api/pros/signup");
      if (!res.ok) res = await postTo("/api/pros");
      if (!res.ok) res = await postTo("/api/signup/pro");
      if (!res.ok) throw new Error(`Signup failed (${res.status})`);
      setOk(true);
      onSubmitted?.();
    } catch (e) {
      setError(e.message || "Submission failed. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      {ok ? (
        <div>
          <h3 style={{ marginTop: 0 }}>Welcome to Fixlo ✅</h3>
          <p>We’ll text you next steps to finish verification and activate job alerts. Reply STOP to unsubscribe.</p>
        </div>
      ) : (
        <form onSubmit={(e) => (e.preventDefault(), submit())}>
          <div style={rowStyles}>
            <div style={colStyles}>
              <label style={label}>First name</label>
              <input style={input} value={form.firstName} onChange={e=>set("firstName", e.target.value)} />
            </div>
            <div style={colStyles}>
              <label style={label}>Last name</label>
              <input style={input} value={form.lastName} onChange={e=>set("lastName", e.target.value)} />
            </div>
          </div>
          <div style={rowStyles}>
            <div style={colStyles}>
              <label style={label}>Phone</label>
              <input style={input} value={form.phone} onChange={e=>set("phone", e.target.value)} placeholder="555-123-4567"/>
            </div>
            <div style={colStyles}>
              <label style={label}>Email</label>
              <input style={input} type="email" value={form.email} onChange={e=>set("email", e.target.value)} placeholder="pro@example.com"/>
            </div>
          </div>
          <div style={rowStyles}>
            <div style={colStyles}>
              <label style={label}>Trade</label>
              <select style={input} value={form.trade} onChange={e=>set("trade", e.target.value)}>
                <option value="">Select a trade</option>
                <option>Plumbing</option>
                <option>Electrical</option>
                <option>Carpentry</option>
                <option>Painting</option>
                <option>HVAC</option>
                <option>Roofing</option>
                <option>House Cleaning</option>
                <option>Junk Removal</option>
                <option>Landscaping</option>
              </select>
            </div>
            <div style={colStyles}>
              <label style={label}>City</label>
              <input style={input} value={form.city} onChange={e=>set("city", e.target.value)} placeholder="Charlotte"/>
            </div>
          </div>

          <div style={{marginTop: 12}}>
            <label style={{display: "flex", alignItems: "flex-start", gap: 8}}>
              <input type="checkbox" checked={form.smsConsent} onChange={e=>set("smsConsent", e.target.checked)} required />
              <span style={{fontSize: 13, color: "#475569"}}>
                I agree to receive SMS about job alerts, account updates, and billing from Fixlo.
                Message & data rates may apply. Reply STOP to unsubscribe.
              </span>
            </label>
          </div>

          {error && <div style={{color: "crimson", marginTop: 10}}>{error}</div>}

          <button type="submit" disabled={loading} style={primaryBtn}>
            {loading ? "Submitting..." : "Create pro account"}
          </button>
        </form>
      )}
    </div>
  );
}

const rowStyles = { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 };
const colStyles = { display: "flex", flexDirection: "column", gap: 6 };
const label = { fontSize: 14, color: "#111827" };
const input = { padding: "10px 12px", borderRadius: 10, border: "1px solid #e5e7eb", width: "100%" };
const primaryBtn = { marginTop: 16, padding: "10px 14px", borderRadius: 10, background: "#0f172a", color: "white", border: 0, cursor: "pointer" };
