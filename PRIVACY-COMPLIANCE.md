# Privacy Compliance Implementation

This document describes the privacy compliance features implemented in the Fixlo application to ensure compliance with GDPR, CCPA, and other privacy regulations.

## Overview

The Fixlo platform has implemented comprehensive privacy protections and user rights features to comply with:
- **GDPR** (General Data Protection Regulation - EU)
- **CCPA** (California Consumer Privacy Act - US)
- Other applicable privacy laws and best practices

## Features Implemented

### 1. Privacy Policy (Updated October 22, 2025)

**Files:**
- `/Privacy.jsx` - Root privacy policy component
- `/client/src/pages/Privacy.jsx` - Client-side privacy policy page
- `/privacy.html` - Static privacy policy page
- `/client/public/privacy-policy.html` - Public static version

**Key Sections:**
- Comprehensive data collection disclosure
- Information usage and sharing policies
- User rights and how to exercise them
- SMS and communication consent
- Data retention and deletion policies
- Security measures
- Cookie and tracking technologies
- International data transfers
- Background check procedures
- Payment processing information

### 2. User Data Rights Endpoints

**Location:** `/server/routes/privacy.js`

#### 2.1 Data Access Request
**Endpoint:** `POST /api/privacy/data-access-request`

Allows users to request access to all their personal data stored in the system.

**Request Body:**
```json
{
  "email": "user@example.com",
  "userType": "pro" // or "homeowner"
}
```

**Response:** Returns all personal data associated with the email address.

#### 2.2 Data Export
**Endpoint:** `POST /api/privacy/data-export`

Enables users to export their data in a portable format (JSON).

**Request Body:**
```json
{
  "email": "user@example.com",
  "userType": "pro",
  "format": "json"
}
```

**Response:** Returns exportable data that can be downloaded.

#### 2.3 Data Deletion Request
**Endpoint:** `POST /api/privacy/data-deletion-request`

Allows users to request deletion of their personal data (Right to be Forgotten).

**Request Body:**
```json
{
  "email": "user@example.com",
  "userType": "pro",
  "confirmDeletion": true
}
```

**Response:** Confirms data anonymization or deletion.

**Notes:**
- Active subscriptions must be cancelled before deletion
- Some data may be retained for legal/regulatory compliance (up to 7 years)
- Recent data is anonymized rather than deleted to maintain referential integrity

#### 2.4 Update Consent Preferences
**Endpoint:** `POST /api/privacy/update-consent`

Allows users to update their communication consent preferences.

**Request Body:**
```json
{
  "email": "user@example.com",
  "consentType": "sms", // sms, email, push, notifications
  "value": true
}
```

#### 2.5 Privacy Policy Version
**Endpoint:** `GET /api/privacy/policy-version`

Returns current privacy policy version and changelog.

### 3. Cookie Consent Banner

**Location:** `/client/src/components/CookieConsent.jsx`

**Features:**
- GDPR-compliant cookie consent banner
- Granular cookie preferences (Necessary, Analytics, Marketing, Functional)
- Accept All / Reject All options
- Cookie preference management
- Persistent storage of user preferences
- Integration with Google Analytics consent mode

**Cookie Categories:**
1. **Necessary** - Always enabled, essential for site functionality
2. **Analytics** - Anonymous usage statistics
3. **Marketing** - Advertising and campaign tracking
4. **Functional** - Enhanced features and personalization

### 4. Privacy Settings Page

**Location:** `/client/src/pages/PrivacySettings.jsx`

**Features:**
- User-friendly interface for exercising data rights
- Access personal data
- Export data as JSON file
- Request data deletion with confirmation
- Email-based verification
- Separate flows for Professionals and Homeowners

**URL:** `/privacy-settings`

### 5. Privacy Audit Logging

**Location:** `/server/middleware/privacyAudit.js`

**Features:**
- Automatic logging of all privacy-related actions
- Logs stored in `/server/logs/privacy-audit.log`
- Includes timestamp, action type, email, IP address, and details
- Compliant with audit requirements for GDPR/CCPA

**Logged Actions:**
- Data access requests
- Data export requests
- Data deletion requests
- Consent updates

**Admin Endpoints:**
- `GET /api/admin/privacy-audit-log` - View recent privacy audit logs
- `POST /api/admin/privacy-audit-cleanup` - Clean up old logs

### 6. Data Retention Service

**Location:** `/server/services/dataRetention.js`

**Retention Policies:**
- **Inactive Accounts:** 7 years (2,555 days) - for financial/legal requirements
- **Job Requests:** 3 years (1,095 days)
- **Audit Logs:** 1 year (365 days)
- **Anonymized Data:** 90 days for analytics

**Automated Tasks:**
1. Anonymize inactive Pro accounts older than 7 years
2. Delete old completed/cancelled job requests older than 3 years
3. Clean up audit logs older than 1 year
4. Can be scheduled to run daily at 2 AM

**Admin Endpoints:**
- `GET /api/admin/data-retention-stats` - View retention statistics
- `POST /api/admin/run-data-retention` - Manually trigger retention tasks

**Functions:**
```javascript
const { 
  scheduleDataRetention,    // Schedule automatic daily runs
  runDataRetentionTasks,    // Run tasks manually
  getRetentionStatistics    // Get current statistics
} = require('./services/dataRetention');
```

### 7. Security Headers

**Location:** `/server/middleware/security.js`

Privacy-enhancing security headers already in place:
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `X-XSS-Protection: 1; mode=block`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Permissions-Policy: camera=(), microphone=(), geolocation=(self)`
- Content Security Policy for API endpoints

### 8. Mobile App Privacy

**Location:** `/mobile/app.config.js`

Privacy URLs configured in mobile app:
- `privacyPolicyUrl: "https://fixloapp.com/privacy"`
- `termsOfServiceUrl: "https://fixloapp.com/terms"`

## User Rights Summary

Users have the following rights under GDPR/CCPA:

1. ✅ **Right to Access** - View all personal data we store
2. ✅ **Right to Portability** - Export data in portable format
3. ✅ **Right to Deletion** - Request deletion of personal data
4. ✅ **Right to Correction** - Update inaccurate information (via account settings)
5. ✅ **Right to Restriction** - Limit data processing via consent settings
6. ✅ **Right to Object** - Object to certain processing activities
7. ✅ **Right to Withdraw Consent** - Update or revoke consent at any time

## Data Processing Transparency

### What We Collect
- Personal information (name, email, phone, address, DOB)
- Professional information (trade, certifications, business info)
- Device and usage information (IP, browser, location)
- Payment information (processed by Stripe)
- Communication data (SMS consent, notification preferences)

### How We Use Data
- Service matching (homeowners with pros)
- Platform operations and improvements
- Communication (notifications, updates)
- Payment processing
- Safety and security (background checks)
- Customer support
- Legal compliance
- Analytics

### Who We Share With
- **Service Providers:** Stripe, Checkr, Twilio, Cloud providers
- **Platform Users:** Matching pros with homeowners
- **Legal Requirements:** When required by law

### We DO NOT:
- ❌ Sell personal information
- ❌ Rent or trade user data
- ❌ Share data without consent (except legal requirements)

## Compliance Features Checklist

- [x] Privacy Policy (comprehensive, up-to-date)
- [x] Cookie Consent Banner (GDPR-compliant)
- [x] Data Access Endpoint (GDPR Article 15)
- [x] Data Portability Endpoint (GDPR Article 20)
- [x] Data Deletion Endpoint (GDPR Article 17 - Right to be Forgotten)
- [x] Consent Management System
- [x] Privacy Settings Page
- [x] Audit Logging
- [x] Data Retention Policies
- [x] Security Headers
- [x] Anonymization of Old Data
- [x] Email-based Verification for Data Requests
- [x] Mobile App Privacy Links
- [x] Transparent Data Processing Information

## Testing Privacy Features

### Test Data Access
```bash
curl -X POST http://localhost:3001/api/privacy/data-access-request \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "userType": "pro"
  }'
```

### Test Data Export
```bash
curl -X POST http://localhost:3001/api/privacy/data-export \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "userType": "pro",
    "format": "json"
  }'
```

### Test Data Deletion
```bash
curl -X POST http://localhost:3001/api/privacy/data-deletion-request \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "userType": "pro",
    "confirmDeletion": true
  }'
```

### Test Consent Update
```bash
curl -X POST http://localhost:3001/api/privacy/update-consent \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "consentType": "sms",
    "value": false
  }'
```

## Admin Access to Privacy Features

Admins can access privacy audit logs and retention statistics:

```bash
# View privacy audit logs
GET /api/admin/privacy-audit-log?limit=100

# View data retention statistics
GET /api/admin/data-retention-stats

# Run data retention tasks manually
POST /api/admin/run-data-retention

# Clean up old audit logs
POST /api/admin/privacy-audit-cleanup
```

## Recommendations for Production

1. **Enable Scheduled Data Retention:**
   Add to server startup (server/index.js):
   ```javascript
   const { scheduleDataRetention } = require('./services/dataRetention');
   scheduleDataRetention(); // Enable automatic daily cleanup
   ```

2. **Monitor Privacy Audit Logs:**
   - Regularly review logs for suspicious activity
   - Set up alerts for unusual deletion patterns
   - Archive logs for compliance (1 year retention)

3. **Regular Compliance Reviews:**
   - Review privacy policy quarterly
   - Update consent mechanisms as regulations evolve
   - Audit data retention practices

4. **User Communication:**
   - Notify users of privacy policy changes
   - Provide clear instructions for exercising rights
   - Maintain 30-day response time for privacy requests

5. **Training:**
   - Train staff on privacy compliance
   - Establish data breach response procedures
   - Maintain incident response plan

## Contact for Privacy Inquiries

Email: pro4u.improvements@gmail.com
Response Time: Within 30 days

## Version History

- **v2.0** (October 22, 2025)
  - Comprehensive privacy policy update
  - Added GDPR/CCPA compliance endpoints
  - Implemented cookie consent banner
  - Added privacy settings page
  - Implemented audit logging
  - Created data retention service
  - Enhanced security headers

- **v1.0** (July 31, 2025)
  - Initial privacy policy
  - Basic data collection disclosure
