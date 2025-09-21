# Walter Arevalo Pro Activation Scripts

This directory contains scripts to activate Walter Arevalo as a Pro user in the Fixlo application, bypassing Stripe subscription requirements.

## Scripts

### 1. `activate-owner-pro.js`
Activates Walter Arevalo as a Pro in the MongoDB database.

**Usage:**
```bash
# Set your MongoDB connection string
MONGODB_URI="your_mongodb_connection_string" npm run activate-owner-pro

# Or use the server environment variable name
MONGO_URI="your_mongodb_connection_string" npm run activate-owner-pro

# Optionally specify database name (defaults to 'fixlo')
MONGODB_URI="your_connection" MONGODB_DB="your_db" npm run activate-owner-pro
```

**Features:**
- Creates/updates Pro record with upsert operation
- Maps to actual Pro model fields
- Sets Walter as active Pro with verified status
- Bypasses Stripe subscription requirement
- Handles Charlotte, NC service area with 30-mile radius

### 2. `test-walter-lead.js` 
Tests lead creation to verify Walter would receive SMS notifications.

**Usage:**
```bash
# Start the server first
cd server && npm start

# Then run the test (in another terminal)
npm run test-walter-lead
```

**What it tests:**
- Server health and availability
- Lead submission endpoint functionality
- Charlotte, NC handyman service lead creation
- SMS notification trigger verification

## Walter's Pro Profile Data

The script creates a Pro profile with these details:

- **Name:** Walter Arevalo
- **Business:** Pro-4U Improvements LLC
- **Email:** pro4u.improvements@gmail.com
- **Phone:** +15164449953
- **Trade:** handyman (mapped from "General")
- **Service Area:** Charlotte, NC (30-mile radius)
- **Status:** Active, Verified, SMS enabled
- **Subscription:** Active (bypasses Stripe)

## Verification Workflow

1. **Activate Walter:**
   ```bash
   MONGODB_URI="your_connection_string" npm run activate-owner-pro
   ```

2. **Test Lead Creation:**
   ```bash
   # Terminal 1: Start server
   cd server && npm start
   
   # Terminal 2: Test lead creation
   npm run test-walter-lead
   ```

3. **Expected Results:**
   - Walter's Pro record shows `isActive: true`, `paymentStatus: "active"`
   - Test lead gets created successfully
   - Walter receives SMS notification at +15164449953
   - Lead appears in Pro dashboard

## Field Mappings

The script maps problem statement fields to actual Pro model fields:

| Problem Statement | Pro Model | Notes |
|------------------|-----------|-------|
| `companyName` | `businessName` | Direct mapping |
| `services[]` | `primaryService` | Model doesn't have services array |
| `trade: "General"` | `trade: "handyman"` | "General" not in enum |
| `smsOptIn` | `smsConsent` | Boolean consent field |
| `radiusMiles` | `serviceRadiusMiles` | Service radius in miles |
| `subscriptionStatus` | `paymentStatus` | Uses existing payment status |
| `acceptsAllLeads` | `wantsNotifications` | Notification preference |

## Environment Variables

Required for activation:
- `MONGODB_URI` or `MONGO_URI` - MongoDB connection string
- `MONGODB_DB` (optional) - Database name, defaults to "fixlo"

Required for SMS testing:
- `TWILIO_ACCOUNT_SID` - Twilio account SID
- `TWILIO_AUTH_TOKEN` - Twilio auth token  
- `TWILIO_PHONE` - Twilio phone number

## Error Handling

The scripts handle common errors:
- Missing environment variables
- MongoDB connection failures
- Server unavailability
- Invalid data validation
- Network timeouts

## Dependencies

- `mongodb` - MongoDB native client (installed as dev dependency)
- Server must have `mongoose` for Pro model (already installed)
- Server must have Twilio configuration for SMS notifications