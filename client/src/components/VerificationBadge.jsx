export default function VerificationBadge({ status }) {
  const map = {
    verified: { label: 'Verified', className: 'bg-green-600' },
    pending: { label: 'Pending', className: 'bg-amber-600' },
    skipped: { label: 'Unverified', className: 'bg-slate-600' },
    unverified: { label: 'Unverified', className: 'bg-slate-600' },
    rejected: { label: 'Rejected', className: 'bg-red-600' },
  };
  const v = map[status || 'unverified'];
  return (
    <span className={`inline-block px-2 py-1 text-xs rounded text-white ${v.className}`}>
      {v.label}
    </span>
  );
}