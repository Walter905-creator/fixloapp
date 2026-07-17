import React, { useEffect, useMemo, useRef, useState } from 'react';

const ICONS = {
  new_lead: '🔔',
  lead_accepted: '✅',
  appointment_scheduled: '📅',
  job_completed: '🏆',
  invoice_ready: '📄',
  payment_received: '💰',
  review_requested: '⭐',
  subscription_renewal: '🔄',
  commission_paid: '💸',
  background_check_approved: '🛡️',
  message_received: '💬',
  system: 'ℹ️'
};

function formatTimeAgo(value) {
  if (!value) return 'Just now';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Just now';
  const diffMs = Date.now() - date.getTime();
  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString();
}

function NotificationList({ notifications, loading, onMarkRead, onMarkAllRead, unreadCount }) {
  if (loading) {
    return (
      <div className="p-6 text-center text-sm text-slate-500">
        <div className="mx-auto mb-3 h-8 w-8 animate-spin rounded-full border-2 border-emerald-200 border-t-emerald-600" />
        Loading notifications...
      </div>
    );
  }

  if (!notifications.length) {
    return (
      <div className="p-6 text-center">
        <div className="text-2xl">🔔</div>
        <p className="mt-2 text-sm font-medium text-slate-700">No notifications yet</p>
      </div>
    );
  }

  return (
    <>
      <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
        <div>
          <p className="text-sm font-semibold text-slate-900">Notifications</p>
          <p className="text-xs text-slate-500">{unreadCount} unread</p>
        </div>
        <button
          type="button"
          onClick={onMarkAllRead}
          disabled={!unreadCount}
          className="text-xs font-semibold text-emerald-600 transition hover:text-emerald-700 disabled:cursor-not-allowed disabled:text-slate-300"
        >
          Mark all read
        </button>
      </div>
      <div className="max-h-[420px] overflow-y-auto">
        {notifications.map((notification) => {
          const isUnread = notification.read === false || notification.isRead === false;
          const icon = ICONS[notification.type] || 'ℹ️';
          return (
            <button
              key={notification.id || notification._id || `${notification.title}-${notification.createdAt}`}
              type="button"
              onClick={() => isUnread && onMarkRead?.(notification)}
              className={`flex w-full items-start gap-3 border-b border-slate-100 px-4 py-3 text-left transition hover:bg-slate-50 ${
                isUnread ? 'bg-emerald-50/70' : 'bg-white'
              }`}
            >
              <span className="mt-0.5 text-lg" aria-hidden="true">{icon}</span>
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-3">
                  <p className="truncate text-sm font-semibold text-slate-900">{notification.title || 'Notification'}</p>
                  <span className={`mt-1 h-2.5 w-2.5 shrink-0 rounded-full ${isUnread ? 'bg-emerald-500' : 'bg-slate-200'}`} />
                </div>
                <p className="mt-1 text-sm text-slate-600">{notification.message || notification.body || 'You have a new update.'}</p>
                <p className="mt-2 text-xs text-slate-400">{formatTimeAgo(notification.createdAt || notification.updatedAt || notification.timestamp)}</p>
              </div>
            </button>
          );
        })}
      </div>
    </>
  );
}

export default function NotificationCenter({
  notifications = [],
  unreadCount = 0,
  onMarkRead,
  onMarkAllRead,
  loading = false,
  expanded = false
}) {
  const [open, setOpen] = useState(false);
  const panelRef = useRef(null);
  const normalizedNotifications = useMemo(
    () => (Array.isArray(notifications) ? notifications : []),
    [notifications]
  );

  useEffect(() => {
    if (expanded) return undefined;
    function handleClickOutside(event) {
      if (panelRef.current && !panelRef.current.contains(event.target)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [expanded]);

  if (expanded) {
    return (
      <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        <NotificationList
          notifications={normalizedNotifications}
          loading={loading}
          onMarkRead={onMarkRead}
          onMarkAllRead={onMarkAllRead}
          unreadCount={unreadCount}
        />
      </section>
    );
  }

  return (
    <div className="relative" ref={panelRef}>
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className="relative inline-flex h-11 w-11 items-center justify-center rounded-full border border-slate-200 bg-white text-lg shadow-sm transition hover:border-emerald-200 hover:text-emerald-600"
        aria-label="Open notifications"
      >
        🔔
        {unreadCount > 0 ? (
          <span className="absolute -right-1 -top-1 inline-flex min-h-[20px] min-w-[20px] items-center justify-center rounded-full bg-emerald-600 px-1.5 text-[11px] font-bold text-white">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        ) : null}
      </button>

      {open ? (
        <div className="absolute right-0 z-30 mt-3 w-[360px] overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl">
          <NotificationList
            notifications={normalizedNotifications}
            loading={loading}
            onMarkRead={onMarkRead}
            onMarkAllRead={onMarkAllRead}
            unreadCount={unreadCount}
          />
        </div>
      ) : null}
    </div>
  );
}
