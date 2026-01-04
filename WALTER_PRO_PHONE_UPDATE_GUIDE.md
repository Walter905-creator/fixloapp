# Walter Pro Phone Update Guide

## Overview
This guide explains how to update Walter Pro's phone number to +15164449953 to enable Twilio SMS notifications for job requests.

## Prerequisites
- Access to the production MongoDB database
- Node.js installed
- Environment variables configured in `server/.env`

## Steps to Update

### 1. Ensure Environment Variables are Set

Make sure the following are configured in `server/.env`:

```bash
MONGODB_URI=your_production_mongodb_uri
TWILIO_ACCOUNT_SID=your_twilio_sid
TWILIO_AUTH_TOKEN=your_twilio_token
TWILIO_PHONE_NUMBER=your_twilio_from_number
```

### 2. Run the Update Script

From the root directory:

```bash
cd server
node scripts/updateWalterProPhone.js
```

### 3. Expected Output

The script will:
1. Connect to MongoDB
2. Find the Pro user with email `pro4u.improvements@gmail.com`
3. Update the phone number to `+15164449953`
4. Enable SMS consent if not already enabled
5. Enable job notifications if not already enabled
6. Display the updated Pro user details

Example successful output:

```
🔌 Connecting to MongoDB...
✅ Connected to MongoDB

🔍 Searching for Pro user with email: pro4u.improvements@gmail.com
✅ Found Pro user: Walter Arevalo (ID: 507f1f77bcf86cd799439011)
📞 Current phone: +19999999999

🔄 Updating phone number to: +15164449953
🔄 Enabling SMS consent for job notifications
🔄 Enabling job notifications
✅ Phone number updated successfully!

📋 Updated Pro user details:
   Name: Walter Arevalo
   Email: pro4u.improvements@gmail.com
   Phone: +15164449953
   Trade: handyman
   Active: true
   SMS Consent: true
   Wants Notifications: true
   ID: 507f1f77bcf86cd799439011

✅ Walter Pro is now configured to receive SMS notifications at:
   📲 +15164449953

🔌 Disconnected from MongoDB
✅ Script completed
```

### 4. Verify the Update

After running the script, verify:

1. **Pro phone is in E.164 format**: `+15164449953`
2. **SMS consent is enabled**: `smsConsent: true`
3. **Notifications are enabled**: `wantsNotifications: true`

## Manual Verification

You can manually verify the update by:

1. Submitting a test service request through the application
2. Checking the server logs for the notification message:
   ```
   📲 Sending job SMS to pro: +15164449953
   ```
3. Confirming SMS is received at the phone number

## Troubleshooting

### Script fails with "Pro user not found"
- Verify the Pro user exists in the database
- Check that the email `pro4u.improvements@gmail.com` is correct
- Ensure you're connected to the correct MongoDB database

### Script fails with "Phone number already in use"
- Another Pro user already has this phone number
- You'll need to update or remove that Pro user first

### Script fails with "Validation error"
- The phone number format is invalid
- Ensure it's in E.164 format: `+15164449953`
- Check the Pro model validation rules

## What This Update Does

1. **Sets the notification phone**: Walter Pro will receive all job SMS at +15164449953
2. **Enables SMS consent**: Allows the system to send SMS notifications
3. **Enables notifications**: Ensures job notifications are sent
4. **E.164 format**: Ensures Twilio can deliver SMS successfully

## Testing the Complete Flow

After the update, test the complete notification flow:

1. Submit a service request through the website
2. Check server logs for:
   - Phone normalization on frontend
   - E.164 validation on backend
   - SMS notification attempt
3. Verify SMS is received at +15164449953

## Rollback (if needed)

If you need to rollback the phone number:

```bash
# Use MongoDB shell or run a custom script
db.pros.updateOne(
  { email: 'pro4u.improvements@gmail.com' },
  { $set: { phone: '+1OLDNUMBER' } }
)
```

Replace `+1OLDNUMBER` with the original phone number.
