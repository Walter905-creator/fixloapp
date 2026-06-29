import React, { useState } from 'react';

export default function CopyLinkCard({ title, value, subtitle }) {
  const [copied, setCopied] = useState(false);

  const onCopy = async () => {
    if (!value) return;
    await navigator.clipboard.writeText(value);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1500);
  };

  return (
    <section className="dashboard-card copy-link-card">
      <div className="dashboard-card-header"><h3>{title}</h3></div>
      <p className="copy-link-value">{value || 'Not available'}</p>
      {subtitle ? <p className="copy-link-subtitle">{subtitle}</p> : null}
      <button type="button" className="dashboard-btn" onClick={onCopy} disabled={!value}>
        {copied ? 'Copied' : 'Copy link'}
      </button>
    </section>
  );
}
