import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  API_BASE,
  fetchAppointments,
  fetchConversations,
  fetchDocuments,
  fetchNotifications,
  fetchProDashboard,
  sendMessage
} from '../lib/api';
import DashboardLayout from '../components/dashboard/DashboardLayout';
import MetricCard from '../components/dashboard/MetricCard';
import DashboardTable from '../components/dashboard/DashboardTable';
import EmptyState from '../components/dashboard/EmptyState';
import StatusBadge from '../components/dashboard/StatusBadge';
import LoadingState from '../components/dashboard/LoadingState';
import ErrorState from '../components/dashboard/ErrorState';
import WeeklyBarChart from '../components/dashboard/WeeklyBarChart';
import CopyLinkCard from '../components/dashboard/CopyLinkCard';
import NotificationCenter from '../components/dashboard/NotificationCenter';
import CalendarView from '../components/dashboard/CalendarView';
import DocumentCenter from '../components/dashboard/DocumentCenter';
import { uploadToCloudinary } from '../utils/cloudinary';
import { formatUsdCents } from '../lib/format';
import '../styles/dashboard.css';

const NAV_ITEMS = [
  'Overview',
  'Leads',
  'Earnings',
  'Calendar',
  'Messages',
  'Notifications',
  'Documents',
  'Invoices',
  'Profile',
  'Billing',
  'Settings',
  'Support',
  'Log Out'
];

function toMoney(value) {
  return formatUsdCents(value);
}

function formatTime(value) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleString();
}

function getMessagePreview(conversation) {
  const lastMessage = conversation?.lastMessage;
  return lastMessage?.text || lastMessage?.message || 'No messages yet';
}

export default function ProDashboard() {
  const { user, logout } = useAuth();
  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState('Overview');
  const [state, setState] = useState({ loading: true, error: '', data: null });
  const [notificationsState, setNotificationsState] = useState({ loading: false, error: '', data: [], loaded: false });
  const [appointmentsState, setAppointmentsState] = useState({ loading: false, error: '', data: [], loaded: false });
  const [documentsState, setDocumentsState] = useState({ loading: false, error: '', data: [], loaded: false });
  const [conversationsState, setConversationsState] = useState({ loading: false, error: '', data: [], loaded: false });
  const [messagesState, setMessagesState] = useState({ loading: false, error: '', data: [] });
  const [selectedConversationId, setSelectedConversationId] = useState('');
  const [draftMessage, setDraftMessage] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);

  const authFetch = useCallback(async (path, options = {}) => {
    const token = localStorage.getItem('fixlo_token') || '';
    const headers = {
      ...(options.body instanceof FormData ? {} : { 'Content-Type': 'application/json' }),
      ...(options.headers || {})
    };

    if (token) {
      headers.Authorization = 'Bearer ' + token;
    }

    const response = await fetch(`${API_BASE}${path}`, {
      credentials: 'include',
      ...options,
      headers
    });

    if (!response.ok) {
      const errorBody = await response.json().catch(() => ({}));
      throw new Error(errorBody.error || errorBody.message || 'Request failed');
    }

    return response.status === 204 ? null : response.json().catch(() => null);
  }, []);

  const load = useCallback(async () => {
    setState((prev) => ({ ...prev, loading: true, error: '' }));
    try {
      const data = await fetchProDashboard({ userId: searchParams.get('userId') || '' });
      setState({ loading: false, error: '', data });
    } catch (error) {
      setState({ loading: false, error: error.message, data: null });
    }
  }, [searchParams]);

  const loadNotifications = useCallback(async () => {
    setNotificationsState((prev) => ({ ...prev, loading: true, error: '' }));
    try {
      const data = await fetchNotifications('pro');
      setNotificationsState({
        loading: false,
        error: '',
        data: data?.notifications || data?.items || data || [],
        loaded: true
      });
    } catch (error) {
      setNotificationsState((prev) => ({ ...prev, loading: false, error: error.message, loaded: true }));
    }
  }, []);

  const loadAppointmentsData = useCallback(async () => {
    setAppointmentsState((prev) => ({ ...prev, loading: true, error: '' }));
    try {
      const data = await fetchAppointments('pro');
      setAppointmentsState({
        loading: false,
        error: '',
        data: data?.appointments || data?.items || data || [],
        loaded: true
      });
    } catch (error) {
      setAppointmentsState((prev) => ({ ...prev, loading: false, error: error.message, loaded: true }));
    }
  }, []);

  const loadDocumentsData = useCallback(async () => {
    setDocumentsState((prev) => ({ ...prev, loading: true, error: '' }));
    try {
      const data = await fetchDocuments('pro');
      setDocumentsState({
        loading: false,
        error: '',
        data: data?.documents || data?.items || data || [],
        loaded: true
      });
    } catch (error) {
      setDocumentsState((prev) => ({ ...prev, loading: false, error: error.message, loaded: true }));
    }
  }, []);

  const loadConversationsData = useCallback(async () => {
    setConversationsState((prev) => ({ ...prev, loading: true, error: '' }));
    try {
      const data = await fetchConversations('pro');
      const conversations = data?.conversations || data?.items || data || [];
      setConversationsState({
        loading: false,
        error: '',
        data: conversations,
        loaded: true
      });
      if (!selectedConversationId && conversations[0]?._id) {
        setSelectedConversationId(conversations[0]._id);
      }
    } catch (error) {
      setConversationsState((prev) => ({ ...prev, loading: false, error: error.message, loaded: true }));
    }
  }, [selectedConversationId]);

  const loadMessages = useCallback(async (conversationId) => {
    if (!conversationId) return;
    setMessagesState((prev) => ({ ...prev, loading: true, error: '' }));
    try {
      let data;
      try {
        data = await authFetch(`/api/conversations/${conversationId}/messages`);
      } catch (error) {
        data = await authFetch(`/api/messages/${conversationId}`);
      }
      setMessagesState({
        loading: false,
        error: '',
        data: data?.messages || data?.items || data || []
      });
    } catch (error) {
      setMessagesState({ loading: false, error: error.message, data: [] });
    }
  }, [authFetch]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (activeTab === 'Calendar' && !appointmentsState.loaded) {
      loadAppointmentsData();
    }
    if (activeTab === 'Notifications' && !notificationsState.loaded) {
      loadNotifications();
    }
    if ((activeTab === 'Documents' || activeTab === 'Invoices') && !documentsState.loaded) {
      loadDocumentsData();
    }
    if (activeTab === 'Messages' && !conversationsState.loaded) {
      loadConversationsData();
    }
  }, [
    activeTab,
    appointmentsState.loaded,
    conversationsState.loaded,
    documentsState.loaded,
    loadAppointmentsData,
    loadConversationsData,
    loadDocumentsData,
    loadNotifications,
    notificationsState.loaded
  ]);

  useEffect(() => {
    if (activeTab === 'Messages' && selectedConversationId) {
      loadMessages(selectedConversationId);
    }
  }, [activeTab, loadMessages, selectedConversationId]);

  const data = state.data;
  const leads = useMemo(() => state.data?.leads || [], [state.data]);
  const recentRequests = useMemo(() => state.data?.recentRequests || [], [state.data]);
  const unreadNotifications = useMemo(
    () => (notificationsState.data || []).filter((item) => item.read === false || item.isRead === false).length,
    [notificationsState.data]
  );
  const selectedConversation = useMemo(
    () => conversationsState.data.find((conversation) => conversation._id === selectedConversationId) || null,
    [conversationsState.data, selectedConversationId]
  );
  const invoiceDocuments = useMemo(() => {
    return (documentsState.data || []).filter((document) => ['invoice', 'receipt'].includes(String(document.type || '').toLowerCase()));
  }, [documentsState.data]);

  const handleMarkNotificationRead = async (notification) => {
    setNotificationsState((prev) => ({
      ...prev,
      data: prev.data.map((item) =>
        (item.id || item._id) === (notification.id || notification._id) ? { ...item, read: true, isRead: true } : item
      )
    }));

    try {
      await authFetch(`/api/notifications/${notification.id || notification._id}/read`, { method: 'POST' });
    } catch (error) {
      // Keep optimistic state.
    }
  };

  const handleMarkAllNotificationsRead = async () => {
    setNotificationsState((prev) => ({
      ...prev,
      data: prev.data.map((item) => ({ ...item, read: true, isRead: true }))
    }));

    try {
      await authFetch('/api/notifications/read-all', { method: 'POST' });
    } catch (error) {
      // Keep optimistic state.
    }
  };

  const handleSendMessage = async (event) => {
    event.preventDefault();
    if (!selectedConversationId || !draftMessage.trim()) return;

    setSendingMessage(true);
    try {
      await sendMessage('pro', {
        conversationId: selectedConversationId,
        recipientId: selectedConversation?.otherUser?._id,
        text: draftMessage.trim()
      });
      setDraftMessage('');
      await loadMessages(selectedConversationId);
      await loadConversationsData();
    } catch (error) {
      setMessagesState((prev) => ({ ...prev, error: error.message }));
    } finally {
      setSendingMessage(false);
    }
  };

  if (state.loading) return <LoadingState message="Loading pro dashboard..." />;
  if (state.error) return <ErrorState message={state.error} onRetry={load} />;

  const handleDocumentUpload = async (file) => {
    const upload = await uploadToCloudinary(file);
    await authFetch('/api/documents', {
      method: 'POST',
      body: JSON.stringify({
        name: file.name,
        type: file.type,
        size: file.size,
        url: upload.secure_url,
        publicId: upload.public_id
      })
    });
    await loadDocumentsData();
  };

  const handleDocumentDelete = async (document) => {
    if (!window.confirm(`Delete ${document.name || 'this document'}?`)) return;
    await authFetch(`/api/documents/${document.id || document._id}`, { method: 'DELETE' });
    await loadDocumentsData();
  };

  const renderOverview = () => (
    <>
      <section className="dashboard-grid metrics-grid">
        <MetricCard label="Leads received" value={data?.summary?.leadsReceived ?? 0} />
        <MetricCard label="Leads viewed" value={data?.summary?.leadsViewed ?? 0} />
        <MetricCard label="Accepted leads" value={data?.summary?.acceptedJobs ?? 0} />
        <MetricCard label="Completed jobs" value={data?.summary?.completedJobs ?? 0} />
        <MetricCard label="Avg response time" value={data?.summary?.averageResponseTimeMs ? `${Math.round(data.summary.averageResponseTimeMs / 60000)} min` : '—'} />
        <MetricCard label="Performance score" value={data?.summary?.performanceScore ?? 0} />
        <MetricCard label="Acceptance rate" value={data?.summary?.acceptanceRate != null ? `${data.summary.acceptanceRate}%` : '—'} />
        <MetricCard label="Completion rate" value={data?.summary?.completionRate != null ? `${data.summary.completionRate}%` : '—'} />
      </section>

      <section className="dashboard-grid chart-grid">
        <WeeklyBarChart data={recentRequests} valueKey="count" title="Recent Service Requests" />
        <CopyLinkCard
          title="Billing"
          value={data?.billing?.stripeCustomerId || ''}
          subtitle={`Status: ${data?.billing?.subscriptionStatus || 'N/A'} • Period end: ${data?.billing?.currentPeriodEnd ? new Date(data.billing.currentPeriodEnd).toLocaleDateString() : 'N/A'}`}
        />
      </section>

      <DashboardTable
        title="Lead Details"
        rows={leads}
        empty={<EmptyState title="No leads yet" message="Your lead pipeline is empty right now." />}
        columns={[
          { key: 'customerName', label: 'Customer' },
          { key: 'service', label: 'Service' },
          { key: 'location', label: 'Location' },
          { key: 'dateRequested', label: 'Requested', render: (value) => value ? new Date(value).toLocaleDateString() : '—' },
          { key: 'status', label: 'Status', render: (value) => <StatusBadge status={value} /> },
          { key: 'estimatedValue', label: 'Est. Value', render: (value) => toMoney(value) },
          { key: 'phone', label: 'Phone', render: (value, row) => row?.secureLeadRequired ? 'Unlock after acceptance' : (value || '—') }
        ]}
      />
    </>
  );

  const renderLeads = () => (
    <DashboardTable
      title="Lead Details"
      rows={leads}
      empty={<EmptyState title="No leads yet" message="Your lead pipeline is empty right now." />}
      columns={[
        { key: 'customerName', label: 'Customer' },
        { key: 'service', label: 'Service' },
        { key: 'location', label: 'Location' },
        { key: 'dateRequested', label: 'Requested', render: (value) => value ? new Date(value).toLocaleDateString() : '—' },
        { key: 'status', label: 'Status', render: (value) => <StatusBadge status={value} /> },
        { key: 'estimatedValue', label: 'Est. Value', render: (value) => toMoney(value) },
        { key: 'phone', label: 'Phone', render: (value, row) => row?.secureLeadRequired ? 'Unlock after acceptance' : (value || '—') }
      ]}
    />
  );

  const renderEarnings = () => (
    <div className="space-y-4">
      <section className="dashboard-grid metrics-grid">
        <MetricCard label="Completed jobs" value={data?.summary?.completedJobs ?? 0} />
        <MetricCard label="Acceptance rate" value={data?.summary?.acceptanceRate != null ? `${data.summary.acceptanceRate}%` : '—'} />
        <MetricCard label="Completion rate" value={data?.summary?.completionRate != null ? `${data.summary.completionRate}%` : '—'} />
        <MetricCard label="Average ticket" value={toMoney(data?.summary?.averageTicketValue ?? 0)} />
      </section>
      <WeeklyBarChart data={recentRequests} valueKey="count" title="Lead Volume Trend" />
    </div>
  );

  const renderMessages = () => (
    <section className="grid gap-4 xl:grid-cols-[320px_minmax(0,1fr)]">
      <div className="dashboard-card">
        <div className="dashboard-card-header"><h3>Conversations</h3></div>
        {conversationsState.loading ? (
          <LoadingState message="Loading conversations..." />
        ) : conversationsState.error ? (
          <ErrorState message={conversationsState.error} onRetry={loadConversationsData} />
        ) : conversationsState.data.length ? (
          <div className="mt-3 grid gap-2">
            {conversationsState.data.map((conversation) => (
              <button
                key={conversation._id}
                type="button"
                onClick={() => setSelectedConversationId(conversation._id)}
                className={`rounded-2xl border px-4 py-3 text-left transition ${
                  selectedConversationId === conversation._id ? 'border-emerald-300 bg-emerald-50' : 'border-slate-200 bg-white hover:border-slate-300'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-slate-900">{conversation.otherUser?.name || 'Conversation'}</p>
                    <p className="mt-1 text-sm text-slate-500">{getMessagePreview(conversation)}</p>
                  </div>
                  {conversation.unreadCount ? (
                    <span className="rounded-full bg-emerald-600 px-2 py-0.5 text-xs font-bold text-white">{conversation.unreadCount}</span>
                  ) : null}
                </div>
              </button>
            ))}
          </div>
        ) : (
          <EmptyState title="No conversations yet" message="Messages with customers will appear here." />
        )}
      </div>

      <div className="dashboard-card">
        <div className="dashboard-card-header"><h3>{selectedConversation?.otherUser?.name || 'Message thread'}</h3></div>
        {messagesState.loading ? (
          <LoadingState message="Loading messages..." />
        ) : messagesState.error ? (
          <ErrorState message={messagesState.error} onRetry={() => loadMessages(selectedConversationId)} />
        ) : selectedConversationId ? (
          <>
            <div className="mt-3 grid max-h-[420px] gap-3 overflow-y-auto">
              {(messagesState.data || []).length ? (
                messagesState.data.map((message) => {
                  const mine = message.senderId === data?.user?.id || message.senderId === data?.user?._id || message.senderId === user?._id;
                  return (
                    <div key={message._id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm ${mine ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-800'}`}>
                        <p>{message.text || message.message}</p>
                        <p className={`mt-1 text-[11px] ${mine ? 'text-emerald-100' : 'text-slate-400'}`}>{formatTime(message.createdAt)}</p>
                      </div>
                    </div>
                  );
                })
              ) : (
                <EmptyState title="No messages yet" message="Start the conversation below." />
              )}
            </div>
            <form onSubmit={handleSendMessage} className="mt-4 flex gap-3">
              <input
                value={draftMessage}
                onChange={(event) => setDraftMessage(event.target.value)}
                className="dashboard-input"
                placeholder="Type your message..."
              />
              <button type="submit" className="dashboard-btn" disabled={sendingMessage || !draftMessage.trim()}>
                {sendingMessage ? 'Sending...' : 'Send'}
              </button>
            </form>
          </>
        ) : (
          <EmptyState title="Select a conversation" message="Choose a conversation to see the thread." />
        )}
      </div>
    </section>
  );

  const renderDocuments = () => (
    documentsState.error && !documentsState.data.length ? (
      <ErrorState message={documentsState.error} onRetry={loadDocumentsData} />
    ) : (
      <DocumentCenter
        documents={documentsState.data}
        loading={documentsState.loading}
        onUpload={handleDocumentUpload}
        onPreview={(document) => {
          const url = document.url || document.secureUrl || document.secure_url;
          if (url) window.open(url, '_blank', 'noopener,noreferrer');
        }}
        onDelete={handleDocumentDelete}
      />
    )
  );

  const renderInvoices = () => (
    <section className="dashboard-grid chart-grid">
      <CopyLinkCard
        title="Stripe customer"
        value={data?.billing?.stripeCustomerId || 'Not available'}
        subtitle={`Subscription: ${data?.billing?.subscriptionStatus || 'Unknown'}`}
      />
      <div className="dashboard-card">
        <div className="dashboard-card-header"><h3>Invoices</h3></div>
        {documentsState.loading ? (
          <LoadingState message="Loading invoices..." />
        ) : invoiceDocuments.length ? (
          <div className="mt-3 grid gap-3">
            {invoiceDocuments.map((document) => (
              <div key={document.id || document._id} className="rounded-xl border border-slate-200 p-3">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="font-semibold text-slate-900">{document.name}</p>
                    <p className="text-sm text-slate-500">{document.type}</p>
                  </div>
                  <a
                    href={document.url || document.secureUrl || document.secure_url || '#'}
                    target="_blank"
                    rel="noreferrer"
                    className="text-sm font-semibold text-blue-600"
                  >
                    View
                  </a>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState title="No invoices yet" message="Invoices will appear here once billing documents are available." />
        )}
      </div>
    </section>
  );

  const renderProfile = () => (
    <section className="dashboard-grid chart-grid">
      <div className="dashboard-card">
        <div className="dashboard-card-header"><h3>Profile</h3></div>
        <div className="mt-4 space-y-3 text-sm text-slate-700">
          <div><span className="font-semibold text-slate-900">Name:</span> {data?.user?.name || user?.name || '—'}</div>
          <div><span className="font-semibold text-slate-900">Email:</span> {data?.user?.email || user?.email || '—'}</div>
          <div><span className="font-semibold text-slate-900">Phone:</span> {data?.user?.phone || user?.phone || '—'}</div>
          <div><span className="font-semibold text-slate-900">Company:</span> {data?.user?.company || '—'}</div>
        </div>
      </div>
      <div className="dashboard-card">
        <div className="dashboard-card-header"><h3>Performance snapshot</h3></div>
        <div className="mt-4 space-y-3">
          <MetricCard label="Performance score" value={data?.summary?.performanceScore ?? 0} />
          <MetricCard label="Completion rate" value={data?.summary?.completionRate != null ? `${data.summary.completionRate}%` : '—'} />
        </div>
      </div>
    </section>
  );

  const renderBilling = () => (
    <section className="dashboard-grid chart-grid">
      <CopyLinkCard
        title="Billing customer ID"
        value={data?.billing?.stripeCustomerId || 'Not linked'}
        subtitle={`Current period end: ${data?.billing?.currentPeriodEnd ? new Date(data.billing.currentPeriodEnd).toLocaleDateString() : 'N/A'}`}
      />
      <div className="dashboard-card">
        <div className="dashboard-card-header"><h3>Subscription</h3></div>
        <div className="mt-4 space-y-2 text-sm text-slate-700">
          <p><span className="font-semibold text-slate-900">Status:</span> {data?.billing?.subscriptionStatus || 'N/A'}</p>
          <p><span className="font-semibold text-slate-900">Plan:</span> {data?.billing?.plan || data?.billing?.subscriptionPlan || 'N/A'}</p>
        </div>
      </div>
    </section>
  );

  const renderSettings = () => (
    <div className="dashboard-card">
      <div className="dashboard-card-header"><h3>Settings</h3></div>
      <div className="mt-4 space-y-3 text-sm text-slate-700">
        <div className="toggle-row"><span>Email alerts</span><span>{data?.user?.wantsNotifications === false ? 'Off' : 'On'}</span></div>
        <div className="toggle-row"><span>SMS / WhatsApp alerts</span><span>{data?.user?.whatsappOptIn ? 'On' : 'Off'}</span></div>
        <div className="toggle-row"><span>Lead access</span><span>{data?.billing?.subscriptionStatus || 'Unknown'}</span></div>
      </div>
    </div>
  );

  const renderSupport = () => (
    <EmptyState
      title="Need help?"
      message="For billing, lead delivery, or account support, email support@fixloapp.com."
      action={<a href="mailto:support@fixloapp.com" className="dashboard-btn">Contact Support</a>}
    />
  );

  const tabContent = {
    Overview: renderOverview(),
    Leads: renderLeads(),
    Earnings: renderEarnings(),
    Calendar: appointmentsState.error && !appointmentsState.data.length
      ? <ErrorState message={appointmentsState.error} onRetry={loadAppointmentsData} />
      : <CalendarView appointments={appointmentsState.data} loading={appointmentsState.loading} onCreateAppointment={() => setActiveTab('Leads')} />,
    Messages: renderMessages(),
    Notifications: notificationsState.error && !notificationsState.data.length
      ? <ErrorState message={notificationsState.error} onRetry={loadNotifications} />
      : (
        <NotificationCenter
          expanded
          notifications={notificationsState.data}
          unreadCount={unreadNotifications}
          loading={notificationsState.loading}
          onMarkRead={handleMarkNotificationRead}
          onMarkAllRead={handleMarkAllNotificationsRead}
        />
      ),
    Documents: renderDocuments(),
    Invoices: renderInvoices(),
    Profile: renderProfile(),
    Billing: renderBilling(),
    Settings: renderSettings(),
    Support: renderSupport()
  };

  return (
    <DashboardLayout
      title="Pro Dashboard"
      userName={data?.user?.name || user?.name}
      dateRange="Last 7 days"
      onLogout={logout}
      navItems={NAV_ITEMS}
      activeItem={activeTab}
      onSelectItem={(key) => key !== 'Log Out' && setActiveTab(key)}
      headerAccessory={
        <NotificationCenter
          notifications={notificationsState.data}
          unreadCount={unreadNotifications}
          loading={notificationsState.loading}
          onMarkRead={handleMarkNotificationRead}
          onMarkAllRead={handleMarkAllNotificationsRead}
        />
      }
    >
      {tabContent[activeTab] || renderOverview()}
    </DashboardLayout>
  );
}
