/**
 * FGE AI Marketing Center
 * Generate and manage campaigns across all content types.
 */

import React, { useEffect, useState } from 'react';
import FGELayout from './FGELayout';
import { fgeApi } from '../../lib/fgeApi';

const CONTENT_TYPES = [
  { value: 'blog',            label: 'Blog Article'    },
  { value: 'email',           label: 'Email Campaign'  },
  { value: 'sms',             label: 'SMS Message'     },
  { value: 'facebook',        label: 'Facebook Post'   },
  { value: 'instagram',       label: 'Instagram Caption' },
  { value: 'linkedin',        label: 'LinkedIn Post'   },
  { value: 'x',               label: 'X (Twitter) Post' },
  { value: 'google_business', label: 'Google Business Profile' },
];

export default function MarketingCenter() {
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Generate form state
  const [form, setForm] = useState({
    type: 'email',
    topic: '',
    service: '',
    city: '',
    audience: 'all',
    saveDraft: true,
  });
  const [generatedContent, setGeneratedContent] = useState(null);

  // Image form
  const [imgPrompt, setImgPrompt] = useState('');
  const [imgJob, setImgJob] = useState(null);

  useEffect(() => {
    loadCampaigns();
  }, []);

  async function loadCampaigns() {
    setLoading(true);
    try {
      const { campaigns } = await fgeApi.getCampaigns({ limit: 30 });
      setCampaigns(campaigns || []);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleGenerate(e) {
    e.preventDefault();
    if (!form.topic.trim()) return setError('Topic is required.');
    setGenerating(true);
    setError('');
    setGeneratedContent(null);
    try {
      const result = await fgeApi.generateContent(form);
      setGeneratedContent(result);
      setSuccess('Content generated successfully!');
      if (form.saveDraft) loadCampaigns();
    } catch (e) {
      setError(e.message);
    } finally {
      setGenerating(false);
    }
  }

  async function handlePublish(id) {
    try {
      await fgeApi.publishCampaign(id, {});
      setSuccess('Campaign published!');
      loadCampaigns();
    } catch (e) {
      setError(e.message);
    }
  }

  async function handleDelete(id) {
    if (!window.confirm('Delete this campaign?')) return;
    try {
      await fgeApi.deleteCampaign(id);
      loadCampaigns();
    } catch (e) {
      setError(e.message);
    }
  }

  async function handleGenerateImage(e) {
    e.preventDefault();
    if (!imgPrompt.trim()) return;
    try {
      const result = await fgeApi.generateImage({ prompt: imgPrompt });
      setImgJob(result);
      setSuccess('Image generation queued!');
    } catch (e) {
      setError(e.message);
    }
  }

  return (
    <FGELayout>
      <h2 className="text-2xl font-bold text-white mb-6">AI Marketing Center</h2>

      {error && <div className="bg-red-900/40 border border-red-700 text-red-300 rounded-lg p-3 mb-4">{error}</div>}
      {success && <div className="bg-green-900/40 border border-green-700 text-green-300 rounded-lg p-3 mb-4">{success}</div>}

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Generator panel */}
        <div className="bg-gray-800 border border-gray-700 rounded-xl p-6">
          <h3 className="font-semibold text-white mb-4">Generate Content</h3>
          <form onSubmit={handleGenerate} className="space-y-4">
            <div>
              <label className="text-xs text-gray-400 block mb-1">Content Type</label>
              <select
                value={form.type}
                onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))}
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm"
              >
                {CONTENT_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs text-gray-400 block mb-1">Topic / Campaign Idea *</label>
              <input
                type="text"
                value={form.topic}
                onChange={(e) => setForm((f) => ({ ...f, topic: e.target.value }))}
                placeholder="e.g. Spring HVAC maintenance tips"
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-gray-400 block mb-1">Service (optional)</label>
                <input
                  type="text"
                  value={form.service}
                  onChange={(e) => setForm((f) => ({ ...f, service: e.target.value }))}
                  placeholder="e.g. plumber"
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm"
                />
              </div>
              <div>
                <label className="text-xs text-gray-400 block mb-1">City (optional)</label>
                <input
                  type="text"
                  value={form.city}
                  onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))}
                  placeholder="e.g. Charlotte"
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm"
                />
              </div>
            </div>

            <div>
              <label className="text-xs text-gray-400 block mb-1">Audience</label>
              <select
                value={form.audience}
                onChange={(e) => setForm((f) => ({ ...f, audience: e.target.value }))}
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm"
              >
                {['all', 'homeowners', 'contractors', 'recruiters'].map((a) => (
                  <option key={a} value={a}>{a}</option>
                ))}
              </select>
            </div>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={form.saveDraft}
                onChange={(e) => setForm((f) => ({ ...f, saveDraft: e.target.checked }))}
                className="accent-blue-500"
              />
              <span className="text-sm text-gray-300">Save as draft campaign</span>
            </label>

            <button
              type="submit"
              disabled={generating}
              className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-medium rounded-lg px-4 py-2.5 text-sm transition-colors"
            >
              {generating ? 'Generating…' : '✨ Generate with AI'}
            </button>
          </form>

          {/* Generated content preview */}
          {generatedContent?.content && (
            <div className="mt-4 bg-gray-700 rounded-lg p-4">
              <h4 className="text-sm font-semibold text-white mb-2">Generated Content</h4>
              <div className="text-xs text-gray-300 max-h-48 overflow-y-auto whitespace-pre-wrap">
                {typeof generatedContent.content === 'string'
                  ? generatedContent.content
                  : JSON.stringify(generatedContent.content, null, 2)}
              </div>
            </div>
          )}
        </div>

        {/* Image generation */}
        <div className="bg-gray-800 border border-gray-700 rounded-xl p-6">
          <h3 className="font-semibold text-white mb-4">Generate Image (DALL-E 3)</h3>
          <form onSubmit={handleGenerateImage} className="space-y-4">
            <div>
              <label className="text-xs text-gray-400 block mb-1">Image Prompt</label>
              <textarea
                rows={4}
                value={imgPrompt}
                onChange={(e) => setImgPrompt(e.target.value)}
                placeholder="e.g. Professional plumber fixing a pipe in a modern kitchen, photorealistic"
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm resize-none"
              />
            </div>
            <button
              type="submit"
              className="w-full bg-purple-600 hover:bg-purple-500 text-white font-medium rounded-lg px-4 py-2.5 text-sm"
            >
              🎨 Generate Image
            </button>
          </form>
          {imgJob && (
            <p className="mt-3 text-xs text-green-400">
              Job queued (ID: {imgJob.jobId}) — check the Queue Monitor for results.
            </p>
          )}
        </div>
      </div>

      {/* Campaigns table */}
      <div className="mt-8 bg-gray-800 border border-gray-700 rounded-xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-700">
          <h3 className="font-semibold text-white">Recent Campaigns</h3>
          <span className="text-xs text-gray-500">{campaigns.length} campaigns</span>
        </div>
        {loading ? (
          <p className="text-gray-400 text-sm p-5">Loading…</p>
        ) : campaigns.length === 0 ? (
          <p className="text-gray-400 text-sm p-5">No campaigns yet. Generate one above!</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-gray-500 border-b border-gray-700">
                  <th className="px-5 py-3">Title</th>
                  <th className="px-5 py-3">Type</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3">Created</th>
                  <th className="px-5 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {campaigns.map((c) => (
                  <tr key={c._id} className="border-b border-gray-700/50 hover:bg-gray-700/30">
                    <td className="px-5 py-3 text-white font-medium truncate max-w-xs">{c.title}</td>
                    <td className="px-5 py-3">
                      <span className="bg-gray-700 text-gray-300 px-2 py-0.5 rounded text-xs">{c.type}</span>
                    </td>
                    <td className="px-5 py-3">
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                        c.status === 'active'    ? 'bg-green-900 text-green-300' :
                        c.status === 'draft'     ? 'bg-gray-700 text-gray-300' :
                        c.status === 'scheduled' ? 'bg-yellow-900 text-yellow-300' :
                        'bg-gray-700 text-gray-400'
                      }`}>{c.status}</span>
                    </td>
                    <td className="px-5 py-3 text-gray-400 text-xs">{new Date(c.createdAt).toLocaleDateString()}</td>
                    <td className="px-5 py-3 flex gap-2">
                      {c.status === 'draft' && (
                        <button
                          onClick={() => handlePublish(c._id)}
                          className="text-xs bg-blue-700 hover:bg-blue-600 text-white px-2 py-1 rounded"
                        >
                          Publish
                        </button>
                      )}
                      <button
                        onClick={() => handleDelete(c._id)}
                        className="text-xs bg-red-900/50 hover:bg-red-800 text-red-300 px-2 py-1 rounded"
                      >
                        Delete
                      </button>
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
