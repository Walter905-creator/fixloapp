/**
 * FGE API client helper
 * All requests include the admin JWT stored in localStorage.
 */

// VITE_API_URL must be set in .env for local development (e.g. http://localhost:3001).
// The production URL is used as fallback for deployed builds where the env var may be absent.
const API_BASE = import.meta.env.VITE_API_URL || 'https://fixloapp.onrender.com';
const FGE_BASE = `${API_BASE}/api/fge`;

function getAdminToken() {
  return localStorage.getItem('fixlo_token') || '';
}

function headers(extra = {}) {
  const token = getAdminToken();
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: 'Bearer ' + token } : {}),
    ...extra,
  };
}

async function request(method, path, body) {
  const opts = { method, headers: headers() };
  if (body !== undefined) opts.body = JSON.stringify(body);
  const res = await fetch(`${FGE_BASE}${path}`, opts);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || data.message || `HTTP ${res.status}`);
  return data;
}

// ─── Convenience wrappers ────────────────────────────────────────────────────

export const fgeApi = {
  get:    (path)          => request('GET', path),
  post:   (path, body)    => request('POST', path, body),
  put:    (path, body)    => request('PUT', path, body),
  delete: (path)          => request('DELETE', path),

  // Growth
  getGrowthSummary:  ()       => request('GET', '/growth/summary'),
  getGrowthHealth:   ()       => request('GET', '/growth/health'),

  // Marketing
  generateContent:   (body)   => request('POST', '/marketing/generate', body),
  getCampaigns:      (params) => request('GET', `/marketing/campaigns?${new URLSearchParams(params || {})}`),
  createCampaign:    (body)   => request('POST', '/marketing/campaign', body),
  updateCampaign:    (id, b)  => request('PUT',  `/marketing/campaigns/${id}`, b),
  deleteCampaign:    (id)     => request('DELETE', `/marketing/campaigns/${id}`),
  publishCampaign:   (id, b)  => request('POST',  `/marketing/campaigns/${id}/publish`, b),
  generateImage:     (body)   => request('POST', '/marketing/image', body),

  // SEO
  generatePage:      (body)   => request('POST', '/seo/generate', body),
  batchSeoPages:     (body)   => request('POST', '/seo/batch', body),
  getSeoPages:       (params) => request('GET', `/seo/pages?${new URLSearchParams(params || {})}`),
  getSeoPage:        (id)     => request('GET', `/seo/pages/${id}`),
  updateSeoPage:     (id, b)  => request('PUT',  `/seo/pages/${id}`, b),
  deleteSeoPage:     (id)     => request('DELETE', `/seo/pages/${id}`),
  triggerSitemap:    ()       => request('POST', '/seo/sitemap'),
  getSeoJobs:        ()       => request('GET', '/seo/jobs'),

  // Blog
  generateBlog:      (body)   => request('POST', '/blog/generate', body),
  getBlogs:          (params) => request('GET', `/blog?${new URLSearchParams(params || {})}`),
  createBlog:        (body)   => request('POST', '/blog', body),
  updateBlog:        (id, b)  => request('PUT',  `/blog/${id}`, b),
  deleteBlog:        (id)     => request('DELETE', `/blog/${id}`),
  publishBlog:       (id, b)  => request('POST',  `/blog/${id}/publish`, b),

  // Email
  getEmailTemplates: ()       => request('GET', '/email/templates'),
  createEmailTemplate:(body)  => request('POST', '/email/templates', body),
  updateEmailTemplate:(id,b)  => request('PUT', `/email/templates/${id}`, b),
  deleteEmailTemplate:(id)    => request('DELETE', `/email/templates/${id}`),
  generateEmail:     (body)   => request('POST', '/email/generate', body),
  sendEmail:         (body)   => request('POST', '/email/send', body),

  // SMS
  getSmsTemplates:   ()       => request('GET', '/sms/templates'),
  createSmsTemplate: (body)   => request('POST', '/sms/templates', body),
  updateSmsTemplate: (id, b)  => request('PUT', `/sms/templates/${id}`, b),
  deleteSmsTemplate: (id)     => request('DELETE', `/sms/templates/${id}`),
  generateSms:       (body)   => request('POST', '/sms/generate', body),
  sendSms:           (body)   => request('POST', '/sms/send', body),

  // Analytics
  getAnalyticsSnapshot: ()    => request('GET', '/analytics/snapshot'),
  getAnalyticsRange: (p)      => request('GET', `/analytics/range?${new URLSearchParams(p)}`),
  getTopCities:      (p)      => request('GET', `/analytics/top-cities?${new URLSearchParams(p || {})}`),
  getTopServices:    (p)      => request('GET', `/analytics/top-services?${new URLSearchParams(p || {})}`),

  // Insights
  getInsightsToday:  ()       => request('GET', '/insights/today'),
  getInsightsHistory:()       => request('GET', '/insights/history'),
  generateInsights:  (body)   => request('POST', '/insights/generate', body),

  // Reviews
  getReviewsAdmin:   ()       => request('GET', '/reviews/admin'),
  requestReview:     (body)   => request('POST', '/reviews/request', body),
  approveReview:     (id)     => request('PUT', `/reviews/${id}/approve`),
  rejectReview:      (id)     => request('PUT', `/reviews/${id}/reject`),

  // Seasonal
  getCurrentSeason:  ()       => request('GET', '/seasonal/current'),
  generateSeasonal:  (body)   => request('POST', '/seasonal/generate', body),

  // Referral
  getReferralOverview: ()     => request('GET', '/referral/overview'),
  getReferralLeaderboard: ()  => request('GET', '/referral/leaderboard'),

  // Settings
  getSettings:       ()       => request('GET', '/settings'),
  updateSettings:    (body)   => request('PUT', '/settings', body),
  testConnection:    (svc)    => request('POST', `/settings/test/${svc}`),

  // Queue
  getQueueStats:     ()       => request('GET', '/queue/stats'),
  getQueueJobs:      (p)      => request('GET', `/queue/jobs?${new URLSearchParams(p || {})}`),
  retryJob:          (id)     => request('POST', `/queue/retry/${id}`),
  deleteJob:         (id)     => request('DELETE', `/queue/jobs/${id}`),
};
