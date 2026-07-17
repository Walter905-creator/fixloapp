'use strict';

/**
 * FGA Event Types — canonical list of every internal platform event.
 *
 * Every module publishes and subscribes using these constants so that
 * typos are caught at load-time rather than at runtime.
 */

const FGA_EVENTS = {
  // ── Lead lifecycle ────────────────────────────────────────────────────────
  LEAD_CREATED:              'LeadCreated',
  LEAD_UPDATED:              'LeadUpdated',
  LEAD_ASSIGNED:             'LeadAssigned',
  LEAD_VIEWED:               'LeadViewed',
  LEAD_ACCEPTED:             'LeadAccepted',
  LEAD_DECLINED:             'LeadDeclined',
  LEAD_EXPIRED:              'LeadExpired',
  LEAD_MERGED:               'LeadMerged',
  LEAD_DEACTIVATED:          'LeadDeactivated',

  // ── Registration ──────────────────────────────────────────────────────────
  REGISTRATION_STARTED:      'RegistrationStarted',
  REGISTRATION_COMPLETED:    'RegistrationCompleted',
  PHONE_VERIFIED:            'PhoneVerified',
  EMAIL_VERIFIED:            'EmailVerified',

  // ── Background checks ─────────────────────────────────────────────────────
  BACKGROUND_CHECK_REQUESTED: 'BackgroundCheckRequested',
  BACKGROUND_CHECK_COMPLETED: 'BackgroundCheckCompleted',
  BACKGROUND_CHECK_PASSED:    'BackgroundCheckPassed',
  BACKGROUND_CHECK_FAILED:    'BackgroundCheckFailed',

  // ── Subscriptions & payments ─────────────────────────────────────────────
  SUBSCRIPTION_PURCHASED:    'SubscriptionPurchased',
  SUBSCRIPTION_RENEWED:      'SubscriptionRenewed',
  SUBSCRIPTION_CANCELLED:    'SubscriptionCancelled',
  SUBSCRIPTION_PAUSED:       'SubscriptionPaused',
  PAYMENT_FAILED:            'PaymentFailed',
  QUOTE_PURCHASED:           'QuotePurchased',

  // ── Jobs ──────────────────────────────────────────────────────────────────
  JOB_CREATED:               'JobCreated',
  JOB_ASSIGNED:              'JobAssigned',
  JOB_STARTED:               'JobStarted',
  JOB_COMPLETED:             'JobCompleted',
  JOB_CANCELLED:             'JobCancelled',

  // ── Reviews ───────────────────────────────────────────────────────────────
  REVIEW_SUBMITTED:          'ReviewSubmitted',

  // ── Referrals & recruiters ────────────────────────────────────────────────
  REFERRAL_CREATED:          'ReferralCreated',
  REFERRAL_CONVERTED:        'ReferralConverted',
  RECRUITER_CREATED:         'RecruiterCreated',
  COMMISSION_EARNED:         'CommissionEarned',

  // ── Notifications ─────────────────────────────────────────────────────────
  OWNER_NOTIFICATION_REQUESTED: 'OwnerNotificationRequested',

  // ── Communication events ──────────────────────────────────────────────────
  EMAIL_SENT:                'EmailSent',
  EMAIL_OPENED:              'EmailOpened',
  EMAIL_CLICKED:             'EmailClicked',
  EMAIL_BOUNCED:             'EmailBounced',
  SMS_SENT:                  'SmsSent',
  SMS_DELIVERED:             'SmsDelivered',
  SMS_FAILED:                'SmsFailed',

  // ── Automation ───────────────────────────────────────────────────────────
  AUTOMATION_TRIGGERED:      'AutomationTriggered',
  AUTOMATION_FAILED:         'AutomationFailed',

  // ── System ────────────────────────────────────────────────────────────────
  SYSTEM_ERROR:              'SystemError',
};

module.exports = FGA_EVENTS;
