# Pro Phone Update - Execution Guide

## Summary
This guide provides instructions for executing the database update to add a phone number to the existing Pro user account.

## What Was Done
✅ **Script Created**: `server/scripts/updateProPhone.js`  
✅ **Documentation Created**: `server/scripts/README.md`  
✅ **Safety Features Implemented**: The script includes all necessary validation and error handling  
✅ **Requirements Met**: Script follows all specified constraints

## Script Details

### Target User
- **Email**: `pro4u.improvements@gmail.com`
- **Role**: `pro` (Pro model)
- **New Phone**: `+15164449953`

### What the Script Does
1. ✅ Finds the Pro user with the specified email
2. ✅ Validates the phone number is not already in use
3. ✅ Updates ONLY the phone field
4. ✅ Provides detailed console output

### What the Script Does NOT Do
- ❌ Create new users
- ❌ Modify passwords
- ❌ Touch Stripe integration
- ❌ Touch Twilio integration
- ❌ Modify job logic
- ❌ Change any other fields

## Safety Features

1. **Idempotent**: Can be run multiple times safely
2. **Validation**: Checks for phone number conflicts
3. **Minimal Changes**: Only updates the phone field
4. **Error Handling**: Clear error messages and graceful failures
5. **Production-Safe**: No destructive operations

## Execution Instructions

### Prerequisites
- Access to production MongoDB database
- `MONGODB_URI` environment variable configured
- Node.js 18+ installed

### Option 1: Run Locally (Recommended)
```bash
# From repository root
cd server
node scripts/updateProPhone.js
```

### Option 2: Run on Production Server
If you have SSH access to the production server:
```bash
ssh your-production-server
cd /path/to/fixloapp/server
node scripts/updateProPhone.js
```

### Option 3: Use MongoDB Connection String Directly
```bash
cd server
MONGODB_URI="your-mongodb-connection-string" node scripts/updateProPhone.js
```

## Expected Output

### ✅ Successful Update
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

### ℹ️ Already Updated
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

### ❌ Error Scenarios

**User Not Found:**
```
❌ Pro user with email pro4u.improvements@gmail.com not found
```

**Phone Number Already In Use:**
```
❌ Phone number +15164449953 is already in use by another Pro user (John Doe)
```

**Missing MongoDB URI:**
```
❌ MONGODB_URI not found in environment variables
```

## Verification Steps

After running the script successfully:

1. **Check the console output** for the success message
2. **Query the database** to confirm:
   ```javascript
   db.pros.findOne({ email: "pro4u.improvements@gmail.com" })
   ```
3. **Test Pro login** with the updated phone number (if applicable)

## Troubleshooting

### MONGODB_URI not found
- Ensure `.env` file exists in `server/` directory
- Check that `MONGODB_URI` is set in `.env`
- Try running with environment variable: `MONGODB_URI="..." node scripts/updateProPhone.js`

### Connection errors
- Verify MongoDB connection string is correct
- Check network connectivity to MongoDB
- Ensure MongoDB server is running
- Verify firewall rules allow connection

### User not found
- Verify the user exists in the database
- Check email address spelling
- Ensure you're connected to the correct database environment (production vs staging)

## Why This Script Was Not Executed in CI/CD

This script requires:
- Production MongoDB credentials (`MONGODB_URI`)
- Direct database access
- Manual verification of the update

For security reasons, production database credentials are not available in the CI/CD sandboxed environment. The script must be executed manually by someone with production database access.

## Files Modified/Created

1. ✅ `server/scripts/updateProPhone.js` - The update script
2. ✅ `server/scripts/README.md` - Detailed script documentation
3. ✅ `PRO_PHONE_UPDATE_EXECUTION_GUIDE.md` - This execution guide

## Next Steps

1. **Review the script**: Ensure you understand what it does
2. **Backup the database** (recommended): Take a snapshot before running
3. **Run the script**: Execute in production environment with database access
4. **Verify the update**: Check console output and query the database
5. **Test functionality**: Confirm the Pro can receive SMS/phone calls if applicable

## Support

If you encounter any issues:
1. Check the troubleshooting section above
2. Review the console output for specific error messages
3. Verify all prerequisites are met
4. Contact the development team if needed

---

**Script Location**: `server/scripts/updateProPhone.js`  
**Documentation**: `server/scripts/README.md`  
**Created**: December 24, 2025  
**Status**: Ready for execution
