/**
 * FGE Referral System — overview and leaderboard.
 */

import React, { useEffect, useState } from 'react';
import FGELayout from './FGELayout';
import { fgeApi } from '../../lib/fgeApi';

export default function ReferralSystem() {
  const [overview, setOverview] = useState(null);
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    setLoading(true);
    Promise.all([fgeApi.getReferralOverview(), fgeApi.getReferralLeaderboard()])
      .then(([o, l]) => { setOverview(o.stats); setLeaderboard(l.leaderboard || []); })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <FGELayout>
      <h2 className="text-2xl font-bold text-white mb-6">Referral System</h2>

      {error && <div className="bg-red-900/40 border border-red-700 text-red-300 rounded-lg p-3 mb-4">{error}</div>}
      {loading && <p className="text-gray-400">Loading…</p>}

      {overview && overview.commissionReferrals && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          {[
            { label: 'Total Referrals', value: overview.commissionReferrals.total, color: 'text-blue-400' },
            { label: 'Converted', value: overview.commissionReferrals.converted, color: 'text-green-400' },
            { label: 'Pending', value: overview.commissionReferrals.pending, color: 'text-yellow-400' },
          ].map((m) => (
            <div key={m.label} className="bg-gray-800 border border-gray-700 rounded-xl p-6 text-center">
              <p className={`text-4xl font-bold ${m.color}`}>{m.value ?? 0}</p>
              <p className="text-gray-400 text-sm mt-2">{m.label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Leaderboard */}
      <div className="bg-gray-800 border border-gray-700 rounded-xl overflow-hidden">
        <h3 className="font-semibold text-white px-5 py-4 border-b border-gray-700">Referral Leaderboard</h3>
        {leaderboard.length === 0 ? (
          <p className="text-gray-400 text-sm p-5">No referral data yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-gray-500 border-b border-gray-700">
                  <th className="px-5 py-3">Rank</th>
                  <th className="px-5 py-3">Referrer ID</th>
                  <th className="px-5 py-3">Conversions</th>
                  <th className="px-5 py-3">Commission</th>
                </tr>
              </thead>
              <tbody>
                {leaderboard.map((r, i) => (
                  <tr key={i} className="border-b border-gray-700/50">
                    <td className="px-5 py-3 text-gray-400 font-bold">#{i + 1}</td>
                    <td className="px-5 py-3 text-white font-mono text-xs">{r._id}</td>
                    <td className="px-5 py-3 text-white">{r.conversions}</td>
                    <td className="px-5 py-3 text-green-400">${((r.totalCommission || 0) / 100).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="mt-6 bg-gray-800 border border-gray-700 rounded-xl p-5">
        <h3 className="font-semibold text-white mb-2">About the Referral System</h3>
        <p className="text-sm text-gray-400 leading-relaxed">
          Every recruiter and contractor automatically receives a unique referral code and link.
          This module provides analytics on top of the existing commission referral system.
          Manage referral codes and commissions in the main Admin → Commissions section.
        </p>
      </div>
    </FGELayout>
  );
}
