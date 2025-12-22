import React, { useState, useEffect } from 'react';
import HelmetSEO from '../seo/HelmetSEO';
import { API_BASE } from '../utils/config';

export default function AdminJobsPage() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [selectedJob, setSelectedJob] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    loadJobs();
  }, [filter]);

  const loadJobs = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('adminToken');
      if (!token) {
        setError('Not authenticated');
        return;
      }

      const params = new URLSearchParams();
      if (filter !== 'all') params.append('status', filter);

      const response = await fetch(`${API_BASE}/api/admin/jobs?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) throw new Error('Failed to fetch jobs');

      const data = await response.json();
      setJobs(data.jobs || []);
    } catch (err) {
      console.error('Error loading jobs:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const viewJobDetails = async (jobId) => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`${API_BASE}/api/admin/jobs/${jobId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) throw new Error('Failed to fetch job details');

      const data = await response.json();
      setSelectedJob(data.job);
      setShowModal(true);
    } catch (err) {
      console.error('Error loading job details:', err);
      alert('Failed to load job details');
    }
  };

  const handleSchedule = async () => {
    const date = prompt('Enter scheduled date (YYYY-MM-DD):');
    const time = prompt('Enter scheduled time (e.g., 10:00 AM):');
    
    if (!date || !time) return;

    try {
      setActionLoading(true);
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`${API_BASE}/api/admin/jobs/${selectedJob._id}/schedule`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ scheduledDate: date, scheduledTime: time })
      });

      if (!response.ok) throw new Error('Failed to schedule visit');

      alert('Visit scheduled successfully');
      setShowModal(false);
      loadJobs();
    } catch (err) {
      alert('Failed to schedule visit: ' + err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleStartJob = async () => {
    if (!confirm('Start this job?')) return;

    try {
      setActionLoading(true);
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`${API_BASE}/api/admin/jobs/${selectedJob._id}/start`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({})
      });

      if (!response.ok) throw new Error('Failed to start job');

      alert('Job started successfully');
      setShowModal(false);
      loadJobs();
    } catch (err) {
      alert('Failed to start job: ' + err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleEndJob = async () => {
    if (!confirm('End this job?')) return;

    try {
      setActionLoading(true);
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`${API_BASE}/api/admin/jobs/${selectedJob._id}/end`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) throw new Error('Failed to end job');

      alert('Job ended successfully');
      setShowModal(false);
      loadJobs();
    } catch (err) {
      alert('Failed to end job: ' + err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleAddMaterials = async () => {
    const description = prompt('Material description:');
    const cost = prompt('Material cost ($):');
    
    if (!description || !cost) return;

    try {
      setActionLoading(true);
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`${API_BASE}/api/admin/jobs/${selectedJob._id}/materials`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          materials: [{ description, cost: parseFloat(cost) }] 
        })
      });

      if (!response.ok) throw new Error('Failed to add materials');

      alert('Materials added successfully');
      viewJobDetails(selectedJob._id);
    } catch (err) {
      alert('Failed to add materials: ' + err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleCompleteJob = async () => {
    const laborCost = prompt('Enter labor cost ($):');
    if (!laborCost) return;

    if (!confirm('Mark job as completed?')) return;

    try {
      setActionLoading(true);
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`${API_BASE}/api/admin/jobs/${selectedJob._id}/complete`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ laborCost: parseFloat(laborCost) })
      });

      if (!response.ok) throw new Error('Failed to complete job');

      alert('Job completed successfully');
      setShowModal(false);
      loadJobs();
    } catch (err) {
      alert('Failed to complete job: ' + err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleGenerateInvoice = async () => {
    const chargeNow = confirm('Generate and charge invoice immediately? (Cancel to generate without charging)');

    try {
      setActionLoading(true);
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`${API_BASE}/api/admin/jobs/${selectedJob._id}/invoice`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ chargeNow })
      });

      if (!response.ok) throw new Error('Failed to generate invoice');

      const data = await response.json();
      alert(`Invoice generated! Amount: $${data.invoice.amount}${chargeNow ? ' (Charged)' : ' (Not charged yet)'}`);
      setShowModal(false);
      loadJobs();
    } catch (err) {
      alert('Failed to generate invoice: ' + err.message);
    } finally {
      setActionLoading(false);
    }
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

  return (
    <>
      <HelmetSEO 
        title="Admin Job Control Center | Fixlo" 
        canonicalPathname="/admin/jobs" 
        robots="noindex, nofollow" 
      />
      
      <div className="container-xl py-8">
        <h1 className="text-3xl font-bold mb-6">Job Control Center</h1>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        {/* Filters */}
        <div className="mb-6 flex gap-2 flex-wrap">
          {['all', 'pending', 'scheduled', 'assigned', 'in-progress', 'completed'].map(status => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`px-4 py-2 rounded-lg font-medium ${
                filter === status 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
              }`}
            >
              {status.charAt(0).toUpperCase() + status.slice(1).replace('-', ' ')}
            </button>
          ))}
        </div>

        {/* Job List */}
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="mt-2 text-gray-600">Loading jobs...</p>
          </div>
        ) : jobs.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg border">
            <p className="text-gray-500">No jobs found</p>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">City</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Service</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Cost</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {jobs.map(job => (
                  <tr key={job._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{job.name}</div>
                      <div className="text-sm text-gray-500">{job.phone}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {job.city || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {job.trade}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-col gap-1">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(job.status)}`}>
                          {job.status}
                        </span>
                        {job.priorityNotified && (
                          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-orange-100 text-orange-800">
                            Priority Pro Notified
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      ${job.totalCost || '0.00'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => viewJobDetails(job._id)}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        View Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Job Detail Modal */}
        {showModal && selectedJob && (
          <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                <h2 className="text-2xl font-bold">Job Details</h2>
                <button
                  onClick={() => setShowModal(false)}
                  className="text-gray-400 hover:text-gray-500"
                >
                  <span className="text-2xl">&times;</span>
                </button>
              </div>

              <div className="px-6 py-4">
                <div className="grid md:grid-cols-2 gap-6">
                  {/* Customer Info */}
                  <div>
                    <h3 className="text-lg font-semibold mb-3">Customer Information</h3>
                    <div className="space-y-2 text-sm">
                      <p><strong>Name:</strong> {selectedJob.name}</p>
                      <p><strong>Phone:</strong> {selectedJob.phone}</p>
                      <p><strong>Email:</strong> {selectedJob.email || 'N/A'}</p>
                      <p><strong>Address:</strong> {selectedJob.address}</p>
                      <p><strong>City:</strong> {selectedJob.city || 'N/A'}</p>
                    </div>
                  </div>

                  {/* Job Info */}
                  <div>
                    <h3 className="text-lg font-semibold mb-3">Job Information</h3>
                    <div className="space-y-2 text-sm">
                      <p><strong>Service:</strong> {selectedJob.trade}</p>
                      <p><strong>Status:</strong> <span className={`px-2 py-1 rounded ${getStatusColor(selectedJob.status)}`}>{selectedJob.status}</span></p>
                      <p><strong>Description:</strong> {selectedJob.description || 'N/A'}</p>
                      {selectedJob.assignedTo && (
                        <p><strong>Assigned To:</strong> {selectedJob.assignedTo.name}</p>
                      )}
                    </div>
                  </div>

                  {/* Timing */}
                  {(selectedJob.scheduledDate || selectedJob.clockInTime) && (
                    <div>
                      <h3 className="text-lg font-semibold mb-3">Timing</h3>
                      <div className="space-y-2 text-sm">
                        {selectedJob.scheduledDate && (
                          <p><strong>Scheduled:</strong> {new Date(selectedJob.scheduledDate).toLocaleDateString()} {selectedJob.scheduledTime}</p>
                        )}
                        {selectedJob.clockInTime && (
                          <p><strong>Clock In:</strong> {new Date(selectedJob.clockInTime).toLocaleString()}</p>
                        )}
                        {selectedJob.clockOutTime && (
                          <p><strong>Clock Out:</strong> {new Date(selectedJob.clockOutTime).toLocaleString()}</p>
                        )}
                        {selectedJob.totalHours > 0 && (
                          <p><strong>Total Hours:</strong> {selectedJob.totalHours}</p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Billing */}
                  <div>
                    <h3 className="text-lg font-semibold mb-3">Billing</h3>
                    <div className="space-y-2 text-sm">
                      <p><strong>Visit Fee:</strong> ${selectedJob.visitFee} {selectedJob.visitFeeWaived && '(Waived)'}</p>
                      <p><strong>Labor Cost:</strong> ${selectedJob.laborCost || '0.00'}</p>
                      <p><strong>Materials Cost:</strong> ${selectedJob.materialsCost || '0.00'}</p>
                      <p className="text-lg"><strong>Total:</strong> ${selectedJob.totalCost || '0.00'}</p>
                    </div>
                  </div>

                  {/* Materials */}
                  {selectedJob.materials && selectedJob.materials.length > 0 && (
                    <div className="md:col-span-2">
                      <h3 className="text-lg font-semibold mb-3">Materials</h3>
                      <ul className="space-y-1 text-sm">
                        {selectedJob.materials.map((material, idx) => (
                          <li key={idx}>
                            {material.description} - ${material.cost}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Priority Pro Routing */}
                  {selectedJob.priorityNotified && (
                    <div className="md:col-span-2">
                      <h3 className="text-lg font-semibold mb-3">Priority Pro Routing</h3>
                      <div className="space-y-2 text-sm">
                        <p>
                          <span className="px-3 py-1 bg-orange-100 text-orange-800 rounded-full font-semibold">
                            Priority Pro Notified
                          </span>
                        </p>
                        <p><strong>Priority Pro:</strong> {selectedJob.priorityPro || 'N/A'}</p>
                        <p><strong>Phone:</strong> +1 (516) 444-9953</p>
                        {selectedJob.priorityNotifiedAt && (
                          <p><strong>Notified At:</strong> {new Date(selectedJob.priorityNotifiedAt).toLocaleString()}</p>
                        )}
                        {selectedJob.priorityAcceptedAt && (
                          <p className="text-green-600">
                            <strong>✅ Accepted At:</strong> {new Date(selectedJob.priorityAcceptedAt).toLocaleString()}
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* SMS Consent */}
                  <div className="md:col-span-2">
                    <h3 className="text-lg font-semibold mb-3">Compliance</h3>
                    <div className="space-y-2 text-sm">
                      <p><strong>SMS Consent:</strong> {selectedJob.smsConsent ? 'Yes' : 'No'}</p>
                      {selectedJob.smsOptOut && <p className="text-red-600"><strong>SMS Opted Out</strong></p>}
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="mt-6 flex flex-wrap gap-3">
                  {selectedJob.status === 'pending' && (
                    <button
                      onClick={handleSchedule}
                      disabled={actionLoading}
                      className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400"
                    >
                      Schedule Visit
                    </button>
                  )}
                  
                  {(selectedJob.status === 'scheduled' || selectedJob.status === 'assigned') && (
                    <button
                      onClick={handleStartJob}
                      disabled={actionLoading}
                      className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:bg-gray-400"
                    >
                      Start Job
                    </button>
                  )}
                  
                  {selectedJob.status === 'in-progress' && (
                    <>
                      <button
                        onClick={handleEndJob}
                        disabled={actionLoading}
                        className="px-4 py-2 bg-orange-600 text-white rounded hover:bg-orange-700 disabled:bg-gray-400"
                      >
                        End Job
                      </button>
                      <button
                        onClick={handleAddMaterials}
                        disabled={actionLoading}
                        className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 disabled:bg-gray-400"
                      >
                        Add Materials
                      </button>
                    </>
                  )}
                  
                  {selectedJob.clockOutTime && !selectedJob.paidAt && (
                    <button
                      onClick={handleCompleteJob}
                      disabled={actionLoading}
                      className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400"
                    >
                      Complete Job
                    </button>
                  )}
                  
                  {selectedJob.status === 'completed' && !selectedJob.paidAt && (
                    <button
                      onClick={handleGenerateInvoice}
                      disabled={actionLoading}
                      className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 disabled:bg-gray-400"
                    >
                      Generate Invoice
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
