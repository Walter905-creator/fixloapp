import React, { useState } from 'react';
import axios from 'axios';
import './ContactUs.css';

/*
Twilio Sample Messages for verification purposes:
1. "You are now subscribed to Fixlo alerts. Reply STOP to unsubscribe."
2. "You have successfully been unsubscribed. Reply START to resubscribe."
3. "Reply STOP to unsubscribe. Msg & Data rates may apply. For help, contact pro4u.improvements@gmail.com"
*/

const ContactUs = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: ''
  });
  const [loading, setLoading] = useState(false);
  const [responseMessage, setResponseMessage] = useState('');

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setResponseMessage('');

    try {
      const API_URL = process.env.REACT_APP_API_URL || 'https://fixloapp.onrender.com';
      
      const response = await axios.post(`${API_URL}/api/contact`, formData);

      if (response.data.success) {
        setResponseMessage('Message sent successfully! We\'ll get back to you within 24 hours.');
        setFormData({
          name: '',
          email: '',
          phone: '',
          subject: '',
          message: ''
        });
      }
    } catch (error) {
      setResponseMessage('Failed to send message. Please try again or email us directly.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="contact-container">
      <div className="contact-header">
        <h1>📞 Contact Fixlo</h1>
        <p>Get in touch with our team - we're here to help!</p>
      </div>

      <div className="contact-content">
        <div className="contact-info">
          <h3>Get Support</h3>
          <div className="contact-method">
            <h4>📧 Email</h4>
            <p>pro4u.improvements@gmail.com</p>
          </div>
          <div className="contact-method">
            <h4>🚨 Emergency</h4>
            <p>For urgent issues, call our 24/7 emergency line:<br />
               (555) 911-FIXL</p>
          </div>
        </div>

        <form className="contact-form" onSubmit={handleSubmit}>
          <h3>Send us a Message</h3>
          
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="name">Full Name *</label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                placeholder="Your full name"
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
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="phone">Phone Number</label>
              <input
                type="tel"
                id="phone"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder="(555) 123-4567"
              />
            </div>

            <div className="form-group">
              <label htmlFor="subject">Subject *</label>
              <select
                id="subject"
                name="subject"
                value={formData.subject}
                onChange={handleChange}
                required
              >
                <option value="">Select a topic</option>
                <option value="general">General Inquiry</option>
                <option value="technical">Technical Support</option>
                <option value="billing">Billing Question</option>
                <option value="professional">Professional Account</option>
                <option value="partnership">Partnership Opportunity</option>
                <option value="feedback">Feedback</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="message">Message *</label>
            <textarea
              id="message"
              name="message"
              value={formData.message}
              onChange={handleChange}
              required
              rows="6"
              placeholder="Tell us how we can help you..."
            ></textarea>
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

          {responseMessage && (
            <div className={`message ${responseMessage.includes('successfully') ? 'success' : 'error'}`}>
              {responseMessage}
            </div>
          )}

          <button type="submit" className="contact-btn" disabled={loading}>
            {loading ? 'Sending...' : 'Send Message'}
          </button>
        </form>
      </div>

      <div className="faq-section">
        <h3>Frequently Asked Questions</h3>
        <div className="faq-grid">
          <div className="faq-item">
            <h4>How do I sign up as a professional?</h4>
            <p>Visit our <a href="/signup">signup page</a> and complete the professional registration form. We'll verify your credentials and set up your account.</p>
          </div>
          <div className="faq-item">
            <h4>How much does it cost?</h4>
            <p>For homeowners, Fixlo is completely free. Professionals pay $59.99/month for unlimited job notifications and access to our platform.</p>
          </div>
          <div className="faq-item">
            <h4>What areas do you serve?</h4>
            <p>Fixlo is available nationwide. We're constantly expanding to new cities and rural areas.</p>
          </div>
          <div className="faq-item">
            <h4>How do payments work?</h4>
            <p>All payments are processed securely through Stripe. Homeowners pay professionals directly through our platform.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContactUs;
