# Priority Pro Notification System - Implementation Documentation

## Overview

The Priority Pro Notification System extends the existing Fixlo lead notification system to give priority access to specific professionals for jobs in Charlotte, NC. This is an **additive feature** that does not modify or remove existing SMS logic.

## Key Features

### 1. **Priority Routing for Charlotte Leads**
- When a homeowner submits a service request with `city === "charlotte"` (case-insensitive)
- The system immediately sends an SMS to the priority pro: **+1 (516) 444-9953 (Walter Arevalo)**
- The lead is marked with priority notification metadata
- Other pros are notified with a 3-minute delay to give priority pro first opportunity

### 2. **Priority SMS Message Format**
```
Fixlo Priority Lead (Charlotte):
New homeowner service request received.
Service: {{serviceType}}
Location: {{address}}
Reply ACCEPT to take this job first.
```

### 3. **ACCEPT Reply Handling**
- When the priority pro replies "ACCEPT" to the SMS
- System finds the most recent pending Charlotte job that was priority-notified
- Automatically assigns the job to the priority pro
- Changes job status to "assigned"
- Sends confirmation SMS to priority pro
- Sends notification SMS to homeowner (if SMS consent given)
- Locks the job from other pros

### 4. **Admin Dashboard Visibility**
- Jobs list shows "Priority Pro Notified" badge for Charlotte leads
- Job details modal displays:
  - Priority pro name: Walter Arevalo
  - Priority pro phone: +1 (516) 444-9953
  - Notification timestamp
  - Acceptance timestamp (if accepted)

## Technical Implementation

### Database Schema Changes

**JobRequest Model** (`/server/models/JobRequest.js`)
```javascript
{
  // Priority Pro Routing (Charlotte, NC)
  priorityNotified: Boolean,      // Was priority pro notified?
  priorityPro: String,            // Priority pro name
  priorityNotifiedAt: Date,       // When was priority pro notified?
  priorityAcceptedAt: Date        // When did priority pro accept?
}
```

### Lead Dispatch Logic

**File**: `/server/routes/leads.js`

**Priority Pro Detection**:
```javascript
const PRIORITY_PRO_PHONE = '+15164449953';
const PRIORITY_PRO_NAME = 'Walter Arevalo';
const isCharlotteLead = city && city.toLowerCase() === 'charlotte';
```

**Flow**:
1. Save lead to database (existing logic)
2. **NEW**: If Charlotte lead → Send priority SMS immediately
3. **NEW**: Mark lead with priority notification fields
4. Query nearby pros (existing logic)
5. **MODIFIED**: 
   - If Charlotte lead → Schedule delayed notification (3 minutes)
   - Else → Immediate notification to all pros (existing logic)

**Delayed Notification**:
```javascript
setTimeout(async () => {
  // Check if job still pending and not accepted by priority pro
  const currentJob = await JobRequest.findById(savedLead._id);
  
  if (currentJob && currentJob.status === 'pending' && !currentJob.priorityAcceptedAt) {
    // Notify other pros (excluding priority pro to avoid duplicates)
    for (const pro of pros) {
      if (normalizeE164(pro.phone) === PRIORITY_PRO_PHONE) continue;
      // Send SMS...
    }
  }
}, 180000); // 3 minutes
```

### SMS Reply Handler

**File**: `/sms-handler.js`

**ACCEPT Command Enhancement**:
```javascript
case 'ACCEPT':
  // Check if sender is priority pro
  const isPriorityPro = normalizedPhone.endsWith('5164449953');
  
  if (isPriorityPro) {
    // Find most recent pending Charlotte job
    const pendingJob = await JobRequest.findOne({
      status: 'pending',
      priorityNotified: true,
      priorityPro: 'Walter Arevalo',
      priorityAcceptedAt: null
    }).sort({ priorityNotifiedAt: -1 });
    
    if (pendingJob) {
      // Assign job
      await JobRequest.findByIdAndUpdate(pendingJob._id, {
        status: 'assigned',
        priorityAcceptedAt: new Date(),
        assignedAt: new Date()
      });
      
      // Send confirmations...
    }
  }
```

### Admin UI Updates

**File**: `/client/src/routes/AdminJobsPage.jsx`

**Job List Badge**:
```jsx
{job.priorityNotified && (
  <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-orange-100 text-orange-800">
    Priority Pro Notified
  </span>
)}
```

**Job Details Section**:
```jsx
{selectedJob.priorityNotified && (
  <div className="md:col-span-2">
    <h3 className="text-lg font-semibold mb-3">Priority Pro Routing</h3>
    <div className="space-y-2 text-sm">
      <p><strong>Priority Pro:</strong> {selectedJob.priorityPro || 'N/A'}</p>
      <p><strong>Phone:</strong> +1 (516) 444-9953</p>
      {selectedJob.priorityNotifiedAt && (
        <p><strong>Notified At:</strong> {new Date(selectedJob.priorityNotifiedAt).toLocaleString()}</p>
      )}
      {selectedJob.priorityAcceptedAt && (
        <p className="text-green-600">
          <strong>✅ Accepted At:</strong> {new Date(selectedJob.priorityAcceptedAt).toLocaleString()}
        </p>
      )}
    </div>
  </div>
)}
```

## Safety & Compliance

### SMS Opt-in Rules
- Priority pro notifications respect existing SMS opt-in framework
- All SMS messages include clear CTAs and opt-out instructions
- STOP replies are handled by existing SMS compliance logic
- All SMS events are logged for compliance tracking

### Job Assignment Safeguards
- Only pending jobs can be accepted by priority pro
- Jobs already assigned/completed cannot be claimed
- Priority pro cannot accept jobs they weren't notified about
- Duplicate notifications to priority pro are prevented

### Logging
All priority routing events are logged:
- `🔔 Priority SMS sent to Walter Arevalo for Charlotte lead`
- `⏳ Charlotte lead detected - scheduling delayed notification for other pros (3 minutes)`
- `⏰ Delayed notification: Notifying X other pros for Charlotte lead`
- `✅ Job already accepted by priority pro - skipping delayed notification`
- `✅ Priority pro accepted Charlotte job {jobId}`

## Configuration

### Constants
- **Priority Pro Phone**: `+15164449953`
- **Priority Pro Name**: `Walter Arevalo`
- **Target City**: `charlotte` (case-insensitive match)
- **Delay Duration**: 3 minutes (180000 ms)

### Environment Variables
No new environment variables required. Uses existing:
- `TWILIO_ACCOUNT_SID`
- `TWILIO_AUTH_TOKEN`
- `TWILIO_PHONE`
- `MONGODB_URI`

## Testing

### Manual Testing Steps

1. **Test Priority Notification**:
   ```bash
   # Submit a Charlotte lead
   curl -X POST http://localhost:3001/api/leads \
     -H "Content-Type: application/json" \
     -d '{
       "name": "Test Customer",
       "phone": "+15551234567",
       "email": "test@example.com",
       "serviceType": "Plumbing",
       "address": "123 Main St",
       "city": "charlotte",
       "state": "NC",
       "description": "Need plumbing help"
     }'
   
   # Verify SMS sent to +15164449953
   # Check job marked as priorityNotified=true
   ```

2. **Test ACCEPT Reply**:
   ```bash
   # Simulate SMS reply from priority pro
   curl -X POST http://localhost:3001/sms-webhook \
     -d "From=+15164449953" \
     -d "Body=ACCEPT"
   
   # Verify job assigned
   # Verify confirmations sent
   ```

3. **Test Admin UI**:
   - Navigate to `/admin/jobs`
   - Verify "Priority Pro Notified" badge on Charlotte leads
   - Click "View Details" on a Charlotte lead
   - Verify Priority Pro Routing section displays

4. **Test Non-Charlotte Leads**:
   ```bash
   # Submit a non-Charlotte lead
   curl -X POST http://localhost:3001/api/leads \
     -d city="New York" ...
   
   # Verify no priority notification
   # Verify immediate notification to all pros
   ```

### Automated Tests
Run the test script:
```bash
node /tmp/test-priority-routing.js
```

Expected output:
```
✅ ALL TESTS PASSED
```

## Future Enhancements

### Scalability Considerations
The current implementation hardcodes the priority pro for Charlotte. To scale to multiple cities/pros:

1. **Configuration Table**:
   ```javascript
   const PRIORITY_CONFIG = {
     'charlotte': { phone: '+15164449953', name: 'Walter Arevalo' },
     'miami': { phone: '+15551234567', name: 'Another Pro' }
     // Add more cities...
   };
   ```

2. **Database-Driven Priority Rules**:
   ```javascript
   // Create PriorityRule model
   {
     city: String,
     proPhone: String,
     proName: String,
     delayMinutes: Number,
     isActive: Boolean
   }
   ```

3. **Multiple Priority Pros per City**:
   - Implement round-robin or load-balancing
   - Track acceptance rates and response times
   - Auto-escalate to next priority pro if no response

4. **Dynamic Delay Configuration**:
   - Allow per-city delay settings
   - Adjust delays based on historical acceptance rates
   - Implement urgency-based priority

## Troubleshooting

### Issue: Priority pro not receiving SMS
**Check**:
1. Verify Twilio credentials in environment variables
2. Check SMS logs for error messages
3. Verify city field is exactly "charlotte" (case-insensitive)
4. Ensure lead was saved to database

### Issue: ACCEPT reply not working
**Check**:
1. Verify SMS webhook is configured in Twilio dashboard
2. Check phone number normalization logic
3. Ensure there's a pending Charlotte job to accept
4. Review SMS webhook logs

### Issue: Other pros getting notified immediately
**Check**:
1. Verify city detection logic
2. Check delayed notification setTimeout is being called
3. Review console logs for Charlotte lead detection

### Issue: Badge not showing in admin UI
**Check**:
1. Verify job has `priorityNotified: true` in database
2. Check admin API is returning priority fields
3. Review browser console for React errors

## Related Files

- `/server/models/JobRequest.js` - Database schema
- `/server/routes/leads.js` - Lead dispatch logic
- `/sms-handler.js` - SMS webhook handling
- `/client/src/routes/AdminJobsPage.jsx` - Admin UI
- `/server/utils/twilio.js` - SMS utility functions

## Contact

For questions or issues with the Priority Pro Notification System:
- Technical Support: pro4u.improvements@gmail.com
- Priority Pro: Walter Arevalo (+1 516-444-9953)
