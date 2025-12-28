# WhatsApp Notifications Implementation

This document describes the WhatsApp notification feature for international professionals on Fixlo.

## Overview

Fixlo now supports WhatsApp notifications for international (non-US) professionals, while maintaining SMS notifications for USA professionals. This is an **additive feature** that does not modify or break existing SMS functionality.

## Critical Rules (COMPLIANCE)

1. **USA professionals**: Continue to use SMS + Email exactly as before
2. **Non-US professionals**: Can opt-in to WhatsApp + Email notifications
3. **All WhatsApp messages**: Require explicit user opt-in
4. **Message type**: Transactional only (job leads), no marketing
5. **Opt-out**: Users can reply "STOP" to unsubscribe at any time

## Architecture

### Channel Routing Logic

```javascript
if (country === "US") {
  // USA professionals (EXISTING BEHAVIOR - UNCHANGED)
  if (pro.smsConsent) sendSMSviaTwilio();
  sendEmail();
} else {
  // International professionals (NEW FEATURE)
  if (pro.whatsappOptIn) sendWhatsAppViaTwilio();
  sendEmail();  // Always send as fallback
}
```

### Database Schema

Added to `Pro` model:
- `whatsappOptIn`: Boolean (default: false) - WhatsApp consent flag
- `country`: String (default: 'US') - ISO 3166-1 alpha-2 country code

### Backend Services

#### 1. `server/utils/twilio.js`
- `sendSms()` - Existing SMS function (unchanged)
- `sendWhatsAppMessage()` - NEW: Send WhatsApp via Twilio
- `isUSPhoneNumber()` - Detect US phone numbers

#### 2. `server/utils/email.js`
- `sendPasswordResetEmail()` - Existing (unchanged)
- `sendLeadNotificationEmail()` - NEW: Email notification for leads

#### 3. `server/utils/notifications.js` (NEW)
- `notifyProOfLead()` - Central notification routing
- Implements country-based channel selection
- Handles graceful fallbacks
- Comprehensive logging

### Frontend Components

#### 1. Pro Signup (`client/src/routes/ProSignupPage.jsx`)
- Detects user's country via `/api/country/detect`
- **US users**: See SMS opt-in checkbox (existing)
- **Non-US users**: See WhatsApp opt-in checkbox (new)
- Conditional UI based on detected country

#### 2. Pro Dashboard (`client/src/routes/ProDashboardPage.jsx`)
- "Notification Settings" panel
- Toggle WhatsApp opt-in (non-US only)
- Toggle job notifications on/off
- Real-time updates via PATCH `/api/pros/settings`

### API Endpoints

#### POST `/api/pros/register`
- Accepts `whatsappOptIn` and `country` fields
- Validates WhatsApp opt-in only for non-US countries
- Auto-detects country from phone if not provided

#### PATCH `/api/pros/settings` (NEW)
- Updates notification preferences
- Enforces USA = no WhatsApp compliance
- Returns updated preferences

#### GET `/api/pros/dashboard`
- Returns pro data including notification preferences
- Includes `country`, `whatsappOptIn`, `smsConsent`, `wantsNotifications`

## WhatsApp Message Template

Template name: `new_lead_alert`

```
🔔 New job lead on Fixlo

Service: {{1}}
Location: {{2}}
Budget: {{3}}

Log in to your Fixlo account to view details and contact the customer.
```

Sent via Twilio API:
```javascript
from: 'whatsapp:+TWILIO_WHATSAPP_NUMBER'
to: 'whatsapp:+USER_PHONE'
```

## Environment Variables

Add to `.env`:
```bash
# Twilio WhatsApp Configuration (for international pros)
TWILIO_WHATSAPP_NUMBER=whatsapp:+14155238886

# SendGrid Email Configuration (for all pros)
SENDGRID_API_KEY=your_sendgrid_api_key
SENDGRID_FROM_EMAIL=noreply@fixloapp.com
```

## Testing

Run manual tests:
```bash
cd server
node test-notifications.js
```

This validates:
- ✅ Phone number detection (US vs International)
- ✅ Notification routing logic
- ✅ Opt-in enforcement
- ✅ USA SMS unchanged
- ✅ Compliance rules

## Safety Guarantees

1. **No breaking changes**: USA SMS logic untouched
2. **Opt-in enforced**: WhatsApp never sent without consent
3. **Graceful failures**: If WhatsApp fails, email still sends
4. **Country detection**: Automatic fallback to US if detection fails
5. **Logging**: Comprehensive logs for debugging and compliance audits

## Security & Compliance

- **TCPA Compliance**: Explicit opt-in required before any WhatsApp messages
- **Transactional only**: No marketing messages, only job notifications
- **Opt-out mechanism**: Users can reply "STOP" to unsubscribe
- **Data privacy**: Country detection respects user privacy
- **Rate limiting**: Handled by Twilio API limits

## Deployment Checklist

- [ ] Set `TWILIO_WHATSAPP_NUMBER` in production environment
- [ ] Set `SENDGRID_API_KEY` in production environment
- [ ] Verify Twilio WhatsApp sender is approved
- [ ] Test with real international phone numbers
- [ ] Monitor logs for notification delivery rates
- [ ] Update privacy policy to mention WhatsApp notifications
- [ ] Train support team on WhatsApp opt-in process

## Monitoring & Metrics

Key metrics to track:
- WhatsApp opt-in rate (non-US pros)
- WhatsApp delivery success rate
- Email fallback usage rate
- Opt-out rate (STOP replies)
- Channel preference by country

Logs to monitor:
- `✅ WhatsApp sent to...` - Successful WhatsApp delivery
- `❌ WhatsApp failed to...` - Failed WhatsApp (check Twilio errors)
- `✅ Email notification sent...` - Email fallback working
- `📊 Notification summary...` - Delivery statistics per lead

## Troubleshooting

### WhatsApp not sending
1. Check `TWILIO_WHATSAPP_NUMBER` is set correctly
2. Verify Twilio account has WhatsApp enabled
3. Confirm pro has `whatsappOptIn: true`
4. Check pro's `country` is not 'US'
5. Review Twilio logs for API errors

### USA users seeing WhatsApp option
1. Check `/api/country/detect` endpoint
2. Verify frontend country detection logic
3. Ensure phone number format includes country code
4. Check Pro model `country` field after registration

### Email not sending
1. Verify `SENDGRID_API_KEY` is set
2. Check SendGrid account status
3. Review email logs for errors
4. Ensure `FROM_EMAIL` is verified in SendGrid

## Future Enhancements

- [ ] Add WhatsApp message templates for other notifications
- [ ] Implement read receipts tracking
- [ ] Add SMS fallback for WhatsApp failures in critical cases
- [ ] Support for WhatsApp Business API features
- [ ] Multi-language message templates
- [ ] Admin dashboard for notification analytics

## Support

For questions or issues:
- Technical: Review logs in `server/utils/notifications.js`
- Compliance: See COMPLIANCE rules at top of this document
- Twilio: https://www.twilio.com/docs/whatsapp
- SendGrid: https://docs.sendgrid.com/

---

**Last Updated**: December 2024
**Version**: 1.0.0
**Status**: Production Ready ✅
