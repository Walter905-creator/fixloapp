# Meta Lead Automation (Instagram + Facebook Lead Ads)

## What was added

### Database models
- `server/models/MetaLead.js`
  - Stores Meta lead profile, campaign attribution, invitation code details, SMS/email status, registration status, recruiter assignment, and follow-up state.
- `server/models/MetaLeadEvent.js`
  - Stores full lead activity timeline (capture, follow-ups, delivery events, replies, registration, redemption, admin actions).

### API & webhook routes
- `server/routes/metaLeadAutomation.js`

#### Meta webhook
- `GET /webhook/meta-leads`
  - Meta verification handshake (`hub.challenge`).
- `POST /webhook/meta-leads`
  - Receives Meta lead notifications.
  - Verifies `X-Hub-Signature-256` using `META_APP_SECRET`.
  - Fetches full lead details via Graph API.
  - Prevents duplicates by unique `metaLeadId`.

#### Twilio webhooks
- `POST /webhook/twilio/meta-leads/status`
  - Tracks SMS delivery lifecycle: queued/sent/delivered/failed/undelivered.
- `POST /webhook/twilio/meta-leads/inbound`
  - Tracks inbound replies.
  - Handles STOP/STOPALL/UNSUBSCRIBE/CANCEL/END and START/YES/UNSTOP.

#### SendGrid webhook
- `POST /webhook/sendgrid/meta-leads/events`
  - Tracks email events: processed/delivered/open/click/bounce/unsubscribe.

#### Admin APIs
- `GET /api/admin/meta-leads/dashboard`
- `GET /api/admin/meta-leads`
- `GET /api/admin/meta-leads/:id`
- `GET /api/admin/meta-leads/settings`
- `POST /api/admin/meta-leads/settings`
- `POST /api/admin/meta-leads/:id/actions/:action`
  - `resend-sms`, `resend-email`, `pause`, `resume`, `mark-closed`, `assign-recruiter`, `add-note`
- `POST /api/admin/meta-leads/jobs/followups/run`
- `POST /api/admin/meta-leads/jobs/reconcile/run`
- `POST /api/admin/meta-leads/jobs/meta-reconcile/run`
  - Discovers active page forms automatically, or validates `formId` / `formIds` before reconciling.

### Scheduler jobs
Added in `server/services/scheduledTasks.js`:
- `meta-lead-followup-cycle` (every 5 minutes)
  - Sends due reminders at configured intervals.
- `meta-lead-registration-reconcile` (every 15 minutes)
  - Detects registration/subscription/invitation redemption and stops follow-ups automatically.
- `meta-full-reconcile` (every 15 minutes)
  - Discovers/validates all active accessible forms for the configured page.
  - Ignores stale configured forms without blocking valid forms.
  - Reconciles recent leads across every active form and records results per form.

### Admin dashboard pages
- `client/src/routes/AdminLeadAutomationPage.jsx`
  - Lead automation analytics, filters, run-now controls, and settings editor.
- `client/src/routes/AdminLeadAutomationDetailPage.jsx`
  - Lead detail with timeline, SMS/email history, invitation code, registration status, notes, and manual actions.
- Added routes in `client/src/App.jsx`:
  - `/dashboard/admin/lead-automation`
  - `/dashboard/admin/lead-automation/:leadId`

## Required environment variables

Set in backend environment (see `server/.env.example`):

- `META_WEBHOOK_VERIFY_TOKEN`
- `META_APP_SECRET`
- `META_PAGE_ACCESS_TOKEN` (single page) OR `META_PAGE_ACCESS_TOKENS` (JSON map for multiple pages)
- `META_PAGE_ID` (required for scheduled form discovery/validation)
- `META_GRAPH_API_VERSION` (optional, defaults to `v20.0`)
- `META_LEAD_FORM_IDS` (optional comma-separated allowlist; each ID is validated against the page before use)
- `META_LEAD_SMS_STATUS_CALLBACK_URL` (optional override)
- `SERVER_BASE_URL` (optional callback URL base)
- `PRO_SIGNUP_URL` (optional template URL, default `https://fixloapp.com/pros`)
- Existing required integrations:
  - Twilio: `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_PHONE_NUMBER`
  - SendGrid: `SENDGRID_API_KEY`, `SENDGRID_FROM_EMAIL`

## Meta webhook configuration

In Meta App Dashboard:
1. Add webhook subscription for **Page** object.
2. Callback URL: `https://<your-backend>/webhook/meta-leads`
3. Verify token: `META_WEBHOOK_VERIFY_TOKEN`
4. Subscribe to lead fields (`leadgen`).
5. Ensure app has permissions to read Lead Ads and page access token is long-lived.

## Twilio webhook configuration

For the Twilio sending number:
- **Status callback URL**: `https://<your-backend>/webhook/twilio/meta-leads/status`
- **Inbound message webhook URL**: `https://<your-backend>/webhook/twilio/meta-leads/inbound`

## SendGrid event webhook configuration

In SendGrid Event Webhook:
- URL: `https://<your-backend>/webhook/sendgrid/meta-leads/events`
- Enable events: processed, delivered, open, click, bounce, dropped, deferred, unsubscribe.

## Default SMS templates

- Immediate welcome
- Reminder #1 (24h)
- Reminder #2 (3d)
- Reminder #3 (7d)
- Final reminder (14d)
- Unsubscribed confirmation
- Resubscribe confirmation

All templates are configurable in `/dashboard/admin/lead-automation`.

## Default email templates

- Immediate welcome email (benefits + invitation code + signup link)
- Reminder email (invitation code + signup link)

All templates are configurable in `/dashboard/admin/lead-automation`.

## Testing checklist

1. Meta webhook verification succeeds (`GET /webhook/meta-leads`).
2. Meta lead webhook creates one `MetaLead` record with campaign/form fields.
3. Duplicate webhook does not create duplicate lead.
4. Invitation code generated in `FIXLO-XXXXXXXX` format and linked to lead.
5. Immediate SMS and email are sent and logged.
6. Follow-up scheduler sends reminders at configured steps.
7. STOP keyword stops sequence and sends unsubscribe message.
8. START keyword resumes when eligible.
9. Twilio status updates lead SMS history/status.
10. SendGrid events update email history/status.
11. Registration reconciliation stops sequence when account is created.
12. Invitation redemption stops sequence and logs timeline event.
13. Dashboard metrics update totals/rates/analytics.
14. Manual actions (resend/pause/resume/close/assign/note) work from lead detail page.

## Production deployment notes

1. Deploy backend changes first (new models/routes/scheduler).
2. Configure all environment variables in Render.
3. Register webhooks in Meta, Twilio, and SendGrid.
4. Deploy frontend to Vercel.
5. Validate end-to-end using real Meta test leads.
6. Confirm cron jobs are running from scheduler logs.
7. Confirm owner/admin notifications are received for new lead and conversion events.
