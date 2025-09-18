#!/bin/bash

# Verify Google Search Console Indexing Fix Deployment
# Run this script after merging the PR to verify the fix is deployed

echo "🔍 Verifying Google Search Console Indexing Fix Deployment"
echo "=========================================================="
echo ""

PRODUCTION_URL="https://www.fixloapp.com"
PASSED=0
FAILED=0

check_canonical() {
    local url=$1
    local expected_canonical=$2
    local name=$3
    
    echo -n "Testing $name ($url)... "
    
    # Get the page content and check for canonical
    content=$(curl -s "$url" 2>/dev/null)
    if [ $? -ne 0 ]; then
        echo "❌ FAILED - Cannot access URL"
        ((FAILED++))
        return
    fi
    
    canonical=$(echo "$content" | grep -o '<link[^>]*rel="canonical"[^>]*>' | grep -o 'href="[^"]*"' | sed 's/href="//; s/"//')
    
    if [ "$canonical" = "$expected_canonical" ]; then
        echo "✅ PASSED - Canonical: $canonical"
        ((PASSED++))
    elif [ -z "$canonical" ]; then
        echo "❌ FAILED - No canonical tag found"
        ((FAILED++))
    else
        echo "❌ FAILED - Wrong canonical: $canonical (expected: $expected_canonical)"
        ((FAILED++))
    fi
}

echo "🔗 Testing Canonical URLs"
echo "-----------------------"

# Test main routes
check_canonical "$PRODUCTION_URL/" "https://www.fixloapp.com/" "Homepage"
check_canonical "$PRODUCTION_URL/how-it-works" "https://www.fixloapp.com/how-it-works" "How It Works"
check_canonical "$PRODUCTION_URL/contact" "https://www.fixloapp.com/contact" "Contact"
check_canonical "$PRODUCTION_URL/signup" "https://www.fixloapp.com/signup" "Signup"
check_canonical "$PRODUCTION_URL/services" "https://www.fixloapp.com/services" "Services"
check_canonical "$PRODUCTION_URL/services/plumbing" "https://www.fixloapp.com/services/plumbing" "Plumbing Services"
check_canonical "$PRODUCTION_URL/services/electrical" "https://www.fixloapp.com/services/electrical" "Electrical Services"
check_canonical "$PRODUCTION_URL/pro/signup" "https://www.fixloapp.com/pro/signup" "Pro Signup"

echo ""
echo "🔍 Testing Parameter Handling"
echo "-----------------------------"

# Test parameter stripping
test_param_url="$PRODUCTION_URL/?utm_source=google&utm_medium=cpc"
echo -n "Testing parameter handling... "
param_content=$(curl -s "$test_param_url" 2>/dev/null)
param_canonical=$(echo "$param_content" | grep -o '<link[^>]*rel="canonical"[^>]*>' | grep -o 'href="[^"]*"' | sed 's/href="//; s/"//')

if [ "$param_canonical" = "https://www.fixloapp.com/" ]; then
    echo "✅ PASSED - Parameters stripped from canonical"
    ((PASSED++))
else
    echo "❌ FAILED - Parameters not handled correctly: $param_canonical"
    ((FAILED++))
fi

echo ""
echo "📊 Summary"
echo "----------"
echo "✅ Passed: $PASSED"
echo "❌ Failed: $FAILED"
echo "📈 Success Rate: $(( PASSED * 100 / (PASSED + FAILED) ))%"

echo ""
if [ $FAILED -eq 0 ]; then
    echo "🎉 All tests passed! The Google Search Console indexing fix has been successfully deployed."
    echo ""
    echo "📋 Next Steps:"
    echo "1. Submit updated sitemap to Google Search Console"
    echo "2. Request re-indexing for affected URLs in GSC"
    echo "3. Monitor GSC for improvements in 'Duplicate without user-selected canonical' issues"
    echo "4. Expected improvement: 80-90% reduction in duplicate canonical issues within 1-2 weeks"
else
    echo "⚠️  Some tests failed. Please check the deployment or wait for cache to clear."
    echo ""
    echo "🔧 Troubleshooting:"
    echo "1. Wait 5-10 minutes for deployment to propagate"
    echo "2. Clear CDN cache if available" 
    echo "3. Check Vercel deployment logs"
    echo "4. Verify the branch being deployed contains the fixes"
fi

echo ""
echo "🔗 Useful Links:"
echo "- Google Search Console: https://search.google.com/search-console"
echo "- Submit Sitemap: https://www.fixloapp.com/sitemap.xml"
echo "- Rich Results Test: https://search.google.com/test/rich-results"