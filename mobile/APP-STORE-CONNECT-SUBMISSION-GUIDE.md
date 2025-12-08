# 📱 FIXLO APP STORE CONNECT SUBMISSION GUIDE

**Date:** December 2, 2025  
**Build:** #24  
**Version:** 1.0.3  
**Status:** Ready for Manual Submission

---

## ⚠️ IMPORTANT: MANUAL STEPS REQUIRED

App Store Connect does not support full automation. You must complete these steps manually in the web portal.

**App Store Connect URL:** https://appstoreconnect.apple.com

---

## ✅ STEP 1: ASSIGN BUILD #24

### Actions:
1. Log in to App Store Connect
2. Click **My Apps** → **Fixlo**
3. Click the **App Store** tab (left sidebar)
4. Scroll to **Build** section
5. Click the **+** icon next to Build
6. Select **Build #24 (1.0.3)** from the list
7. Click **Done**

### Verification:
- ✅ Build #24 should appear in the Build section
- ✅ Status should show version 1.0.3, build 24

---

## ✅ STEP 2: CREATE IAP SUBSCRIPTION PRODUCT

### Actions:
1. In App Store Connect, go to **My Apps** → **Fixlo**
2. Click **In-App Purchases** (left sidebar)
3. Click the **+** button (top left)
4. Select **Auto-Renewable Subscription**
5. Fill in the details:

**Product Information:**
```
Reference Name: Fixlo Pro Monthly
Product ID: com.fixloapp.mobile.pro.monthly
```

**Subscription Group:**
```
If no group exists:
  - Click "Create a subscription group"
  - Name: Fixlo Pro Subscriptions
  - Click "Create"

If group exists:
  - Select "Fixlo Pro Subscriptions"
```

**Subscription Duration:**
```
Duration: 1 Month
```

**Subscription Prices:**
```
Click "Add Subscription Price"
Price: $59.99 USD
All territories: Yes (or select specific regions)
Click "Next" → "Confirm"
```

**Localization:**
```
Language: English (U.S.)
Display Name: Fixlo Pro
Description: 
  Unlimited job leads, direct client contact, instant SMS notifications, 
  professional profile, in-app messaging, and job analytics. Grow your 
  contracting business with Fixlo Pro.
```

**Review Information (Screenshot):**
```
Upload a screenshot showing the subscription benefits
You can use a screenshot of the SubscriptionScreen from the app
```

6. Click **Save** (top right)

### Verification:
- ✅ Product ID exactly matches: `com.fixloapp.mobile.pro.monthly`
- ✅ Price is $59.99/month
- ✅ Localization is complete
- ✅ Status shows "Ready to Submit" or "Waiting for Review"

---

## ✅ STEP 3: LINK SUBSCRIPTION TO APP VERSION

### Actions:
1. Go back to **App Store** tab
2. Scroll to **In-App Purchases** section
3. Click the **+** icon
4. Search for "Fixlo Pro" or the product ID
5. Select **Fixlo Pro Monthly** (com.fixloapp.mobile.pro.monthly)
6. Click **Add**

### Verification:
- ✅ Subscription appears in the In-App Purchases list
- ✅ No warnings about "Missing In-App Purchase Metadata"

---

## ✅ STEP 4: EXPORT COMPLIANCE

### Actions:
1. In the **App Store** tab, scroll to **Export Compliance**
2. Answer the questions:

```
Does your app use encryption?
  → Select: No

OR if it asks about encryption types:
  → Select: "No, my app only uses encryption for purposes that are exempt 
    from export compliance documentation requirements"
  → Reason: "The app only uses HTTPS for network communication"
```

3. Click **Save** or **Next**

### Verification:
- ✅ Export compliance section shows "Complete"
- ✅ No yellow warning icons

---

## ✅ STEP 5: APP REVIEW INFORMATION

### Actions:
1. Scroll to **App Review Information** section
2. Fill in the contact details (if not already set):

```
First Name: Fixlo
Last Name: Support
Phone Number: [Your contact number]
Email: support@fixloapp.com (or your support email)
```

3. Scroll to **Sign-In Information** section
4. Check **Sign-in required**
5. Add demo account credentials:

```
Username: demo.pro@fixloapp.com
Password: Demo2025!
```

6. In **Notes** field, add:

```
SUBSCRIPTION TESTING INSTRUCTIONS

This app uses Apple In-App Purchase for subscriptions (compliant with Guideline 3.1.1).

TEST ACCOUNT:
Email: demo.pro@fixloapp.com
Password: Demo2025!

TESTING STEPS:
1. Launch the app
2. Tap "I am a Pro" on the home screen
3. Sign in with the demo account above
4. Tap "Subscribe to Fixlo Pro" button
5. Complete the purchase using your App Store Sandbox test account
6. The subscription unlocks all Pro features:
   - Unlimited job leads
   - Direct client contact
   - Instant notifications
   - Professional profile
   - In-app messaging
   - Job analytics

IMPORTANT:
All subscriptions use native Apple In-App Purchase. There are no external payment links or redirects (Guideline 3.1.1 compliant).

The subscription can be managed via iOS Settings → [Apple ID] → Subscriptions.
```

7. Click **Save**

### Verification:
- ✅ Demo account credentials are entered
- ✅ Notes explain the subscription flow
- ✅ Contact information is complete

---

## ✅ STEP 6: ADVERTISING IDENTIFIER (IDFA)

### Actions:
1. Scroll to **Advertising Identifier** section
2. Select: **No, this app does not use the Advertising Identifier (IDFA)**
3. Click **Save**

### Verification:
- ✅ IDFA section shows "No"

---

## ✅ STEP 7: AGE RATING (if not already set)

### Actions:
1. If Age Rating shows "None" or needs update:
2. Click **Edit** next to Age Rating
3. Answer the questionnaire:
   - Most answers should be "None" or "No"
   - The app is a business/productivity tool
4. Typical result: **4+** or **12+**
5. Click **Done**

### Verification:
- ✅ Age rating is set (not "None")

---

## ✅ STEP 8: FINAL REVIEW BEFORE SUBMISSION

### Pre-Submission Checklist:

Go through the **App Store** tab and verify:

- [ ] **Version Information**: Title, subtitle, description filled
- [ ] **What's New**: Release notes for version 1.0.3 added
- [ ] **Build**: Build #24 (1.0.3) assigned
- [ ] **Screenshots**: At least 3 screenshots uploaded for each device size
- [ ] **App Icon**: Icon is visible in the preview
- [ ] **In-App Purchases**: Fixlo Pro Monthly subscription linked
- [ ] **Export Compliance**: Answered (No encryption beyond HTTPS)
- [ ] **App Review Information**: Demo account and notes added
- [ ] **IDFA**: Set to "No"
- [ ] **Age Rating**: Set (not "None")
- [ ] **Copyright**: Year and company name set
- [ ] **Version Release**: Set to "Manually release this version" or "Automatically release"

---

## ✅ STEP 9: SUBMIT FOR REVIEW

### Actions:
1. Scroll to the top of the **App Store** tab
2. Look for the blue **Submit for Review** button (top right)
3. If the button is grayed out:
   - Check for any sections with yellow warning icons
   - Complete any missing required fields
4. Click **Submit for Review**
5. Confirm any final prompts
6. Wait for confirmation

### Expected Result:
```
Status changes from: "Prepare for Submission"
Status changes to: "Waiting for Review"
```

### Verification:
- ✅ Status shows **"Waiting for Review"**
- ✅ You receive a confirmation email from Apple
- ✅ The build appears in the Activity tab

---

## 📊 SUBMISSION STATUS SUMMARY

After completing all steps, verify this checklist:

```
BUILD ASSIGNMENT
  ✅ Build #24 assigned: [YES/NO]
  ✅ Version 1.0.3 displayed: [YES/NO]

IAP CONFIGURATION
  ✅ IAP product created: [YES/NO]
  ✅ Product ID correct: com.fixloapp.mobile.pro.monthly
  ✅ Price set: $59.99/month
  ✅ IAP linked to version: [YES/NO]

COMPLIANCE
  ✅ Export compliance complete: [YES/NO]
  ✅ IDFA set to No: [YES/NO]

REVIEW INFO
  ✅ Demo account set: demo.pro@fixloapp.com / Demo2025!
  ✅ Review notes added: [YES/NO]

SUBMISSION
  ✅ Submitted for review: [YES/NO]
  ✅ Status: [Waiting for Review / In Review / Other]
```

---

## ⏰ EXPECTED TIMELINE

After submission:

- **0-24 hours**: "Waiting for Review"
- **1-3 days**: "In Review" (Apple is actively reviewing)
- **1-5 days total**: Decision (Approved / Rejected / Need More Info)

---

## 🔔 NOTIFICATIONS

You will receive emails at the Apple ID email for:
- Submission confirmation
- Review start notification
- Approval notification
- Or rejection with reasons

---

## ❓ COMMON ISSUES

### Issue: "Missing In-App Purchase Metadata"
**Solution:** 
- Ensure the subscription product has:
  - Localized display name and description
  - Screenshot uploaded
  - Price set for at least one territory

### Issue: "Export Compliance Not Complete"
**Solution:**
- Answer the encryption question: "No" or "Exempt"
- Save the answer

### Issue: "Build Not Available"
**Solution:**
- Wait 5-10 minutes after build upload
- Refresh the page
- Ensure build completed processing

### Issue: "Cannot Submit - Missing Required Fields"
**Solution:**
- Check for yellow warning icons
- Complete all required metadata sections
- Ensure all screenshots are uploaded

---

## 📞 SUPPORT

If you encounter issues:
- **Apple Support:** https://developer.apple.com/contact/
- **App Store Connect Help:** https://help.apple.com/app-store-connect/

---

## ✅ COMPLETION CONFIRMATION

Once submitted, you should see:

```
App Store Status: Waiting for Review
Build: 1.0.3 (24)
In-App Purchases: 1 product
Submission Date: [Date/Time]
```

---

**Last Updated:** December 2, 2025  
**Prepared For:** Fixlo iOS App Submission  
**Build:** #24 (1.0.3)  
**Status:** Ready for Manual Submission in App Store Connect

