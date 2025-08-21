import React from "react";
import { Helmet } from "react-helmet-async";

export default function Contact() {
  return (
    <div className="min-h-screen bg-white">
      <Helmet>
        <title>Contact Us - Fixlo</title>
        <meta 
          name="description" 
          content="Get in touch with Fixlo. Contact our team for questions about home services, professional accounts, or general inquiries." 
        />
        <link rel="canonical" href="https://www.fixloapp.com/contact" />
      </Helmet>

      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Contact Us</h1>
          <p className="text-xl text-gray-600">We're here to help with any questions you may have</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          {/* Contact Information */}
          <div>
            <h2 className="text-2xl font-semibold text-gray-900 mb-6">Get In Touch</h2>
            
            <div className="space-y-6">
              <div className="flex items-start space-x-4">
                <div className="bg-blue-100 rounded-lg p-3">
                  <span className="text-xl">📧</span>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Email</h3>
                  <p className="text-gray-600">pro4u.improvements@gmail.com</p>
                  <p className="text-sm text-gray-500">Response within 2-4 hours</p>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <div className="bg-blue-100 rounded-lg p-3">
                  <span className="text-xl">🏢</span>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Business Hours</h3>
                  <p className="text-gray-600">Monday - Friday: 8 AM - 8 PM EST</p>
                  <p className="text-gray-600">Saturday: 9 AM - 6 PM EST</p>
                  <p className="text-gray-600">Sunday: Emergency support only</p>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <div className="bg-blue-100 rounded-lg p-3">
                  <span className="text-xl">❓</span>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Support</h3>
                  <p className="text-gray-600">Need help with your account or services?</p>
                  <a 
                    href="/support" 
                    className="text-blue-600 hover:text-blue-800 hover:underline"
                  >
                    Visit our Support Center
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h2 className="text-2xl font-semibold text-gray-900 mb-6">Quick Links</h2>
            
            <div className="space-y-4">
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 mb-2">For Homeowners</h3>
                <ul className="space-y-1">
                  <li><a href="/services" className="text-blue-600 hover:underline">Browse Services</a></li>
                  <li><a href="/signup" className="text-blue-600 hover:underline">Create Account</a></li>
                  <li><a href="/how-it-works" className="text-blue-600 hover:underline">How It Works</a></li>
                </ul>
              </div>

              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 mb-2">For Professionals</h3>
                <ul className="space-y-1">
                  <li><a href="/pro/signup" className="text-blue-600 hover:underline">Join Our Network</a></li>
                  <li><a href="/pro/signin" className="text-blue-600 hover:underline">Professional Sign In</a></li>
                  <li><a href="/pro/gallery" className="text-blue-600 hover:underline">Upload Work Photos</a></li>
                </ul>
              </div>

              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 mb-2">Legal & Policies</h3>
                <ul className="space-y-1">
                  <li><a href="/terms" className="text-blue-600 hover:underline">Terms of Service</a></li>
                  <li><a href="/privacy" className="text-blue-600 hover:underline">Privacy Policy</a></li>
                  <li><a href="/support" className="text-blue-600 hover:underline">Support Center</a></li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Emergency Contact */}
        <div className="mt-12 text-center bg-red-50 rounded-lg p-6">
          <h2 className="text-xl font-semibold text-red-900 mb-2">Emergency Services</h2>
          <p className="text-red-700">
            For emergency plumbing, electrical, or HVAC issues that require immediate attention, 
            please contact your local emergency services or utility companies directly.
          </p>
        </div>
      </div>
    </div>
  );
}