import React, { useState } from "react";

export default function ServiceRequestForm({ presetService = "", presetCity = "", onSubmitted }) {
  const [form, setForm] = useState({
    fullName: "",
    phone: "",
    email: "",
    service: presetService || "",
    city: presetCity || "",
    address: "",
    description: "",
    preferredDate: "",
    preferredTime: "",
    smsConsent: false
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [ok, setOk] = useState(false);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  async function submit() {
    setError("");
    if (!form.fullName || !form.phone || !form.service) {
      setError("Please fill your name, phone, and service.");
      return;
    }
    if (!form.smsConsent) {
      setError("You must agree to receive SMS updates to proceed.");
      return;
    }
    setLoading(true);
    try {
      const payload = { ...form, source: "website" };
      async function postTo(url) {
        const res = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
          credentials: "include"
        });
        return res;
      }
      // Try common endpoints in this order
      let res = await postTo("/api/leads");
      if (!res.ok) res = await postTo("/api/requests");
      if (!res.ok) res = await postTo("/api/lead");
      if (!res.ok) throw new Error(`Request failed (${res.status})`);
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
          <h3 style={{ marginTop: 0 }}>Request received ✅</h3>
          <p>Thanks! We’ll text you updates shortly. You can reply STOP to unsubscribe.</p>
        </div>
      ) : (
        <form onSubmit={(e) => (e.preventDefault(), submit())}>
          <div style={rowStyles}>
            <div style={colStyles}>
              <label style={label}>Full name</label>
              <input style={input} value={form.fullName} onChange={e=>set("fullName", e.target.value)} placeholder="John Doe"/>
            </div>
            <div style={colStyles}>
              <label style={label}>Phone</label>
              <input style={input} value={form.phone} onChange={e=>set("phone", e.target.value)} placeholder="555-123-4567"/>
            </div>
          </div>

          <div style={rowStyles}>
            <div style={colStyles}>
              <label style={label}>Email (optional)</label>
              <input style={input} type="email" value={form.email} onChange={e=>set("email", e.target.value)} placeholder="you@example.com"/>
            </div>
            <div style={colStyles}>
              <label style={label}>Service</label>
              <select style={input} value={form.service} onChange={e=>set("service", e.target.value)}>
                <option value="">Select a service</option>
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
          </div>

          <div style={rowStyles}>
            <div style={colStyles}>
              <label style={label}>City</label>
              <input style={input} value={form.city} onChange={e=>set("city", e.target.value)} placeholder="Miami"/>
            </div>
            <div style={colStyles}>
              <label style={label}>Address (optional)</label>
              <input style={input} value={form.address} onChange={e=>set("address", e.target.value)} placeholder="123 Main St"/>
            </div>
          </div>

          <div>
            <label style={label}>Describe your project</label>
            <textarea style={{...input, height: 100}} value={form.description} onChange={e=>set("description", e.target.value)} placeholder="Tell us what you need help with"/>
          </div>

          <div style={rowStyles}>
            <div style={colStyles}>
              <label style={label}>Preferred date</label>
              <input style={input} type="date" value={form.preferredDate} onChange={e=>set("preferredDate", e.target.value)}/>
            </div>
            <div style={colStyles}>
              <label style={label}>Preferred time</label>
              <input style={input} type="time" value={form.preferredTime} onChange={e=>set("preferredTime", e.target.value)}/>
            </div>
          </div>

          <div style={{marginTop: 12}}>
            <label style={{display: "flex", alignItems: "flex-start", gap: 8}}>
              <input type="checkbox" checked={form.smsConsent} onChange={e=>set("smsConsent", e.target.checked)} required />
              <span style={{fontSize: 13, color: "#475569"}}>
                I agree to receive SMS updates related to my request, including job status and appointment reminders. 
                Message & data rates may apply. Reply STOP to unsubscribe.
              </span>
            </label>
          </div>

          {error && <div style={{color: "crimson", marginTop: 10}}>{error}</div>}

          <button type="submit" disabled={loading} style={primaryBtn}>
            {loading ? "Submitting..." : "Submit request"}
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
