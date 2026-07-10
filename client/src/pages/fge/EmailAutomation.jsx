/**
 * FGE Email Automation — manage templates and send campaigns.
 */

import React, { useEffect, useState } from 'react';
import FGELayout from './FGELayout';
import { fgeApi } from '../../lib/fgeApi';

const TRIGGERS = ['new_homeowner','new_contractor','recruiter_signup','quote_request',
  'inactive_user','job_completed','seasonal_spring','seasonal_summer','seasonal_fall',
  'seasonal_winter','referral_invite','manual'];

export default function EmailAutomation() {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState(null);
  const [generating, setGenerating] = useState(false);

  const [form, setForm] = useState({
    name: '', trigger: 'manual', subject: '', bodyHtml: '', bodyText: '', audience: 'all', active: true,
  });
  const [genTopic, setGenTopic] = useState('');

  useEffect(() => { loadTemplates(); }, []);

  async function loadTemplates() {
    setLoading(true);
    try {
      const { templates } = await fgeApi.getEmailTemplates();
      setTemplates(templates || []);
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  }

  function openCreate() { setForm({ name:'',trigger:'manual',subject:'',bodyHtml:'',bodyText:'',audience:'all',active:true }); setEditId(null); setShowForm(true); }
  function openEdit(t) { setForm({ name:t.name,trigger:t.trigger,subject:t.subject,bodyHtml:t.bodyHtml||'',bodyText:t.bodyText||'',audience:t.audience,active:t.active }); setEditId(t._id); setShowForm(true); }

  async function handleSave(e) {
    e.preventDefault();
    try {
      if (editId) { await fgeApi.updateEmailTemplate(editId, form); }
      else { await fgeApi.createEmailTemplate(form); }
      setSuccess('Template saved!'); setShowForm(false); loadTemplates();
    } catch (e) { setError(e.message); }
  }

  async function handleDelete(id) {
    if (!window.confirm('Delete template?')) return;
    try { await fgeApi.deleteEmailTemplate(id); loadTemplates(); }
    catch (e) { setError(e.message); }
  }

  async function handleGenerate() {
    if (!genTopic.trim()) return;
    setGenerating(true); setError('');
    try {
      const { content } = await fgeApi.generateEmail({ topic: genTopic, audience: form.audience });
      setForm((f) => ({ ...f, subject: content.subject || '', bodyHtml: content.bodyHtml || '', bodyText: content.bodyText || '' }));
      setSuccess('AI content applied to form!');
    } catch (e) { setError(e.message); }
    finally { setGenerating(false); }
  }

  return (
    <FGELayout>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-white">Email Automation</h2>
        <button onClick={openCreate} className="bg-blue-600 hover:bg-blue-500 text-white text-sm px-4 py-2 rounded-lg">+ New Template</button>
      </div>

      {error && <div className="bg-red-900/40 border border-red-700 text-red-300 rounded-lg p-3 mb-4">{error}</div>}
      {success && <div className="bg-green-900/40 border border-green-700 text-green-300 rounded-lg p-3 mb-4">{success}</div>}

      {/* Template form */}
      {showForm && (
        <div className="bg-gray-800 border border-gray-700 rounded-xl p-6 mb-6">
          <h3 className="font-semibold text-white mb-4">{editId ? 'Edit Template' : 'New Template'}</h3>

          {/* AI generation shortcut */}
          <div className="flex gap-2 mb-4">
            <input type="text" value={genTopic} onChange={(e) => setGenTopic(e.target.value)}
              placeholder="Generate with AI — enter topic…"
              className="flex-1 bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm" />
            <button onClick={handleGenerate} disabled={generating}
              className="bg-purple-700 hover:bg-purple-600 disabled:opacity-50 text-white text-sm px-4 py-2 rounded-lg whitespace-nowrap">
              {generating ? '…' : '✨ AI Fill'}
            </button>
          </div>

          <form onSubmit={handleSave} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-gray-400 block mb-1">Name</label>
                <input type="text" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm" required />
              </div>
              <div>
                <label className="text-xs text-gray-400 block mb-1">Trigger</label>
                <select value={form.trigger} onChange={(e) => setForm((f) => ({ ...f, trigger: e.target.value }))}
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm">
                  {TRIGGERS.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
            </div>
            <input type="text" placeholder="Subject" value={form.subject}
              onChange={(e) => setForm((f) => ({ ...f, subject: e.target.value }))}
              className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm" />
            <textarea rows={6} placeholder="HTML body" value={form.bodyHtml}
              onChange={(e) => setForm((f) => ({ ...f, bodyHtml: e.target.value }))}
              className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm resize-none font-mono text-xs" />
            <div className="flex gap-3">
              <button type="submit" className="bg-blue-600 hover:bg-blue-500 text-white text-sm px-4 py-2 rounded-lg">Save</button>
              <button type="button" onClick={() => setShowForm(false)} className="bg-gray-700 hover:bg-gray-600 text-white text-sm px-4 py-2 rounded-lg">Cancel</button>
            </div>
          </form>
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
                  <th className="px-5 py-3">Name</th>
                  <th className="px-5 py-3">Trigger</th>
                  <th className="px-5 py-3">Audience</th>
                  <th className="px-5 py-3">Active</th>
                  <th className="px-5 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {templates.map((t) => (
                  <tr key={t._id} className="border-b border-gray-700/50 hover:bg-gray-700/30">
                    <td className="px-5 py-3 text-white font-medium">{t.name}</td>
                    <td className="px-5 py-3 text-gray-300 text-xs font-mono">{t.trigger}</td>
                    <td className="px-5 py-3 text-gray-300 text-xs">{t.audience}</td>
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
