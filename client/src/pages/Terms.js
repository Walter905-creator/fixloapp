import React from "react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import HelmetSEO from "../seo/HelmetSEO";

export default function Terms() {
  return (
    <>
      <HelmetSEO 
        title="Terms of Service – Fixlo"
        description="Read Fixlo's terms of service. Learn about our platform policies, user responsibilities, and service guidelines."
        canonicalPathname="/terms"
      />
      <Navbar />
      <main style={{maxWidth: 1000, margin: "0 auto", padding: "24px 16px"}}>
        <h1 style={{fontSize: 32, margin: "4px 0"}}>Terms of Service</h1>
        <p style={{color:"#475569"}}>Last updated: 2025-08-26</p>

        <h2 style={h2}>1. Overview</h2>
        <p style={p}>Fixlo connects homeowners with independent service professionals. We are not the employer of professionals and are not responsible for their work.</p>

        <h2 style={h2}>2. Use of the Service</h2>
        <p style={p}>You agree to provide accurate information, comply with laws, and not misuse the platform.</p>

        <h2 style={h2}>3. Payments</h2>
        <p style={p}>Payments may be processed by third-party providers. Fees and taxes are your responsibility where applicable.</p>

        <h2 style={h2}>4. Messaging & Consent</h2>
        <p style={p}>By opting in, you agree to receive SMS updates about your requests and account. Message & data rates may apply. Reply STOP to unsubscribe.</p>

        <h2 style={h2}>5. Disclaimers</h2>
        <p style={p}>THE SERVICE IS PROVIDED “AS IS” WITHOUT WARRANTIES. To the fullest extent permitted by law, Fixlo disclaims liability for services performed by independent professionals.</p>

        <h2 style={h2}>6. Disputes</h2>
        <p style={p}>Any disputes will be resolved under applicable law. Some jurisdictions may not allow limitations; your rights may vary.</p>

        <h2 style={h2}>7. Contact</h2>
        <p style={p}>Questions? Contact us via the website.</p>
      </main>
      <Footer />
    </>
  );
}

const h2 = {fontSize: 22, marginTop: 18};
const p = {color:"#334155"};
