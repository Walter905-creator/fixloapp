import React from "react";
import { Link } from "react-router-dom";

export default function Footer() {
  const services = [
    { id: "plumbing", name: "Plumbing" },
    { id: "electrical", name: "Electrical" },
    { id: "hvac", name: "HVAC" },
    { id: "carpentry", name: "Carpentry" },
    { id: "painting", name: "Painting" },
    { id: "roofing", name: "Roofing" },
    { id: "house-cleaning", name: "House Cleaning" },
    { id: "junk-removal", name: "Junk Removal" },
    { id: "landscaping", name: "Landscaping" }
  ];

  return (
    <footer className="border-t border-slate-200 bg-white">
      <div className="max-w-6xl mx-auto px-4 py-12">
        {/* Brand section */}
        <div className="mb-8">
          <Link to="/" className="flex items-center gap-2 mb-4" aria-label="Fixlo — Home">
            <span
              aria-hidden="true"
              className="inline-block rounded-lg px-2 py-1 text-white"
              style={{
                background:
                  "linear-gradient(135deg, #833ab4 0%, #fd1d1d 50%, #fcb045 100%)",
              }}
            >
              Fixlo
            </span>
            <span className="sr-only">Fixlo</span>
          </Link>
          <p className="text-gray-600 max-w-md">
            Connecting homeowners with trusted professionals across the country. 
            From emergency repairs to home improvements, find the right expert for every job.
          </p>
        </div>

        {/* Main footer content */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
          {/* Services */}
          <div>
            <h3 className="font-semibold text-gray-900 mb-4">Services</h3>
            <ul className="space-y-2">
              {services.map((service) => (
                <li key={service.id}>
                  <Link 
                    to={`/services/${service.id}`}
                    className="text-gray-600 hover:text-gray-900 hover:underline text-sm"
                  >
                    {service.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company */}
          <div>
            <h3 className="font-semibold text-gray-900 mb-4">Company</h3>
            <ul className="space-y-2">
              <li>
                <Link 
                  to="/how-it-works"
                  className="text-gray-600 hover:text-gray-900 hover:underline text-sm"
                >
                  How It Works
                </Link>
              </li>
              <li>
                <Link 
                  to="/ai-assistant"
                  className="text-gray-600 hover:text-gray-900 hover:underline text-sm"
                >
                  AI Assistant
                </Link>
              </li>
              <li>
                <Link 
                  to="/contact"
                  className="text-gray-600 hover:text-gray-900 hover:underline text-sm"
                >
                  Contact
                </Link>
              </li>
              <li>
                <Link 
                  to="/admin"
                  className="text-gray-600 hover:text-gray-900 hover:underline text-sm"
                >
                  Admin
                </Link>
              </li>
            </ul>
          </div>

          {/* For Professionals */}
          <div>
            <h3 className="font-semibold text-gray-900 mb-4">For Professionals</h3>
            <ul className="space-y-2">
              <li>
                <Link 
                  to="/pro/signup"
                  className="text-gray-600 hover:text-gray-900 hover:underline text-sm"
                >
                  Join as Pro
                </Link>
              </li>
              <li>
                <Link 
                  to="/pro/signin"
                  className="text-gray-600 hover:text-gray-900 hover:underline text-sm"
                >
                  Pro Sign In
                </Link>
              </li>
              <li>
                <Link 
                  to="/pro/gallery"
                  className="text-gray-600 hover:text-gray-900 hover:underline text-sm"
                >
                  Pro Gallery
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h3 className="font-semibold text-gray-900 mb-4">Legal</h3>
            <ul className="space-y-2">
              <li>
                <Link 
                  to="/privacy"
                  className="text-gray-600 hover:text-gray-900 hover:underline text-sm"
                >
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link 
                  to="/terms"
                  className="text-gray-600 hover:text-gray-900 hover:underline text-sm"
                >
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link 
                  to="/support"
                  className="text-gray-600 hover:text-gray-900 hover:underline text-sm"
                >
                  Support
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Copyright */}
        <div className="pt-8 border-t border-slate-200">
          <div className="text-center text-sm text-gray-500">
            © {new Date().getFullYear()} Fixlo. All rights reserved.
          </div>
        </div>
      </div>
    </footer>
  );
}