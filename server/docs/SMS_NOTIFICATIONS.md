# SMS Notification System Documentation

## Overview

This document describes the hardened SMS notification system for Fixlo. The system ensures reliable, compliant, and idempotent SMS delivery for all non-referral notifications.

## Architecture

### Three SMS Notification Types

1. **Lead Notifications** - Alerts sent to professionals about new service requests
2. **Homeowner Confirmations** - Confirmations sent to homeowners after submitting requests
3. **Pro Alerts** - Lead assignment notifications to professionals

**Note:** Referral SMS notifications use a separate system (`/server/services/referralNotification.js`) and are not covered by this implementation.

## Core Components

### 1. Centralized SMS Sender (`/server/utils/smsSender.js`)

The central hub for all non-referral SMS operations.

**Key Features:**
- **Idempotency Protection**: Prevents duplicate SMS using `leadId + userId + notificationType` hash
- **Multi-language Support**: Templates in English, Spanish, and Portuguese
- **Channel Routing**: SMS for USA, WhatsApp for international (if opted-in)
- **Compliance Enforcement**: Checks SMS consent and opt-out status
- **Privacy Protection**: Logs masked phone numbers only

**Usage Example:**
```javascript
const { sendHomeownerConfirmation, sendProLeadAlert } = require('./utils/smsSender');

// Send homeowner confirmation
await sendHomeownerConfirmation(lead);

// Send pro alert
await sendProLeadAlert(pro, lead);
```

### 2. SMS Notification Model (`/server/models/SmsNotification.js`)

Database model for tracking SMS delivery and preventing duplicates.

**Key Fields:**
- `idempotencyKey`: SHA-256 hash for deduplication
- `notificationType`: 'lead', 'homeowner', or 'pro'
- `status`: 'pending', 'sent', 'failed', 'delivered', 'undelivered'
- `twilioSid`: Twilio message ID for tracking
- `phoneNumberMasked`: Privacy-protected phone number

**Auto-Cleanup:** Records older than 90 days are automatically deleted via TTL index.

### 3. Updated Notification Handler (`/server/utils/notifications.js`)

Integrates with the centralized SMS sender for pro lead notifications.

**Changes:**
- Uses `sendProLeadAlert()` instead of direct Twilio calls
- Automatic idempotency checking
- Maintains backward compatibility with existing code

### 4. Lead Route Integration (`/server/routes/leads.js`)

Sends homeowner confirmation SMS after lead submission.

**Flow:**
1. Lead is saved to database
2. Homeowner confirmation SMS sent (with idempotency)
3. Pros are notified (with idempotency per pro)

## SMS Templates

All templates include opt-out language for TCPA compliance.

### Homeowner Confirmation
```
Fixlo: Your [Service] request in [City] was received. 
We're matching you with verified pros who will contact you soon. 
Reply STOP to opt out.
```

### Pro Lead Alert
```
[Service] [Location] – Contact: [Name] [Phone]. 
Reply STOP to opt out.
```

## Compliance & Safety

### TCPA Compliance
✅ All messages include "Reply STOP to opt out"  
✅ SMS consent required before sending  
✅ Opt-out status checked before each send  
✅ International users require WhatsApp opt-in  

### Idempotency
✅ Duplicate prevention via idempotency keys  
✅ Safe retries - no duplicate SMS sent  
✅ Per-recipient deduplication  

### Privacy
✅ Phone numbers masked in logs (`+1***567890`)  
✅ No sensitive data in error messages  
✅ Automatic cleanup of old records  

## Verification Tool

### `npm run sms:doctor`

Health check script that validates the SMS system.

**Checks Performed:**
1. Twilio credentials configuration
2. SMS sender utility functions
3. Notification model and methods
4. Template rendering and compliance
5. Referral SMS module integrity (read-only)

**Usage:**
```bash
cd server
npm run sms:doctor
```

**Expected Output:**
```
✅ ALL CHECKS PASSED!
Non-referral SMS notifications are properly configured.
```

## Error Handling

### Common Scenarios

**No SMS Consent:**
```javascript
{
  success: false,
  reason: 'User has not consented to SMS'
}
```

**Duplicate Send Prevented:**
```javascript
{
  success: false,
  reason: 'Duplicate notification prevented by idempotency check',
  idempotent: true
}
```

**Twilio API Error:**
```javascript
{
  success: false,
  error: 'Twilio API error message',
  errorCode: 'TWILIO_ERROR_CODE'
}
```

All errors are logged to console with appropriate severity levels.

## Testing

### Manual Testing Checklist

- [ ] Lead submission sends homeowner confirmation SMS
- [ ] Pro receives lead alert SMS (USA)
- [ ] Pro receives WhatsApp lead alert (International)
- [ ] Duplicate lead submission doesn't send duplicate SMS
- [ ] No SMS sent if consent is false
- [ ] No SMS sent if user opted out
- [ ] SMS doctor script passes all checks

### Test Data Requirements

- USA pro with SMS consent
- International pro with WhatsApp opt-in
- Lead with valid E.164 phone number
- Lead with SMS consent = true

## Deployment

### Environment Variables Required

```bash
# Twilio Configuration
TWILIO_ACCOUNT_SID=your_account_sid
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_PHONE_NUMBER=+1XXXXXXXXXX
TWILIO_WHATSAPP_NUMBER=whatsapp:+1XXXXXXXXXX  # Optional

# MongoDB (for notification tracking)
MONGODB_URI=mongodb://...
```

### Pre-Deployment Checklist

1. Run `npm run sms:doctor` to verify configuration
2. Ensure MongoDB connection is available
3. Verify Twilio credentials are valid
4. Test with a small batch of real leads
5. Monitor logs for errors

## Monitoring

### Key Metrics to Track

- SMS delivery success rate
- Idempotency prevention count (duplicates avoided)
- Twilio API errors
- Opt-out rate
- Language distribution (EN/ES/PT)

### Log Messages

**Success:**
```
✅ homeowner notification sent successfully
   Channel: sms
   Language: en
   Twilio SID: SM...
   Masked Phone: +1***567890
```

**Duplicate Prevented:**
```
⏭️ SMS already sent: pro to +1***567890
```

**Consent Failed:**
```
📱 SMS not sent to +1***567890: consent=false, optOut=false
```

## Troubleshooting

### Issue: SMS Doctor Fails

**Symptoms:** Script exits with errors  
**Solution:** 
1. Check if dependencies are installed (`npm install`)
2. Verify `.env` file exists with Twilio credentials
3. Run with verbose output: `node -r dotenv/config scripts/sms-doctor.js`

### Issue: Homeowner Confirmation Not Sent

**Symptoms:** Lead saved but no SMS  
**Solution:**
1. Check lead has `smsConsent: true`
2. Verify phone is E.164 format (`+1XXXXXXXXXX`)
3. Check Twilio credentials are valid
4. Review server logs for errors

### Issue: Duplicate SMS Sent

**Symptoms:** Pro receives multiple alerts for same lead  
**Solution:**
1. Check `SmsNotification` model is properly indexed
2. Verify MongoDB connection is stable
3. Review idempotency key generation
4. Check for concurrent requests (race conditions)

## API Reference

### `sendNonReferralSms(options)`

Core function for sending non-referral SMS.

**Parameters:**
```javascript
{
  phone: string,              // E.164 format
  notificationType: string,   // 'lead', 'homeowner', 'pro'
  templateData: object,       // Data for message template
  leadId: string,             // Lead/JobRequest ID
  userId: string,             // Recipient user ID
  userModel: string,          // 'Pro' or 'JobRequest'
  smsConsent: boolean,        // User SMS opt-in status
  smsOptOut: boolean,         // User SMS opt-out status
  whatsappOptIn: boolean,     // WhatsApp opt-in (non-US only)
  country: string             // ISO country code
}
```

**Returns:**
```javascript
{
  success: boolean,
  messageId: string,      // Twilio SID
  channel: string,        // 'sms' or 'whatsapp'
  language: string,       // 'en', 'es', or 'pt'
  notificationType: string
}
```

### `sendHomeownerConfirmation(lead)`

Convenience function for homeowner confirmations.

**Parameters:**
- `lead`: JobRequest object with phone, trade, city, smsConsent

**Returns:** Same as `sendNonReferralSms()`

### `sendProLeadAlert(pro, lead)`

Convenience function for pro lead alerts.

**Parameters:**
- `pro`: Pro object with phone, smsConsent, whatsappOptIn, country
- `lead`: JobRequest object with trade, city, state, name, phone

**Returns:** Same as `sendNonReferralSms()`

## Migration Notes

### From Direct Twilio Calls

**Before:**
```javascript
const { sendSms } = require('./twilio');
await sendSms(pro.phone, messageBody);
```

**After:**
```javascript
const { sendProLeadAlert } = require('./smsSender');
await sendProLeadAlert(pro, lead);
```

**Benefits:**
- Automatic idempotency
- Compliance checking
- Delivery tracking
- Multi-language support

## Support

For issues or questions:
1. Check this documentation
2. Run `npm run sms:doctor` for diagnostics
3. Review server logs for error details
4. Consult Twilio API documentation for error codes

## Future Enhancements

Potential improvements:
- [ ] Delivery status webhooks from Twilio
- [ ] SMS analytics dashboard
- [ ] A/B testing for message templates
- [ ] Rate limiting per recipient
- [ ] Scheduled SMS sending
- [ ] SMS campaign management
