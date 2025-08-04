import React from 'react';

export default function Footer() {
  return (
    <footer className="bg-gray-800 text-white py-16 px-5">
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Company Info */}
          <div className="md:col-span-2">
            <h3 className="text-xl font-bold mb-4">Fixlo</h3>
            <p className="text-gray-300 mb-4">
              Your one-stop hub for trusted professionals and home projects. 
              Connecting homeowners with verified local pros since 2024.
            </p>
            <div className="flex space-x-4">
              <a href="#" className="text-gray-300 hover:text-white">📧</a>
              <a href="#" className="text-gray-300 hover:text-white">📱</a>
              <a href="#" className="text-gray-300 hover:text-white">🐦</a>
              <a href="#" className="text-gray-300 hover:text-white">📘</a>
            </div>
          </div>
          
          {/* Services */}
          <div>
            <h4 className="text-lg font-semibold mb-4">Services</h4>
            <ul className="space-y-2 text-gray-300">
              <li><a href="#" className="hover:text-white">Plumbing</a></li>
              <li><a href="#" className="hover:text-white">Electrical</a></li>
              <li><a href="#" className="hover:text-white">HVAC</a></li>
              <li><a href="#" className="hover:text-white">Carpentry</a></li>
              <li><a href="#" className="hover:text-white">Cleaning</a></li>
            </ul>
          </div>
          
          {/* Support */}
          <div>
            <h4 className="text-lg font-semibold mb-4">Support</h4>
            <ul className="space-y-2 text-gray-300">
              <li><a href="/contact.html" className="hover:text-white">Contact Us</a></li>
              <li><a href="/support.html" className="hover:text-white">Help Center</a></li>
              <li><a href="/privacy.html" className="hover:text-white">Privacy Policy</a></li>
              <li><a href="/terms.html" className="hover:text-white">Terms of Service</a></li>
            </ul>
          </div>
        </div>
        
        {/* Bottom Bar */}
        <div className="border-t border-gray-700 pt-8 flex flex-col md:flex-row justify-between items-center">
          <p className="text-gray-400 text-sm">
            © {new Date().getFullYear()} Fixlo. All rights reserved.
          </p>
          <div className="flex space-x-4 mt-4 md:mt-0">
            <a href="/pro-signup.html" className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded text-sm">
              Join as a Pro
            </a>
            <button className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded text-sm">
              Get Service
            </button>
          </div>
        </div>
        
        {/* Build Info */}
        <div className="text-center text-xs text-gray-500 mt-4">
          Build: {process.env.REACT_APP_BUILD_ID || 'dev'} | Updated: {new Date().toLocaleString()}
        </div>
      </div>
    </footer>
  );
}