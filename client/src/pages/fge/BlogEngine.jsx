/**
 * FGE Blog Engine — AI-generate and manage blog articles.
 */

import React, { useEffect, useState } from 'react';
import FGELayout from './FGELayout';
import { fgeApi } from '../../lib/fgeApi';

export default function BlogEngine() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [editPost, setEditPost] = useState(null);

  const [form, setForm] = useState({ topic: '', service: '', city: '', saveDraft: true });

  useEffect(() => { loadPosts(); }, []);

  async function loadPosts() {
    setLoading(true);
    try {
      const { posts } = await fgeApi.getBlogs({ limit: 30 });
      setPosts(posts || []);
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  }

  async function handleGenerate(e) {
    e.preventDefault();
    if (!form.topic.trim()) return setError('Topic is required.');
    setGenerating(true); setError(''); setSuccess('');
    try {
      await fgeApi.generateBlog(form);
      setSuccess('Blog article generated and saved as draft!');
      setForm({ topic: '', service: '', city: '', saveDraft: true });
      loadPosts();
    } catch (e) { setError(e.message); }
    finally { setGenerating(false); }
  }

  async function handlePublish(id, scheduledAt) {
    try {
      await fgeApi.publishBlog(id, scheduledAt ? { scheduledAt } : {});
      setSuccess(scheduledAt ? 'Scheduled!' : 'Published!');
      loadPosts();
    } catch (e) { setError(e.message); }
  }

  async function handleSaveEdit() {
    if (!editPost) return;
    try {
      await fgeApi.updateBlog(editPost._id, editPost);
      setEditPost(null);
      setSuccess('Saved!');
      loadPosts();
    } catch (e) { setError(e.message); }
  }

  async function handleDelete(id) {
    if (!window.confirm('Delete this article?')) return;
    try { await fgeApi.deleteBlog(id); loadPosts(); }
    catch (e) { setError(e.message); }
  }

  return (
    <FGELayout>
      <h2 className="text-2xl font-bold text-white mb-6">Blog Engine</h2>

      {error && <div className="bg-red-900/40 border border-red-700 text-red-300 rounded-lg p-3 mb-4">{error}</div>}
      {success && <div className="bg-green-900/40 border border-green-700 text-green-300 rounded-lg p-3 mb-4">{success}</div>}

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mb-8">
        {/* Generator */}
        <div className="xl:col-span-1 bg-gray-800 border border-gray-700 rounded-xl p-6">
          <h3 className="font-semibold text-white mb-4">AI Article Generator</h3>
          <form onSubmit={handleGenerate} className="space-y-4">
            <div>
              <label className="text-xs text-gray-400 block mb-1">Topic *</label>
              <input type="text" value={form.topic}
                onChange={(e) => setForm((f) => ({ ...f, topic: e.target.value }))}
                placeholder="e.g. How to choose a plumber"
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm"
              />
            </div>
            <div>
              <label className="text-xs text-gray-400 block mb-1">Related Service</label>
              <input type="text" value={form.service}
                onChange={(e) => setForm((f) => ({ ...f, service: e.target.value }))}
                placeholder="plumbing"
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm"
              />
            </div>
            <div>
              <label className="text-xs text-gray-400 block mb-1">Target City</label>
              <input type="text" value={form.city}
                onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))}
                placeholder="Charlotte"
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm"
              />
            </div>
            <button type="submit" disabled={generating}
              className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-medium rounded-lg px-4 py-2.5 text-sm"
            >
              {generating ? 'Generating…' : '✍️ Generate Article'}
            </button>
          </form>
        </div>

        {/* Edit panel */}
        {editPost && (
          <div className="xl:col-span-2 bg-gray-800 border border-gray-700 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-white">Edit Article</h3>
              <button onClick={() => setEditPost(null)} className="text-gray-400 hover:text-white text-sm">✕ Close</button>
            </div>
            <div className="space-y-3">
              <input type="text" value={editPost.title || ''}
                onChange={(e) => setEditPost((p) => ({ ...p, title: e.target.value }))}
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm"
                placeholder="Title"
              />
              <input type="text" value={editPost.excerpt || ''}
                onChange={(e) => setEditPost((p) => ({ ...p, excerpt: e.target.value }))}
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm"
                placeholder="Excerpt"
              />
              <textarea rows={10} value={editPost.body || ''}
                onChange={(e) => setEditPost((p) => ({ ...p, body: e.target.value }))}
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm resize-none font-mono text-xs"
                placeholder="Body (HTML)"
              />
              <div className="flex gap-2">
                <button onClick={handleSaveEdit}
                  className="bg-blue-600 hover:bg-blue-500 text-white text-sm px-4 py-2 rounded-lg">
                  💾 Save
                </button>
                <button onClick={() => handlePublish(editPost._id)}
                  className="bg-green-700 hover:bg-green-600 text-white text-sm px-4 py-2 rounded-lg">
                  🚀 Publish Now
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Posts table */}
      <div className="bg-gray-800 border border-gray-700 rounded-xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-700">
          <h3 className="font-semibold text-white">Articles ({posts.length})</h3>
          <button onClick={loadPosts} className="text-xs text-gray-400 hover:text-white">↻ Refresh</button>
        </div>
        {loading ? (
          <p className="text-gray-400 text-sm p-5">Loading…</p>
        ) : posts.length === 0 ? (
          <p className="text-gray-400 text-sm p-5">No articles yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-gray-500 border-b border-gray-700">
                  <th className="px-5 py-3">Title</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3">AI</th>
                  <th className="px-5 py-3">Views</th>
                  <th className="px-5 py-3">Date</th>
                  <th className="px-5 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {posts.map((p) => (
                  <tr key={p._id} className="border-b border-gray-700/50 hover:bg-gray-700/30">
                    <td className="px-5 py-3 text-white font-medium truncate max-w-xs">{p.title}</td>
                    <td className="px-5 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded font-medium ${
                        p.status === 'published' ? 'bg-green-900 text-green-300' :
                        p.status === 'scheduled' ? 'bg-yellow-900 text-yellow-300' :
                        'bg-gray-700 text-gray-400'}`}>{p.status}</span>
                    </td>
                    <td className="px-5 py-3 text-xs text-gray-400">{p.generatedByAI ? '🤖' : '✍️'}</td>
                    <td className="px-5 py-3 text-gray-300">{p.views ?? 0}</td>
                    <td className="px-5 py-3 text-gray-400 text-xs">{new Date(p.createdAt).toLocaleDateString()}</td>
                    <td className="px-5 py-3 flex gap-1">
                      <button onClick={() => setEditPost(p)}
                        className="text-xs bg-gray-700 hover:bg-gray-600 text-white px-2 py-1 rounded">
                        Edit
                      </button>
                      {p.status === 'draft' && (
                        <button onClick={() => handlePublish(p._id)}
                          className="text-xs bg-green-800 hover:bg-green-700 text-white px-2 py-1 rounded">
                          Publish
                        </button>
                      )}
                      <button onClick={() => handleDelete(p._id)}
                        className="text-xs bg-red-900/50 hover:bg-red-800 text-red-300 px-2 py-1 rounded">
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
