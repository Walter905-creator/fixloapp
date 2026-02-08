# Owner Notification System for Charlotte Leads

## Overview
This document describes the implementation of the owner notification system for Fixlo, ensuring the owner (Walter Arevalo) receives immediate SMS notifications for all new service leads in Charlotte, NC.

## Owner Information
- **Name**: Walter Arevalo
- **Phone**: +1 (516) 444-9953
- **City**: Charlotte, NC

## Implementation Details

### 1. SMS Template (server/utils/smsSender.js)
A new SMS template has been added for owner notifications:

```javascript
owner: {
  en: (data) =>
    `Fixlo Owner Alert: New ${data.service} lead in ${data.city}. Customer: ${data.customerName} (${data.customerPhone}). Address: ${data.address}.`
}
```

**Message Format Example:**
```
Fixlo Owner Alert: New Plumbing lead in Charlotte. 
Customer: John Smith (+17045551234). 
Address: 123 Main St, Charlotte, NC 28202.
```

### 2. Owner Notification Function (server/utils/smsSender.js)
The `sendOwnerNotification(ownerPhone, lead)` function handles sending notifications to the owner:

**Features:**
- Bypasses SMS consent checks (business notifications)
- Uses direct SMS sending via Twilio
- Records notifications for tracking
- Comprehensive error handling
- Does not block lead processing on failure

**Parameters:**
- `ownerPhone` (string): Owner's phone number in E.164 format
- `lead` (object): Lead/JobRequest object with lead details

**Returns:**
```javascript
{
  success: boolean,
  messageId: string,     // Twilio SID on success
  channel: 'sms',
  notificationType: 'owner',
  error: string,         // On failure
  reason: string         // On validation failure
}
```

### 3. Integration with Lead Processing (server/routes/leads.js)
Owner notifications are triggered automatically when:
1. A new lead is submitted via POST /api/leads
2. The lead's city matches "Charlotte" (case-insensitive)
3. Priority routing configuration exists for the city

**Flow:**
```
New Lead Submitted (city="Charlotte")
    ↓
Priority SMS sent to Walter (existing)
    ↓
Owner Notification SMS sent to Walter (NEW)
    ↓
Lead marked as priority notified
    ↓
Other pros notified after 3-minute delay
```

### 4. Error Handling
- Owner notification failures are logged but do not block lead processing
- All errors are caught and logged to console
- Lead submission always succeeds even if owner notification fails
- Idempotency tracking prevents duplicate notifications

## Configuration

### Priority Routing Configuration (server/config/priorityRouting.js)
```javascript
const PRIORITY_ROUTING = {
  charlotte: {
    phone: '+15164449953',      // Walter Arevalo
    name: 'Walter Arevalo',
    delayMinutes: 3
  }
};
```

### Environment Variables
No new environment variables required. Uses existing Twilio configuration:
- `TWILIO_ACCOUNT_SID`
- `TWILIO_AUTH_TOKEN`
- `TWILIO_FROM_NUMBER`

## Testing

### Automated Test
Run the test script to validate the implementation:
```bash
cd server
node test-owner-notification.js
```

**Test Coverage:**
- ✓ Priority configuration exists for Charlotte
- ✓ Owner phone number is correct
- ✓ SMS template includes all required information
- ✓ sendOwnerNotification function is implemented
- ✓ Integration with leads.js route is complete
- ✓ Error handling prevents processing failures

### Manual Testing
1. **Start the server:**
   ```bash
   cd server
   npm run dev
   ```

2. **Submit a test lead:**
   ```bash
   curl -X POST http://localhost:3001/api/leads \
     -H "Content-Type: application/json" \
     -d '{
       "fullName": "Test Customer",
       "phone": "+17045551234",
       "email": "test@example.com",
       "serviceType": "Plumbing",
       "city": "Charlotte",
       "state": "NC",
       "address": "123 Test St, Charlotte, NC",
       "description": "Test lead for owner notification",
       "smsConsent": true
     }'
   ```

3. **Check server logs for:**
   ```
   📲 Sending SMS to: +15164449953
   ✅ Priority SMS sent to: +15164449953
   📢 Sending owner notification for Charlotte lead
   ✅ Owner notification sent successfully (SID: SMxxxxxxxxxx)
   ```

4. **Verify Walter receives two SMS messages:**
   - Priority SMS: "Fixlo Priority Lead (Charlotte): New homeowner service request received..."
   - Owner notification: "Fixlo Owner Alert: New Plumbing lead in Charlotte. Customer: Test Customer (+17045551234)..."

## Monitoring

### Success Indicators
- Owner notification SMS sent successfully (✅ in logs)
- Twilio SID returned and logged
- No errors in server logs

### Failure Indicators
- ⚠️ or ❌ in server logs
- "Owner notification failed" message
- Lead processing continues normally

### Log Patterns
```bash
# Success
📢 Sending owner notification for Charlotte lead
✅ Owner notification sent successfully (SID: SMxxxxxxxxxx)

# Failure
📢 Sending owner notification for Charlotte lead
❌ Failed to send owner notification: [error message]

# Validation failure
⚠️ Owner notification failed: Missing owner phone or lead data
```

## Compliance

### TCPA Compliance
- Owner notifications are **business notifications** to the business owner
- No consumer consent required for owner alerts
- Owner can stop notifications by updating configuration
- Messages are transactional (lead alerts)

### Data Privacy
- Customer phone numbers are included in owner alerts (business necessity)
- Customer information is not shared with third parties
- All notifications are logged for compliance tracking

## Future Enhancements

### Potential Improvements
1. **Multi-City Support**: Extend to other cities with local owners
2. **Email Notifications**: Add email fallback for owner
3. **Dashboard Integration**: Add owner notification toggle in admin panel
4. **Advanced Filtering**: Allow owner to set preferences (service types, minimum value)
5. **Delivery Tracking**: Add Twilio delivery status webhooks

### Scaling Considerations
- If adding more cities, update `PRIORITY_ROUTING` in priorityRouting.js
- Consider moving owner config to database for dynamic updates
- Add rate limiting for high-volume markets

## Troubleshooting

### Owner Not Receiving Notifications

**Check 1: Priority Config**
```javascript
const { getPriorityConfig } = require('./config/priorityRouting');
console.log(getPriorityConfig('charlotte'));
// Should return: { phone: '+15164449953', name: 'Walter Arevalo', delayMinutes: 3 }
```

**Check 2: Twilio Credentials**
```bash
# Check environment variables
echo $TWILIO_ACCOUNT_SID
echo $TWILIO_AUTH_TOKEN
echo $TWILIO_FROM_NUMBER
```

**Check 3: Server Logs**
```bash
# Search for owner notification attempts
cd server
grep "owner notification" logs/*.log
```

**Check 4: Phone Number Format**
- Ensure phone is in E.164 format: +15164449953
- No spaces, dashes, or parentheses

### Common Issues

**Issue**: "Owner notification failed: Missing owner phone or lead data"
**Solution**: Verify lead object is saved before notification is sent

**Issue**: Twilio error "Invalid phone number"
**Solution**: Verify phone format is E.164 (+1XXXXXXXXXX)

**Issue**: "Failed to record notification"
**Solution**: Check MongoDB connection; notification still sent

## Rollback Plan

If owner notifications need to be disabled:

1. **Quick disable (no code changes):**
   ```javascript
   // In server/config/priorityRouting.js
   const PRIORITY_ROUTING = {
     // charlotte: {  // Comment out Charlotte config
     //   phone: '+15164449953',
     //   name: 'Walter Arevalo',
     //   delayMinutes: 3
     // }
   };
   ```

2. **Remove from lead processing:**
   Comment out lines 168-179 in server/routes/leads.js

3. **Restart server:**
   ```bash
   cd server
   npm run dev
   ```

## Support

For issues or questions:
1. Check server logs: `server/logs/`
2. Review Twilio logs: https://console.twilio.com/
3. Test with manual curl command
4. Review this documentation

## Changelog

### 2026-02-08 - Initial Implementation
- Added owner notification SMS template
- Implemented sendOwnerNotification function
- Integrated with lead processing flow
- Added comprehensive testing
- Created documentation
