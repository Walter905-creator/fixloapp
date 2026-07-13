import React, { useState, useEffect } from 'react';
import HelmetSEO from '../seo/HelmetSEO';
import { API_BASE } from '../utils/config';

// ─── Icons (inline SVG helpers) ────────────────────────────────────────────────
const Icon = ({ d, size = 20, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
    <path d={d} />
  </svg>
);

const Icons = {
  home:      'M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z',
  tool:      'M14.7 6.3a1 1 0 00-1.4 1.4l1.4 1.4a1 1 0 001.4-1.4l-1.4-1.4zM18 2l-1.5 1.5-3 3 1.4 1.4 3-3 1.4-1.4A7 7 0 0118 2zM2 22l7-7M3 12v.01M7 4v.01M12 2v.01M20 12v.01M16 20v.01',
  wrench:    'M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z',
  clock:     'M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10zM12 6v6l4 2',
  check:     'M20 6L9 17l-5-5',
  star:      'M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z',
  bell:      'M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0',
  msg:       'M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z',
  user:      'M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2M12 11a4 4 0 100-8 4 4 0 000 8z',
  plus:      'M12 5v14M5 12h14',
  list:      'M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01',
  quote:     'M3 21c3 0 7-1 7-8V5c0-1.25-.756-2.017-2-2H4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2 1 0 1 0 1 1v1c0 1-1 2-2 2s-1 .008-1 1.031V20c0 1 0 1 1 1zm12 0c3 0 7-1 7-8V5c0-1.25-.757-2.017-2-2h-4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2h.75c0 2.25.25 4-2.75 4v3c0 1 0 1 1 1z',
  settings:  'M12 15a3 3 0 100-6 3 3 0 000 6zM19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z',
  share:     'M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8M16 6l-4-4-4 4M12 2v13',
  map:       'M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0zM12 13a3 3 0 100-6 3 3 0 000 6z',
  calendar:  'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z',
  dollar:    'M12 1v22M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6',
  eye:       'M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8zM12 9a3 3 0 100 6 3 3 0 000-6z',
  receipt:   'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2',
  logout:    'M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1',
  shield:    'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z',
  zap:       'M13 2L3 14h9l-1 8 10-12h-9l1-8z',
  trending:  'M23 6l-9.5 9.5-5-5L1 18',
};

// ─── Status configuration ───────────────────────────────────────────────────────
const STATUS_CONFIG = {
  pending:         { label: 'Pending',          bg: 'bg-yellow-100',  text: 'text-yellow-800',  dot: 'bg-yellow-400',  progress: 1 },
  'matching-pros': { label: 'Matching Pros',    bg: 'bg-blue-100',    text: 'text-blue-800',    dot: 'bg-blue-400',    progress: 2 },
  scheduled:       { label: 'Scheduled',        bg: 'bg-purple-100',  text: 'text-purple-800',  dot: 'bg-purple-400',  progress: 2 },
  assigned:        { label: 'Assigned',         bg: 'bg-purple-100',  text: 'text-purple-800',  dot: 'bg-purple-400',  progress: 2 },
  'in-progress':   { label: 'In Progress',      bg: 'bg-orange-100',  text: 'text-orange-800',  dot: 'bg-orange-400',  progress: 3 },
  completed:       { label: 'Completed',        bg: 'bg-green-100',   text: 'text-green-800',   dot: 'bg-green-500',   progress: 4 },
  cancelled:       { label: 'Cancelled',        bg: 'bg-red-100',     text: 'text-red-800',     dot: 'bg-red-400',     progress: 0 },
};

const PROGRESS_STEPS = ['Submitted', 'Pro Found', 'Scheduled', 'In Progress', 'Completed'];

const MAINTENANCE_ITEMS = [
  { id: 1, icon: '❄️',  label: 'HVAC Inspection',         status: 'recommended', month: 'Oct' },
  { id: 2, icon: '🏠',  label: 'Roof Inspection',          status: 'due-soon',    month: 'Nov' },
  { id: 3, icon: '🍂',  label: 'Gutter Cleaning',          status: 'recommended', month: 'Oct' },
  { id: 4, icon: '💧',  label: 'Pressure Washing',         status: 'recommended', month: 'Spring' },
  { id: 5, icon: '🚿',  label: 'Water Heater Inspection',  status: 'completed',   month: 'Sep' },
];

const MAINTENANCE_STATUS = {
  recommended: { label: 'Recommended', bg: 'bg-blue-50',   text: 'text-blue-700',   border: 'border-blue-200' },
  'due-soon':  { label: 'Due Soon',    bg: 'bg-amber-50',  text: 'text-amber-700',  border: 'border-amber-200' },
  completed:   { label: 'Completed',   bg: 'bg-green-50',  text: 'text-green-700',  border: 'border-green-200' },
};

// ─── Skeleton loader ────────────────────────────────────────────────────────────
function Skeleton({ className = '' }) {
  return <div className={`animate-pulse bg-slate-200 rounded-lg ${className}`} />;
}

function SummaryCardSkeleton() {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
      <Skeleton className="h-4 w-24 mb-3" />
      <Skeleton className="h-8 w-12 mb-2" />
      <Skeleton className="h-3 w-20" />
    </div>
  );
}

// ─── Summary Card ───────────────────────────────────────────────────────────────
function SummaryCard({ icon, label, value, sub, color = 'blue' }) {
  const colors = {
    blue:   { bg: 'bg-blue-50',   icon: 'text-blue-600',   val: 'text-blue-700' },
    green:  { bg: 'bg-green-50',  icon: 'text-green-600',  val: 'text-green-700' },
    yellow: { bg: 'bg-yellow-50', icon: 'text-yellow-600', val: 'text-yellow-700' },
    purple: { bg: 'bg-purple-50', icon: 'text-purple-600', val: 'text-purple-700' },
    red:    { bg: 'bg-red-50',    icon: 'text-red-600',    val: 'text-red-700' },
    slate:  { bg: 'bg-slate-50',  icon: 'text-slate-600',  val: 'text-slate-700' },
  };
  const c = colors[color] || colors.blue;
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 hover:shadow-md transition-shadow duration-200 group">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">{label}</p>
          <p className={`text-3xl font-extrabold ${c.val}`}>{value ?? 0}</p>
          {sub && <p className="text-xs text-slate-400 mt-1">{sub}</p>}
        </div>
        <div className={`${c.bg} ${c.icon} p-3 rounded-xl group-hover:scale-110 transition-transform duration-200`}>
          <Icon d={icon} size={22} />
        </div>
      </div>
    </div>
  );
}

// ─── Status Badge ───────────────────────────────────────────────────────────────
function StatusBadge({ status }) {
  const cfg = STATUS_CONFIG[status] || { label: status, bg: 'bg-slate-100', text: 'text-slate-700', dot: 'bg-slate-400' };
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${cfg.bg} ${cfg.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
      {cfg.label}
    </span>
  );
}

// ─── Progress Bar ───────────────────────────────────────────────────────────────
function ProgressTracker({ status }) {
  const cfg = STATUS_CONFIG[status];
  const step = cfg ? cfg.progress : 0;
  const pct = status === 'cancelled' ? 0 : Math.round((step / (PROGRESS_STEPS.length - 1)) * 100);
  return (
    <div className="mt-4">
      <div className="flex justify-between text-[10px] text-slate-400 mb-1">
        {PROGRESS_STEPS.map((s, i) => (
          <span key={s} className={i <= step && status !== 'cancelled' ? 'text-slate-700 font-medium' : ''}>{s}</span>
        ))}
      </div>
      <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-700 ${status === 'cancelled' ? 'bg-red-400' : 'bg-gradient-to-r from-blue-500 to-indigo-500'}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

// ─── Login Page ─────────────────────────────────────────────────────────────────
function LoginPage({ phone, setPhone, email, setEmail, loading, error, onSubmit }) {
  return (
    <>
      <HelmetSEO title="My Portal | Fixlo" canonicalPathname="/my-jobs" robots="noindex, nofollow" />
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 flex flex-col justify-center items-center px-4 py-16">
        <div className="mb-8 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-white shadow-xl mb-4">
            <span className="text-3xl font-extrabold text-brand">F</span>
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">Welcome to Fixlo</h1>
          <p className="text-blue-200 mt-2 text-sm">Your home services portal</p>
        </div>

        <div className="w-full max-w-sm bg-white rounded-3xl shadow-2xl px-8 py-10">
          <h2 className="text-xl font-bold text-slate-900 mb-1">Sign in to your portal</h2>
          <p className="text-slate-500 text-sm mb-6">Enter your phone or email to access your jobs</p>

          <form onSubmit={onSubmit} className="space-y-4">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm flex items-center gap-2">
                <span>⚠️</span> {error}
              </div>
            )}

            <div>
              <label htmlFor="portal-phone" className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">Phone Number</label>
              <input
                type="tel"
                id="portal-phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="block w-full border border-slate-200 rounded-xl py-3 px-4 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                placeholder="(555) 123-4567"
              />
            </div>

            <div className="flex items-center gap-3">
              <div className="flex-1 h-px bg-slate-200" />
              <span className="text-xs font-medium text-slate-400">OR</span>
              <div className="flex-1 h-px bg-slate-200" />
            </div>

            <div>
              <label htmlFor="portal-email" className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">Email Address</label>
              <input
                type="email"
                id="portal-email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="block w-full border border-slate-200 rounded-xl py-3 px-4 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                placeholder="you@example.com"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-brand hover:bg-brand-dark text-white font-bold py-3 rounded-xl transition-colors duration-200 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-2"
            >
              {loading ? (
                <><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Loading…</>
              ) : (
                <><Icon d={Icons.home} size={16} /> Access My Portal</>
              )}
            </button>
          </form>
        </div>

        <p className="text-blue-300 text-xs mt-6">Protected by Fixlo Security · SSL Encrypted</p>
      </div>
    </>
  );
}

// ─── Job Detail Modal ───────────────────────────────────────────────────────────
function JobModal({ job, invoice, onClose, onDownloadInvoice }) {
  const getStatusMessage = (j) => {
    switch (j.status) {
      case 'pending':       return 'Your request has been received. We will contact you soon.';
      case 'scheduled':     return `Scheduled for ${new Date(j.scheduledDate).toLocaleDateString()} at ${j.scheduledTime}`;
      case 'assigned':      return `Assigned to ${j.assignedTo?.name || 'a technician'}`;
      case 'in-progress':   return 'Technician is currently working on your job';
      case 'completed':     return 'Service completed successfully';
      default:              return '';
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 z-50" onClick={onClose}>
      <div
        className="bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl w-full sm:max-w-lg max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 pt-6 pb-4 border-b border-slate-100 flex justify-between items-start sticky top-0 bg-white rounded-t-3xl sm:rounded-t-3xl z-10">
          <div>
            <h2 className="text-xl font-bold text-slate-900">{job.trade}</h2>
            <div className="mt-1"><StatusBadge status={job.status} /></div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-full w-8 h-8 flex items-center justify-center transition-colors">
            ✕
          </button>
        </div>

        <div className="px-6 py-5 space-y-5">
          {/* Status Message */}
          <p className="text-sm text-slate-600 bg-slate-50 rounded-xl px-4 py-3 border border-slate-100">{getStatusMessage(job)}</p>

          {/* Progress */}
          <ProgressTracker status={job.status} />

          {/* Service Details */}
          <div>
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-3">Service Details</h3>
            <div className="space-y-2">
              <div className="flex justify-between text-sm"><span className="text-slate-500">Service</span><span className="font-medium text-slate-900">{job.trade}</span></div>
              {job.description && <div className="flex justify-between text-sm"><span className="text-slate-500">Description</span><span className="font-medium text-slate-900 text-right max-w-[60%]">{job.description}</span></div>}
              {job.assignedTo && <div className="flex justify-between text-sm"><span className="text-slate-500">Professional</span><span className="font-medium text-slate-900">{job.assignedTo.name}</span></div>}
              <div className="flex justify-between text-sm"><span className="text-slate-500">Submitted</span><span className="font-medium text-slate-900">{new Date(job.createdAt).toLocaleDateString()}</span></div>
            </div>
          </div>

          {/* Timing */}
          {(job.scheduledDate || job.clockInTime) && (
            <div>
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-3">Timing</h3>
              <div className="space-y-2">
                {job.scheduledDate && <div className="flex justify-between text-sm"><span className="text-slate-500">Scheduled</span><span className="font-medium">{new Date(job.scheduledDate).toLocaleDateString()} at {job.scheduledTime}</span></div>}
                {job.clockInTime && <div className="flex justify-between text-sm"><span className="text-slate-500">Started</span><span className="font-medium">{new Date(job.clockInTime).toLocaleString()}</span></div>}
                {job.clockOutTime && <div className="flex justify-between text-sm"><span className="text-slate-500">Completed</span><span className="font-medium">{new Date(job.clockOutTime).toLocaleString()}</span></div>}
                {job.totalHours > 0 && <div className="flex justify-between text-sm"><span className="text-slate-500">Duration</span><span className="font-medium">{job.totalHours} hours</span></div>}
              </div>
            </div>
          )}

          {/* Invoice */}
          {invoice && (
            <div>
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-3">Invoice</h3>
              <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
                <div className="space-y-2">
                  {!job.visitFeeWaived && job.visitFee > 0 && (
                    <div className="flex justify-between text-sm"><span className="text-slate-600">Visit Fee</span><span>${job.visitFee.toFixed(2)}</span></div>
                  )}
                  {job.laborCost > 0 && (
                    <div className="flex justify-between text-sm"><span className="text-slate-600">Labor ({job.totalHours || 0} hrs)</span><span>${job.laborCost.toFixed(2)}</span></div>
                  )}
                  {job.materials && job.materials.map((m, i) => (
                    <div key={i} className="flex justify-between text-sm pl-3 text-slate-500"><span>{m.description}</span><span>${m.cost.toFixed(2)}</span></div>
                  ))}
                  <div className="border-t border-slate-200 pt-2 mt-2 flex justify-between font-bold text-slate-900">
                    <span>Total</span><span>${job.totalCost?.toFixed(2)}</span>
                  </div>
                  {job.paidAt && <p className="text-xs text-green-600 text-right">✓ Paid {new Date(job.paidAt).toLocaleDateString()}</p>}
                </div>
                {job.invoiceId && (
                  <button onClick={() => onDownloadInvoice(job._id)} className="mt-4 w-full bg-slate-900 text-white py-2.5 px-4 rounded-xl hover:bg-slate-700 transition-colors text-sm font-semibold flex items-center justify-center gap-2">
                    <Icon d={Icons.receipt} size={16} /> Download Invoice PDF
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Section Header ─────────────────────────────────────────────────────────────
function SectionHeader({ icon, title, action }) {
  return (
    <div className="flex items-center justify-between mb-4">
      <h2 className="flex items-center gap-2 text-base font-bold text-slate-900">
        <span className="text-slate-500"><Icon d={icon} size={18} /></span>
        {title}
      </h2>
      {action}
    </div>
  );
}

// ─── Empty State ────────────────────────────────────────────────────────────────
function EmptyState({ emoji, title, sub, cta }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="text-5xl mb-4">{emoji}</div>
      <p className="font-semibold text-slate-700 mb-1">{title}</p>
      <p className="text-sm text-slate-400 mb-4">{sub}</p>
      {cta}
    </div>
  );
}

// ─── Main Component ─────────────────────────────────────────────────────────────
export default function CustomerPortalPage() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [authenticated, setAuthenticated] = useState(false);
  const [selectedJob, setSelectedJob] = useState(null);
  const [showJobModal, setShowJobModal] = useState(false);
  const [invoice, setInvoice] = useState(null);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('home');
  // TODO: Replace with API-driven notifications when backend endpoint is available
  const [notifications, setNotifications] = useState([
    { id: 1, type: 'quote',    text: 'New quote received for your Plumbing request',     time: '2 hours ago',  unread: true },
    { id: 2, type: 'accepted', text: 'A professional accepted your Electrical request',  time: '1 day ago',    unread: true },
    { id: 3, type: 'reminder', text: 'Appointment reminder: HVAC service tomorrow',      time: '2 days ago',   unread: false },
    { id: 4, type: 'review',   text: 'How was your recent Plumbing service? Leave a review.', time: '3 days ago', unread: false },
  ]);
  const [linkCopied, setLinkCopied] = useState(false);
  const [savedPros] = useState([]);
  const [showNotifPanel, setShowNotifPanel] = useState(false);

  // Restore session
  useEffect(() => {
    const savedPhone = sessionStorage.getItem('customerPhone');
    const savedEmail = sessionStorage.getItem('customerEmail');
    if (savedPhone || savedEmail) {
      setPhone(savedPhone || '');
      setEmail(savedEmail || '');
      // Auto-restore session
      restoreSession(savedPhone, savedEmail);
    } else {
      setLoading(false);
    }
  }, []);

  const restoreSession = async (ph, em) => {
    try {
      const params = new URLSearchParams();
      if (ph) params.append('phone', ph);
      if (em) params.append('email', em);
      const res = await fetch(`${API_BASE}/api/customer/jobs?${params}`);
      if (res.ok) {
        const data = await res.json();
        setJobs(data.jobs || []);
        setAuthenticated(true);
      }
    } catch (err) {
      console.warn('Session restore failed:', err);
      // silently fail — user will see login screen
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!phone && !email) {
      setError('Please enter your phone number or email');
      return;
    }
    try {
      setLoading(true);
      setError('');
      const params = new URLSearchParams();
      if (phone) params.append('phone', phone);
      if (email) params.append('email', email);
      const response = await fetch(`${API_BASE}/api/customer/jobs?${params}`);
      if (!response.ok) throw new Error('Failed to fetch jobs');
      const data = await response.json();
      setJobs(data.jobs || []);
      setAuthenticated(true);
      sessionStorage.setItem('customerPhone', phone);
      sessionStorage.setItem('customerEmail', email);
    } catch (err) {
      console.error('Error loading jobs:', err);
      setError('Failed to load your portal. Please check your information and try again.');
    } finally {
      setLoading(false);
    }
  };

  const viewJobDetails = async (job) => {
    setSelectedJob(job);
    setShowJobModal(true);
    setInvoice(null);
    if (job.invoiceId) {
      try {
        const res = await fetch(`${API_BASE}/api/customer/jobs/${job._id}/invoice`);
        if (res.ok) setInvoice(await res.json());
      } catch (err) {
        console.warn('Invoice load failed:', err);
      }
    }
  };

  const downloadInvoice = (jobId) => {
    window.open(`${API_BASE}/api/customer/jobs/${jobId}/invoice/pdf`, '_blank');
  };

  const handleSignOut = () => {
    setAuthenticated(false);
    setJobs([]);
    setPhone('');
    setEmail('');
    sessionStorage.clear();
  };

  // Derive stats from jobs
  const activeCount    = jobs.filter(j => ['pending','matching-pros','scheduled','assigned','in-progress'].includes(j.status)).length;
  const completedCount = jobs.filter(j => j.status === 'completed').length;
  const unreadNotifs   = notifications.filter(n => n.unread).length;

  // Derive activity feed from jobs
  const activityFeed = jobs
    .flatMap(j => {
      const events = [{ ts: j.createdAt, text: `You requested ${j.trade} service`, icon: '📋' }];
      if (j.status === 'completed') events.push({ ts: j.updatedAt || j.createdAt, text: `${j.trade} job completed`, icon: '✅' });
      return events;
    })
    .sort((a, b) => new Date(b.ts) - new Date(a.ts))
    .slice(0, 8);

  const completedJobs = jobs.filter(j => j.status === 'completed');
  const activeJobs    = jobs.filter(j => ['pending','matching-pros','scheduled','assigned','in-progress'].includes(j.status));

  const todayStr = new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  // Derive display name from email local part or show friendly fallback
  const rawName = email ? email.split('@')[0] : '';
  const firstName = rawName ? rawName.split(/[._-]/)[0] : 'there';
  const displayName = firstName.length > 0 ? firstName.charAt(0).toUpperCase() + firstName.slice(1) : 'there';

  if (loading && !authenticated) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-500 text-sm">Loading your portal…</p>
        </div>
      </div>
    );
  }

  if (!authenticated) {
    return <LoginPage phone={phone} setPhone={setPhone} email={email} setEmail={setEmail} loading={loading} error={error} onSubmit={handleLogin} />;
  }

  return (
    <>
      <HelmetSEO title="My Portal | Fixlo" canonicalPathname="/my-jobs" robots="noindex, nofollow" />

      <div className="min-h-screen bg-slate-50 pb-24 lg:pb-8">

        {/* ── Top Bar ─────────────────────────────────────────── */}
        <header className="bg-white border-b border-slate-100 sticky top-0 z-30 shadow-sm">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-xl font-extrabold text-brand tracking-tight">Fixlo</span>
              <span className="hidden sm:inline text-slate-300">|</span>
              <span className="hidden sm:inline text-sm text-slate-500 font-medium">My Portal</span>
            </div>
            <div className="flex items-center gap-3">
              {/* Notification Bell */}
              <button
                onClick={() => setShowNotifPanel(v => !v)}
                className="relative p-2 rounded-xl hover:bg-slate-100 transition-colors text-slate-600"
                aria-label="Notifications"
              >
                <Icon d={Icons.bell} size={20} />
                {unreadNotifs > 0 && (
                  <span className="absolute top-1 right-1 w-4 h-4 bg-brand text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                    {unreadNotifs}
                  </span>
                )}
              </button>
              <button
                onClick={handleSignOut}
                className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-900 transition-colors px-3 py-1.5 rounded-xl hover:bg-slate-100"
              >
                <Icon d={Icons.logout} size={15} />
                <span className="hidden sm:inline">Sign Out</span>
              </button>
            </div>
          </div>
        </header>

        {/* ── Notification Panel ────────────────────────────── */}
        {showNotifPanel && (
          <div className="fixed inset-0 z-40" onClick={() => setShowNotifPanel(false)}>
            <div
              className="absolute top-16 right-4 sm:right-8 w-80 bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden"
              onClick={e => e.stopPropagation()}
            >
              <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
                <h3 className="font-bold text-slate-900 text-sm">Notifications</h3>
                {unreadNotifs > 0 && (
                  <button
                    onClick={() => setNotifications(ns => ns.map(n => ({ ...n, unread: false })))}
                    className="text-xs text-blue-600 hover:underline"
                  >
                    Mark all read
                  </button>
                )}
              </div>
              {notifications.length === 0 ? (
                <div className="p-6 text-center">
                  <p className="text-3xl mb-2">🔔</p>
                  <p className="text-slate-500 text-sm">Everything looks good!</p>
                </div>
              ) : (
                <ul className="max-h-72 overflow-y-auto divide-y divide-slate-50">
                  {notifications.map(n => (
                    <li
                      key={n.id}
                      className={`px-5 py-3.5 cursor-pointer hover:bg-slate-50 transition-colors ${n.unread ? 'bg-blue-50/40' : ''}`}
                      onClick={() => setNotifications(ns => ns.map(x => x.id === n.id ? { ...x, unread: false } : x))}
                    >
                      <p className={`text-sm ${n.unread ? 'font-semibold text-slate-900' : 'text-slate-600'}`}>{n.text}</p>
                      <p className="text-xs text-slate-400 mt-0.5">{n.time}</p>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        )}

        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">

          {/* ── Welcome Header ────────────────────────────────── */}
          <div className="mb-8">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
              Welcome back, {displayName} 👋
            </h1>
            <p className="text-slate-500 mt-1 text-sm sm:text-base">
              Manage your projects, quotes and trusted professionals from one place.
            </p>
            <p className="text-xs text-slate-400 mt-1">{todayStr}</p>
          </div>

          {/* ── Summary Cards ─────────────────────────────────── */}
          <section className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-8">
            <SummaryCard icon={Icons.tool}    label="Active Requests"    value={activeCount}          color="blue"   sub="In progress" />
            {/* TODO: integrate with quotes API when available */}
            <SummaryCard icon={Icons.quote}   label="Pending Quotes"     value={0}                    color="yellow" sub="Awaiting review" />
            <SummaryCard icon={Icons.check}   label="Completed Jobs"     value={completedCount}       color="green"  sub="All time" />
            <SummaryCard icon={Icons.star}    label="Saved Pros"         value={savedPros.length}     color="purple" sub="Favorites" />
            {/* TODO: integrate with messages API when available */}
            <SummaryCard icon={Icons.msg}     label="Unread Messages"    value={0}                    color="slate"  sub="No new messages" />
            <SummaryCard icon={Icons.bell}    label="Notifications"      value={unreadNotifs}         color="red"    sub="Unread" />
          </section>

          {/* ── Quick Actions ─────────────────────────────────── */}
          <section className="mb-8">
            <SectionHeader icon={Icons.zap} title="Quick Actions" />
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
              {[
                { icon: Icons.plus,     label: 'Request a New Service',  href: '/request',     color: 'bg-brand hover:bg-brand-dark text-white' },
                { icon: Icons.list,     label: 'View My Requests',       href: '#requests',    color: 'bg-blue-600 hover:bg-blue-700 text-white' },
                { icon: Icons.quote,    label: 'View Quotes',            href: '#history',     color: 'bg-purple-600 hover:bg-purple-700 text-white' },
                { icon: Icons.star,     label: 'Saved Professionals',    href: '#saved-pros',  color: 'bg-amber-500 hover:bg-amber-600 text-white' },
                { icon: Icons.settings, label: 'Account Settings',       href: '#maintenance', color: 'bg-slate-700 hover:bg-slate-800 text-white' },
              ].map(({ icon, label, href, color }) => (
                <a
                  key={label}
                  href={href}
                  className={`flex flex-col items-center justify-center gap-2 px-3 py-5 rounded-2xl font-semibold text-xs text-center shadow-sm hover:shadow-md transition-all duration-200 hover:-translate-y-0.5 ${color}`}
                >
                  <Icon d={icon} size={24} />
                  <span className="leading-tight">{label}</span>
                </a>
              ))}
            </div>
          </section>

          {/* ── Main Grid ─────────────────────────────────────── */}
          <div className="grid lg:grid-cols-3 gap-6">

            {/* Left / Main column */}
            <div className="lg:col-span-2 space-y-6">

              {/* Active Requests */}
              <section id="requests" className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
                <SectionHeader
                  icon={Icons.tool}
                  title="Active Requests"
                  action={
                    <a href="/request" className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1">
                      <Icon d={Icons.plus} size={13} /> New Request
                    </a>
                  }
                />
                {activeJobs.length === 0 ? (
                  <EmptyState
                    emoji="🔧"
                    title="No active requests"
                    sub="Request your first home service and we'll match you with a trusted pro."
                    cta={
                      <a href="/request" className="inline-flex items-center gap-2 bg-brand text-white text-sm font-semibold px-5 py-2.5 rounded-xl hover:bg-brand-dark transition-colors">
                        <Icon d={Icons.plus} size={15} /> Request a Service
                      </a>
                    }
                  />
                ) : (
                  <div className="space-y-3">
                    {activeJobs.map(job => (
                      <div
                        key={job._id}
                        className="border border-slate-100 rounded-xl p-4 hover:border-blue-200 hover:shadow-sm transition-all duration-200 cursor-pointer group"
                        onClick={() => viewJobDetails(job)}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <h3 className="font-bold text-slate-900 group-hover:text-blue-700 transition-colors">{job.trade}</h3>
                            {job.city && <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5"><Icon d={Icons.map} size={11} />{job.city}</p>}
                          </div>
                          <StatusBadge status={job.status} />
                        </div>
                        <div className="flex items-center gap-4 text-xs text-slate-400 mb-3">
                          <span className="flex items-center gap-1"><Icon d={Icons.calendar} size={11} />{new Date(job.createdAt).toLocaleDateString()}</span>
                          {job.assignedTo && <span className="flex items-center gap-1"><Icon d={Icons.user} size={11} />{job.assignedTo.name}</span>}
                        </div>
                        <ProgressTracker status={job.status} />
                      </div>
                    ))}
                  </div>
                )}
              </section>

              {/* Job History */}
              <section id="history" className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
                <SectionHeader icon={Icons.receipt} title="Job History" />
                {completedJobs.length === 0 ? (
                  <EmptyState emoji="📂" title="No completed jobs yet" sub="Your finished services will appear here." />
                ) : (
                  <div className="space-y-3">
                    {completedJobs.map(job => (
                      <div key={job._id} className="flex items-center justify-between border border-slate-100 rounded-xl p-4 hover:bg-slate-50 transition-colors">
                        <div>
                          <p className="font-semibold text-slate-900 text-sm">{job.trade}</p>
                          <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-1">
                            {job.assignedTo && <><Icon d={Icons.user} size={11} />{job.assignedTo.name} · </>}
                            <Icon d={Icons.calendar} size={11} />{job.updatedAt ? new Date(job.updatedAt).toLocaleDateString() : '—'}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          {job.totalCost > 0 && <span className="text-sm font-bold text-slate-900">${job.totalCost.toFixed(2)}</span>}
                          <button
                            onClick={() => viewJobDetails(job)}
                            className="text-xs text-blue-600 border border-blue-200 px-3 py-1.5 rounded-lg hover:bg-blue-50 transition-colors font-medium"
                          >
                            View
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </section>

              {/* Home Maintenance */}
              <section id="maintenance" className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
                <SectionHeader icon={Icons.shield} title="Home Maintenance Checklist" />
                <div className="grid sm:grid-cols-2 gap-2">
                  {MAINTENANCE_ITEMS.map(item => {
                    const st = MAINTENANCE_STATUS[item.status];
                    return (
                      <div key={item.id} className={`flex items-center gap-3 p-3 rounded-xl border ${st.border} ${st.bg} group hover:shadow-sm transition-shadow`}>
                        <span className="text-xl">{item.icon}</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-slate-800 truncate">{item.label}</p>
                          <p className={`text-xs font-medium ${st.text}`}>{st.label} · {item.month}</p>
                        </div>
                        {item.status !== 'completed' && (
                          <a href="/request" className="text-xs text-blue-600 hover:underline font-medium whitespace-nowrap">Book</a>
                        )}
                        {item.status === 'completed' && (
                          <Icon d={Icons.check} size={16} className="text-green-500 flex-shrink-0" />
                        )}
                      </div>
                    );
                  })}
                </div>
              </section>
            </div>

            {/* Right column */}
            <div className="space-y-6">

              {/* Recent Activity */}
              <section className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
                <SectionHeader icon={Icons.trending} title="Recent Activity" />
                {activityFeed.length === 0 ? (
                  <EmptyState emoji="📅" title="No activity yet" sub="Your service history will appear here." />
                ) : (
                  <ol className="relative border-l border-slate-100 ml-2 space-y-4">
                    {activityFeed.map((item, i) => (
                      <li key={i} className="ml-4">
                        <span className="absolute -left-1.5 w-3 h-3 bg-blue-500 rounded-full border-2 border-white" />
                        <p className="text-sm text-slate-700">{item.text}</p>
                        <time className="text-xs text-slate-400">{new Date(item.ts).toLocaleDateString()}</time>
                      </li>
                    ))}
                  </ol>
                )}
                {activityFeed.length === 0 && (
                  <div className="mt-4 border-t border-slate-50 pt-4 space-y-3 opacity-50">
                    {['You requested Plumbing service','3 professionals viewed your request','Quote received','Job completed'].map((t, i) => (
                      <div key={i} className="flex items-start gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-slate-300 mt-1.5 flex-shrink-0" />
                        <p className="text-xs text-slate-400">{t}</p>
                      </div>
                    ))}
                  </div>
                )}
              </section>

              {/* Saved Professionals */}
              <section id="saved-pros" className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
                <SectionHeader icon={Icons.star} title="Saved Professionals" />
                {savedPros.length === 0 ? (
                  <EmptyState
                    emoji="⭐"
                    title="No saved professionals yet"
                    sub="You haven't saved any professionals yet. After a service, you can save your favorite pros here."
                  />
                ) : (
                  <div className="space-y-3">
                    {savedPros.map((pro, i) => (
                      <div key={i} className="flex items-center gap-3 border border-slate-100 rounded-xl p-3 hover:border-blue-200 transition-colors">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                          {pro.name?.[0] || 'P'}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-sm text-slate-900 truncate">{pro.name}</p>
                          <p className="text-xs text-slate-400">{pro.trade} · {pro.city}</p>
                        </div>
                        <button className="text-xs text-blue-600 border border-blue-200 px-2.5 py-1 rounded-lg hover:bg-blue-50 transition-colors font-medium">View</button>
                      </div>
                    ))}
                  </div>
                )}
              </section>

              {/* Notification Center */}
              <section className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
                <SectionHeader
                  icon={Icons.bell}
                  title="Notifications"
                  action={
                    unreadNotifs > 0 ? (
                      <button
                        onClick={() => setNotifications(ns => ns.map(n => ({ ...n, unread: false })))}
                        className="text-xs text-blue-600 hover:underline"
                      >
                        Mark all read
                      </button>
                    ) : null
                  }
                />
                {notifications.length === 0 ? (
                  <EmptyState emoji="🔔" title="No notifications" sub="Everything looks good!" />
                ) : (
                  <ul className="space-y-2">
                    {notifications.map(n => (
                      <li
                        key={n.id}
                        onClick={() => setNotifications(ns => ns.map(x => x.id === n.id ? { ...x, unread: false } : x))}
                        className={`px-3 py-3 rounded-xl cursor-pointer transition-colors ${n.unread ? 'bg-blue-50 hover:bg-blue-100' : 'hover:bg-slate-50'}`}
                      >
                        <p className={`text-sm ${n.unread ? 'font-semibold text-slate-900' : 'text-slate-600'}`}>{n.text}</p>
                        <p className="text-xs text-slate-400 mt-0.5">{n.time}</p>
                      </li>
                    ))}
                  </ul>
                )}
              </section>

              {/* Referral */}
              <section className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl p-5 text-white shadow-lg">
                <div className="flex items-start gap-3 mb-3">
                  <div className="bg-white/20 rounded-xl p-2">
                    <Icon d={Icons.share} size={20} />
                  </div>
                  <div>
                    <h2 className="font-bold text-base">Invite Friends</h2>
                    <p className="text-blue-100 text-xs mt-0.5">Invite friends to use Fixlo.</p>
                  </div>
                </div>
                <p className="text-blue-100 text-xs mb-4 leading-relaxed">
                  Share Fixlo with friends and family. Future referral rewards coming soon!
                </p>
                <button
                  onClick={() => {
                    if (navigator.share) {
                      navigator.share({ title: 'Fixlo – Home Services', url: 'https://fixloapp.com' }).catch(() => {});
                    } else {
                      navigator.clipboard?.writeText('https://fixloapp.com').then(() => {
                        setLinkCopied(true);
                        setTimeout(() => setLinkCopied(false), 2500);
                      });
                    }
                  }}
                  className="w-full bg-white text-blue-700 font-bold py-2.5 rounded-xl hover:bg-blue-50 transition-colors text-sm flex items-center justify-center gap-2"
                >
                  <Icon d={Icons.share} size={15} />
                  {linkCopied ? '✓ Link copied!' : 'Share Fixlo'}
                </button>
              </section>
            </div>
          </div>
        </div>

        {/* ── Sticky Mobile Bottom Nav ───────────────────────── */}
        <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 z-30 lg:hidden safe-area-inset-bottom">
          <div className="flex items-center justify-around h-16">
            {[
              { id: 'home',     icon: Icons.home,  label: 'Home',     target: null },
              { id: 'requests', icon: Icons.list,  label: 'Requests', target: 'requests' },
              { id: 'messages', icon: Icons.msg,   label: 'Messages', target: null },
              { id: 'account',  icon: Icons.user,  label: 'Account',  target: null },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id);
                  if (tab.target) {
                    document.getElementById(tab.target)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                  } else {
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }
                }}
                className={`flex flex-col items-center gap-1 px-4 py-2 transition-colors ${activeTab === tab.id ? 'text-brand' : 'text-slate-400 hover:text-slate-600'}`}
              >
                <Icon d={tab.icon} size={20} />
                <span className="text-[10px] font-semibold">{tab.label}</span>
              </button>
            ))}
          </div>
        </nav>
      </div>

      {/* ── Job Detail Modal ──────────────────────────────────── */}
      {showJobModal && selectedJob && (
        <JobModal
          job={selectedJob}
          invoice={invoice}
          onClose={() => { setShowJobModal(false); setInvoice(null); }}
          onDownloadInvoice={downloadInvoice}
        />
      )}
    </>
  );
}
