import React, { useState } from 'react';
import HelmetSEO from '../seo/HelmetSEO';
import ClockInSystem from '../components/ClockInSystem';

const API_URL = import.meta.env.VITE_API_URL || 'https://fixloapp.onrender.com';

export default function JobManagementPage() {
  const [jobs, setJobs] = useState([]);
  const [selectedJobId, setSelectedJobId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const loadJobs = async () => {
    setLoading(true);
    try {
      // For now, we'll just show a manual job ID entry
      // In production, this would fetch from an API endpoint
      console.log('Jobs would be loaded from API');
    } catch (error) {
      console.error('Error loading jobs:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleJobSelect = (jobId) => {
    setSelectedJobId(jobId);
  };

  const handleJobComplete = () => {
    setSelectedJobId(null);
    setSearchQuery('');
  };

  if (selectedJobId) {
    return (
      <div className="min-h-screen bg-slate-50">
        <HelmetSEO title="Job Management - Fixlo Staff" />
        <div className="container-xl py-8">
          <button
            onClick={() => setSelectedJobId(null)}
            className="btn-ghost mb-4"
          >
            ← Back to Job List
          </button>
          <ClockInSystem jobId={selectedJobId} onComplete={handleJobComplete} />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <HelmetSEO title="Job Management - Fixlo Staff" />
      
      <div className="container-xl py-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold text-slate-900 mb-8">Job Management</h1>

          <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">Enter Job ID</h2>
            <p className="text-slate-600 mb-4">
              Enter the job ID to clock in and manage the service request.
            </p>
            
            <div className="flex gap-4">
              <input
                type="text"
                placeholder="Enter Job ID (e.g., 507f1f77bcf86cd799439011)"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="input flex-1"
              />
              <button
                onClick={() => handleJobSelect(searchQuery)}
                disabled={!searchQuery}
                className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Open Job
              </button>
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
            <h3 className="font-semibold text-blue-900 mb-3">Staff Instructions</h3>
            <ol className="space-y-2 text-blue-800 text-sm">
              <li>1. Receive job ID from dispatch or customer confirmation email</li>
              <li>2. Enter the job ID above and click "Open Job"</li>
              <li>3. Clock in when you arrive at the job site (GPS required)</li>
              <li>4. Complete the work and add any materials used</li>
              <li>5. Check "Customer approved the work" if they're moving forward</li>
              <li>6. Clock out to automatically generate invoice and charge customer</li>
            </ol>
          </div>

          <div className="mt-6 bg-slate-50 border border-slate-200 rounded-lg p-6">
            <h3 className="font-semibold text-slate-900 mb-3">Pricing Details</h3>
            <ul className="space-y-2 text-slate-700 text-sm">
              <li>• <strong>Labor:</strong> $150/hour (2-hour minimum)</li>
              <li>• <strong>Visit Fee:</strong> $150 (waived if customer approves work)</li>
              <li>• <strong>Materials:</strong> Itemized and billed separately</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
