import React, { useState, useEffect } from 'react';
import HelmetSEO from '../seo/HelmetSEO';
import { API_BASE } from '../utils/config';

export default function CustomerPortalPage() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [authenticated, setAuthenticated] = useState(false);
  const [selectedJob, setSelectedJob] = useState(null);
  const [showJobModal, setShowJobModal] = useState(false);
  const [invoice, setInvoice] = useState(null);
  const [error, setError] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    
    if (!phone && !email) {
      setError('Please enter your phone number or email');
      return;
    }

    try {
      setLoading(true);
      setError('');
      
      const params = new URLSearchParams();
      if (phone) params.append('phone', phone);
      if (email) params.append('email', email);

      const response = await fetch(`${API_BASE}/api/customer/jobs?${params}`);
      
      if (!response.ok) throw new Error('Failed to fetch jobs');

      const data = await response.json();
      setJobs(data.jobs || []);
      setAuthenticated(true);
      
      // Store credentials for session
      sessionStorage.setItem('customerPhone', phone);
      sessionStorage.setItem('customerEmail', email);
    } catch (err) {
      console.error('Error loading jobs:', err);
      setError('Failed to load jobs. Please check your information and try again.');
    } finally {
      setLoading(false);
    }
  };

  const viewJobDetails = async (job) => {
    setSelectedJob(job);
    setShowJobModal(true);
    
    // Load invoice if job is completed
    if (job.invoiceId) {
      try {
        const response = await fetch(`${API_BASE}/api/customer/jobs/${job._id}/invoice`);
        if (response.ok) {
          const data = await response.json();
          setInvoice(data);
        }
      } catch (err) {
        console.error('Error loading invoice:', err);
      }
    }
  };

  const downloadInvoice = (jobId) => {
    window.open(`${API_BASE}/api/customer/jobs/${jobId}/invoice/pdf`, '_blank');
  };

  const getStatusColor = (status) => {
    const colors = {
      'pending': 'bg-yellow-100 text-yellow-800',
      'scheduled': 'bg-blue-100 text-blue-800',
      'assigned': 'bg-purple-100 text-purple-800',
      'in-progress': 'bg-green-100 text-green-800',
      'completed': 'bg-gray-100 text-gray-800',
      'cancelled': 'bg-red-100 text-red-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getStatusMessage = (job) => {
    switch (job.status) {
      case 'pending':
        return 'Your request has been received. We will contact you soon.';
      case 'scheduled':
        return `Scheduled for ${new Date(job.scheduledDate).toLocaleDateString()} at ${job.scheduledTime}`;
      case 'assigned':
        return `Assigned to ${job.assignedTo?.name || 'a technician'}`;
      case 'in-progress':
        return 'Technician is working on your job';
      case 'completed':
        return 'Job completed';
      default:
        return '';
    }
  };

  if (!authenticated) {
    return (
      <>
        <HelmetSEO 
          title="My Jobs | Fixlo" 
          canonicalPathname="/my-jobs" 
          robots="noindex, nofollow" 
        />
        
        <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
          <div className="sm:mx-auto sm:w-full sm:max-w-md">
            <h2 className="text-center text-3xl font-extrabold text-gray-900">
              My Jobs Portal
            </h2>
            <p className="mt-2 text-center text-sm text-gray-600">
              View your service requests and invoices
            </p>
          </div>

          <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
            <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
              <form onSubmit={handleLogin} className="space-y-6">
                {error && (
                  <div className="bg-red-50 border border-red-400 text-red-700 px-4 py-3 rounded">
                    {error}
                  </div>
                )}

                <div>
                  <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    id="phone"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="(555) 123-4567"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-center">
                    <span className="text-sm text-gray-500">OR</span>
                  </div>
                </div>

                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                    Email Address
                  </label>
                  <input
                    type="email"
                    id="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="you@example.com"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-gray-400"
                >
                  {loading ? 'Loading...' : 'View My Jobs'}
                </button>
              </form>
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <HelmetSEO 
        title="My Jobs | Fixlo" 
        canonicalPathname="/my-jobs" 
        robots="noindex, nofollow" 
      />
      
      <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900">My Jobs</h1>
            <button
              onClick={() => {
                setAuthenticated(false);
                setJobs([]);
                setPhone('');
                setEmail('');
                sessionStorage.clear();
              }}
              className="text-sm text-gray-600 hover:text-gray-900"
            >
              Sign Out
            </button>
          </div>

          {jobs.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-lg shadow">
              <p className="text-gray-500">No jobs found</p>
            </div>
          ) : (
            <div className="space-y-4">
              {jobs.map(job => (
                <div
                  key={job._id}
                  className="bg-white rounded-lg shadow hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => viewJobDetails(job)}
                >
                  <div className="p-6">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-semibold text-gray-900">
                            {job.trade}
                          </h3>
                          <span className={`px-3 py-1 text-xs font-semibold rounded-full ${getStatusColor(job.status)}`}>
                            {job.status}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 mb-2">
                          {getStatusMessage(job)}
                        </p>
                        <p className="text-xs text-gray-500">
                          Submitted: {new Date(job.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="mt-4 sm:mt-0 sm:ml-6 text-right">
                        {job.totalCost > 0 && (
                          <p className="text-2xl font-bold text-gray-900">
                            ${job.totalCost.toFixed(2)}
                          </p>
                        )}
                        {job.paidAt && (
                          <p className="text-xs text-green-600 font-medium">
                            Paid {new Date(job.paidAt).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Job Detail Modal */}
          {showJobModal && selectedJob && (
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4 z-50">
              <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                  <h2 className="text-2xl font-bold">Job Details</h2>
                  <button
                    onClick={() => {
                      setShowJobModal(false);
                      setInvoice(null);
                    }}
                    className="text-gray-400 hover:text-gray-500"
                  >
                    <span className="text-2xl">&times;</span>
                  </button>
                </div>

                <div className="px-6 py-4">
                  <div className="space-y-6">
                    {/* Status */}
                    <div>
                      <h3 className="text-lg font-semibold mb-2">Status</h3>
                      <span className={`px-3 py-1 text-sm font-semibold rounded-full ${getStatusColor(selectedJob.status)}`}>
                        {selectedJob.status}
                      </span>
                      <p className="mt-2 text-sm text-gray-600">
                        {getStatusMessage(selectedJob)}
                      </p>
                    </div>

                    {/* Service Details */}
                    <div>
                      <h3 className="text-lg font-semibold mb-2">Service Details</h3>
                      <div className="space-y-1 text-sm">
                        <p><strong>Service:</strong> {selectedJob.trade}</p>
                        <p><strong>Description:</strong> {selectedJob.description || 'N/A'}</p>
                        {selectedJob.assignedTo && (
                          <p><strong>Technician:</strong> {selectedJob.assignedTo.name}</p>
                        )}
                      </div>
                    </div>

                    {/* Timing */}
                    {(selectedJob.scheduledDate || selectedJob.clockInTime) && (
                      <div>
                        <h3 className="text-lg font-semibold mb-2">Timing</h3>
                        <div className="space-y-1 text-sm">
                          {selectedJob.scheduledDate && (
                            <p><strong>Scheduled:</strong> {new Date(selectedJob.scheduledDate).toLocaleDateString()} at {selectedJob.scheduledTime}</p>
                          )}
                          {selectedJob.clockInTime && (
                            <p><strong>Started:</strong> {new Date(selectedJob.clockInTime).toLocaleString()}</p>
                          )}
                          {selectedJob.clockOutTime && (
                            <p><strong>Completed:</strong> {new Date(selectedJob.clockOutTime).toLocaleString()}</p>
                          )}
                          {selectedJob.totalHours > 0 && (
                            <p><strong>Duration:</strong> {selectedJob.totalHours} hours</p>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Invoice */}
                    {invoice && (
                      <div>
                        <h3 className="text-lg font-semibold mb-2">Invoice</h3>
                        <div className="bg-gray-50 rounded-lg p-4">
                          <div className="space-y-2">
                            {!selectedJob.visitFeeWaived && selectedJob.visitFee > 0 && (
                              <div className="flex justify-between text-sm">
                                <span>Visit Fee</span>
                                <span>${selectedJob.visitFee.toFixed(2)}</span>
                              </div>
                            )}
                            {selectedJob.laborCost > 0 && (
                              <div className="flex justify-between text-sm">
                                <span>Labor ({selectedJob.totalHours || 0} hours)</span>
                                <span>${selectedJob.laborCost.toFixed(2)}</span>
                              </div>
                            )}
                            {selectedJob.materials && selectedJob.materials.length > 0 && (
                              <>
                                <div className="text-sm font-medium mt-2">Materials:</div>
                                {selectedJob.materials.map((material, idx) => (
                                  <div key={idx} className="flex justify-between text-sm pl-4">
                                    <span>{material.description}</span>
                                    <span>${material.cost.toFixed(2)}</span>
                                  </div>
                                ))}
                              </>
                            )}
                            <div className="border-t border-gray-300 mt-2 pt-2 flex justify-between font-bold">
                              <span>Total</span>
                              <span>${selectedJob.totalCost.toFixed(2)}</span>
                            </div>
                            {selectedJob.paidAt && (
                              <p className="text-sm text-green-600 text-right">
                                Paid on {new Date(selectedJob.paidAt).toLocaleDateString()}
                              </p>
                            )}
                          </div>

                          {selectedJob.invoiceId && (
                            <button
                              onClick={() => downloadInvoice(selectedJob._id)}
                              className="mt-4 w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700"
                            >
                              Download Invoice PDF
                            </button>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
