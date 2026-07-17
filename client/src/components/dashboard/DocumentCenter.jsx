import React, { useMemo, useRef, useState } from 'react';

const TYPE_ICONS = {
  invoice: '📄',
  receipt: '🧾',
  contract: '📋',
  photo: '🖼️',
  before_photo: '🖼️',
  after_photo: '🖼️',
  permit: '📃',
  insurance: '🛡️',
  other: '📁'
};

function normalizeType(value) {
  return String(value || 'other').toLowerCase();
}

function formatBytes(bytes) {
  const size = Number(bytes || 0);
  if (!size) return '—';
  if (size < 1024) return `${size} B`;
  if (size < 1024 ** 2) return `${(size / 1024).toFixed(1)} KB`;
  return `${(size / 1024 ** 2).toFixed(1)} MB`;
}

function getLabel(type) {
  return String(type || 'other')
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

export default function DocumentCenter({ documents = [], onUpload, onDelete, onPreview, loading = false }) {
  const [filter, setFilter] = useState('all');
  const inputRef = useRef(null);
  const normalizedDocuments = useMemo(() => (Array.isArray(documents) ? documents : []), [documents]);

  const filters = useMemo(() => {
    const dynamic = Array.from(new Set(normalizedDocuments.map((document) => normalizeType(document.type))));
    return ['all', ...dynamic];
  }, [normalizedDocuments]);

  const filteredDocuments = useMemo(() => {
    if (filter === 'all') return normalizedDocuments;
    return normalizedDocuments.filter((document) => normalizeType(document.type) === filter);
  }, [filter, normalizedDocuments]);

  const handlePreview = (document) => {
    if (onPreview) {
      onPreview(document);
      return;
    }

    const url = document.url || document.secureUrl || document.secure_url;
    if (url) {
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  };

  const handleUploadChange = async (event) => {
    const file = event.target.files?.[0];
    if (!file || !onUpload) return;
    await onUpload(file);
    event.target.value = '';
  };

  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-3 border-b border-slate-100 pb-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-sm font-semibold text-slate-500">Document Center</p>
          <h3 className="text-xl font-bold text-slate-900">Files and records</h3>
        </div>
        <div className="flex flex-wrap gap-2">
          {filters.map((type) => (
            <button
              key={type}
              type="button"
              onClick={() => setFilter(type)}
              className={`rounded-full px-3 py-1.5 text-sm font-semibold transition ${
                filter === type ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {type === 'all' ? 'All' : getLabel(type)}
            </button>
          ))}
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700"
          >
            Upload
          </button>
          <input ref={inputRef} type="file" className="hidden" onChange={handleUploadChange} />
        </div>
      </div>

      {loading ? (
        <div className="py-12 text-center text-sm text-slate-500">
          <div className="mx-auto mb-3 h-8 w-8 animate-spin rounded-full border-2 border-emerald-200 border-t-emerald-600" />
          Loading documents...
        </div>
      ) : filteredDocuments.length ? (
        <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filteredDocuments.map((document) => {
            const type = normalizeType(document.type);
            const url = document.url || document.secureUrl || document.secure_url;
            return (
              <article
                key={document.id || document._id || `${document.name}-${document.createdAt}`}
                className="rounded-3xl border border-slate-200 bg-slate-50/70 p-4 shadow-sm"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-2xl shadow-sm">
                      {TYPE_ICONS[type] || TYPE_ICONS.other}
                    </div>
                    <div>
                      <h4 className="line-clamp-2 text-sm font-semibold text-slate-900">{document.name || 'Untitled document'}</h4>
                      <p className="mt-1 text-xs font-medium text-slate-500">{getLabel(type)}</p>
                    </div>
                  </div>
                </div>

                <div className="mt-4 space-y-2 text-sm text-slate-600">
                  <div className="flex justify-between gap-3">
                    <span>File size</span>
                    <span className="font-medium text-slate-900">{formatBytes(document.size || document.bytes)}</span>
                  </div>
                  <div className="flex justify-between gap-3">
                    <span>Uploaded</span>
                    <span className="font-medium text-slate-900">
                      {document.createdAt || document.uploadedAt ? new Date(document.createdAt || document.uploadedAt).toLocaleDateString() : '—'}
                    </span>
                  </div>
                  {document.projectName || document.jobTitle ? (
                    <div className="flex justify-between gap-3">
                      <span>Project</span>
                      <span className="text-right font-medium text-slate-900">{document.projectName || document.jobTitle}</span>
                    </div>
                  ) : null}
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => handlePreview(document)}
                    className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 transition hover:border-emerald-200 hover:text-emerald-700"
                  >
                    Preview
                  </button>
                  <a
                    href={url || '#'}
                    target="_blank"
                    rel="noreferrer"
                    download
                    className={`rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold transition ${
                      url ? 'text-slate-700 hover:border-emerald-200 hover:text-emerald-700' : 'pointer-events-none text-slate-300'
                    }`}
                  >
                    Download
                  </a>
                  <button
                    type="button"
                    onClick={() => onDelete?.(document)}
                    className="rounded-xl border border-red-200 px-3 py-2 text-sm font-semibold text-red-600 transition hover:bg-red-50"
                  >
                    Delete
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      ) : (
        <div className="mt-6 rounded-3xl border border-dashed border-slate-300 bg-slate-50 px-6 py-12 text-center">
          <div className="text-3xl">📁</div>
          <p className="mt-3 text-base font-semibold text-slate-900">No documents yet. Upload your first document.</p>
        </div>
      )}
    </section>
  );
}
