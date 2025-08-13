#!/bin/bash

# 🎯 Feature Verification Script - Production vs New Build
# Compares current production bundle with new build to show missing features

echo "🎯 FIXLO FEATURE VERIFICATION - PRODUCTION vs NEW BUILD"
echo "========================================================="
echo ""

echo "📦 Bundle Analysis:"
echo "Production Bundle: main.7a416ca8.js (current live)"
echo "New Build Bundle:  main.775c389d.js (ready to deploy)"
echo ""

echo "🔍 Feature Comparison:"
echo ""

echo "1. Share Profile Features:"
PROD_SHARE=$(curl -s "https://www.fixloapp.com/static/js/main.7a416ca8.js" | grep -o "Share" | wc -l)
NEW_SHARE=$(grep -o "Share" static/js/main.775c389d.js | wc -l)
echo "   Production: $PROD_SHARE references"
echo "   New Build:  $NEW_SHARE references"
echo "   Status: $([ $NEW_SHARE -gt $PROD_SHARE ] && echo "✅ ENHANCED" || echo "❌ MISSING")"
echo ""

echo "2. UTM Parameter Tracking:"
PROD_UTM=$(curl -s "https://www.fixloapp.com/static/js/main.7a416ca8.js" | grep -o "utm_" | wc -l)
NEW_UTM=$(grep -o "utm_" static/js/main.775c389d.js | wc -l)
echo "   Production: $PROD_UTM parameters"
echo "   New Build:  $NEW_UTM parameters"
echo "   Status: $([ $NEW_UTM -gt $PROD_UTM ] && echo "✅ IMPLEMENTED" || echo "❌ MISSING")"
echo ""

echo "3. Badge System:"
PROD_BADGE=$(curl -s "https://www.fixloapp.com/static/js/main.7a416ca8.js" | grep -o "Badge" | wc -l)
NEW_BADGE=$(grep -o "Badge" static/js/main.775c389d.js | wc -l)
echo "   Production: $PROD_BADGE references"
echo "   New Build:  $NEW_BADGE references"
echo "   Status: $([ $NEW_BADGE -gt $PROD_BADGE ] && echo "✅ ENHANCED" || echo "❌ MISSING")"
echo ""

echo "4. Feature Flags:"
PROD_FEATURE=$(curl -s "https://www.fixloapp.com/static/js/main.7a416ca8.js" | grep -o "featureFlags" | wc -l)
NEW_FEATURE=$(grep -o "featureFlags" static/js/main.775c389d.js | wc -l)
echo "   Production: $PROD_FEATURE references"
echo "   New Build:  $NEW_FEATURE references"
echo "   Status: $([ $NEW_FEATURE -gt $PROD_FEATURE ] && echo "✅ IMPLEMENTED" || echo "❌ MISSING")"
echo ""

echo "📋 SUMMARY:"
echo "=========="
if [ $NEW_UTM -gt $PROD_UTM ] && [ $NEW_SHARE -gt $PROD_SHARE ] && [ $NEW_BADGE -gt $PROD_BADGE ]; then
    echo "✅ NEW BUILD CONTAINS ENHANCED FEATURE SET"
    echo "🚀 READY FOR DEPLOYMENT TO PRODUCTION"
else
    echo "❌ NEW BUILD MISSING SOME FEATURES"
fi
echo ""

echo "🎯 Next Action: Deploy new build to make features live on www.fixloapp.com"