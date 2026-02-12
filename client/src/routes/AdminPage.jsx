import React from 'react';
import HelmetSEO from '../seo/HelmetSEO';
export default function AdminPage(){
  return (<>
    <HelmetSEO 
      title="Admin Dashboard | Fixlo" 
      canonicalPathname="/dashboard/admin" 
      robots="noindex, nofollow" 
    />
    <div className="container-xl py-8">
      <h1 className="text-2xl font-extrabold mb-6">Admin Dashboard</h1>
      
      <div className="grid md:grid-cols-2 gap-6">
        {/* Job Management Card */}
        <a 
          href="/dashboard/admin/jobs" 
          className="card p-6 hover:shadow-lg transition-shadow border border-gray-200"
        >
          <h2 className="text-xl font-bold mb-2">Job Control Center</h2>
          <p className="text-sm text-gray-600">
            Manage jobs, schedules, and payments
          </p>
        </a>

        {/* Social Media Manager Card */}
        <a 
          href="/dashboard/admin/social" 
          className="card p-6 hover:shadow-lg transition-shadow border border-gray-200"
        >
          <h2 className="text-xl font-bold mb-2">Social Media Manager</h2>
          <p className="text-sm text-gray-600">
            Connect and manage social media accounts
          </p>
        </a>

        {/* AI Lead Hunter Card */}
        <a 
          href="/dashboard/admin/lead-hunter" 
          className="card p-6 hover:shadow-lg transition-shadow border border-gray-200 bg-gradient-to-br from-blue-50 to-indigo-50"
        >
          <h2 className="text-xl font-bold mb-2">🤖 AI Lead Hunter</h2>
          <p className="text-sm text-gray-600">
            AI-powered lead detection and distribution
          </p>
        </a>

        {/* SEO AI Engine Card */}
        <a 
          href="/dashboard/admin/seo-ai" 
          className="card p-6 hover:shadow-lg transition-shadow border border-gray-200 bg-gradient-to-br from-green-50 to-emerald-50"
        >
          <h2 className="text-xl font-bold mb-2">🔍 SEO AI Engine</h2>
          <p className="text-sm text-gray-600">
            Automated SEO content generation and optimization
          </p>
        </a>
      </div>
    </div>
  </>);
}
