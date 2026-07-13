import React from 'react';
import HelmetSEO from '../seo/HelmetSEO';
import { API_BASE } from '../utils/config';
import { csrfFetch } from '../lib/api';
import { useParams } from 'react-router-dom';

function formatResponseTime(ms) {
  if (!Number.isFinite(ms) || ms < 0) return '—';
  const minutes = Math.round(ms / 60000);
  if (minutes < 1) return 'Under 1 minute';
  if (minutes < 60) return `${minutes} minute${minutes === 1 ? '' : 's'}`;
  const hours = Math.floor(minutes / 60);
  const remaining = minutes % 60;
  return `${hours}h${remaining ? ` ${remaining}m` : ''}`;
}

export default function LeadResponsePage() {
  const { token } = useParams();
  const [state, setState] = React.useState({ loading: true, error: '', data: null });
  const [pendingAction, setPendingAction] = React.useState('');
  const [declineReason, setDeclineReason] = React.useState('');
  const [contacted, setContacted] = React.useState(false);

  const loadLead = React.useCallback(async () => {
    if (!token) return;
    setState((prev) => ({ ...prev, loading: true, error: '' }));
    try {
      const res = await fetch(`${API_BASE}/api/lead-access/${token}`, {
        credentials: 'include'
      });
      const data = await res.json();
      if (!res.ok && !data.available) {
        setState({ loading: false, error: data.message || 'This lead is no longer available.', data });
        return;
      }
      setState({ loading: false, error: '', data });
    } catch (error) {
      setState({ loading: false, error: error.message, data: null });
    }
  }, [token]);

  React.useEffect(() => {
    loadLead();
  }, [loadLead]);

  async function act(path, body = {}) {
    setPendingAction(path);
    try {
      const res = await csrfFetch(`${API_BASE}/api/lead-access/${token}/${path}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.message || 'Request failed');
      }
      setState((prev) => ({ ...prev, data: data.lead ? data : { ...(prev.data || {}), ...data } }));
      if (path === 'decline') {
        setState((prev) => ({ ...prev, error: data.message || 'You declined this lead.' }));
      }
      if (path === 'contacted') {
        setContacted(true);
      }
      if (path !== 'contacted') {
        await loadLead();
      }
    } catch (error) {
      setState((prev) => ({ ...prev, error: error.message }));
    } finally {
      setPendingAction('');
    }
  }

  const payload = state.data;
  const lead = payload?.lead;
  const available = payload?.available;

  return (
    <>
      <HelmetSEO title="Secure Lead | Fixlo" canonicalPathname={token ? `/lead/${token}` : '/lead'} robots="noindex, nofollow" />
      <div className="container-xl py-10">
        <div className="mx-auto max-w-3xl rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-6 flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.25em] text-emerald-600">Secure Fixlo Lead</p>
              <h1 className="mt-2 text-3xl font-extrabold text-slate-900">{lead?.service || 'Lead details'}</h1>
            </div>
            {lead?.expiresAt && (
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                Expires {new Date(lead.expiresAt).toLocaleString()}
              </span>
            )}
          </div>

          {state.loading ? (
            <p className="text-slate-500">Loading lead…</p>
          ) : !available ? (
            <div className="rounded-2xl border border-red-200 bg-red-50 p-5 text-red-700">
              {state.error || payload?.message || 'This lead is no longer available.'}
            </div>
          ) : (
            <>
              {state.error && (
                <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
                  {state.error}
                </div>
              )}

              <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-2xl bg-slate-50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Location</p>
                  <p className="mt-1 text-lg font-semibold text-slate-900">{[lead?.city, lead?.state].filter(Boolean).join(', ') || 'Unknown'}</p>
                </div>
                <div className="rounded-2xl bg-slate-50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Estimated Budget</p>
                  <p className="mt-1 text-lg font-semibold text-slate-900">{lead?.estimatedBudget || 'Contact for details'}</p>
                </div>
                <div className="rounded-2xl bg-slate-50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Distance</p>
                  <p className="mt-1 text-lg font-semibold text-slate-900">{lead?.distanceLabel || 'Within 30 miles'}</p>
                </div>
                <div className="rounded-2xl bg-slate-50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Requested Time</p>
                  <p className="mt-1 text-lg font-semibold text-slate-900">{lead?.requestedTime || 'Flexible'}</p>
                </div>
              </div>

              <div className="mt-4 rounded-2xl border border-slate-200 p-5">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Project Description</p>
                <p className="mt-2 whitespace-pre-wrap text-slate-700">{lead?.description || 'No project description provided.'}</p>
              </div>

              {lead?.homeowner ? (
                <div className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50 p-5">
                  <h2 className="text-lg font-bold text-emerald-900">Homeowner Details Unlocked</h2>
                  <div className="mt-3 space-y-1 text-sm text-emerald-950">
                    <p><strong>Name:</strong> {lead.homeowner.name || '—'}</p>
                    <p><strong>Phone:</strong> {lead.homeowner.phone || '—'}</p>
                    <p><strong>Email:</strong> {lead.homeowner.email || '—'}</p>
                    <p><strong>Address:</strong> {lead.homeowner.address || '—'}</p>
                  </div>
                  <div className="mt-4 flex flex-wrap gap-3">
                    {lead.homeowner.phone && <a className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white" href={`tel:${lead.homeowner.phone}`}>Call Homeowner</a>}
                    {lead.homeowner.email && <a className="rounded-xl border border-emerald-300 px-4 py-2 text-sm font-semibold text-emerald-800" href={`mailto:${lead.homeowner.email}`}>Email Homeowner</a>}
                    <button
                      type="button"
                      onClick={() => act('contacted')}
                      disabled={pendingAction === 'contacted' || contacted}
                      className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 disabled:opacity-50"
                    >
                      {contacted ? 'Homeowner Contacted' : pendingAction === 'contacted' ? 'Saving…' : 'Mark Homeowner Contacted'}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-5">
                  <p className="font-semibold text-slate-900">Homeowner details stay locked until you accept this lead.</p>
                  <p className="mt-1 text-sm text-slate-600">Fixlo tracks every open, response, and follow-up so lead routing can stay fair and secure.</p>
                </div>
              )}

              {!lead?.homeowner && (
                <>
                  <div className="mt-6 flex flex-wrap gap-3">
                    <button
                      type="button"
                      onClick={() => act('accept')}
                      disabled={pendingAction === 'accept'}
                      className="rounded-xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white"
                    >
                      {pendingAction === 'accept' ? 'Accepting…' : 'Accept Lead'}
                    </button>
                    <button
                      type="button"
                      onClick={() => act('ask-later')}
                      disabled={pendingAction === 'ask-later'}
                      className="rounded-xl border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700"
                    >
                      {pendingAction === 'ask-later' ? 'Saving…' : 'Ask Later'}
                    </button>
                    <button
                      type="button"
                      onClick={() => act('decline', { reason: declineReason })}
                      disabled={pendingAction === 'decline'}
                      className="rounded-xl border border-red-300 px-5 py-3 text-sm font-semibold text-red-700"
                    >
                      {pendingAction === 'decline' ? 'Declining…' : 'Decline Lead'}
                    </button>
                  </div>
                  <div className="mt-4">
                    <label className="text-sm font-semibold text-slate-700" htmlFor="declineReason">Decline reason (optional)</label>
                    <textarea
                      id="declineReason"
                      value={declineReason}
                      onChange={(event) => setDeclineReason(event.target.value)}
                      className="mt-2 w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm"
                      rows={3}
                      placeholder="Reason for declining this lead"
                    />
                  </div>
                </>
              )}

              <div className="mt-6 rounded-2xl border border-slate-200 p-4 text-sm text-slate-600">
                <p><strong>Opened:</strong> {payload?.tracking?.openedAt ? new Date(payload.tracking.openedAt).toLocaleString() : 'Just now'}</p>
                <p><strong>Responses tracked:</strong> {payload?.tracking?.openCount || 0} view{payload?.tracking?.openCount === 1 ? '' : 's'}</p>
                <p><strong>Time to first open:</strong> {formatResponseTime(payload?.tracking?.openTimeMs)}</p>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}
