import React from 'react';
import HelmetSEO from '../seo/HelmetSEO';
import { Link } from 'react-router-dom';

export default function ContactPage(){
  return (<>
    <HelmetSEO 
      title="Contact Fixlo – Get Help with Home Services" 
      description="Contact Fixlo for support with home services, questions about becoming a professional, or general inquiries. We're here to help."
      canonicalPathname="/contact" 
    />
    <div className="container-xl py-8">
      <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 mb-6">Contact Fixlo</h1>
      
      <div className="grid md:grid-cols-2 gap-8">
        {/* Contact Information */}
        <div>
          <div className="card p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">Get in Touch</h2>
            <div className="space-y-4">
              <div>
                <div className="font-medium text-slate-900 mb-1">Email Support</div>
                <a href="mailto:pro4u.improvements@gmail.com" className="text-brand hover:underline">
                  pro4u.improvements@gmail.com
                </a>
                <p className="text-sm text-slate-600 mt-1">Response within 1 business day</p>
              </div>
              
              <div className="pt-4 border-t border-slate-200">
                <div className="font-medium text-slate-900 mb-2">Business Hours</div>
                <p className="text-sm text-slate-700">Monday - Friday: 9am - 6pm EST</p>
                <p className="text-sm text-slate-700">Saturday: 10am - 4pm EST</p>
                <p className="text-sm text-slate-700">Sunday: Closed</p>
              </div>
            </div>
          </div>
          
          {/* Quick Links */}
          <div className="card p-6">
            <h2 className="text-xl font-semibold mb-4">Quick Links</h2>
            <div className="space-y-3">
              <Link to="/how-it-works" className="block text-brand hover:underline">
                How Fixlo Works →
              </Link>
              <Link to="/join" className="block text-brand hover:underline">
                Join as a Professional →
              </Link>
              <Link to="/services" className="block text-brand hover:underline">
                Browse Services →
              </Link>
              <Link to="/terms" className="block text-brand hover:underline">
                Terms of Service →
              </Link>
              <Link to="/privacy-policy" className="block text-brand hover:underline">
                Privacy Policy →
              </Link>
            </div>
          </div>
        </div>
        
        {/* FAQ Section */}
        <div>
          <div className="card p-6">
            <h2 className="text-xl font-semibold mb-4">Frequently Asked Questions</h2>
            
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold text-slate-900 mb-2">How do I find a professional?</h3>
                <p className="text-sm text-slate-700">
                  Visit our <Link to="/services" className="text-brand hover:underline">Services page</Link>, select the service you need, enter your location, and submit your request. We'll connect you with qualified professionals in your area.
                </p>
              </div>
              
              <div>
                <h3 className="font-semibold text-slate-900 mb-2">Are professionals background-checked?</h3>
                <p className="text-sm text-slate-700">
                  Yes! Every professional in our network undergoes thorough background screening to ensure your safety and peace of mind.
                </p>
              </div>
              
              <div>
                <h3 className="font-semibold text-slate-900 mb-2">How much does it cost to use Fixlo?</h3>
                <p className="text-sm text-slate-700">
                  For homeowners, Fixlo is completely free to use. You only pay the professional directly for their services. For professionals, we offer a flat monthly subscription with no per-lead fees.
                </p>
              </div>
              
              <div>
                <h3 className="font-semibold text-slate-900 mb-2">What areas do you serve?</h3>
                <p className="text-sm text-slate-700">
                  Fixlo serves homeowners and professionals across the United States, with coverage in major metropolitan areas and surrounding regions.
                </p>
              </div>
              
              <div>
                <h3 className="font-semibold text-slate-900 mb-2">How do I become a Fixlo professional?</h3>
                <p className="text-sm text-slate-700">
                  Visit our <Link to="/join" className="text-brand hover:underline">Join page</Link> to sign up. You'll complete a simple registration, undergo a background check, and start receiving job leads in your area.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </>);
}
