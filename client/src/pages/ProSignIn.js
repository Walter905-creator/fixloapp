import React, { useState } from "react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

export default function ProSignIn() {
  const [formData, setFormData] = useState({
    email: "",
    password: ""
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setError(""); // Clear error when user types
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:3001';
      const response = await fetch(`${apiUrl}/api/auth/signin`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (data.success) {
        // Redirect to pro dashboard on successful login
        window.location.href = '/pro/dashboard';
      } else {
        setError(data.error || 'Invalid email or password');
      }
    } catch (error) {
      setError('Network error. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Navbar />
      <main style={{ maxWidth: 500, margin: "0 auto", padding: "24px 16px" }}>
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <h1 style={{ fontSize: 32, margin: "4px 0" }}>Professional Sign In</h1>
          <p style={{ color: "#475569", fontSize: 16 }}>
            Welcome back! Sign in to access your professional dashboard.
          </p>
        </div>

        <div style={{ background: "#ffffff", border: "1px solid #e5e7eb", borderRadius: 16, padding: 32 }}>
          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: 20 }}>
              <label style={{ display: "block", marginBottom: 8, fontWeight: 600, color: "#374151" }}>
                Email Address
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                style={inputStyle}
                placeholder="your@email.com"
              />
            </div>

            <div style={{ marginBottom: 24 }}>
              <label style={{ display: "block", marginBottom: 8, fontWeight: 600, color: "#374151" }}>
                Password
              </label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
                style={inputStyle}
                placeholder="Enter your password"
              />
            </div>

            {error && (
              <div style={{
                padding: 12,
                borderRadius: 8,
                marginBottom: 20,
                background: '#fef2f2',
                color: '#dc2626',
                border: '1px solid #fecaca',
                fontSize: 14
              }}>
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              style={{
                ...buttonStyle,
                opacity: isLoading ? 0.7 : 1,
                cursor: isLoading ? 'not-allowed' : 'pointer'
              }}
            >
              {isLoading ? 'Signing In...' : 'Sign In'}
            </button>
          </form>

          <div style={{ textAlign: "center", marginTop: 24 }}>
            <a href="#" style={{ color: "#0f172a", textDecoration: "none", fontSize: 14 }}>
              Forgot your password?
            </a>
          </div>
        </div>

        <div style={{ marginTop: 32, textAlign: "center" }}>
          <div style={{ display: "flex", alignItems: "center", marginBottom: 16 }}>
            <div style={{ flex: 1, height: 1, background: "#e5e7eb" }}></div>
            <span style={{ padding: "0 16px", color: "#6b7280", fontSize: 14 }}>New to Fixlo?</span>
            <div style={{ flex: 1, height: 1, background: "#e5e7eb" }}></div>
          </div>
          
          <a 
            href="/"
            style={{
              display: "inline-block",
              padding: "12px 24px",
              background: "#f8fafc",
              color: "#0f172a",
              textDecoration: "none",
              border: "1px solid #e5e7eb",
              borderRadius: 8,
              fontWeight: 600,
              transition: "all 0.2s"
            }}
            onMouseOver={(e) => {
              e.target.style.background = "#f1f5f9";
            }}
            onMouseOut={(e) => {
              e.target.style.background = "#f8fafc";
            }}
          >
            Join as a Professional
          </a>
        </div>

        <section style={{ marginTop: 48 }}>
          <h2 style={{ fontSize: 20, marginBottom: 16, textAlign: "center" }}>Professional Benefits</h2>
          <div style={{ display: "grid", gap: 16 }}>
            <div style={benefitStyle}>
              <div style={{ fontSize: 24, marginBottom: 8 }}>📱</div>
              <div>
                <h3 style={{ margin: "0 0 4px", fontSize: 16, fontWeight: 600 }}>Instant Job Alerts</h3>
                <p style={{ margin: 0, color: "#6b7280", fontSize: 14 }}>Get notified immediately when homeowners request your services nearby</p>
              </div>
            </div>
            
            <div style={benefitStyle}>
              <div style={{ fontSize: 24, marginBottom: 8 }}>💳</div>
              <div>
                <h3 style={{ margin: "0 0 4px", fontSize: 16, fontWeight: 600 }}>Secure Payments</h3>
                <p style={{ margin: 0, color: "#6b7280", fontSize: 14 }}>Get paid quickly and securely through our integrated payment system</p>
              </div>
            </div>
            
            <div style={benefitStyle}>
              <div style={{ fontSize: 24, marginBottom: 8 }}>⭐</div>
              <div>
                <h3 style={{ margin: "0 0 4px", fontSize: 16, fontWeight: 600 }}>Build Your Reputation</h3>
                <p style={{ margin: 0, color: "#6b7280", fontSize: 14 }}>Collect reviews and showcase your work to attract more customers</p>
              </div>
            </div>
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
  boxSizing: "border-box",
  outline: "none",
  transition: "border-color 0.2s"
};

const buttonStyle = {
  width: "100%",
  padding: "14px 20px",
  background: "#0f172a",
  color: "white",
  border: 0,
  borderRadius: 8,
  fontSize: 16,
  fontWeight: 600,
  cursor: "pointer"
};

const benefitStyle = {
  display: "flex",
  gap: 16,
  padding: 16,
  background: "#f8fafc",
  border: "1px solid #e5e7eb",
  borderRadius: 12,
  alignItems: "flex-start"
};