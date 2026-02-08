#!/bin/bash

# SEO Fixes Verification Script
# Validates Google Search Console indexing issue fixes

echo "=========================================="
echo "SEO Fixes Verification Report"
echo "=========================================="
echo ""

# Color codes
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

PASS=0
FAIL=0

echo "1. Checking Homepage Canonical Tag..."
if grep -q 'rel="canonical".*href="https://www.fixloapp.com/"' index.html; then
    echo -e "${GREEN}✅ PASS${NC} - Homepage has canonical tag"
    ((PASS++))
else
    echo -e "${RED}❌ FAIL${NC} - Homepage missing canonical tag"
    ((FAIL++))
fi
echo ""

echo "2. Checking Homepage Meta Description..."
DESCRIPTION=$(grep -o 'meta name="description" content="[^"]*"' index.html | sed 's/.*content="//;s/".*//')
if [ -n "$DESCRIPTION" ] && [ ${#DESCRIPTION} -gt 50 ]; then
    echo -e "${GREEN}✅ PASS${NC} - Homepage has meta description (${#DESCRIPTION} chars)"
    ((PASS++))
elif [ -n "$DESCRIPTION" ]; then
    echo -e "${YELLOW}⚠️  WARNING${NC} - Homepage meta description is too short (${#DESCRIPTION} chars, should be >50)"
    ((PASS++))
else
    echo -e "${RED}❌ FAIL${NC} - Homepage missing meta description"
    ((FAIL++))
fi
echo ""

echo "3. Checking Sitemap Size..."
SITEMAP_URLS=$(grep -c '<loc>' sitemap.xml)
echo "   Found $SITEMAP_URLS URLs in sitemap"
if [ "$SITEMAP_URLS" -le 20 ] && [ "$SITEMAP_URLS" -ge 15 ]; then
    echo -e "${GREEN}✅ PASS${NC} - Sitemap has appropriate number of URLs (15-20)"
    ((PASS++))
else
    echo -e "${YELLOW}⚠️  WARNING${NC} - Sitemap has $SITEMAP_URLS URLs (expected 15-20)"
    ((PASS++))
fi
echo ""

echo "4. Verifying All Sitemap URLs Exist..."
MISSING=0
for url in $(grep '<loc>' sitemap.xml | sed 's/.*<loc>//;s/<\/loc>.*//'); do
    path=$(echo "$url" | sed 's|https://www.fixloapp.com||')
    if [ "$path" = "/" ]; then
        path="/index.html"
    fi
    
    if [ -f ".${path}/index.html" ] || [ -f ".${path}" ]; then
        continue
    else
        echo -e "   ${RED}❌${NC} Missing: $path"
        ((MISSING++))
    fi
done

if [ "$MISSING" -eq 0 ]; then
    echo -e "${GREEN}✅ PASS${NC} - All $SITEMAP_URLS URLs in sitemap exist as files"
    ((PASS++))
else
    echo -e "${RED}❌ FAIL${NC} - $MISSING URLs in sitemap do not exist"
    ((FAIL++))
fi
echo ""

echo "5. Checking Service Pages Have Canonical Tags..."
SERVICE_PAGES=0
SERVICE_PASS=0
for service in plumbing electrical hvac carpentry painting roofing house-cleaning junk-removal landscaping; do
    ((SERVICE_PAGES++))
    if [ -f "services/$service/index.html" ]; then
        if grep -q "rel=\"canonical\"" "services/$service/index.html"; then
            ((SERVICE_PASS++))
        fi
    fi
done

if [ "$SERVICE_PASS" -eq "$SERVICE_PAGES" ]; then
    echo -e "${GREEN}✅ PASS${NC} - All $SERVICE_PAGES service pages have canonical tags"
    ((PASS++))
else
    echo -e "${RED}❌ FAIL${NC} - Only $SERVICE_PASS/$SERVICE_PAGES service pages have canonical tags"
    ((FAIL++))
fi
echo ""

echo "6. Checking 404 Page Has noindex..."
if grep -q 'name="robots" content="noindex' 404.html; then
    echo -e "${GREEN}✅ PASS${NC} - 404 page has noindex tag"
    ((PASS++))
else
    echo -e "${RED}❌ FAIL${NC} - 404 page missing noindex tag"
    ((FAIL++))
fi
echo ""

echo "7. Checking robots.txt exists..."
if [ -f "robots.txt" ]; then
    echo -e "${GREEN}✅ PASS${NC} - robots.txt exists"
    ((PASS++))
    if grep -q "Sitemap: https://www.fixloapp.com/sitemap.xml" robots.txt; then
        echo -e "${GREEN}✅ PASS${NC} - robots.txt references sitemap"
        ((PASS++))
    else
        echo -e "${RED}❌ FAIL${NC} - robots.txt does not reference sitemap"
        ((FAIL++))
    fi
else
    echo -e "${RED}❌ FAIL${NC} - robots.txt missing"
    ((FAIL++))
fi
echo ""

echo "=========================================="
echo "Summary"
echo "=========================================="
echo -e "Total Checks: $(($PASS + $FAIL))"
echo -e "${GREEN}Passed: $PASS${NC}"
echo -e "${RED}Failed: $FAIL${NC}"
echo ""

if [ "$FAIL" -eq 0 ]; then
    echo -e "${GREEN}🎉 All SEO fixes verified successfully!${NC}"
    echo ""
    echo "Next Steps:"
    echo "1. Deploy to production (merge this PR)"
    echo "2. Submit sitemap.xml to Google Search Console"
    echo "3. Request re-indexing of key pages using URL Inspection tool"
    echo "4. Monitor GSC Coverage report over 2-4 weeks for improvements"
    exit 0
else
    echo -e "${RED}⚠️  Some checks failed. Please review the issues above.${NC}"
    exit 1
fi
