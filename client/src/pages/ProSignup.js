import React, { useState } from "react";
import { Helmet } from 'react-helmet-async';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

export default function ProSignup() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    trade: "",
    location: "",
    dob: "",
    smsConsent: false, // unchecked by default
    termsConsent: false,
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const onChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((f) => ({ ...f, [name]: type === "checkbox" ? checked : value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    // Basic required fields
    const required = ["name", "email", "phone", "trade", "location", "dob"];
    for (const k of required) {
      if (!form[k]) {
        setError(`Please fill out ${k}.`);
        return;
      }
    }

    // Enforce consent (checkbox must be checked)
    if (!form.smsConsent) {
      setError("Please consent to receive automated SMS in order to proceed.");
      return;
    }
    if (!form.termsConsent) {
      setError("Please agree to the Terms of Service and Privacy Policy.");
      return;
    }

    try {
      setSubmitting(true);

      // (Optional) save the pro in your DB first:
      // await fetch("/api/pro-signup", { ...form })

      // Then immediately create Stripe Checkout and redirect
      const resp = await fetch("/api/subscribe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: form.email }), // priceId can also be passed here
      });
      const data = await resp.json();
      if (!resp.ok || !data?.url) {
        throw new Error(data?.error || "Could not start checkout");
      }

      window.location.assign(data.url); // go to Stripe Checkout
    } catch (err) {
      console.error(err);
      setError(err.message || "Something went wrong");
      setSubmitting(false);
    }
  };

  return (
    <>
      <Helmet>
        <title>Join as a Professional - Fixlo</title>
        <meta 
          name="description" 
          content="Join Fixlo as a trusted home service professional. Connect with homeowners in your area and grow your business. Sign up today to start receiving service requests." 
        />
        <link rel="canonical" href="https://www.fixloapp.com/pro/signup" />
      </Helmet>
      <Navbar />
      <main className="container" style={{ padding: "3rem 0" }}>
        <h1 className="text-3xl font-bold mb-6">Join Fixlo as a Pro</h1>
        <form onSubmit={handleSubmit} style={{ maxWidth: 640 }}>
          {/* your inputs */}
          <div className="grid gap-3">
            <input name="name" value={form.name} onChange={onChange} placeholder="Full name" className="input" style={{border:'1px solid #e5e7eb',borderRadius:'1rem',padding:'0.75rem'}} />
            <input name="email" type="email" value={form.email} onChange={onChange} placeholder="Email" className="input" style={{border:'1px solid #e5e7eb',borderRadius:'1rem',padding:'0.75rem'}} />
            <input name="phone" value={form.phone} onChange={onChange} placeholder="Phone" className="input" style={{border:'1px solid #e5e7eb',borderRadius:'1rem',padding:'0.75rem'}} />
            <input name="trade" value={form.trade} onChange={onChange} placeholder="Trade (e.g., Plumbing)" className="input" style={{border:'1px solid #e5e7eb',borderRadius:'1rem',padding:'0.75rem'}} />
            <input name="location" value={form.location} onChange={onChange} placeholder="City, State" className="input" style={{border:'1px solid #e5e7eb',borderRadius:'1rem',padding:'0.75rem'}} />
            <input name="dob" type="date" value={form.dob} onChange={onChange} className="input" style={{border:'1px solid #e5e7eb',borderRadius:'1rem',padding:'0.75rem'}} />
          </div>

          {/* Required SMS consent (unchecked by default) */}
          <label className="block mt-4 text-sm leading-6">
            <input
              type="checkbox"
              name="smsConsent"
              checked={form.smsConsent}
              onChange={onChange}
              className="mr-2"
            />
            I expressly consent to receive automated SMS text messages from Fixlo, including job leads,
            scheduling updates, and promotional messages. Message frequency varies; up to 20 msgs/mo.
            Message & data rates may apply. Reply <strong>STOP</strong> to opt out, <strong>HELP</strong> for help.
            See our <a href="/terms" target="_blank" rel="noreferrer">Terms</a> and{" "}
            <a href="/privacy" target="_blank" rel="noreferrer">Privacy Policy</a>.
          </label>

          {/* Terms box */}
          <label className="block mt-2 text-sm leading-6">
            <input
              type="checkbox"
              name="termsConsent"
              checked={form.termsConsent}
              onChange={onChange}
              className="mr-2"
            />
            I agree to the Terms of Service and Privacy Policy.
          </label>

          {error && <p className="text-red-600 mt-3">{error}</p>}

          <button
            type="submit"
            className="btn btn-primary mt-5"
            style={{width:'100%'}}
            disabled={submitting}
          >
            {submitting ? "Redirecting to Stripe…" : "Continue to Payment"}
          </button>
        </form>
      </main>
      <Footer />
    </>
  );
}