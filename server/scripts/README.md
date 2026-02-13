# Database Update Script: Update Pro Phone Number

## Overview
This directory contains a one-time database update script to add a phone number to an existing Pro user record.

## Script Details

### `updateProPhone.js`
**Purpose:** Add phone number "+15164449953" to the Pro user with email "pro4u.improvements@gmail.com"

**What it does:**
- Connects to MongoDB using the `MONGO_URI` environment variable
- Finds the Pro user with the specified email address
- Validates that the phone number is not already in use by another user
- Updates the phone number field
- Provides detailed console output of the operation
- Safely handles errors and edge cases

**What it does NOT do:**
- Create a new user
- Modify passwords
- Touch Stripe integration
- Modify job logic
- Make any other changes to the user record

## Prerequisites
- Node.js 18+ installed
- MongoDB connection string configured in `.env` file
- Access to the production or staging database

## Usage

### 1. Ensure environment variables are set
Make sure your `.env` file in the `server/` directory contains:
```bash
MONGO_URI=your_mongodb_connection_string
```

### 2. Run the script
From the repository root:
```bash
node server/scripts/updateProPhone.js
```

Or from the `server/` directory:
```bash
cd server
node scripts/updateProPhone.js
```

## Expected Output

### Successful execution:
```
🔌 Connecting to MongoDB...
✅ Connected to MongoDB

🔍 Searching for Pro user with email: pro4u.improvements@gmail.com
✅ Found Pro user: Walter Arevalo (ID: 507f1f77bcf86cd799439011)
📞 Current phone: +19999999999

🔄 Updating phone number to: +15164449953
✅ Phone number updated successfully!

📋 Updated Pro user details:
   Name: Walter Arevalo
   Email: pro4u.improvements@gmail.com
   Phone: +15164449953
   Trade: handyman
   Active: true
   ID: 507f1f77bcf86cd799439011

🔌 Disconnected from MongoDB
✅ Script completed
```

### If already updated:
```
🔌 Connecting to MongoDB...
✅ Connected to MongoDB

🔍 Searching for Pro user with email: pro4u.improvements@gmail.com
✅ Found Pro user: Walter Arevalo (ID: 507f1f77bcf86cd799439011)
📞 Current phone: +15164449953
✅ Phone number already set to +15164449953
ℹ️  No update needed

🔌 Disconnected from MongoDB
✅ Script completed
```

### If user not found:
```
🔌 Connecting to MongoDB...
✅ Connected to MongoDB

🔍 Searching for Pro user with email: pro4u.improvements@gmail.com
❌ Pro user with email pro4u.improvements@gmail.com not found
```

### If phone number already in use:
```
🔌 Connecting to MongoDB...
✅ Connected to MongoDB

🔍 Searching for Pro user with email: pro4u.improvements@gmail.com
✅ Found Pro user: Walter Arevalo (ID: 507f1f77bcf86cd799439011)
📞 Current phone: +19999999999
❌ Phone number +15164449953 is already in use by another Pro user (John Doe)
```

## Safety Features

1. **Idempotent:** Can be run multiple times safely - will skip update if phone is already set
2. **Validation:** Checks if the new phone number conflicts with existing users
3. **Read-only verification:** Confirms user exists before attempting update
4. **Minimal changes:** Only updates the phone field, nothing else
5. **Error handling:** Exits gracefully with clear error messages
6. **Production-safe:** No destructive operations

## After Running

### Verify the update
You can verify the update was successful by:

1. Checking the console output for success message
2. Querying the database directly:
   ```javascript
   db.pros.findOne({ email: "pro4u.improvements@gmail.com" })
   ```
3. Testing Pro login with the updated phone number

### No rollback needed
The script only updates the phone number field. If you need to change it back, you can:
- Run the script again with a different phone number (modify line 36)
- Use MongoDB directly to update the field
- Use the admin panel if available

## Troubleshooting

### "MONGO_URI not found in environment variables"
- Ensure `.env` file exists in `server/` directory
- Check that `MONGO_URI` is properly set in `.env`
- Try running from the `server/` directory: `cd server && node scripts/updateProPhone.js`

### "Pro user with email ... not found"
- Verify the user exists in the database
- Check if the email address is correct (case-insensitive)
- Ensure you're connected to the correct database environment

### Connection errors
- Verify MongoDB connection string is correct
- Check network connectivity to MongoDB
- Ensure MongoDB server is running

## Related Scripts
- `initWalterPro.js` - Initial creation of Walter Pro user
- `backfill-pro-coords.js` - Update Pro user coordinates

## Support
For issues or questions, contact the development team.
