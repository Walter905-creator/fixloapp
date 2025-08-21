import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';

// Minimal components without dependencies
function MinimalHome() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
      <div className="max-w-4xl mx-auto text-center">
        <h1 className="text-5xl font-bold text-gray-900 mb-6">
          Welcome to Fixlo
        </h1>
        <p className="text-xl text-gray-600 mb-8">
          Your one-stop hub for connecting with trusted home service professionals.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <div className="text-4xl mb-4">🔧</div>
            <h3 className="text-xl font-semibold mb-2">Plumbing</h3>
            <p className="text-gray-600">Fix leaks and install fixtures</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <div className="text-4xl mb-4">⚡</div>
            <h3 className="text-xl font-semibold mb-2">Electrical</h3>
            <p className="text-gray-600">Safe wiring and installations</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <div className="text-4xl mb-4">🔨</div>
            <h3 className="text-xl font-semibold mb-2">Carpentry</h3>
            <p className="text-gray-600">Custom builds and repairs</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">404</h1>
        <p className="text-gray-600">Page not found</p>
      </div>
    </div>
  );
}

export default function AppMinimal(){
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<MinimalHome/>}/>
        <Route path="*" element={<NotFound/>}/>
      </Routes>
    </BrowserRouter>
  );
}