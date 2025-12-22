import React, { useState, useEffect } from 'react';

const API_URL = import.meta.env.VITE_API_URL || 'https://fixloapp.onrender.com';

export default function ClockInSystem({ jobId, onComplete }) {
  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [location, setLocation] = useState(null);
  const [materials, setMaterials] = useState([{ description: '', cost: 0 }]);
  const [jobApproved, setJobApproved] = useState(false);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    loadJob();
    getCurrentLocation();
  }, [jobId]);

  const getCurrentLocation = () => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          });
        },
        (error) => {
          console.error('Error getting location:', error);
          setError('Unable to get GPS location. Please enable location services.');
        }
      );
    } else {
      setError('Geolocation is not supported by your browser');
    }
  };

  const loadJob = async () => {
    try {
      const response = await fetch(`${API_URL}/api/service-intake/job/${jobId}`);
      const data = await response.json();
      
      if (data.success) {
        setJob(data.job);
      } else {
        setError(data.message);
      }
    } catch (err) {
      setError('Error loading job details');
    } finally {
      setLoading(false);
    }
  };

  const handleClockIn = async () => {
    if (!location) {
      setError('GPS location is required to clock in');
      return;
    }

    setProcessing(true);
    setError('');

    try {
      const response = await fetch(`${API_URL}/api/service-intake/clock-in/${jobId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          latitude: location.latitude,
          longitude: location.longitude,
          staffId: 'STAFF_001' // TODO: Use actual staff ID from authentication
        })
      });

      const data = await response.json();

      if (data.success) {
        await loadJob();
      } else {
        setError(data.message);
      }
    } catch (err) {
      setError('Error clocking in: ' + err.message);
    } finally {
      setProcessing(false);
    }
  };

  const handleClockOut = async () => {
    setProcessing(true);
    setError('');

    // Filter out empty materials
    const validMaterials = materials.filter(m => m.description && m.cost > 0);

    try {
      const response = await fetch(`${API_URL}/api/service-intake/clock-out/${jobId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          materials: validMaterials,
          jobApproved: jobApproved
        })
      });

      const data = await response.json();

      if (data.success) {
        alert(`Job completed!\nTotal Hours: ${data.totalHours.toFixed(2)}\nTotal Cost: $${data.totalCost.toFixed(2)}\nInvoice: ${data.invoiceNumber}\nPayment ${data.charged ? 'Charged' : 'Pending'}`);
        if (onComplete) {
          onComplete(data);
        }
      } else {
        setError(data.message);
      }
    } catch (err) {
      setError('Error clocking out: ' + err.message);
    } finally {
      setProcessing(false);
    }
  };

  const addMaterialRow = () => {
    setMaterials([...materials, { description: '', cost: 0 }]);
  };

  const removeMaterialRow = (index) => {
    setMaterials(materials.filter((_, i) => i !== index));
  };

  const updateMaterial = (index, field, value) => {
    const updated = [...materials];
    updated[index][field] = field === 'cost' ? parseFloat(value) || 0 : value;
    setMaterials(updated);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand mx-auto"></div>
          <p className="mt-4 text-slate-600">Loading job details...</p>
        </div>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="p-8 text-center">
        <p className="text-red-600">Job not found</p>
      </div>
    );
  }

  const isClocked = !!job.clockInTime && !job.clockOutTime;
  const isCompleted = !!job.clockOutTime;

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-2xl font-bold text-slate-900 mb-4">Job Clock-In System</h2>
        
        {/* Job Details */}
        <div className="bg-slate-50 rounded-lg p-4 mb-6 space-y-2">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-slate-600">Service Type</p>
              <p className="font-semibold">{job.trade}</p>
            </div>
            <div>
              <p className="text-sm text-slate-600">Customer</p>
              <p className="font-semibold">{job.name}</p>
            </div>
            <div>
              <p className="text-sm text-slate-600">Address</p>
              <p className="font-semibold">{job.address}</p>
            </div>
            <div>
              <p className="text-sm text-slate-600">Status</p>
              <p className="font-semibold capitalize">{job.status}</p>
            </div>
          </div>
          <div>
            <p className="text-sm text-slate-600">Description</p>
            <p className="text-slate-800">{job.description}</p>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-800 p-4 rounded-lg mb-4">
            {error}
          </div>
        )}

        {!location && (
          <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 p-4 rounded-lg mb-4">
            Waiting for GPS location...
          </div>
        )}

        {/* Clock In Button */}
        {!job.clockInTime && (
          <button
            onClick={handleClockIn}
            disabled={!location || processing}
            className="btn-primary w-full py-4 text-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {processing ? 'Clocking In...' : '🕐 Clock In'}
          </button>
        )}

        {/* Clock Out Section */}
        {isClocked && !isCompleted && (
          <div className="space-y-6">
            <div className="bg-green-50 border border-green-200 p-4 rounded-lg">
              <p className="text-green-800 font-semibold">
                ✓ Clocked in at {new Date(job.clockInTime).toLocaleTimeString()}
              </p>
            </div>

            {/* Job Approval */}
            <div className="border border-slate-200 rounded-lg p-4">
              <label className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={jobApproved}
                  onChange={(e) => setJobApproved(e.target.checked)}
                  className="h-5 w-5 text-brand border-slate-300 rounded focus:ring-brand"
                />
                <div>
                  <p className="font-semibold text-slate-900">Customer approved the work</p>
                  <p className="text-sm text-slate-600">Check this to waive the $150 visit fee</p>
                </div>
              </label>
            </div>

            {/* Materials */}
            <div className="border border-slate-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-slate-900">Materials Used</h3>
                <button
                  onClick={addMaterialRow}
                  className="btn-ghost text-sm"
                >
                  + Add Material
                </button>
              </div>

              <div className="space-y-3">
                {materials.map((material, index) => (
                  <div key={index} className="flex gap-3">
                    <input
                      type="text"
                      placeholder="Material description"
                      value={material.description}
                      onChange={(e) => updateMaterial(index, 'description', e.target.value)}
                      className="input flex-1"
                    />
                    <input
                      type="number"
                      placeholder="Cost"
                      value={material.cost || ''}
                      onChange={(e) => updateMaterial(index, 'cost', e.target.value)}
                      className="input w-32"
                      min="0"
                      step="0.01"
                    />
                    {materials.length > 1 && (
                      <button
                        onClick={() => removeMaterialRow(index)}
                        className="btn-ghost text-red-600 px-3"
                      >
                        ×
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Pricing Summary */}
            <div className="bg-slate-50 rounded-lg p-4 space-y-2">
              <h3 className="font-semibold text-slate-900 mb-3">Pricing Summary</h3>
              <div className="flex justify-between text-sm">
                <span>Labor Rate:</span>
                <span className="font-semibold">$150/hour</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Minimum Hours:</span>
                <span className="font-semibold">2 hours</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Visit Fee:</span>
                <span className={jobApproved ? 'line-through text-slate-400' : 'font-semibold'}>$150</span>
              </div>
              {jobApproved && (
                <div className="flex justify-between text-sm text-green-600">
                  <span>Visit Fee Waived:</span>
                  <span className="font-semibold">-$150</span>
                </div>
              )}
              <div className="flex justify-between text-sm">
                <span>Materials:</span>
                <span className="font-semibold">
                  ${materials.reduce((sum, m) => sum + (m.cost || 0), 0).toFixed(2)}
                </span>
              </div>
            </div>

            <button
              onClick={handleClockOut}
              disabled={processing}
              className="btn-primary w-full py-4 text-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {processing ? 'Processing...' : '🕐 Clock Out & Complete Job'}
            </button>
          </div>
        )}

        {/* Completed Status */}
        {isCompleted && (
          <div className="space-y-4">
            <div className="bg-green-50 border border-green-200 p-4 rounded-lg">
              <p className="text-green-800 font-semibold text-center">
                ✓ Job Completed
              </p>
            </div>
            <div className="bg-slate-50 rounded-lg p-4 space-y-2">
              <div className="flex justify-between">
                <span>Clocked In:</span>
                <span className="font-semibold">{new Date(job.clockInTime).toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span>Clocked Out:</span>
                <span className="font-semibold">{new Date(job.clockOutTime).toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span>Total Hours:</span>
                <span className="font-semibold">{job.totalHours.toFixed(2)} hours</span>
              </div>
              <div className="flex justify-between">
                <span>Total Cost:</span>
                <span className="font-semibold text-lg">${job.totalCost.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Invoice:</span>
                <span className="font-semibold">{job.invoiceId}</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
