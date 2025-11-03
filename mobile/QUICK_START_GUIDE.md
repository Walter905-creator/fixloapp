# Quick Start Guide - Apple App Store Submission

**Build**: 6 | **Version**: 1.0.0 | **Status**: READY ✅

---

## 🚀 Fast Track to Submission (2-3 hours)

### Prerequisites
- Apple Developer Account ($99/year)
- Access to App Store Connect
- iOS device or Mac with Xcode (for screenshots)

---

## Step 1: Configure In-App Purchase (15 min)

**App Store Connect → Your App → Features → In-App Purchases**

1. Click "+" to add new subscription
2. Select "Auto-Renewable Subscription"
3. Create group: "Fixlo Pro"
4. Add subscription:
   - Product ID: `com.fixloapp.mobile.pro.monthly`
   - Duration: 1 month
   - Price: Tier 29 ($59.99 USD)
   - Description: "Unlimited job leads for professionals"
5. Save and submit for review

---

## Step 2: Capture Screenshots (30 min)

**Required Sizes:**
- iPhone 6.7": 1290 x 2796 pixels (5 screenshots minimum)
- iPad 12.9": 2048 x 2732 pixels (5 screenshots minimum)

**Method 1 - Using Simulator:**
```bash
cd mobile
npx expo start --ios
# Navigate to each screen
# Press Cmd+S to save screenshots
```

**Screens to Capture:**
1. Welcome screen (with both user type buttons)
2. Homeowner dashboard (with action buttons)
3. Job request form (showing input fields)
4. Pro dashboard (showing benefits)
5. Pro subscription (showing $59.99 pricing)

---

## Step 3: Build for Production (20 min build + 30 min processing)

```bash
cd mobile
npm run eas:build:prod:ios
```

**What happens:**
- Uploads code to EAS servers
- Builds iOS app (15-20 minutes)
- Downloads .ipa file

**After build completes:**
- Use Transporter app to upload .ipa to App Store Connect
- Wait for processing (30-60 minutes)

---

## Step 4: Configure App Store Connect (30 min)

**App Store Connect → Your App → 1.0 Prepare for Submission**

1. **App Information**
   - Category: Lifestyle
   - Age Rating: 4+

2. **URLs**
   - Privacy: https://fixloapp.com/privacy-policy.html
   - Terms: https://fixloapp.com/terms.html
   - Support: https://fixloapp.com/support

3. **Description** (use template from APPLE_APP_STORE_READINESS.md)

4. **Keywords**: `home services,handyman,contractor,plumber,repairs`

5. **Screenshots**: Upload captured screenshots

6. **Build**: Select build 6

7. **Pricing**: Free (Pro subscription is IAP)

---

## Step 5: Submit for Review (5 min)

1. Review all information
2. Add notes for reviewer:
   ```
   This app connects homeowners with service professionals.
   Pro subscription uses native Apple In-App Purchase.
   Test account: test@fixloapp.com / TestPass123
   ```
3. Click "Submit for Review"

**Apple Review Time:** Typically 24-48 hours

---

## ✅ What's Already Done

- [x] Privacy Manifest (mandatory 2024 requirement)
- [x] Professional app icons
- [x] Native IAP implementation
- [x] iPad support and responsiveness
- [x] Permission descriptions
- [x] Build configuration

---

## 🚨 Common Mistakes to Avoid

❌ Don't submit without IAP configured in App Store Connect  
❌ Don't use only login screenshots  
❌ Don't skip iPad testing  
❌ Don't forget privacy policy URL  

✅ Do configure IAP first  
✅ Do show actual app features in screenshots  
✅ Do test on iPad  
✅ Do add all required URLs  

---

## 📞 Need Help?

**Full Documentation:**
- `APPLE_APP_STORE_READINESS.md` - Complete guide
- `FINAL_SUBMISSION_CHECKLIST.md` - Detailed checklist
- `APP_STORE_SUBMISSION_GUIDE.md` - Previous fixes

**External Resources:**
- [Apple Review Guidelines](https://developer.apple.com/app-store/review/guidelines/)
- [Expo Submission Guide](https://docs.expo.dev/submit/ios/)

---

## Timeline Summary

| Task | Duration |
|------|----------|
| IAP Configuration | 15 min |
| Screenshot Capture | 30 min |
| Production Build | 50 min |
| App Store Setup | 30 min |
| Submit | 5 min |
| **Total** | **~2.5 hours** |
| Apple Review | 24-48 hours |

---

**You're ready! Follow these steps and your app will be in the App Store soon.** 🚀

*Last Updated: November 3, 2024*
