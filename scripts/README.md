# Fixlo Scripts

This directory contains utility scripts for the Fixlo application including Pro activation, testing, and user creation.

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

### 3. `createTestUsers.js`
Creates sample test Pro users in the Fixlo backend for testing mobile and web logins.

**Usage:**
```bash
# Run directly
node scripts/createTestUsers.js

# Or use npm script
npm run create-test-users
```

**Features:**
- Creates 3 test Pro users with different trades
- Clear console output with success/warning/error indicators
- Handles multiple error scenarios gracefully:
  - User already exists (⚠️ warning, not error)
  - Service unavailable (❌ error)
  - API errors (❌ error)
  - Network errors (❌ error)
- Provides detailed summary at the end
- Shows login credentials for testing
- No database connection required (uses API endpoint)

**Test Users Created:**

1. **Test Pro** (testpro@fixlo.com)
   - Trade: Plumbing
   - Password: FixloTest123
   - Phone: 555-111-2222
   - Location: New York, NY

2. **Test Homeowner** (testhomeowner@fixlo.com)
   - Trade: Electrical
   - Password: FixloTest123
   - Phone: 555-333-4444
   - Location: Los Angeles, CA

3. **Demo User** (demo@fixlo.com)
   - Trade: Handyman
   - Password: FixloTest123
   - Phone: 555-777-8888
   - Location: Chicago, IL

**Note:** All test users are created as Pro accounts since Fixlo's architecture only includes Pro user accounts. Homeowners don't need accounts - they simply submit job requests.

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

**Required dependencies (already installed):**
- `mongodb` - MongoDB native client (dev dependency)
- `axios` - HTTP client for API requests
- Server dependencies:
  - `mongoose` - MongoDB ODM for Pro model
  - `twilio` - SMS notification service

**Installation:**
```bash
# Install all dependencies
npm install

# Or install specific script dependencies
npm install --save axios
```