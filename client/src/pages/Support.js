import React from 'react';

const Support = () => {
  return (
    <div style={{ padding: '6rem 2rem 4rem', maxWidth: '1000px', margin: '0 auto' }}>
      <h1 style={{ textAlign: 'center', fontSize: '3rem', marginBottom: '3rem', color: '#333' }}>
        🆘 Customer Support
      </h1>
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem', marginBottom: '4rem' }}>
        
        <div style={{ 
          background: 'linear-gradient(135deg, #ff6b6b 0%, #ee5a52 100%)', 
          color: 'white', 
          padding: '2rem', 
          borderRadius: '15px',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📧</div>
          <h3>Email Support</h3>
          <p><strong>pro4u.improvements@gmail.com</strong></p>
          <p>Response within 2-4 hours<br/>24/7 for emergencies</p>
        </div>

        <div style={{ 
          background: 'linear-gradient(135deg, #4ecdc4 0%, #44a08d 100%)', 
          color: 'white', 
          padding: '2rem', 
          borderRadius: '15px',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>💬</div>
          <h3>Live Chat</h3>
          <p><strong>Coming Soon in App</strong></p>
          <p>Real-time support<br/>Available 24/7</p>
        </div>
      </div>

      <div style={{ 
        background: '#f8f9fa', 
        padding: '3rem', 
        borderRadius: '15px', 
        marginBottom: '3rem' 
      }}>
        <h2 style={{ textAlign: 'center', marginBottom: '2rem' }}>❓ Frequently Asked Questions</h2>
        <div style={{ textAlign: 'left' }}>
          
          <details style={{ marginBottom: '1rem', cursor: 'pointer' }}>
            <summary style={{ fontWeight: 'bold', padding: '10px', background: 'white', borderRadius: '5px' }}>
              How are professionals verified?
            </summary>
            <p style={{ padding: '10px' }}>
              All professionals undergo background checks through Checkr, license verification, insurance validation, and reference checks.
            </p>
          </details>

          <details style={{ marginBottom: '1rem', cursor: 'pointer' }}>
            <summary style={{ fontWeight: 'bold', padding: '10px', background: 'white', borderRadius: '5px' }}>
              What if I'm not satisfied with the work?
            </summary>
            <p style={{ padding: '10px' }}>
              We offer a satisfaction guarantee. Contact support within 24 hours and we'll work to resolve any issues or provide a refund.
            </p>
          </details>

          <details style={{ marginBottom: '1rem', cursor: 'pointer' }}>
            <summary style={{ fontWeight: 'bold', padding: '10px', background: 'white', borderRadius: '5px' }}>
              How does payment work?
            </summary>
            <p style={{ padding: '10px' }}>
              Secure payments through Stripe. You're only charged after work is completed to your satisfaction.
            </p>
          </details>

          <details style={{ marginBottom: '1rem', cursor: 'pointer' }}>
            <summary style={{ fontWeight: 'bold', padding: '10px', background: 'white', borderRadius: '5px' }}>
              What services do you offer?
            </summary>
            <p style={{ padding: '10px' }}>
              Plumbing, Electrical, HVAC, Handyman services, Cleaning, Landscaping, and more. If it's a home service, we probably cover it!
            </p>
          </details>

          <details style={{ marginBottom: '1rem', cursor: 'pointer' }}>
            <summary style={{ fontWeight: 'bold', padding: '10px', background: 'white', borderRadius: '5px' }}>
              Do you offer emergency services?
            </summary>
            <p style={{ padding: '10px' }}>
              Yes! We have 24/7 emergency services for urgent plumbing, electrical, and HVAC issues.
            </p>
          </details>
        </div>
      </div>

      <div style={{ textAlign: 'center' }}>
        <h2 style={{ marginBottom: '2rem' }}>Still Need Help?</h2>
        <a href="/contact" style={{
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white',
          padding: '15px 30px',
          borderRadius: '50px',
          textDecoration: 'none',
          fontSize: '1.2rem',
          fontWeight: 'bold',
          display: 'inline-block',
          margin: '0 10px'
        }}>
          📝 Contact Us
        </a>
        <a href="tel:+15551234596" style={{
          background: 'linear-gradient(135deg, #ff6b6b 0%, #ee5a52 100%)',
          color: 'white',
          padding: '15px 30px',
          borderRadius: '50px',
          textDecoration: 'none',
          fontSize: '1.2rem',
          fontWeight: 'bold',
          display: 'inline-block',
          margin: '0 10px'
        }}>
          📞 Call Now
        </a>
      </div>
    </div>
  );
};

export default Support;
