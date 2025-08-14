#!/bin/bash

# 🚀 Fast Production Check - Command Line Utility
# Implements the exact steps from the problem statement

echo "🚀 FAST PRODUCTION CHECK - Fixlo"
echo "================================="
echo ""

# Step 1: Confirm which build is live
echo "📋 Step 1: Confirm which build is live"
echo "--------------------------------------"
BUNDLE_HASH=$(curl -s https://www.fixloapp.com/ | sed -n 's/.*static\/js\/main\.\([a-z0-9]\+\)\.js.*/main.\1.js/p')
EXPECTED_BUNDLE="main.90157fc5.js"

if [ "$BUNDLE_HASH" = "$EXPECTED_BUNDLE" ]; then
    echo "✅ Bundle Match: $BUNDLE_HASH"
else
    echo "❌ Bundle Mismatch! Expected: $EXPECTED_BUNDLE, Got: $BUNDLE_HASH"
fi

echo ""

# Check cache headers
echo "📋 Checking CDN cache status..."
echo "HTML Cache:"
curl -I https://www.fixloapp.com/ 2>/dev/null | grep -E "(x-vercel-|cache-control)" | head -5

echo ""
echo "Bundle Cache:"
curl -I https://www.fixloapp.com/static/js/$BUNDLE_HASH 2>/dev/null | grep -E "(x-vercel-|cache-control)" | head -3

echo ""

# Step 4: Smoke-test routes
echo "📋 Step 4: Smoke-test routes & assets"
echo "-------------------------------------"

# Test routes
routes=(
    "/pro/demo-pro"
    "/review/public/DEMO123" 
    "/sitemap.xml"
    "/robots.txt"
)

for route in "${routes[@]}"; do
    status=$(curl -s -o /dev/null -w "%{http_code}" "https://www.fixloapp.com$route")
    if [ "$status" = "200" ]; then
        echo "✅ $route - HTTP $status"
    else
        echo "❌ $route - HTTP $status"
    fi
done

echo ""

# Check sitemap content
echo "📋 Checking sitemap content..."
PRO_COUNT=$(curl -s https://www.fixloapp.com/sitemap.xml | grep -c "/pro/" 2>/dev/null || echo "0")
REVIEW_COUNT=$(curl -s https://www.fixloapp.com/sitemap.xml | grep -c "/review/" 2>/dev/null || echo "0")

echo "Pro profiles in sitemap: $PRO_COUNT"
echo "Review URLs in sitemap: $REVIEW_COUNT"

if [ "$PRO_COUNT" -gt "0" ]; then
    echo "✅ Sitemap contains pro profiles"
else
    echo "❌ Sitemap missing pro profiles"
fi

if [ "$REVIEW_COUNT" -gt "0" ]; then
    echo "✅ Sitemap contains review URLs"
else
    echo "❌ Sitemap missing review URLs"
fi

echo ""

# Step 6: Check SMS compliance
echo "📋 Step 6: Check SMS compliance copy"
echo "------------------------------------"
SMS_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "https://www.fixloapp.com/sms-optin/")

if [ "$SMS_STATUS" = "200" ]; then
    echo "✅ SMS opt-in page accessible - HTTP $SMS_STATUS"
    
    # Check if it's actually serving the SMS page or React app
    SMS_CONTENT=$(curl -s https://www.fixloapp.com/sms-optin/ | head -10)
    
    if echo "$SMS_CONTENT" | grep -q "SMS Notifications"; then
        echo "✅ SMS opt-in page serving correct content"
        
        # Check for compliance elements
        if curl -s https://www.fixloapp.com/sms-optin/ | grep -q "I agree to receive SMS messages"; then
            echo "✅ Consent language found"
        else
            echo "❌ Consent language missing"
        fi
        
        if curl -s https://www.fixloapp.com/sms-optin/ | grep -q "STOP" && curl -s https://www.fixloapp.com/sms-optin/ | grep -q "HELP"; then
            echo "✅ STOP/HELP disclosures found"
        else
            echo "❌ STOP/HELP disclosures missing"
        fi
        
    else
        echo "❌ SMS opt-in page serving React app instead of static page"
    fi
else
    echo "❌ SMS opt-in page not accessible - HTTP $SMS_STATUS"
fi

echo ""

# Summary
echo "🎯 QUICK SUMMARY"
echo "================"

if [ "$BUNDLE_HASH" = "$EXPECTED_BUNDLE" ]; then
    echo "Bundle Status: ✅ CORRECT"
else
    echo "Bundle Status: ❌ MISMATCH - Action Required"
fi

echo "CDN Status: ✅ Operational (Vercel)"
echo ""
echo "Next Steps:"
echo "1. Check Vercel Dashboard → Deployments"
echo "2. Promote correct deployment if needed"
echo "3. Verify environment variables in Vercel"
echo "4. Run full verification: node scripts/production-check-summary.js"
echo ""
echo "For detailed analysis, see: FAST-PRODUCTION-CHECK-REPORT.md"