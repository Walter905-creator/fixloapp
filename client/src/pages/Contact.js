import React, { useState } from "react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

export default function Contact() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: ""
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState(null);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitStatus(null);

    try {
      const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:3001';
      const response = await fetch(`${apiUrl}/api/contact`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (data.success) {
        setSubmitStatus({ type: 'success', message: data.message });
        setFormData({ name: "", email: "", subject: "", message: "" });
      } else {
        setSubmitStatus({ type: 'error', message: data.error || 'Failed to send message' });
      }
    } catch (error) {
      setSubmitStatus({ type: 'error', message: 'Network error. Please try again later.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Navbar />
      <main style={{ maxWidth: 800, margin: "0 auto", padding: "24px 16px" }}>
        <h1 style={{ fontSize: 32, margin: "4px 0" }}>Contact Us</h1>
        <p style={{ color: "#475569", marginBottom: 24 }}>
          Have a question or need help? We're here to assist you.
        </p>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 32, marginBottom: 32 }}>
          <div>
            <h2 style={{ fontSize: 24, marginBottom: 16 }}>Get in Touch</h2>
            <div style={{ marginBottom: 16 }}>
              <h3 style={{ fontSize: 18, marginBottom: 8 }}>📧 Email</h3>
              <p style={{ color: "#475569" }}>support@fixloapp.com</p>
            </div>
            <div style={{ marginBottom: 16 }}>
              <h3 style={{ fontSize: 18, marginBottom: 8 }}>📞 Phone</h3>
              <p style={{ color: "#475569" }}>1-800-FIXLO-1</p>
            </div>
            <div>
              <h3 style={{ fontSize: 18, marginBottom: 8 }}>⏰ Hours</h3>
              <p style={{ color: "#475569" }}>Monday - Friday: 8am - 8pm EST<br />Weekend: 9am - 6pm EST</p>
            </div>
          </div>

          <div>
            <h2 style={{ fontSize: 24, marginBottom: 16 }}>Send a Message</h2>
            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: "block", marginBottom: 4, fontWeight: 600 }}>Name</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  style={inputStyle}
                />
              </div>
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: "block", marginBottom: 4, fontWeight: 600 }}>Email</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  style={inputStyle}
                />
              </div>
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: "block", marginBottom: 4, fontWeight: 600 }}>Subject</label>
                <input
                  type="text"
                  name="subject"
                  value={formData.subject}
                  onChange={handleChange}
                  required
                  style={inputStyle}
                />
              </div>
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: "block", marginBottom: 4, fontWeight: 600 }}>Message</label>
                <textarea
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  required
                  rows={5}
                  style={{ ...inputStyle, minHeight: 120, resize: "vertical" }}
                />
              </div>
              
              {submitStatus && (
                <div style={{
                  padding: 12,
                  borderRadius: 8,
                  marginBottom: 16,
                  background: submitStatus.type === 'success' ? '#dcfce7' : '#fef2f2',
                  color: submitStatus.type === 'success' ? '#166534' : '#dc2626',
                  border: `1px solid ${submitStatus.type === 'success' ? '#bbf7d0' : '#fecaca'}`
                }}>
                  {submitStatus.message}
                </div>
              )}
              
              <button
                type="submit"
                disabled={isSubmitting}
                style={{
                  ...buttonStyle,
                  opacity: isSubmitting ? 0.7 : 1,
                  cursor: isSubmitting ? 'not-allowed' : 'pointer'
                }}
              >
                {isSubmitting ? 'Sending...' : 'Send Message'}
              </button>
            </form>
          </div>
        </div>

        <section style={{ marginTop: 48 }}>
          <h2 style={{ fontSize: 24, marginBottom: 16 }}>Frequently Asked Questions</h2>
          <div style={{ display: "grid", gap: 16 }}>
            <details style={faqStyle}>
              <summary style={summaryStyle}>How quickly do you respond to messages?</summary>
              <div style={answerStyle}>We typically respond within 24 hours during business days.</div>
            </details>
            <details style={faqStyle}>
              <summary style={summaryStyle}>Can I get help with my service request?</summary>
              <div style={answerStyle}>Absolutely! We're here to help with any questions about your service requests, matching with professionals, or platform features.</div>
            </details>
            <details style={faqStyle}>
              <summary style={summaryStyle}>Do you offer phone support?</summary>
              <div style={answerStyle}>Yes, we offer phone support during business hours. You can also reach us through this contact form or email.</div>
            </details>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}

const inputStyle = {
  width: "100%",
  padding: "12px 16px",
  border: "1px solid #d1d5db",
  borderRadius: 8,
  fontSize: 16,
  boxSizing: "border-box"
};

const buttonStyle = {
  padding: "12px 24px",
  background: "#0f172a",
  color: "white",
  border: 0,
  borderRadius: 8,
  fontSize: 16,
  fontWeight: 600,
  cursor: "pointer",
  width: "100%"
};

const faqStyle = {
  border: "1px solid #e5e7eb",
  borderRadius: 12,
  padding: 16
};

const summaryStyle = {
  cursor: "pointer",
  fontWeight: 600,
  fontSize: 16
};

const answerStyle = {
  marginTop: 8,
  color: "#475569",
  paddingLeft: 16
};