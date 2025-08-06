import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import SignupPopup from './SignupPopup';

const Navigation = () => {
  const [showSignupPopup, setShowSignupPopup] = useState(false);
  const [signupType, setSignupType] = useState('homeowner');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleSignupClick = (type) => {
    setSignupType(type);
    setShowSignupPopup(true);
    setMobileMenuOpen(false);
  };

  return (
    <>
      <nav className="bg-white shadow-lg sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            {/* Logo */}
            <div className="flex items-center">
              <Link to="/" className="flex items-center">
                <img 
                  src="./assets/fixlo-logo.png" 
                  alt="Fixlo" 
                  className="h-8 w-auto mr-2"
                  onError={(e) => {
                    e.target.style.display = 'none';
                  }}
                />
                <span className="text-2xl font-bold text-blue-600">Fixlo</span>
              </Link>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-8">
              <Link to="/how-it-works" className="text-gray-700 hover:text-blue-600 font-medium">
                How It Works
              </Link>
              <Link to="/ai-assistant" className="text-gray-700 hover:text-blue-600 font-medium">
                AI Assistant
              </Link>
              <Link to="/contact" className="text-gray-700 hover:text-blue-600 font-medium">
                Contact
              </Link>
              <Link to="/terms" className="text-gray-700 hover:text-blue-600 font-medium">
                Terms
              </Link>
              
              {/* Action Buttons */}
              <button
                onClick={() => handleSignupClick('homeowner')}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors"
              >
                Get Service
              </button>
              <button
                onClick={() => handleSignupClick('professional')}
                className="bg-green-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-green-700 transition-colors"
              >
                Join as Pro
              </button>
            </div>

            {/* Mobile menu button */}
            <div className="md:hidden flex items-center">
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="text-gray-700 hover:text-blue-600 focus:outline-none"
              >
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  {mobileMenuOpen ? (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  )}
                </svg>
              </button>
            </div>
          </div>

          {/* Mobile Navigation */}
          {mobileMenuOpen && (
            <div className="md:hidden border-t border-gray-200 py-4">
              <div className="flex flex-col space-y-4">
                <Link 
                  to="/how-it-works" 
                  className="text-gray-700 hover:text-blue-600 font-medium"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  How It Works
                </Link>
                <Link 
                  to="/ai-assistant" 
                  className="text-gray-700 hover:text-blue-600 font-medium"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  AI Assistant
                </Link>
                <Link 
                  to="/contact" 
                  className="text-gray-700 hover:text-blue-600 font-medium"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Contact
                </Link>
                <Link 
                  to="/terms" 
                  className="text-gray-700 hover:text-blue-600 font-medium"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Terms
                </Link>
                
                <div className="flex flex-col space-y-2 pt-4 border-t border-gray-200">
                  <button
                    onClick={() => handleSignupClick('homeowner')}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors text-center"
                  >
                    Get Service
                  </button>
                  <button
                    onClick={() => handleSignupClick('professional')}
                    className="bg-green-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-green-700 transition-colors text-center"
                  >
                    Join as Pro
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* Signup Popup */}
      <SignupPopup
        isOpen={showSignupPopup}
        onClose={() => setShowSignupPopup(false)}
        userType={signupType}
      />
    </>
  );
};

export default Navigation;