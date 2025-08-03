import React from 'react';
import { Link } from 'react-router-dom';

const Footer = () => {
  return (
    <footer style={{
      background: '#333',
      color: 'white',
      padding: '3rem 2rem 2rem',
      marginTop: '4rem'
    }}>
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto',
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
        gap: '2rem'
      }}>
        
        {/* Company Info */}
        <div>
          <h3 style={{ marginBottom: '1rem', color: '#ff6b6b' }}>Fixlo</h3>
          <p style={{ marginBottom: '1rem', lineHeight: '1.6' }}>
            Professional home services made simple. Connect with verified professionals 
            for all your home repair and maintenance needs.
          </p>
          <div style={{ textAlign: 'center', fontSize: '0.875rem', color: '#6b7280', marginTop: '1.5rem' }}>
            📧 <a href="mailto:pro4u.improvements@gmail.com" style={{ textDecoration: 'underline', color: '#6b7280' }}>
              pro4u.improvements@gmail.com
            </a>
          </div>
        </div>

        {/* Services */}
        <div>
          <h4 style={{ marginBottom: '1rem', color: '#4ecdc4' }}>Services</h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <span style={{ color: '#ccc', fontSize: '0.9rem' }}>🔧 Handyman Services</span>
            <span style={{ color: '#ccc', fontSize: '0.9rem' }}>🚰 Plumbing</span>
            <span style={{ color: '#ccc', fontSize: '0.9rem' }}>⚡ Electrical</span>
            <span style={{ color: '#ccc', fontSize: '0.9rem' }}>🌡️ HVAC</span>
            <span style={{ color: '#ccc', fontSize: '0.9rem' }}>🧹 Cleaning</span>
            <span style={{ color: '#ccc', fontSize: '0.9rem' }}>🌿 Landscaping</span>
          </div>
        </div>

        {/* Quick Links */}
        <div>
          <h4 style={{ marginBottom: '1rem', color: '#667eea' }}>Quick Links</h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <Link to="/how-it-works" style={{ color: '#ccc', textDecoration: 'none', fontSize: '0.9rem' }}>How It Works</Link>
            <Link to="/pricing" style={{ color: '#ccc', textDecoration: 'none', fontSize: '0.9rem' }}>Pricing</Link>
            <Link to="/download" style={{ color: '#ccc', textDecoration: 'none', fontSize: '0.9rem' }}>Download App</Link>
            <Link to="/signup" style={{ color: '#ccc', textDecoration: 'none', fontSize: '0.9rem' }}>Sign Up</Link>
            <Link to="/pro-support" style={{ color: '#ccc', textDecoration: 'none', fontSize: '0.9rem' }}>For Professionals</Link>
            <Link to="/support" style={{ color: '#ccc', textDecoration: 'none', fontSize: '0.9rem' }}>Customer Support</Link>
          </div>
        </div>

        {/* Legal & Contact */}
        <div>
          <h4 style={{ marginBottom: '1rem', color: '#ffd700' }}>Legal & Contact</h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <Link to="/contact" style={{ color: '#ccc', textDecoration: 'none', fontSize: '0.9rem' }}>Contact Us</Link>
            <Link to="/terms-of-service" style={{ color: '#ccc', textDecoration: 'none', fontSize: '0.9rem' }}>Terms of Service</Link>
            <Link to="/privacy" style={{ color: '#ccc', textDecoration: 'none', fontSize: '0.9rem' }}>Privacy Policy</Link>
            <a href="mailto:pro4u.improvements@gmail.com" style={{ color: '#ccc', textDecoration: 'none', fontSize: '0.9rem' }}>Email Support</a>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div style={{
        borderTop: '1px solid #555',
        marginTop: '2rem',
        paddingTop: '1rem',
        textAlign: 'center',
        color: '#aaa',
        fontSize: '0.9rem'
      }}>
        <p>© 2024 Fixlo. All rights reserved. | Made with ❤️ for homeowners and professionals.</p>
        <p style={{ marginTop: '0.5rem' }}>
          🔒 Secure payments via Stripe | 🛡️ Background checks via Checkr | ⭐ Satisfaction guaranteed
        </p>
      </div>
    </footer>
  );
};

export default Footer;
