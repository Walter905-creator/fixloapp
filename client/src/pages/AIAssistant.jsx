import React from "react";
import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";

export default function AIAssistant() {
  return (
    <div className="min-h-screen bg-white">
      <Helmet>
        <title>AI Assistant - Fixlo</title>
        <meta 
          name="description" 
          content="Fixlo's AI assistant helps homeowners and professionals with smart matching, project estimates, and business growth tools." 
        />
        <link rel="canonical" href="https://www.fixloapp.com/ai-assistant" />
      </Helmet>

      <div className="max-w-6xl mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">AI Assistant</h1>
          <p className="text-xl text-gray-600">Smart tools to enhance your Fixlo experience</p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
          <div className="bg-blue-50 rounded-lg p-6">
            <div className="text-3xl mb-4">🤖</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Smart Matching</h3>
            <p className="text-gray-600">
              Our AI analyzes your project requirements and instantly connects you with the most suitable professionals in your area.
            </p>
          </div>

          <div className="bg-green-50 rounded-lg p-6">
            <div className="text-3xl mb-4">💡</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Project Estimates</h3>
            <p className="text-gray-600">
              Get instant, accurate cost estimates for your home projects based on local market data and project complexity.
            </p>
          </div>

          <div className="bg-purple-50 rounded-lg p-6">
            <div className="text-3xl mb-4">📊</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Business Insights</h3>
            <p className="text-gray-600">
              Professionals get AI-powered analytics to optimize pricing, improve efficiency, and grow their business.
            </p>
          </div>

          <div className="bg-yellow-50 rounded-lg p-6">
            <div className="text-3xl mb-4">🔧</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Problem Diagnosis</h3>
            <p className="text-gray-600">
              Describe your issue and get AI-powered suggestions for potential causes and solutions before booking a service.
            </p>
          </div>

          <div className="bg-red-50 rounded-lg p-6">
            <div className="text-3xl mb-4">⏰</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Optimal Scheduling</h3>
            <p className="text-gray-600">
              AI optimizes scheduling to find the best times for both homeowners and professionals, reducing wait times.
            </p>
          </div>

          <div className="bg-indigo-50 rounded-lg p-6">
            <div className="text-3xl mb-4">📱</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Smart Notifications</h3>
            <p className="text-gray-600">
              Receive intelligent alerts about your projects, maintenance reminders, and opportunities to save money.
            </p>
          </div>
        </div>

        {/* How It Works */}
        <div className="bg-gray-50 rounded-lg p-8 mb-12">
          <h2 className="text-3xl font-semibold text-gray-900 mb-8 text-center">How Our AI Works</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="bg-white rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4 shadow-sm">
                <span className="text-2xl">🧠</span>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Learn</h3>
              <p className="text-gray-600">AI continuously learns from successful projects and user preferences.</p>
            </div>
            <div className="text-center">
              <div className="bg-white rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4 shadow-sm">
                <span className="text-2xl">⚡</span>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Analyze</h3>
              <p className="text-gray-600">Processes project details, location data, and professional capabilities in real-time.</p>
            </div>
            <div className="text-center">
              <div className="bg-white rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4 shadow-sm">
                <span className="text-2xl">🎯</span>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Match</h3>
              <p className="text-gray-600">Delivers personalized recommendations and optimal connections.</p>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="text-center">
          <h2 className="text-3xl font-semibold text-gray-900 mb-4">Experience AI-Powered Service</h2>
          <p className="text-xl text-gray-600 mb-8">
            Join thousands of homeowners and professionals already benefiting from our AI assistant.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/signup"
              className="px-8 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors"
            >
              Get Started as Homeowner
            </Link>
            <Link
              to="/pro/signup"
              className="px-8 py-3 bg-white text-blue-600 font-semibold rounded-lg border-2 border-blue-600 hover:bg-blue-50 transition-colors"
            >
              Join as Professional
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}