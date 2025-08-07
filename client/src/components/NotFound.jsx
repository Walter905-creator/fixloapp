import React from 'react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <>
      <Helmet>
        <title>Page Not Found - Fixlo</title>
        <meta name="description" content="The page you're looking for doesn't exist. Browse our home services or return to the Fixlo homepage." />
        <meta name="robots" content="noindex, follow" />
        <link rel="canonical" href="https://www.fixloapp.com/404" />
      </Helmet>
      
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="max-w-md text-center">
          <div className="text-6xl mb-6">🔍</div>
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Page Not Found</h1>
          <p className="text-gray-600 mb-8">
            Sorry, the page you're looking for doesn't exist. It might have been moved, deleted, or you entered the wrong URL.
          </p>
          
          <div className="space-y-3">
            <Link 
              to="/" 
              className="block bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
            >
              Return Home
            </Link>
            
            <Link 
              to="/services/plumbing" 
              className="block bg-gray-200 hover:bg-gray-300 text-gray-800 px-6 py-3 rounded-lg font-semibold transition-colors"
            >
              Browse Services
            </Link>
          </div>
          
          <div className="mt-8 pt-8 border-t border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Popular Pages:</h3>
            <div className="space-y-2">
              <Link to="/how-it-works" className="block text-blue-600 hover:text-blue-800">How It Works</Link>
              <Link to="/signup" className="block text-blue-600 hover:text-blue-800">Join as Professional</Link>
              <Link to="/contact" className="block text-blue-600 hover:text-blue-800">Contact</Link>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}