// src/App.js
import React from 'react';
import './App.css';
import AnalyticsWrapper from './components/AnalyticsWrapper';
import UrgencyPopup from './components/UrgencyPopup';
import ExitIntentModal from './components/ExitIntentModal';
import StickyCTA from './components/StickyCTA';
import ServiceSelector from './components/ServiceSelector';

function App() {
  return (
    <>
      <UrgencyPopup />
      <ExitIntentModal />
      <StickyCTA />
      <div className="app">
        <header className="header">
          <img src="/assets/fixlo-logo.png" alt="Fixlo Logo" className="logo" />
          <h1>Welcome to Fixlo</h1>
          <p>Your one-stop hub for trusted professionals and home projects</p>
        </header>

        <section className="services">
          <h2>Select a Service</h2>
          <ServiceSelector />
        </section>

        <footer className="footer">
          <p>&copy; {new Date().getFullYear()} Fixlo. All rights reserved.</p>
        </footer>
      </div>
      <AnalyticsWrapper />
    </>
  );
}

export default App;
