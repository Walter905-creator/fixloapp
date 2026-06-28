import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { API_BASE } from '../utils/config';
import { useRecruiterAuth } from '../context/RecruiterAuthContext';
import HelmetSEO from '../seo/HelmetSEO';

function fmt(cents) {
  return '$' + ((cents || 0) / 100).toLocaleString('en-US', { minimumFractionDigits: 2 });
}

export default function RecruiterRecruitersPage() {
  const navigate = useNavigate();
  const { isAuthenticated, loading: authLoading, authFetch, logout } = useRecruiterAuth();
  const [recruiters, setRecruiters] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [recruiterLink, setRecruiterLink] = useState('');

  useEffect(() => {
    if (!authLoading && !isAuthenticated) navigate('/recruiter/login', { replace: true });
  }, [authLoading, isAuthenticated, navigate]);

  useEffect(() => {
    if (!isAuthenticated) return;
    loadData();
  }, [isAuthenticated]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [recRes, meRes] = await Promise.all([
        authFetch(`${API_BASE}/api/recruiter/recruiters?limit=50`),
        authFetch(`${API_BASE}/api/recruiter/me`)
      ]);
      if (recRes.status === 401) { logout(); navigate('/recruiter/login'); return; }
      const recData = await recRes.json();
      const meData = await meRes.json();
      if (recData.ok) { setRecruiters(recData.recruiters); setTotal(recData.total); }
      if (meData.ok) setRecruiterLink(meData.recruiter.recruiterRecruiterLink);
    } finally { setLoading(false); }
  };

  const copy = () => {
    navigator.clipboard.writeText(recruiterLink).then(() => {
      setCopied(true); setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <>
      <HelmetSEO title="My Recruiters | Fixlo Recruiter" canonicalPathname="/recruiter/recruiters" description="Track your recruited recruiters" />
      <div className="min-h-screen bg-gradient-to-br from-slate-950 to-blue-950 text-white">
        <div className="border-b border-white/10 bg-white/5">
          <div className="max-w-7xl mx-auto px-4 py-3 flex items-center gap-3">
            <Link to="/recruiter/dashboard" className="text-white/50 hover:text-white text-sm">← Dashboard</Link>
            <span className="text-white/20">/</span>
            <span className="text-sm">My Recruiters</span>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 py-8">
          <h1 className="text-2xl font-extrabold mb-2">My Recruiters</h1>
          <p className="text-white/50 mb-6 text-sm">
            Recruiters you've brought in. You earn 10% of every pro they sign up.
          </p>

          {/* Share link */}
          <div className="bg-purple-500/10 border border-purple-400/30 rounded-2xl p-5 mb-8">
            <p className="text-purple-200 text-sm font-medium mb-2">Share this link to recruit more recruiters:</p>
            <div className="flex gap-3 items-center">
              <code className="flex-1 text-purple-300 text-sm font-mono bg-white/5 rounded-lg px-3 py-2 truncate">
                {recruiterLink}
              </code>
              <button onClick={copy}
                className="shrink-0 bg-purple-500/30 hover:bg-purple-500/50 border border-purple-400/40 text-purple-200 text-sm px-4 py-2 rounded-lg transition-colors">
                {copied ? '✓ Copied' : 'Copy'}
              </button>
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-400"></div></div>
          ) : recruiters.length === 0 ? (
            <div className="text-center py-16 text-white/40">
              <div className="text-5xl mb-4">🤝</div>
              <p className="text-lg font-semibold mb-2">No recruiters referred yet</p>
              <p className="text-sm">Share your recruiter link above to build your network.</p>
            </div>
          ) : (
            <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-white/5 text-white/50 text-left">
                    <th className="px-4 py-3 font-medium">Recruiter</th>
                    <th className="px-4 py-3 font-medium">Date Joined</th>
                    <th className="px-4 py-3 font-medium">Pros Recruited</th>
                    <th className="px-4 py-3 font-medium">Your 2nd-Level Earnings</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {recruiters.map(r => (
                    <tr key={r._id} className="hover:bg-white/5 transition-colors">
                      <td className="px-4 py-3">
                        <div className="font-medium">{r.name}</div>
                        <div className="text-white/40 text-xs">{r.email}</div>
                      </td>
                      <td className="px-4 py-3 text-white/60">{new Date(r.createdAt).toLocaleDateString()}</td>
                      <td className="px-4 py-3 text-white/80">{r.prosRecruited || 0}</td>
                      <td className="px-4 py-3 font-semibold text-purple-300">{fmt(r.earningsGenerated)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
