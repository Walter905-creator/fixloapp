import React, { useState, useEffect } from 'react';
import HelmetSEO from '../seo/HelmetSEO';
import { API_BASE } from '../utils/config';

export default function ContractorDashboardPage() {
  const [jobs, setJobs] = useState([]);
  const [contractor, setContractor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [selectedJob, setSelectedJob] = useState(null);
  const [showJobModal, setShowJobModal] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState('');
  const [gpsPermission, setGpsPermission] = useState(null);

  useEffect(() => {
    loadJobs();
    checkGpsPermission();
  }, [filter]);

  const checkGpsPermission = async () => {
    if ('geolocation' in navigator) {
      try {
        const result = await navigator.permissions.query({ name: 'geolocation' });
        setGpsPermission(result.state);
      } catch (err) {
        console.warn('GPS permission check not supported:', err);
      }
    }
  };

  const loadJobs = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('proToken');
      if (!token) {
        setError('Not authenticated');
        return;
      }

      const params = new URLSearchParams();
      if (filter !== 'all') params.append('status', filter);

      const response = await fetch(`${API_BASE}/api/contractor/jobs?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) throw new Error('Failed to fetch jobs');

      const data = await response.json();
      setJobs(data.jobs || []);
      setContractor(data.contractor);
    } catch (err) {
      console.error('Error loading jobs:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getCurrentLocation = () => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation not supported'));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        position => {
          resolve({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
        },
        error => {
          reject(new Error('Failed to get location: ' + error.message));
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0
        }
      );
    });
  };

  const handleClockIn = async (jobId) => {
    if (!confirm('Clock in to this job?')) return;

    try {
      setActionLoading(true);
      
      // Get GPS location
      const location = await getCurrentLocation();
      
      const token = localStorage.getItem('proToken');
      const response = await fetch(`${API_BASE}/api/contractor/jobs/${jobId}/clock-in`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ location })
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to clock in');
      }

      alert('Clocked in successfully');
      loadJobs();
      setShowJobModal(false);
    } catch (err) {
      alert('Failed to clock in: ' + err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleClockOut = async (jobId) => {
    if (!confirm('Clock out from this job?')) return;

    try {
      setActionLoading(true);
      
      const token = localStorage.getItem('proToken');
      const response = await fetch(`${API_BASE}/api/contractor/jobs/${jobId}/clock-out`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to clock out');
      }

      const data = await response.json();
      alert(`Clocked out successfully. Hours worked: ${data.hoursWorked}`);
      loadJobs();
      setShowJobModal(false);
    } catch (err) {
      alert('Failed to clock out: ' + err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const viewJobDetails = (job) => {
    setSelectedJob(job);
    setShowJobModal(true);
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
        title="Contractor Dashboard | Fixlo" 
        canonicalPathname="/contractor/dashboard" 
        robots="noindex, nofollow" 
      />
      
      <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Contractor Dashboard</h1>
          
          {/* Status Bar */}
          {contractor && (
            <div className="bg-white rounded-lg shadow p-4 mb-6">
              <div className="flex flex-wrap gap-6">
                <div>
                  <p className="text-sm text-gray-600">Status</p>
                  <p className={`font-semibold ${contractor.isClockedIn ? 'text-green-600' : 'text-gray-900'}`}>
                    {contractor.isClockedIn ? 'Clocked In' : 'Available'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Total Hours Worked</p>
                  <p className="font-semibold text-gray-900">{contractor.totalHoursWorked || 0} hrs</p>
                </div>
                {gpsPermission && (
                  <div>
                    <p className="text-sm text-gray-600">GPS Status</p>
                    <p className={`font-semibold ${gpsPermission === 'granted' ? 'text-green-600' : 'text-orange-600'}`}>
                      {gpsPermission === 'granted' ? 'Enabled' : 'Needs Permission'}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}

          {/* Filters */}
          <div className="mb-6 flex gap-2 flex-wrap">
            {['all', 'assigned', 'in-progress', 'completed'].map(status => (
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
            <div className="text-center py-12 bg-white rounded-lg shadow">
              <p className="text-gray-500">No jobs assigned</p>
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
                        <p className="text-sm text-gray-600 mb-1">
                          {job.address}
                        </p>
                        {job.description && (
                          <p className="text-sm text-gray-500 line-clamp-2">
                            {job.description}
                          </p>
                        )}
                        {job.scheduledDate && (
                          <p className="text-sm text-blue-600 mt-2">
                            Scheduled: {new Date(job.scheduledDate).toLocaleDateString()} at {job.scheduledTime}
                          </p>
                        )}
                      </div>
                      <div className="mt-4 sm:mt-0 sm:ml-6">
                        {job.clockInTime && !job.clockOutTime && (
                          <p className="text-sm text-green-600 font-medium">
                            Clocked in
                          </p>
                        )}
                        {job.totalHours > 0 && (
                          <p className="text-sm text-gray-600">
                            {job.totalHours} hours
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
                    onClick={() => setShowJobModal(false)}
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
                    </div>

                    {/* Job Details */}
                    <div>
                      <h3 className="text-lg font-semibold mb-2">Job Information</h3>
                      <div className="space-y-1 text-sm">
                        <p><strong>Service:</strong> {selectedJob.trade}</p>
                        <p><strong>Address:</strong> {selectedJob.address}</p>
                        <p><strong>Description:</strong> {selectedJob.description || 'N/A'}</p>
                      </div>
                    </div>

                    {/* Customer Info */}
                    <div>
                      <h3 className="text-lg font-semibold mb-2">Customer</h3>
                      <div className="space-y-1 text-sm">
                        <p><strong>Name:</strong> {selectedJob.name}</p>
                        <p><strong>Phone:</strong> {selectedJob.phone}</p>
                      </div>
                    </div>

                    {/* Timing */}
                    {(selectedJob.scheduledDate || selectedJob.clockInTime) && (
                      <div>
                        <h3 className="text-lg font-semibold mb-2">Time Tracking</h3>
                        <div className="space-y-1 text-sm">
                          {selectedJob.scheduledDate && (
                            <p><strong>Scheduled:</strong> {new Date(selectedJob.scheduledDate).toLocaleDateString()} at {selectedJob.scheduledTime}</p>
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

                    {/* Action Buttons */}
                    <div className="flex flex-wrap gap-3 pt-4">
                      {selectedJob.status === 'assigned' && !selectedJob.clockInTime && (
                        <button
                          onClick={() => handleClockIn(selectedJob._id)}
                          disabled={actionLoading}
                          className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:bg-gray-400"
                        >
                          Clock In
                        </button>
                      )}
                      
                      {selectedJob.clockInTime && !selectedJob.clockOutTime && (
                        <button
                          onClick={() => handleClockOut(selectedJob._id)}
                          disabled={actionLoading}
                          className="px-4 py-2 bg-orange-600 text-white rounded hover:bg-orange-700 disabled:bg-gray-400"
                        >
                          Clock Out
                        </button>
                      )}
                    </div>
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
