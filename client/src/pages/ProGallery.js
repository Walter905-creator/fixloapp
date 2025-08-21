import React from 'react';
import { Helmet } from 'react-helmet-async';
import Navbar from '../components/Navbar';
import ProGallery from '../components/ProGallery';
import Footer from '../components/Footer';

export default function ProGalleryPage() {
  return (
    <>
      <Helmet>
        <title>Professional Gallery - Fixlo</title>
        <meta 
          name="description" 
          content="Browse our gallery of trusted home service professionals. See work examples, ratings, and specializations from verified contractors in your area." 
        />
        <link rel="canonical" href="https://www.fixloapp.com/pro/gallery" />
      </Helmet>
      <Navbar />
      <ProGallery />
      <Footer />
    </>
  );
}