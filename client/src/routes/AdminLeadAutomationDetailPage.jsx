import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import HelmetSEO from '../seo/HelmetSEO';
import { API_BASE } from '../utils/config';

function authHeaders() {
  const token = localStorage.getItem('fixlo_token') || localStorage.getItem('fixlo_admin_token');
  return {
    'Content-Type': 'application/json',
    Authorization: token ? 'Bearer ' + token : ''
  };
}

export default function AdminLeadAutomationDetailPage() {
  const { leadId } = useParams();
  const [lead, setLead] = useState(null);
  const [timeline, setTimeline] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notes, setNotes] = useState('');
  const [recruiter, setRecruiter] = useState('');

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${API_BASE}/api/admin/meta-leads/${leadId}`, { headers: authHeaders() });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.error || 'Failed to load lead');
      setLead(data.lead);
      setTimeline(data.timeline || []);
      setNotes(data.lead?.notes || '');
      setRecruiter(data.lead?.assignedRecruiter || '');
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [leadId]);

  const runAction = async (action, payload = {}) => {
    setError('');
    try {
      const res = await fetch(`${API_BASE}/api/admin/meta-leads/${leadId}/actions/${action}`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.error || `Failed to run ${action}`);
      await load();
    } catch (e) {
      setError(e.message);
    }
  };

  if (loading) {
    return <div className="container-xl py-10 text-gray-500">Loading lead details…</div>;
  }

  if (!lead) {
    return <div className="container-xl py-10 text-red-600">Lead not found.</div>;
  }

  return (
    <>
      <HelmetSEO title="Lead Detail | Fixlo" canonicalPathname={`/dashboard/admin/lead-automation/${leadId}`} robots="noindex, nofollow" />
      <div className="container-xl py-8 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-extrabold">🧾 Lead Detail</h1>
            <p className="text-sm text-gray-600">Meta Lead ID: {lead.metaLeadId}</p>
          </div>
          <a href="/dashboard/admin/lead-automation" className="text-sm text-blue-700">← Back</a>
        </div>

        {error && <div className="p-3 rounded border border-red-300 bg-red-50 text-red-700 text-sm">{error}</div>}

        <div className="grid lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 bg-white border border-gray-200 rounded-lg p-4 space-y-4">
            <div className="grid md:grid-cols-2 gap-3 text-sm">
              <div><span className="text-gray-500">Name:</span> {lead.firstName} {lead.lastName}</div>
              <div><span className="text-gray-500">Email:</span> {lead.email || '—'}</div>
              <div><span className="text-gray-500">Phone:</span> {lead.phone || '—'}</div>
              <div><span className="text-gray-500">Trade:</span> {lead.trade || '—'}</div>
              <div><span className="text-gray-500">City/State:</span> {lead.city || '—'}, {lead.state || '—'}</div>
              <div><span className="text-gray-500">ZIP:</span> {lead.zipCode || '—'}</div>
              <div><span className="text-gray-500">Source:</span> {lead.source}</div>
              <div><span className="text-gray-500">Campaign:</span> {lead.campaign?.campaignName || '—'}</div>
              <div><span className="text-gray-500">Ad:</span> {lead.campaign?.adName || '—'}</div>
              <div><span className="text-gray-500">Form:</span> {lead.campaign?.formName || '—'}</div>
              <div><span className="text-gray-500">Lead Status:</span> {lead.leadStatus}</div>
              <div><span className="text-gray-500">Registration:</span> {lead.registrationStatus}</div>
              <div><span className="text-gray-500">SMS Status:</span> {lead.smsStatus}</div>
              <div><span className="text-gray-500">Email Status:</span> {lead.emailStatus}</div>
              <div><span className="text-gray-500">Invitation Code:</span> <span className="font-mono">{lead.invitationCode || '—'}</span></div>
              <div><span className="text-gray-500">Follow-Up:</span> {lead.followUp?.status} (step {lead.followUp?.step || 0})</div>
            </div>

            <div className="space-y-2">
              <h2 className="font-semibold">Manual Actions</h2>
              <div className="flex flex-wrap gap-2">
                <button onClick={() => runAction('resend-sms')} className="px-3 py-1.5 rounded border">Resend SMS</button>
                <button onClick={() => runAction('resend-email')} className="px-3 py-1.5 rounded border">Resend Email</button>
                <button onClick={() => runAction('pause', { reason: 'paused_by_admin' })} className="px-3 py-1.5 rounded border">Pause Follow-Up</button>
                <button onClick={() => runAction('resume')} className="px-3 py-1.5 rounded border">Resume Follow-Up</button>
                <button onClick={() => runAction('mark-closed', { reason: 'closed_by_admin' })} className="px-3 py-1.5 rounded border border-red-300 text-red-700">Mark Closed</button>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-3">
              <div className="space-y-2">
                <p className="text-sm font-semibold">Assign Recruiter</p>
                <div className="flex gap-2">
                  <input value={recruiter} onChange={(e) => setRecruiter(e.target.value)} className="border rounded px-2 py-1 text-sm flex-1" placeholder="Recruiter name/email" />
                  <button onClick={() => runAction('assign-recruiter', { assignedRecruiter: recruiter })} className="px-3 py-1.5 rounded bg-slate-900 text-white text-sm">Assign</button>
                </div>
              </div>
              <div className="space-y-2">
                <p className="text-sm font-semibold">Notes</p>
                <div className="flex gap-2">
                  <input value={notes} onChange={(e) => setNotes(e.target.value)} className="border rounded px-2 py-1 text-sm flex-1" placeholder="Add note" />
                  <button onClick={() => runAction('add-note', { notes })} className="px-3 py-1.5 rounded bg-slate-900 text-white text-sm">Save</button>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <h2 className="font-semibold mb-2">Timeline</h2>
            <div className="space-y-3 max-h-[720px] overflow-auto pr-1">
              {timeline.map((entry) => (
                <div key={entry._id} className="border border-gray-100 rounded p-2">
                  <p className="text-sm font-medium text-slate-900">{entry.title}</p>
                  <p className="text-xs text-slate-500">{new Date(entry.occurredAt || entry.createdAt).toLocaleString()}</p>
                  {entry.description ? <p className="text-xs text-slate-700 mt-1">{entry.description}</p> : null}
                  <p className="text-[11px] mt-1 text-slate-500">{entry.channel} · {entry.eventType}</p>
                </div>
              ))}
              {!timeline.length && <p className="text-sm text-gray-500">No activity yet.</p>}
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-4">
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <h2 className="font-semibold mb-2">SMS History</h2>
            <div className="space-y-2 max-h-96 overflow-auto">
              {(lead.smsHistory || []).slice().reverse().map((sms, index) => (
                <div key={`${sms.messageSid || 'sms'}-${index}`} className="border border-gray-100 rounded p-2 text-xs">
                  <div className="flex justify-between"><span>{sms.direction}</span><span className="uppercase">{sms.status}</span></div>
                  <p className="text-slate-700 mt-1">{sms.body || '—'}</p>
                  <p className="text-slate-500 mt-1">SID: {sms.messageSid || '—'}</p>
                </div>
              ))}
              {!lead.smsHistory?.length && <p className="text-sm text-gray-500">No SMS records.</p>}
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <h2 className="font-semibold mb-2">Email History</h2>
            <div className="space-y-2 max-h-96 overflow-auto">
              {(lead.emailHistory || []).slice().reverse().map((email, index) => (
                <div key={`${email.messageId || 'email'}-${index}`} className="border border-gray-100 rounded p-2 text-xs">
                  <div className="flex justify-between"><span>{email.subject || '—'}</span><span className="uppercase">{email.status}</span></div>
                  <p className="text-slate-500 mt-1">Message ID: {email.messageId || '—'}</p>
                  {email.clickUrl ? <p className="text-slate-700 mt-1 break-all">Clicked: {email.clickUrl}</p> : null}
                </div>
              ))}
              {!lead.emailHistory?.length && <p className="text-sm text-gray-500">No email records.</p>}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
