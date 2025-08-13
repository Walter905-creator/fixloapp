import React from 'react';
import { Link } from 'react-router-dom';

const HowItWorks = () => {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">How Fixlo Works</h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Connecting homeowners with trusted professionals has never been easier. 
            Here's how our platform works for both homeowners and professionals.
          </p>
        </div>

        {/* For Homeowners Section */}
        <div className="mb-20">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-blue-600 mb-4">For Homeowners</h2>
            <p className="text-lg text-gray-600">Get your home projects done by verified professionals</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Step 1 */}
            <div className="text-center">
              <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-6">
                <span className="text-2xl font-bold text-blue-600">1</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Request a Service</h3>
              <p className="text-gray-600 leading-relaxed">
                Tell us what you need done. Whether it's plumbing, electrical work, landscaping, 
                or any other home service, simply describe your project and location.
              </p>
            </div>

            {/* Step 2 */}
            <div className="text-center">
              <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-6">
                <span className="text-2xl font-bold text-blue-600">2</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Get Matched</h3>
              <p className="text-gray-600 leading-relaxed">
                Our system instantly finds verified professionals in your area who specialize 
                in your type of project. All professionals are background-checked and licensed.
              </p>
            </div>

            {/* Step 3 */}
            <div className="text-center">
              <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-6">
                <span className="text-2xl font-bold text-blue-600">3</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Connect & Hire</h3>
              <p className="text-gray-600 leading-relaxed">
                Professionals will contact you directly to discuss your project, provide quotes, 
                and schedule the work. Choose the best fit for your needs and budget.
              </p>
            </div>
          </div>
        </div>

        {/* For Professionals Section */}
        <div className="mb-20">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-green-600 mb-4">For Professionals</h2>
            <p className="text-lg text-gray-600">Grow your business with qualified leads</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {/* Step 1 */}
            <div className="text-center">
              <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-6">
                <span className="text-2xl font-bold text-green-600">1</span>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Sign Up</h3>
              <p className="text-gray-600 text-sm leading-relaxed">
                Create your professional profile with your trade, location, and experience details.
              </p>
            </div>

            {/* Step 2 */}
            <div className="text-center">
              <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-6">
                <span className="text-2xl font-bold text-green-600">2</span>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Get Verified</h3>
              <p className="text-gray-600 text-sm leading-relaxed">
                Complete background check through Checkr and activate your monthly subscription.
              </p>
            </div>

            {/* Step 3 */}
            <div className="text-center">
              <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-6">
                <span className="text-2xl font-bold text-green-600">3</span>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Receive Leads</h3>
              <p className="text-gray-600 text-sm leading-relaxed">
                Get instant SMS notifications when customers in your area need your services.
              </p>
            </div>

            {/* Step 4 */}
            <div className="text-center">
              <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-6">
                <span className="text-2xl font-bold text-green-600">4</span>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Grow Business</h3>
              <p className="text-gray-600 text-sm leading-relaxed">
                Connect with customers, complete jobs, and build your reputation on our platform.
              </p>
            </div>
          </div>
        </div>

        {/* Features Section */}
        <div className="mb-20">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Platform Features</h2>
            <p className="text-lg text-gray-600">Everything you need for successful project completion</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Real-time Notifications */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Real-time SMS</h3>
              <p className="text-gray-600 text-sm">
                Instant SMS notifications powered by Twilio ensure professionals never miss an opportunity.
              </p>
            </div>

            {/* AI Assistant */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">AI Assistant</h3>
              <p className="text-gray-600 text-sm">
                OpenAI-powered guidance helps homeowners understand their projects before requesting services.
              </p>
            </div>

            {/* Background Checks */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Background Checks</h3>
              <p className="text-gray-600 text-sm">
                All professionals undergo thorough background verification through Checkr for your safety.
              </p>
            </div>

            {/* Secure Payments */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Secure Payments</h3>
              <p className="text-gray-600 text-sm">
                Professional subscriptions processed securely through Stripe with industry-standard encryption.
              </p>
            </div>

            {/* Real-time Chat */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Real-time Chat</h3>
              <p className="text-gray-600 text-sm">
                Socket.io powered chat enables instant communication between homeowners and professionals.
              </p>
            </div>

            {/* Admin Dashboard */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Admin Dashboard</h3>
              <p className="text-gray-600 text-sm">
                Comprehensive management tools for monitoring professionals, job requests, and platform health.
              </p>
            </div>
          </div>
        </div>

        {/* Popular Services Section */}
        <div className="mb-16 bg-white rounded-2xl p-8 shadow-lg">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-8">Popular Services on Fixlo</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            <Link to="/services/plumbing" className="block p-4 border border-gray-200 rounded-lg hover:border-blue-500 hover:shadow-md transition-all text-center">
              <div className="text-2xl mb-2">🚰</div>
              <div className="font-medium text-gray-900">Plumbing</div>
              <div className="text-sm text-gray-600">Emergency repairs, installations</div>
            </Link>
            <Link to="/services/electrical" className="block p-4 border border-gray-200 rounded-lg hover:border-blue-500 hover:shadow-md transition-all text-center">
              <div className="text-2xl mb-2">💡</div>
              <div className="font-medium text-gray-900">Electrical</div>
              <div className="text-sm text-gray-600">Licensed electricians</div>
            </Link>
            <Link to="/services/hvac" className="block p-4 border border-gray-200 rounded-lg hover:border-blue-500 hover:shadow-md transition-all text-center">
              <div className="text-2xl mb-2">❄️</div>
              <div className="font-medium text-gray-900">HVAC</div>
              <div className="text-sm text-gray-600">AC, heating, ventilation</div>
            </Link>
            <Link to="/services/carpentry" className="block p-4 border border-gray-200 rounded-lg hover:border-blue-500 hover:shadow-md transition-all text-center">
              <div className="text-2xl mb-2">🪚</div>
              <div className="font-medium text-gray-900">Carpentry</div>
              <div className="text-sm text-gray-600">Custom woodwork</div>
            </Link>
            <Link to="/services/painting" className="block p-4 border border-gray-200 rounded-lg hover:border-blue-500 hover:shadow-md transition-all text-center">
              <div className="text-2xl mb-2">🎨</div>
              <div className="font-medium text-gray-900">Painting</div>
              <div className="text-sm text-gray-600">Interior & exterior</div>
            </Link>
            <Link to="/services/roofing" className="block p-4 border border-gray-200 rounded-lg hover:border-blue-500 hover:shadow-md transition-all text-center">
              <div className="text-2xl mb-2">🏠</div>
              <div className="font-medium text-gray-900">Roofing</div>
              <div className="text-sm text-gray-600">Repairs & installations</div>
            </Link>
            <Link to="/services/house-cleaning" className="block p-4 border border-gray-200 rounded-lg hover:border-blue-500 hover:shadow-md transition-all text-center">
              <div className="text-2xl mb-2">🧹</div>
              <div className="font-medium text-gray-900">Cleaning</div>
              <div className="text-sm text-gray-600">House & deep cleaning</div>
            </Link>
            <Link to="/services/landscaping" className="block p-4 border border-gray-200 rounded-lg hover:border-blue-500 hover:shadow-md transition-all text-center">
              <div className="text-2xl mb-2">🌿</div>
              <div className="font-medium text-gray-900">Landscaping</div>
              <div className="text-sm text-gray-600">Garden & yard work</div>
            </Link>
          </div>
        </div>

        {/* CTA Section */}
        <div className="bg-gradient-to-r from-blue-600 to-green-600 rounded-2xl p-12 text-center text-white">
          <h2 className="text-3xl font-bold mb-4">Ready to Get Started?</h2>
          <p className="text-xl mb-8 opacity-90">
            Join thousands of homeowners and professionals using Fixlo
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/services/plumbing" className="bg-white text-blue-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors inline-block text-center">
              Request a Service
            </Link>
            <Link to="/signup" className="bg-transparent border-2 border-white text-white px-8 py-3 rounded-lg font-semibold hover:bg-white hover:text-blue-600 transition-colors inline-block text-center">
              Join as Professional
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HowItWorks;