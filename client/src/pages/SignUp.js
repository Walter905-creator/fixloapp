import React, { useState } from 'react';
import axios from 'axios';
import './SignUp.css';

/*
Twilio Sample Messages for verification purposes:
1. "You are now subscribed to Fixlo alerts. Reply STOP to unsubscribe."
2. "You have successfully been unsubscribed. Reply START to resubscribe."
3. "Reply STOP to unsubscribe. Msg & Data rates may apply. For help, contact support@fixloapp.com"
*/

const SignUp = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    trade: '',
    experience: '',
    location: '',
    smsConsent: false
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    // Validation
    if (formData.password !== formData.confirmPassword) {
      setMessage('Passwords do not match');
      setLoading(false);
      return;
    }

    if (!formData.smsConsent) {
      setMessage('You must agree to receive SMS messages to continue');
      setLoading(false);
      return;
    }

    try {
      const API_URL = process.env.REACT_APP_API_URL || 'https://fixloapp.onrender.com';
      
      // Submit to API to register user
      const response = await axios.post(`${API_URL}/api/auth/register`, {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        password: formData.password,
        trade: formData.trade,
        experience: formData.experience,
        location: formData.location
      });

      if (response.data.success) {
        const userId = response.data.user._id;
        const email = response.data.user.email;

        // Create Stripe checkout session
        const checkoutRes = await axios.post(`${API_URL}/api/stripe/create-checkout-session`, {
          email,
          userId
        });

        // Redirect to Stripe
        window.location.href = checkoutRes.data.url;
      }
    } catch (error) {
      console.error("Signup error:", error);
      setMessage(error.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="signup-container">
      <div className="signup-header">
        <h1>🔧 Join Fixlo as a Professional</h1>
        <p>Connect with homeowners and grow your business</p>
      </div>

      <form className="signup-form" onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="name">Full Name *</label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
            placeholder="Enter your full name"
          />
        </div>

        <div className="form-group">
          <label htmlFor="email">Email Address *</label>
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            required
            placeholder="your@email.com"
          />
        </div>

        <div className="form-group">
          <label htmlFor="phone">Phone Number *</label>
          <input
            type="tel"
            id="phone"
            name="phone"
            value={formData.phone}
            onChange={handleChange}
            required
            placeholder="(555) 123-4567"
          />
        </div>

        <div className="form-group">
          <label htmlFor="trade">Trade/Service *</label>
          <select
            id="trade"
            name="trade"
            value={formData.trade}
            onChange={handleChange}
            required
          >
            <option value="">Select your trade</option>
            <option value="plumbing">🚰 Plumbing</option>
            <option value="electrical">💡 Electrical</option>
            <option value="carpentry">🪚 Carpentry</option>
            <option value="painting">🎨 Painting</option>
            <option value="hvac">❄️ HVAC</option>
            <option value="roofing">🏠 Roofing</option>
            <option value="landscaping">🌿 Landscaping</option>
            <option value="cleaning">🧹 House Cleaning</option>
            <option value="general">🔧 General Handyman</option>
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="experience">Years of Experience *</label>
          <select
            id="experience"
            name="experience"
            value={formData.experience}
            onChange={handleChange}
            required
          >
            <option value="">Select experience level</option>
            <option value="0-2">0-2 years</option>
            <option value="3-5">3-5 years</option>
            <option value="6-10">6-10 years</option>
            <option value="10+">10+ years</option>
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="location">Service Area *</label>
          <input
            type="text"
            id="location"
            name="location"
            value={formData.location}
            onChange={handleChange}
            required
            placeholder="City, State or ZIP code"
          />
        </div>

        <div className="form-group">
          <label htmlFor="password">Password *</label>
          <input
            type="password"
            id="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            required
            placeholder="Create a secure password"
            minLength="6"
          />
        </div>

        <div className="form-group">
          <label htmlFor="confirmPassword">Confirm Password *</label>
          <input
            type="password"
            id="confirmPassword"
            name="confirmPassword"
            value={formData.confirmPassword}
            onChange={handleChange}
            required
            placeholder="Confirm your password"
            minLength="6"
          />
        </div>

        <div className="form-group">
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
            <input
              type="checkbox"
              name="smsConsent"
              checked={formData.smsConsent}
              onChange={handleChange}
              required
              style={{ 
                width: 'auto',
                marginRight: '8px',
                transform: 'scale(1.2)'
              }}
            />
            <span style={{ fontSize: '0.9rem', lineHeight: '1.4' }}>
              I agree to receive SMS messages from Fixlo about my account and job opportunities. 
              Message and data rates may apply. Reply STOP to unsubscribe.{' '}
              <a href="/privacy" target="_blank" style={{ color: '#667eea' }}>Privacy Policy</a>.
            </span>
          </label>
        </div>

        {/* Twilio SMS Opt-in Disclaimer */}
        <p style={{ 
          fontSize: '0.9rem', 
          color: '#666', 
          marginTop: '12px',
          textAlign: 'left',
          lineHeight: '1.4'
        }} aria-label="SMS opt-in terms and messaging disclaimer">
          By submitting this form, you consent to receive SMS messages from Fixlo about your request or account. 
          Message and data rates may apply. Reply STOP to unsubscribe. View our{' '}
          <a href="/privacy" target="_blank" style={{ color: '#667eea' }}>Privacy Policy</a>.
        </p>

        {message && (
          <div className={`message ${message.includes('successful') ? 'success' : 'error'}`}>
            {message}
          </div>
        )}

        <button type="submit" className="signup-btn" disabled={loading}>
          {loading ? 'Creating Account...' : 'Join Fixlo - $59.99/month'}
        </button>

        <div className="signup-benefits">
          <h3>What's Included:</h3>
          <ul>
            <li>✅ Unlimited job notifications</li>
            <li>✅ Professional background check</li>
            <li>✅ Secure payment processing</li>
            <li>✅ Customer review system</li>
            <li>✅ 24/7 support</li>
          </ul>
        </div>
      </form>
    </div>
  );
};

export default SignUp;
