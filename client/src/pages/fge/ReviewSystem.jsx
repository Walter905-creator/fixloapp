/**
 * FGE Review System — request and moderate reviews.
 */

import React, { useEffect, useState } from 'react';
import FGELayout from './FGELayout';
import { fgeApi } from '../../lib/fgeApi';

export default function ReviewSystem() {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [reqForm, setReqForm] = useState({ jobId: '', homeownerEmail: '', homeownerPhone: '', proName: '', channel: 'email' });
  const [requesting, setRequesting] = useState(false);

  useEffect(() => { loadReviews(); }, []);

  async function loadReviews() {
    setLoading(true);
    try {
      const { reviews } = await fgeApi.getReviewsAdmin();
      setReviews(reviews || []);
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  }

  async function handleRequest(e) {
    e.preventDefault();
    setRequesting(true); setError(''); setSuccess('');
    try {
      const result = await fgeApi.requestReview(reqForm);
      setSuccess(`Review request sent! Link: ${result.reviewUrl}`);
      setReqForm({ jobId: '', homeownerEmail: '', homeownerPhone: '', proName: '', channel: 'email' });
    } catch (e) { setError(e.message); }
    finally { setRequesting(false); }
  }

  async function handleApprove(id) {
    try { await fgeApi.approveReview(id); setSuccess('Approved!'); loadReviews(); }
    catch (e) { setError(e.message); }
  }

  async function handleReject(id) {
    try { await fgeApi.rejectReview(id); loadReviews(); }
    catch (e) { setError(e.message); }
  }

  return (
    <FGELayout>
      <h2 className="text-2xl font-bold text-white mb-6">Review System</h2>

      {error && <div className="bg-red-900/40 border border-red-700 text-red-300 rounded-lg p-3 mb-4">{error}</div>}
      {success && <div className="bg-green-900/40 border border-green-700 text-green-300 rounded-lg p-3 mb-4">{success}</div>}

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-8">
        {/* Request form */}
        <div className="bg-gray-800 border border-gray-700 rounded-xl p-6">
          <h3 className="font-semibold text-white mb-4">Request a Review</h3>
          <form onSubmit={handleRequest} className="space-y-4">
            <input type="text" placeholder="Job ID (optional)" value={reqForm.jobId}
              onChange={(e) => setReqForm((f) => ({ ...f, jobId: e.target.value }))}
              className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm" />
            <input type="email" placeholder="Homeowner email" value={reqForm.homeownerEmail}
              onChange={(e) => setReqForm((f) => ({ ...f, homeownerEmail: e.target.value }))}
              className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm" />
            <input type="tel" placeholder="Homeowner phone (optional)" value={reqForm.homeownerPhone}
              onChange={(e) => setReqForm((f) => ({ ...f, homeownerPhone: e.target.value }))}
              className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm" />
            <input type="text" placeholder="Pro name" value={reqForm.proName}
              onChange={(e) => setReqForm((f) => ({ ...f, proName: e.target.value }))}
              className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm" />
            <select value={reqForm.channel} onChange={(e) => setReqForm((f) => ({ ...f, channel: e.target.value }))}
              className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm">
              {['email','sms','both'].map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
            <button type="submit" disabled={requesting}
              className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-medium rounded-lg px-4 py-2.5 text-sm">
              {requesting ? 'Sending…' : '⭐ Request Review'}
            </button>
          </form>
        </div>

        {/* Info */}
        <div className="bg-gray-800 border border-gray-700 rounded-xl p-6">
          <h3 className="font-semibold text-white mb-3">How it works</h3>
          <ul className="space-y-2 text-sm text-gray-400">
            <li>• After a job is completed, send a review request via email or SMS.</li>
            <li>• The homeowner follows a unique link to leave a review.</li>
            <li>• Approve or reject reviews before they appear publicly.</li>
            <li>• Integrate with Google and Facebook review links in settings.</li>
          </ul>
        </div>
      </div>

      {/* Reviews table */}
      <div className="bg-gray-800 border border-gray-700 rounded-xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-700">
          <h3 className="font-semibold text-white">Reviews ({reviews.length})</h3>
          <button onClick={loadReviews} className="text-xs text-gray-400 hover:text-white">↻ Refresh</button>
        </div>
        {loading ? <p className="text-gray-400 text-sm p-5">Loading…</p> :
         reviews.length === 0 ? <p className="text-gray-400 text-sm p-5">No reviews yet.</p> : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-gray-500 border-b border-gray-700">
                  <th className="px-5 py-3">Rating</th><th className="px-5 py-3">Comment</th>
                  <th className="px-5 py-3">Status</th><th className="px-5 py-3">Date</th>
                  <th className="px-5 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {reviews.map((r) => (
                  <tr key={r._id} className="border-b border-gray-700/50 hover:bg-gray-700/30">
                    <td className="px-5 py-3 text-yellow-400 font-bold">{'⭐'.repeat(Math.min(r.rating || 5, 5))}</td>
                    <td className="px-5 py-3 text-gray-300 text-xs max-w-xs truncate">{r.comment || r.body || '—'}</td>
                    <td className="px-5 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded ${
                        r.status === 'approved' ? 'bg-green-900 text-green-300' :
                        r.status === 'rejected' ? 'bg-red-900 text-red-300' : 'bg-yellow-900 text-yellow-300'
                      }`}>{r.status || 'pending'}</span>
                    </td>
                    <td className="px-5 py-3 text-gray-400 text-xs">{new Date(r.createdAt).toLocaleDateString()}</td>
                    <td className="px-5 py-3 flex gap-2">
                      {r.status !== 'approved' && (
                        <button onClick={() => handleApprove(r._id)} className="text-xs bg-green-800 hover:bg-green-700 text-white px-2 py-1 rounded">Approve</button>
                      )}
                      {r.status !== 'rejected' && (
                        <button onClick={() => handleReject(r._id)} className="text-xs bg-red-900/50 hover:bg-red-800 text-red-300 px-2 py-1 rounded">Reject</button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </FGELayout>
  );
}
