import React from 'react';
import { Helmet } from 'react-helmet-async';
import Navbar from '../components/Navbar';
import SignupForm from '../components/SignupForm';
import Footer from '../components/Footer';

export default function Signup() {
  return (
    <>
      <Helmet>
        <title>Sign Up - Fixlo</title>
        <meta 
          name="description" 
          content="Create your Fixlo account to book trusted home service professionals. Sign up today and connect with verified local experts for all your home maintenance needs." 
        />
        <link rel="canonical" href="https://www.fixloapp.com/signup" />
      </Helmet>
      <Navbar />
      <main className="container" style={{padding:'3rem 0'}}>
        <h1 className="text-3xl font-bold mb-6">Sign up</h1>
        <SignupForm />
      </main>
      <Footer />
    </>
  );
}