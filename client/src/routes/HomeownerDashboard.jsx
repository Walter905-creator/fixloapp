import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { API_BASE } from '../utils/config';
import { uploadToCloudinary } from '../utils/cloudinary';
import NotificationCenter from '../components/dashboard/NotificationCenter';
import CalendarView from '../components/dashboard/CalendarView';
import DocumentCenter from '../components/dashboard/DocumentCenter';
import ProjectTimeline from '../components/dashboard/ProjectTimeline';
import ReviewForm from '../components/dashboard/ReviewForm';
import EmptyState from '../components/dashboard/EmptyState';
import StatusBadge from '../components/dashboard/StatusBadge';
import LoadingState from '../components/dashboard/LoadingState';
import ErrorState from '../components/dashboard/ErrorState';
import '../styles/dashboard.css';

const TABS = [
  'Overview',
  'My Projects',
  'Appointments',
  'Messages',
  'Notifications',
  'Documents',
  'Reviews',
  'Profile',
  'Settings'
];

function getToken() {
  return localStorage.getItem('fixlo_homeowner_token') || localStorage.getItem('fixlo_token') || '';
}

function formatTimeAgo(value) {
  if (!value) return 'Just now';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Just now';
  const diffMinutes = Math.floor((Date.now() - date.getTime()) / 60000);
  if (diffMinutes < 1) return 'Just now';
  if (diffMinutes < 60) return `${diffMinutes}m ago`;
  const hours = Math.floor(diffMinutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString();
}

function formatMessageTime(value) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleString();
}

function getStatusFilterMatch(project, filter) {
  if (filter === 'All') return true;
  const status = String(project.status || '').toLowerCase();
  if (filter === 'Active') return ['active', 'accepted', 'in_progress', 'assigned', 'scheduled'].includes(status);
  if (filter === 'Completed') return status === 'completed';
  if (filter === 'Pending') return status === 'pending';
  return true;
}

function SummaryCard({ label, value, helper }) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-3 text-3xl font-extrabold text-slate-900">{value}</p>
      {helper ? <p className="mt-2 text-sm text-slate-500">{helper}</p> : null}
    </div>
  );
}

export default function HomeownerDashboard() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('Overview');
  const [dashboardState, setDashboardState] = useState({ loading: true, error: '', data: null });
  const [notificationsState, setNotificationsState] = useState({ loading: false, error: '', data: [], loaded: false });
  const [appointmentsState, setAppointmentsState] = useState({ loading: false, error: '', data: [], loaded: false });
  const [documentsState, setDocumentsState] = useState({ loading: false, error: '', data: [], loaded: false });
  const [conversationsState, setConversationsState] = useState({ loading: false, error: '', data: [], loaded: false });
  const [messagesState, setMessagesState] = useState({ loading: false, error: '', data: [] });
  const [selectedConversationId, setSelectedConversationId] = useState('');
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [projectFilter, setProjectFilter] = useState('All');
  const [messageDraft, setMessageDraft] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);
  const [profileForm, setProfileForm] = useState({ name: '', email: '', phone: '', password: '', newPassword: '', smsNotifications: true });
  const [settingsForm, setSettingsForm] = useState({ emailNotifications: true, smsNotifications: true });
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingSettings, setSavingSettings] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState('');
  const [settingsSuccess, setSettingsSuccess] = useState('');
  const [actionError, setActionError] = useState('');
  const [activeReviewJob, setActiveReviewJob] = useState(null);

  const authFetch = useCallback(async (path, options = {}) => {
    const token = getToken();
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

  const loadDashboard = useCallback(async () => {
    setDashboardState((prev) => ({ ...prev, loading: true, error: '' }));
    try {
      const data = await authFetch('/api/dashboard/homeowner');
      setDashboardState({ loading: false, error: '', data });
    } catch (error) {
      setDashboardState({ loading: false, error: error.message, data: null });
    }
  }, [authFetch]);

  const loadNotifications = useCallback(async () => {
    setNotificationsState((prev) => ({ ...prev, loading: true, error: '' }));
    try {
      const data = await authFetch('/api/notifications');
      setNotificationsState({
        loading: false,
        error: '',
        data: data?.notifications || data?.items || data || [],
        loaded: true
      });
    } catch (error) {
      setNotificationsState((prev) => ({ ...prev, loading: false, error: error.message, loaded: true }));
    }
  }, [authFetch]);

  const loadAppointments = useCallback(async () => {
    setAppointmentsState((prev) => ({ ...prev, loading: true, error: '' }));
    try {
      const data = await authFetch('/api/calendar/appointments');
      setAppointmentsState({
        loading: false,
        error: '',
        data: data?.appointments || data?.items || data || [],
        loaded: true
      });
    } catch (error) {
      setAppointmentsState((prev) => ({ ...prev, loading: false, error: error.message, loaded: true }));
    }
  }, [authFetch]);

  const loadDocuments = useCallback(async () => {
    setDocumentsState((prev) => ({ ...prev, loading: true, error: '' }));
    try {
      const data = await authFetch('/api/documents');
      setDocumentsState({
        loading: false,
        error: '',
        data: data?.documents || data?.items || data || [],
        loaded: true
      });
    } catch (error) {
      setDocumentsState((prev) => ({ ...prev, loading: false, error: error.message, loaded: true }));
    }
  }, [authFetch]);

  const loadConversations = useCallback(async () => {
    setConversationsState((prev) => ({ ...prev, loading: true, error: '' }));
    try {
      const data = await authFetch('/api/conversations');
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
  }, [authFetch, selectedConversationId]);

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
    const token = getToken();
    if (!token) {
      navigate('/login/homeowner', { replace: true });
      return;
    }
    loadDashboard();
  }, [loadDashboard, navigate]);

  useEffect(() => {
    if (activeTab === 'Notifications' && !notificationsState.loaded) loadNotifications();
    if (activeTab === 'Appointments' && !appointmentsState.loaded) loadAppointments();
    if (activeTab === 'Documents' && !documentsState.loaded) loadDocuments();
    if (activeTab === 'Messages' && !conversationsState.loaded) loadConversations();
  }, [
    activeTab,
    appointmentsState.loaded,
    conversationsState.loaded,
    documentsState.loaded,
    loadAppointments,
    loadConversations,
    loadDocuments,
    loadNotifications,
    notificationsState.loaded
  ]);

  useEffect(() => {
    if (activeTab === 'Messages' && selectedConversationId) {
      loadMessages(selectedConversationId);
    }
  }, [activeTab, loadMessages, selectedConversationId]);

  const dashboard = dashboardState.data || {};
  const homeowner = dashboard.homeowner || dashboard.user || user || {};
  const projects = useMemo(() => dashboard.projects || dashboard.jobs || [], [dashboard.jobs, dashboard.projects]);
  const filteredProjects = useMemo(
    () => projects.filter((project) => getStatusFilterMatch(project, projectFilter)),
    [projectFilter, projects]
  );
  const selectedProject = useMemo(
    () => filteredProjects.find((project) => (project.id || project._id) === selectedProjectId) || filteredProjects[0] || null,
    [filteredProjects, selectedProjectId]
  );
  const upcomingAppointments = useMemo(
    () => (appointmentsState.data.length ? appointmentsState.data : (dashboard.appointments || [])),
    [appointmentsState.data, dashboard.appointments]
  );
  const notifications = useMemo(
    () => (notificationsState.data.length ? notificationsState.data : (dashboard.notifications || [])),
    [dashboard.notifications, notificationsState.data]
  );
  const documents = useMemo(
    () => (documentsState.data.length ? documentsState.data : (dashboard.documents || [])),
    [dashboard.documents, documentsState.data]
  );
  const submittedReviews = useMemo(() => dashboard.reviews || dashboard.submittedReviews || [], [dashboard.reviews, dashboard.submittedReviews]);
  const pendingReviews = useMemo(() => {
    if (Array.isArray(dashboard.pendingReviews) && dashboard.pendingReviews.length) return dashboard.pendingReviews;
    return projects.filter((project) => String(project.status).toLowerCase() === 'completed' && !project.reviewSubmitted);
  }, [dashboard.pendingReviews, projects]);
  const selectedConversation = useMemo(
    () => conversationsState.data.find((conversation) => conversation._id === selectedConversationId) || null,
    [conversationsState.data, selectedConversationId]
  );
  const unreadNotifications = useMemo(
    () => notifications.filter((item) => item.read === false || item.isRead === false).length,
    [notifications]
  );
  const unreadMessages = useMemo(
    () => (conversationsState.data || []).reduce((total, conversation) => total + (conversation.unreadCount || 0), 0),
    [conversationsState.data]
  );

  useEffect(() => {
    setProfileForm((current) => ({
      ...current,
      name: homeowner.name || '',
      email: homeowner.email || '',
      phone: homeowner.phone || '',
      smsNotifications: homeowner.smsNotifications !== false
    }));
    setSettingsForm({
      emailNotifications: homeowner.emailNotifications !== false,
      smsNotifications: homeowner.smsNotifications !== false
    });
  }, [homeowner.email, homeowner.emailNotifications, homeowner.name, homeowner.phone, homeowner.smsNotifications]);

  useEffect(() => {
    if (selectedProject && !selectedProjectId) {
      setSelectedProjectId(selectedProject.id || selectedProject._id);
    }
  }, [selectedProject, selectedProjectId]);

  const handleMarkRead = async (notification) => {
    setNotificationsState((prev) => ({
      ...prev,
      data: (prev.data.length ? prev.data : notifications).map((item) =>
        (item.id || item._id) === (notification.id || notification._id) ? { ...item, read: true, isRead: true } : item
      )
    }));
    try {
      await authFetch(`/api/notifications/${notification.id || notification._id}/read`, { method: 'POST' });
    } catch (error) {
      // Keep optimistic state.
    }
  };

  const handleMarkAllRead = async () => {
    setNotificationsState((prev) => ({
      ...prev,
      data: (prev.data.length ? prev.data : notifications).map((item) => ({ ...item, read: true, isRead: true })),
      loaded: true
    }));
    try {
      await authFetch('/api/notifications/read-all', { method: 'POST' });
    } catch (error) {
      // Keep optimistic state.
    }
  };

  const handleDocumentUpload = async (file) => {
    setActionError('');
    try {
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
      await loadDocuments();
    } catch (error) {
      setActionError(error.message);
    }
  };

  const handleDocumentDelete = async (document) => {
    if (!window.confirm(`Delete ${document.name || 'this document'}?`)) return;
    setActionError('');
    try {
      await authFetch(`/api/documents/${document.id || document._id}`, { method: 'DELETE' });
      await loadDocuments();
    } catch (error) {
      setActionError(error.message);
    }
  };

  const handleSendMessage = async (event) => {
    event.preventDefault();
    if (!selectedConversationId || !messageDraft.trim()) return;
    setSendingMessage(true);
    setActionError('');
    try {
      try {
        await authFetch('/api/messages', {
          method: 'POST',
          body: JSON.stringify({
            conversationId: selectedConversationId,
            recipientId: selectedConversation?.otherUser?._id,
            text: messageDraft.trim()
          })
        });
      } catch (error) {
        await authFetch('/api/conversations', {
          method: 'POST',
          body: JSON.stringify({
            recipientId: selectedConversation?.otherUser?._id,
            initialMessage: messageDraft.trim()
          })
        });
      }
      setMessageDraft('');
      await loadMessages(selectedConversationId);
      await loadConversations();
    } catch (error) {
      setActionError(error.message);
    } finally {
      setSendingMessage(false);
    }
  };

  const handleReviewSubmit = async (payload) => {
    await authFetch('/api/reviews', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
    setActiveReviewJob(null);
    await loadDashboard();
  };

  const handleProfileSave = async (event) => {
    event.preventDefault();
    setSavingProfile(true);
    setProfileSuccess('');
    setActionError('');
    try {
      await authFetch('/api/homeowner/profile', {
        method: 'PATCH',
        body: JSON.stringify(profileForm)
      });
      setProfileSuccess('Profile updated successfully.');
      await loadDashboard();
    } catch (error) {
      setActionError(error.message);
    } finally {
      setSavingProfile(false);
    }
  };

  const handleSettingsSave = async (event) => {
    event.preventDefault();
    setSavingSettings(true);
    setSettingsSuccess('');
    setActionError('');
    try {
      await authFetch('/api/homeowner/settings', {
        method: 'PATCH',
        body: JSON.stringify(settingsForm)
      });
      setSettingsSuccess('Settings saved.');
      await loadDashboard();
    } catch (error) {
      setActionError(error.message);
    } finally {
      setSavingSettings(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!window.confirm('Are you sure you want to delete your account? This cannot be undone.')) return;
    try {
      await authFetch('/api/homeowner/account', { method: 'DELETE' });
      localStorage.removeItem('fixlo_homeowner_token');
      logout();
      navigate('/login/homeowner');
    } catch (error) {
      setActionError(error.message);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('fixlo_homeowner_token');
    logout();
    navigate('/login/homeowner');
  };

  if (!getToken()) {
    return null;
  }

  if (dashboardState.loading) {
    return <LoadingState message="Loading homeowner dashboard..." />;
  }

  if (dashboardState.error) {
    return <ErrorState message={dashboardState.error} onRetry={loadDashboard} />;
  }

  const renderOverview = () => (
    <div className="space-y-6">
      <section className="rounded-3xl border border-emerald-100 bg-gradient-to-r from-emerald-600 to-emerald-500 px-6 py-7 text-white shadow-lg">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-50">Homeowner dashboard</p>
        <h2 className="mt-2 text-3xl font-extrabold">Welcome back, {homeowner.name || 'there'}.</h2>
        <p className="mt-2 max-w-2xl text-sm text-emerald-50">Track every Fixlo project, message professionals, manage documents, and stay on top of upcoming appointments.</p>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <SummaryCard label="Active Projects" value={dashboard.summary?.activeProjects ?? projects.filter((project) => getStatusFilterMatch(project, 'Active')).length} />
        <SummaryCard label="Completed Projects" value={dashboard.summary?.completedProjects ?? projects.filter((project) => String(project.status).toLowerCase() === 'completed').length} />
        <SummaryCard label="Upcoming Appointments" value={dashboard.summary?.upcomingAppointments ?? upcomingAppointments.length} />
        <SummaryCard label="Unread Messages" value={dashboard.summary?.unreadMessages ?? unreadMessages} />
        <SummaryCard label="Unread Notifications" value={dashboard.summary?.unreadNotifications ?? unreadNotifications} />
      </section>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-slate-900">Active projects</h3>
            <button type="button" onClick={() => setActiveTab('My Projects')} className="text-sm font-semibold text-emerald-600">View all</button>
          </div>
          <div className="mt-4 space-y-3">
            {projects.slice(0, 3).length ? projects.slice(0, 3).map((project) => (
              <button
                key={project.id || project._id}
                type="button"
                onClick={() => {
                  setSelectedProjectId(project.id || project._id);
                  setActiveTab('My Projects');
                }}
                className="w-full rounded-2xl border border-slate-200 p-4 text-left transition hover:border-emerald-200 hover:bg-emerald-50/40"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-slate-900">{project.trade || project.title || 'Project'}</p>
                    <p className="mt-1 text-sm text-slate-500">{project.description?.slice(0, 110) || 'No description provided.'}</p>
                  </div>
                  <StatusBadge status={project.status || 'pending'} />
                </div>
              </button>
            )) : <EmptyState title="No active projects" message="Request your first service to get started." />}
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-900">Upcoming appointments</h3>
              <button type="button" onClick={() => setActiveTab('Appointments')} className="text-sm font-semibold text-emerald-600">Calendar</button>
            </div>
            <div className="mt-4 space-y-3">
              {upcomingAppointments.slice(0, 3).length ? upcomingAppointments.slice(0, 3).map((appointment) => (
                <div key={appointment.id || appointment._id} className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
                  <p className="font-semibold text-slate-900">{appointment.title || appointment.type || 'Appointment'}</p>
                  <p className="mt-1 text-sm text-slate-500">{formatMessageTime(appointment.scheduledAt)}</p>
                </div>
              )) : <EmptyState title="No upcoming appointments" message="Appointments you schedule will appear here." />}
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-900">Recent notifications</h3>
              <button type="button" onClick={() => setActiveTab('Notifications')} className="text-sm font-semibold text-emerald-600">Open</button>
            </div>
            <div className="mt-4 space-y-3">
              {notifications.slice(0, 5).length ? notifications.slice(0, 5).map((notification) => (
                <div key={notification.id || notification._id} className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold text-slate-900">{notification.title || 'Notification'}</p>
                      <p className="mt-1 text-sm text-slate-500">{notification.message || notification.body}</p>
                    </div>
                    <span className="text-xs text-slate-400">{formatTimeAgo(notification.createdAt || notification.updatedAt)}</span>
                  </div>
                </div>
              )) : <EmptyState title="No notifications yet" message="Project updates will appear here." />}
            </div>
          </div>
        </div>
      </section>

      <section className="flex flex-wrap gap-3">
        <button type="button" onClick={() => navigate('/request')} className="rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white">Request New Service</button>
        <button type="button" onClick={() => navigate('/pros')} className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700">Find a Pro</button>
        <button type="button" onClick={() => setActiveTab('My Projects')} className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700">View All Projects</button>
      </section>
    </div>
  );

  const renderProjects = () => (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
      <div>
        <div className="mb-4 flex flex-wrap gap-2">
          {['All', 'Active', 'Completed', 'Pending'].map((filter) => (
            <button
              key={filter}
              type="button"
              onClick={() => setProjectFilter(filter)}
              className={`rounded-full px-3 py-1.5 text-sm font-semibold ${projectFilter === filter ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
            >
              {filter}
            </button>
          ))}
        </div>
        {filteredProjects.length ? (
          <div className="grid gap-4">
            {filteredProjects.map((project) => (
              <button
                key={project.id || project._id}
                type="button"
                onClick={() => setSelectedProjectId(project.id || project._id)}
                className={`rounded-3xl border p-5 text-left shadow-sm transition ${
                  (project.id || project._id) === (selectedProject?.id || selectedProject?._id)
                    ? 'border-emerald-300 bg-emerald-50'
                    : 'border-slate-200 bg-white hover:border-emerald-200'
                }`}
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h3 className="text-lg font-bold text-slate-900">{project.trade || project.title || 'Project'}</h3>
                    <p className="mt-1 text-sm text-slate-500">Created {project.createdAt ? new Date(project.createdAt).toLocaleDateString() : 'recently'}</p>
                    <p className="mt-3 text-sm text-slate-600">{project.description?.slice(0, 140) || 'No project description available yet.'}</p>
                    <p className="mt-3 text-sm text-slate-500">Assigned pro: <span className="font-medium text-slate-700">{project.assignedPro?.name || project.proName || 'Not assigned yet'}</span></p>
                  </div>
                  <StatusBadge status={project.status || 'pending'} />
                </div>
              </button>
            ))}
          </div>
        ) : (
          <EmptyState
            title="No projects yet"
            message="Request a new service and your projects will appear here."
            action={<button type="button" onClick={() => navigate('/request')} className="dashboard-btn">Request Service</button>}
          />
        )}
      </div>

      <aside className="space-y-4">
        {selectedProject ? (
          <>
            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-slate-500">Project details</p>
                  <h3 className="mt-1 text-xl font-bold text-slate-900">{selectedProject.trade || selectedProject.title}</h3>
                </div>
                <StatusBadge status={selectedProject.status || 'pending'} />
              </div>
              <div className="mt-4 space-y-3 text-sm text-slate-600">
                <p>{selectedProject.description || 'No description provided.'}</p>
                <p><span className="font-semibold text-slate-900">Created:</span> {selectedProject.createdAt ? new Date(selectedProject.createdAt).toLocaleString() : '—'}</p>
                <p><span className="font-semibold text-slate-900">Assigned pro:</span> {selectedProject.assignedPro?.name || selectedProject.proName || 'Pending assignment'}</p>
                {selectedProject.assignedPro?.phone ? <p><span className="font-semibold text-slate-900">Phone:</span> {selectedProject.assignedPro.phone}</p> : null}
              </div>
            </div>
            <ProjectTimeline events={selectedProject.timeline || selectedProject.events || []} />
          </>
        ) : (
          <EmptyState title="Select a project" message="Choose a project to view the full timeline." />
        )}
      </aside>
    </div>
  );

  const renderAppointments = () => (
    <div className="space-y-6">
      {appointmentsState.error && !appointmentsState.data.length ? (
        <ErrorState message={appointmentsState.error} onRetry={loadAppointments} />
      ) : (
        <CalendarView
          appointments={upcomingAppointments}
          loading={appointmentsState.loading}
          onCreateAppointment={() => navigate('/request?intent=schedule')}
        />
      )}
      <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-slate-900">Upcoming appointments</h3>
          <button type="button" onClick={() => navigate('/request?intent=schedule')} className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white">Schedule Appointment</button>
        </div>
        <div className="mt-4 space-y-3">
          {upcomingAppointments.length ? upcomingAppointments.map((appointment) => (
            <div key={appointment.id || appointment._id} className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-semibold text-slate-900">{appointment.title || appointment.type || 'Appointment'}</p>
                  <p className="mt-1 text-sm text-slate-500">{formatMessageTime(appointment.scheduledAt)}</p>
                </div>
                <StatusBadge status={appointment.status || 'scheduled'} />
              </div>
            </div>
          )) : <EmptyState title="No appointments scheduled" message="Use the calendar above to schedule one." />}
        </div>
      </div>
    </div>
  );

  const renderMessages = () => (
    <section className="grid gap-4 xl:grid-cols-[320px_minmax(0,1fr)]">
      <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-slate-900">Conversations</h3>
        </div>
        {conversationsState.loading ? (
          <LoadingState message="Loading conversations..." />
        ) : conversationsState.error ? (
          <ErrorState message={conversationsState.error} onRetry={loadConversations} />
        ) : conversationsState.data.length ? (
          <div className="mt-4 grid gap-2">
            {conversationsState.data.map((conversation) => (
              <button
                key={conversation._id}
                type="button"
                onClick={() => setSelectedConversationId(conversation._id)}
                className={`rounded-2xl border px-4 py-3 text-left ${selectedConversationId === conversation._id ? 'border-emerald-300 bg-emerald-50' : 'border-slate-200 hover:border-slate-300'}`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-slate-900">{conversation.otherUser?.name || 'Conversation'}</p>
                    <p className="mt-1 text-sm text-slate-500">{conversation.lastMessage?.text || conversation.lastMessage?.message || 'No messages yet'}</p>
                  </div>
                  {conversation.unreadCount ? <span className="rounded-full bg-emerald-600 px-2 py-0.5 text-xs font-bold text-white">{conversation.unreadCount}</span> : null}
                </div>
              </button>
            ))}
          </div>
        ) : (
          <EmptyState title="No conversations yet" message="When a pro messages you, it will appear here." />
        )}
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
        <h3 className="text-lg font-bold text-slate-900">{selectedConversation?.otherUser?.name || 'Message thread'}</h3>
        {messagesState.loading ? (
          <LoadingState message="Loading messages..." />
        ) : messagesState.error ? (
          <ErrorState message={messagesState.error} onRetry={() => loadMessages(selectedConversationId)} />
        ) : selectedConversationId ? (
          <>
            <div className="mt-4 grid max-h-[440px] gap-3 overflow-y-auto">
              {messagesState.data.length ? messagesState.data.map((message) => {
                const mine = message.senderId === homeowner.id || message.senderId === homeowner._id || message.senderId === user?._id;
                return (
                  <div key={message._id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm ${mine ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-800'}`}>
                      <p>{message.text || message.message}</p>
                      <p className={`mt-1 text-[11px] ${mine ? 'text-emerald-100' : 'text-slate-400'}`}>{formatMessageTime(message.createdAt)}</p>
                    </div>
                  </div>
                );
              }) : <EmptyState title="No messages yet" message="Say hello to start the conversation." />}
            </div>
            <form onSubmit={handleSendMessage} className="mt-4 flex gap-3">
              <input
                value={messageDraft}
                onChange={(event) => setMessageDraft(event.target.value)}
                className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-emerald-300 focus:ring-2 focus:ring-emerald-100"
                placeholder="Type your message..."
              />
              <button type="submit" disabled={sendingMessage || !messageDraft.trim()} className="rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60">
                {sendingMessage ? 'Sending...' : 'Send'}
              </button>
            </form>
          </>
        ) : (
          <EmptyState title="Select a conversation" message="Choose a conversation to see your messages." />
        )}
      </div>
    </section>
  );

  const renderNotifications = () => (
    notificationsState.error && !notificationsState.data.length ? (
      <ErrorState message={notificationsState.error} onRetry={loadNotifications} />
    ) : (
      <NotificationCenter
        expanded
        notifications={notifications}
        unreadCount={unreadNotifications}
        onMarkRead={handleMarkRead}
        onMarkAllRead={handleMarkAllRead}
        loading={notificationsState.loading}
      />
    )
  );

  const renderDocuments = () => (
    documentsState.error && !documentsState.data.length ? (
      <ErrorState message={documentsState.error} onRetry={loadDocuments} />
    ) : (
      <DocumentCenter
        documents={documents}
        loading={documentsState.loading}
        onUpload={handleDocumentUpload}
        onDelete={handleDocumentDelete}
        onPreview={(document) => {
          const url = document.url || document.secureUrl || document.secure_url;
          if (url) window.open(url, '_blank', 'noopener,noreferrer');
        }}
      />
    )
  );

  const renderReviews = () => (
    <div className="space-y-6">
      <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
        <h3 className="text-lg font-bold text-slate-900">Pending reviews</h3>
        <div className="mt-4 space-y-3">
          {pendingReviews.length ? pendingReviews.map((reviewItem) => (
            <div key={reviewItem.id || reviewItem._id} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
              <div>
                <p className="font-semibold text-slate-900">{reviewItem.trade || reviewItem.title || 'Completed job'}</p>
                <p className="mt-1 text-sm text-slate-500">Completed by {reviewItem.assignedPro?.name || reviewItem.proName || 'your pro'}</p>
              </div>
              <button type="button" onClick={() => setActiveReviewJob(reviewItem)} className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white">
                Leave Review
              </button>
            </div>
          )) : <EmptyState title="No pending reviews" message="You are all caught up." />}
        </div>
      </div>

      {activeReviewJob ? (
        <ReviewForm
          proId={activeReviewJob.assignedPro?._id || activeReviewJob.proId}
          jobId={activeReviewJob._id || activeReviewJob.id}
          proName={activeReviewJob.assignedPro?.name || activeReviewJob.proName}
          onSubmit={handleReviewSubmit}
          onCancel={() => setActiveReviewJob(null)}
        />
      ) : null}

      <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
        <h3 className="text-lg font-bold text-slate-900">Past reviews</h3>
        <div className="mt-4 space-y-3">
          {submittedReviews.length ? submittedReviews.map((review) => (
            <div key={review.id || review._id} className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-semibold text-slate-900">{review.proName || review.professionalName || 'Professional review'}</p>
                  <p className="mt-1 text-sm text-slate-500">{review.review || review.comment || 'No written review.'}</p>
                </div>
                <span className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-700">{review.rating || review.overallRating || 0}/5</span>
              </div>
            </div>
          )) : <EmptyState title="No reviews submitted yet" message="Completed jobs ready for feedback will appear above." />}
        </div>
      </div>
    </div>
  );

  const renderProfile = () => (
    <form onSubmit={handleProfileSave} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="border-b border-slate-100 pb-4">
        <h3 className="text-lg font-bold text-slate-900">Profile</h3>
      </div>
      <div className="mt-5 grid gap-4 md:grid-cols-2">
        {[
          ['name', 'Name'],
          ['email', 'Email'],
          ['phone', 'Phone']
        ].map(([key, label]) => (
          <div key={key}>
            <label className="block text-sm font-semibold text-slate-700">{label}</label>
            <input
              type={key === 'email' ? 'email' : 'text'}
              value={profileForm[key]}
              onChange={(event) => setProfileForm((current) => ({ ...current, [key]: event.target.value }))}
              className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-emerald-300 focus:ring-2 focus:ring-emerald-100"
            />
          </div>
        ))}
        <div>
          <label className="block text-sm font-semibold text-slate-700">Current password</label>
          <input
            type="password"
            value={profileForm.password}
            onChange={(event) => setProfileForm((current) => ({ ...current, password: event.target.value }))}
            className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-emerald-300 focus:ring-2 focus:ring-emerald-100"
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-slate-700">New password</label>
          <input
            type="password"
            value={profileForm.newPassword}
            onChange={(event) => setProfileForm((current) => ({ ...current, newPassword: event.target.value }))}
            className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-emerald-300 focus:ring-2 focus:ring-emerald-100"
          />
        </div>
      </div>
      <label className="mt-4 inline-flex items-center gap-2 text-sm text-slate-700">
        <input
          type="checkbox"
          checked={profileForm.smsNotifications}
          onChange={(event) => setProfileForm((current) => ({ ...current, smsNotifications: event.target.checked }))}
          className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
        />
        Enable SMS notifications
      </label>
      {profileSuccess ? <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{profileSuccess}</div> : null}
      <div className="mt-5 flex justify-end">
        <button type="submit" disabled={savingProfile} className="rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60">
          {savingProfile ? 'Saving...' : 'Save Profile'}
        </button>
      </div>
    </form>
  );

  const renderSettings = () => (
    <form onSubmit={handleSettingsSave} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="border-b border-slate-100 pb-4">
        <h3 className="text-lg font-bold text-slate-900">Settings</h3>
      </div>
      <div className="mt-5 space-y-4">
        <label className="flex items-center justify-between rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-700">
          <span>Email notifications</span>
          <input
            type="checkbox"
            checked={settingsForm.emailNotifications}
            onChange={(event) => setSettingsForm((current) => ({ ...current, emailNotifications: event.target.checked }))}
            className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
          />
        </label>
        <label className="flex items-center justify-between rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-700">
          <span>SMS notifications</span>
          <input
            type="checkbox"
            checked={settingsForm.smsNotifications}
            onChange={(event) => setSettingsForm((current) => ({ ...current, smsNotifications: event.target.checked }))}
            className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
          />
        </label>
      </div>
      {settingsSuccess ? <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{settingsSuccess}</div> : null}
      <div className="mt-6 flex flex-wrap justify-between gap-3">
        <button type="button" onClick={handleDeleteAccount} className="rounded-xl border border-red-200 px-4 py-2.5 text-sm font-semibold text-red-600">
          Delete Account
        </button>
        <button type="submit" disabled={savingSettings} className="rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60">
          {savingSettings ? 'Saving...' : 'Save Settings'}
        </button>
      </div>
    </form>
  );

  const tabContent = {
    Overview: renderOverview(),
    'My Projects': renderProjects(),
    Appointments: renderAppointments(),
    Messages: renderMessages(),
    Notifications: renderNotifications(),
    Documents: renderDocuments(),
    Reviews: renderReviews(),
    Profile: renderProfile(),
    Settings: renderSettings()
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-24 lg:pb-8">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="grid gap-6 lg:grid-cols-[260px_minmax(0,1fr)]">
          <aside className="hidden rounded-3xl bg-slate-900 p-5 text-slate-100 shadow-xl lg:block">
            <div className="mb-6">
              <p className="text-xs font-semibold uppercase tracking-[0.25em] text-emerald-300">Fixlo</p>
              <h1 className="mt-2 text-2xl font-extrabold">Homeowner</h1>
              <p className="mt-1 text-sm text-slate-300">{homeowner.name || homeowner.email || 'Dashboard'}</p>
            </div>
            <nav className="grid gap-2">
              {TABS.map((tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setActiveTab(tab)}
                  className={`rounded-2xl px-4 py-3 text-left text-sm font-semibold transition ${
                    activeTab === tab ? 'bg-emerald-500 text-white' : 'text-slate-200 hover:bg-white/10'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </nav>
          </aside>

          <main className="min-w-0 space-y-6">
            <header className="flex flex-col gap-4 rounded-3xl border border-slate-200 bg-white px-5 py-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-semibold text-slate-500">{activeTab}</p>
                <h2 className="text-2xl font-bold text-slate-900">Manage your home services</h2>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <NotificationCenter
                  notifications={notifications}
                  unreadCount={unreadNotifications}
                  loading={notificationsState.loading}
                  onMarkRead={handleMarkRead}
                  onMarkAllRead={handleMarkAllRead}
                />
                <button type="button" onClick={handleLogout} className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700">
                  Log Out
                </button>
              </div>
            </header>

            {actionError ? <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{actionError}</div> : null}
            {tabContent[activeTab]}
          </main>
        </div>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-20 border-t border-slate-200 bg-white/95 p-2 backdrop-blur lg:hidden">
        <div className="flex gap-2 overflow-x-auto">
          {TABS.map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={`whitespace-nowrap rounded-full px-3 py-2 text-xs font-semibold ${
                activeTab === tab ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-600'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
