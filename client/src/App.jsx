import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import Signup from './pages/Signup';
import ProProfile from './pages/ProProfile';
import ReviewCapture from './pages/ReviewCapture';
import ReviewPublic from './pages/ReviewPublic';
import NotFound from './pages/NotFound';
import Header from './components/Header';

export default function App() {
  return (
    <>
      <Header />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/pro/:slug" element={<ProProfile />} />
        <Route path="/review/:token" element={<ReviewCapture />} />
        <Route path="/review/public/:reviewId" element={<ReviewPublic />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </>
  );
}