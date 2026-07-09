/**
 * FGE SMS Automation — manage SMS templates.
 */

import React, { useEffect, useState } from 'react';
import FGELayout from './FGELayout';
import { fgeApi } from '../../lib/fgeApi';

const TRIGGERS = ['quote_confirmation','job_reminder','job_follow_up','seasonal_reminder',
  'referral_invite','recruiter_update','manual'];

export default function SmsAutomation() {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState(null);
  const [generating, setGenerating] = useState(false);
  const [genTopic, setGenTopic] = useState('');

  const [form, setForm] = useState({
    name: '', trigger: 'manual', body: '', audience: 'all', active: true, requireConsent: true,
  });

  // Test SMS
  const [testTo, setTestTo] = useState('');
  const [sending, setSending] = useState(false);

  useEffect(() => { loadTemplates(); }, []);

  async function loadTemplates() {
    setLoading(true);
    try {
      const { templates } = await fgeApi.getSmsTemplates();
      setTemplates(templates || []);
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  }

  function openCreate() { setForm({ name:'',trigger:'manual',body:'',audience:'all',active:true,requireConsent:true }); setEditId(null); setShowForm(true); }
  function openEdit(t) { setForm({ name:t.name,trigger:t.trigger,body:t.body,audience:t.audience,active:t.active,requireConsent:t.requireConsent }); setEditId(t._id); setShowForm(true); }

  async function handleSave(e) {
    e.preventDefault();
    try {
      if (editId) await fgeApi.updateSmsTemplate(editId, form);
      else await fgeApi.createSmsTemplate(form);
      setSuccess('Template saved!'); setShowForm(false); loadTemplates();
    } catch (e) { setError(e.message); }
  }

  async function handleDelete(id) {
    if (!window.confirm('Delete template?')) return;
    try { await fgeApi.deleteSmsTemplate(id); loadTemplates(); }
    catch (e) { setError(e.message); }
  }

  async function handleGenerate() {
    if (!genTopic.trim()) return;
    setGenerating(true);
    try {
      const { body } = await fgeApi.generateSms({ topic: genTopic, audience: form.audience });
      setForm((f) => ({ ...f, body }));
      setSuccess('AI SMS text applied!');
    } catch (e) { setError(e.message); }
    finally { setGenerating(false); }
  }

  async function handleTestSms(e) {
    e.preventDefault();
    if (!testTo) return;
    setSending(true);
    try {
      await fgeApi.sendSms({ to: testTo, body: form.body || 'Test SMS from Fixlo Growth Engine', hasConsent: true });
      setSuccess('Test SMS sent!');
    } catch (e) { setError(e.message); }
    finally { setSending(false); }
  }

  return (
    <FGELayout>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-white">SMS Automation</h2>
        <button onClick={openCreate} className="bg-blue-600 hover:bg-blue-500 text-white text-sm px-4 py-2 rounded-lg">+ New Template</button>
      </div>

      {error && <div className="bg-red-900/40 border border-red-700 text-red-300 rounded-lg p-3 mb-4">{error}</div>}
      {success && <div className="bg-green-900/40 border border-green-700 text-green-300 rounded-lg p-3 mb-4">{success}</div>}

      {showForm && (
        <div className="bg-gray-800 border border-gray-700 rounded-xl p-6 mb-6">
          <h3 className="font-semibold text-white mb-4">{editId ? 'Edit Template' : 'New Template'}</h3>
          <div className="flex gap-2 mb-4">
            <input type="text" value={genTopic} onChange={(e) => setGenTopic(e.target.value)}
              placeholder="Generate with AI…"
              className="flex-1 bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm" />
            <button onClick={handleGenerate} disabled={generating}
              className="bg-purple-700 hover:bg-purple-600 disabled:opacity-50 text-white text-sm px-4 py-2 rounded-lg">
              {generating ? '…' : '✨ AI Fill'}
            </button>
          </div>
          <form onSubmit={handleSave} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <input type="text" placeholder="Template name" value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                className="bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm" required />
              <select value={form.trigger} onChange={(e) => setForm((f) => ({ ...f, trigger: e.target.value }))}
                className="bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm">
                {TRIGGERS.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <textarea rows={4} placeholder="SMS body (max 160 chars)" value={form.body}
              onChange={(e) => setForm((f) => ({ ...f, body: e.target.value }))}
              maxLength={1600}
              className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm resize-none" />
            <p className="text-xs text-gray-500">{form.body.length}/160 chars</p>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={form.requireConsent} onChange={(e) => setForm((f) => ({ ...f, requireConsent: e.target.checked }))} className="accent-blue-500" />
              <span className="text-sm text-gray-300">Require SMS consent</span>
            </label>
            <div className="flex gap-3">
              <button type="submit" className="bg-blue-600 hover:bg-blue-500 text-white text-sm px-4 py-2 rounded-lg">Save</button>
              <button type="button" onClick={() => setShowForm(false)} className="bg-gray-700 text-white text-sm px-4 py-2 rounded-lg">Cancel</button>
            </div>
          </form>

          {/* Test send */}
          <div className="mt-4 pt-4 border-t border-gray-700">
            <h4 className="text-sm font-medium text-gray-300 mb-2">Test SMS</h4>
            <form onSubmit={handleTestSms} className="flex gap-2">
              <input type="tel" placeholder="+17045551234" value={testTo}
                onChange={(e) => setTestTo(e.target.value)}
                className="flex-1 bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm" />
              <button type="submit" disabled={sending}
                className="bg-green-700 hover:bg-green-600 disabled:opacity-50 text-white text-sm px-4 py-2 rounded-lg">
                {sending ? 'Sending…' : 'Send Test'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Templates list */}
      <div className="bg-gray-800 border border-gray-700 rounded-xl overflow-hidden">
        <h3 className="font-semibold text-white px-5 py-4 border-b border-gray-700">Templates ({templates.length})</h3>
        {loading ? <p className="text-gray-400 text-sm p-5">Loading…</p> :
         templates.length === 0 ? <p className="text-gray-400 text-sm p-5">No templates yet.</p> : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-gray-500 border-b border-gray-700">
                  <th className="px-5 py-3">Name</th><th className="px-5 py-3">Trigger</th>
                  <th className="px-5 py-3">Body Preview</th><th className="px-5 py-3">Active</th>
                  <th className="px-5 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {templates.map((t) => (
                  <tr key={t._id} className="border-b border-gray-700/50 hover:bg-gray-700/30">
                    <td className="px-5 py-3 text-white font-medium">{t.name}</td>
                    <td className="px-5 py-3 text-gray-300 text-xs font-mono">{t.trigger}</td>
                    <td className="px-5 py-3 text-gray-400 text-xs max-w-xs truncate">{t.body}</td>
                    <td className="px-5 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded ${t.active ? 'bg-green-900 text-green-300' : 'bg-gray-700 text-gray-400'}`}>{t.active ? 'Yes' : 'No'}</span>
                    </td>
                    <td className="px-5 py-3 flex gap-2">
                      <button onClick={() => openEdit(t)} className="text-xs bg-gray-700 hover:bg-gray-600 text-white px-2 py-1 rounded">Edit</button>
                      <button onClick={() => handleDelete(t._id)} className="text-xs bg-red-900/50 hover:bg-red-800 text-red-300 px-2 py-1 rounded">Delete</button>
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
