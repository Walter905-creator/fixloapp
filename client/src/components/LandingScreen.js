import React from 'react';
 copilot/fix-a7d5aeac-2da4-468f-9787-62ac277d583a
import logo from '../assets/brand/fixlo-logo-primary.png';

import { ReactComponent as FixloLogo } from '../assets/brand/fixlo-logo.svg';
 main

function LandingScreen() {
  return (
    <section style={{
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      color: 'white',
      padding: '150px 0 100px 0',
      textAlign: 'center',
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center'
    }}>
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto',
        padding: '0 20px'
      }}>
        <FixloLogo 
          aria-label="Fixlo" 
          className="fixlo-logo"
          style={{
            maxWidth: '400px',
            height: 'auto',
            marginBottom: '40px',
            filter: 'drop-shadow(0 8px 16px rgba(0,0,0,0.3))'
          }}
        />
        
        <h1 style={{
          fontSize: '3.5rem',
          marginBottom: '20px',
          fontWeight: '700'
        }}>
          Welcome to Fixlo
        </h1>
        
        <p style={{
          fontSize: '1.3rem',
          marginBottom: '40px',
          maxWidth: '600px',
          margin: '0 auto 40px'
        }}>
          Your one-stop hub for finding trusted professionals and managing your home projects effortlessly.
        </p>
        
        <div style={{
          display: 'flex',
          gap: '20px',
          justifyContent: 'center',
          flexWrap: 'wrap',
          marginBottom: '60px'
        }}>
          <button style={{
            padding: '15px 30px',
            borderRadius: '50px',
            background: '#ff6b6b',
            color: 'white',
            border: 'none',
            fontWeight: '600',
            fontSize: '1.1rem',
            cursor: 'pointer',
            transition: 'all 0.3s ease'
          }}>
            Download App
          </button>
          
          <button style={{
            padding: '15px 30px',
            borderRadius: '50px',
            background: '#28a745',
            color: 'white',
            border: 'none',
            fontWeight: '600',
            fontSize: '1.1rem',
            cursor: 'pointer',
            transition: 'all 0.3s ease'
          }}>
            🔧 Join as Handyman
          </button>
          
          <button style={{
            padding: '15px 30px',
            borderRadius: '50px',
            background: '#28a745',
            color: 'white',
            border: 'none',
            fontWeight: '600',
            fontSize: '1.1rem',
            cursor: 'pointer',
            transition: 'all 0.3s ease'
          }}>
            🏗️ Join as Contractor
          </button>
        </div>
      </div>
    </section>
  );
}

export default LandingScreen;
