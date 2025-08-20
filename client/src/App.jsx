import React from "react";
import { Routes, Route, Link } from "react-router-dom";

const Home = () => (
  <main style={{ padding: "24px" }}>
    <h1>Fixlo</h1>
    <p>Book trusted home services near you. Plumbing, electrical, HVAC, and more.</p>
    <Link to="/signup">Sign up</Link>
  </main>
);

const HowItWorks = () => <div style={{ padding: 24 }}><h2>How it works</h2></div>;
const Contact = () => <div style={{ padding: 24 }}><h2>Contact</h2></div>;
const Services = () => <div style={{ padding: 24 }}><h2>Services</h2></div>;
const Service = () => <div style={{ padding: 24 }}><h2>Service</h2></div>;
const Signup = () => <div style={{ padding: 24 }}><h2>Signup</h2></div>;
const ProSignup = () => <div style={{ padding: 24 }}><h2>Pro Signup</h2></div>;
const ProProfile = () => <div style={{ padding: 24 }}><h2>Pro Profile</h2></div>;
const ReviewCapture = () => <div style={{ padding: 24 }}><h2>Review</h2></div>;
const ReviewPublic = () => <div style={{ padding: 24 }}><h2>Public Review</h2></div>;
const NotFound = () => <div style={{ padding: 24 }}><h2>Not Found</h2></div>;

export default function App() {
  return (
    <>
      {/* Keep your existing header/nav if you have one; this is just a placeholder */}
      <nav style={{ padding: "12px 24px", borderBottom: "1px solid #eee" }}>
        <Link to="/">Home</Link>{" • "}
        <Link to="/how-it-works">How it works</Link>{" • "}
        <Link to="/contact">Contact</Link>{" • "}
        <Link to="/services">Services</Link>{" • "}
        <Link to="/signup">Sign up</Link>{" • "}
        <Link to="/pro/signup">Pro signup</Link>
      </nav>

      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/how-it-works" element={<HowItWorks />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/services" element={<Services />} />
        <Route path="/services/:service" element={<Service />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/pro/signup" element={<ProSignup />} />
        <Route path="/pro/:slug" element={<ProProfile />} />
        <Route path="/review/:token" element={<ReviewCapture />} />
        <Route path="/review/public/:reviewId" element={<ReviewPublic />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </>
  );
}
