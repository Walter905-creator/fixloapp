#!/bin/bash

# Global Expansion Validation Script
# Tests all implemented features for the international expansion

echo "🌍 Fixlo Global Expansion Validation"
echo "===================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Start server
echo "Starting server..."
cd /home/runner/work/fixloapp/fixloapp/server
node index.js > /tmp/expansion-test-server.log 2>&1 &
SERVER_PID=$!
echo "Server PID: $SERVER_PID"
sleep 8

# Base URL
BASE_URL="http://localhost:3001"

# Test counter
PASSED=0
FAILED=0

# Test function
test_endpoint() {
  local name="$1"
  local url="$2"
  local expected_status="${3:-200}"
  
  response=$(curl -s -o /dev/null -w "%{http_code}" "$url")
  
  if [ "$response" = "$expected_status" ]; then
    echo -e "${GREEN}✓${NC} $name (HTTP $response)"
    ((PASSED++))
    return 0
  else
    echo -e "${RED}✗${NC} $name (Expected $expected_status, got $response)"
    ((FAILED++))
    return 1
  fi
}

# Test with JSON validation
test_json_endpoint() {
  local name="$1"
  local url="$2"
  local jq_filter="$3"
  
  response=$(curl -s "$url")
  result=$(echo "$response" | jq -r "$jq_filter" 2>/dev/null)
  
  if [ "$result" != "null" ] && [ "$result" != "" ]; then
    echo -e "${GREEN}✓${NC} $name: $result"
    ((PASSED++))
    return 0
  else
    echo -e "${RED}✗${NC} $name (Invalid response)"
    ((FAILED++))
    return 1
  fi
}

echo "Phase 1: Country Detection Tests"
echo "---------------------------------"
test_endpoint "Health Check" "$BASE_URL/api/health"
test_endpoint "Country Detection" "$BASE_URL/api/country/detect"
test_endpoint "Supported Countries" "$BASE_URL/api/country/supported"
test_json_endpoint "US Country Info" "$BASE_URL/api/country/info/US" ".data.name"
test_json_endpoint "CA Country Info" "$BASE_URL/api/country/info/CA" ".data.name"
test_json_endpoint "GB Country Info" "$BASE_URL/api/country/info/GB" ".data.name"
test_json_endpoint "Cache Stats" "$BASE_URL/api/country/cache-stats" ".data.cacheTimeout"
echo ""

echo "Phase 2: Pricing Engine Tests"
echo "------------------------------"
test_json_endpoint "US Pricing" "$BASE_URL/api/pricing/US/proMonthlySubscription" ".data.price.formatted"
test_json_endpoint "Canada Pricing" "$BASE_URL/api/pricing/CA/proMonthlySubscription" ".data.price.formatted"
test_json_endpoint "UK Pricing" "$BASE_URL/api/pricing/GB/proMonthlySubscription" ".data.price.formatted"
test_json_endpoint "Australia Pricing" "$BASE_URL/api/pricing/AU/proMonthlySubscription" ".data.price.formatted"
test_json_endpoint "Mexico Pricing" "$BASE_URL/api/pricing/MX/proMonthlySubscription" ".data.price.formatted"
test_json_endpoint "Brazil Pricing" "$BASE_URL/api/pricing/BR/proMonthlySubscription" ".data.price.formatted"
test_json_endpoint "Currency Conversion Rate CA" "$BASE_URL/api/pricing/CA/proMonthlySubscription" ".data.price.conversionRate"
test_json_endpoint "Currency Conversion Rate MX" "$BASE_URL/api/pricing/MX/proMonthlySubscription" ".data.price.conversionRate"
echo ""

echo "Phase 3: Terms of Service (File Check)"
echo "---------------------------------------"
if [ -f "/home/runner/work/fixloapp/fixloapp/client/src/pages/Terms.jsx" ]; then
  if grep -q "Country-Specific" "/home/runner/work/fixloapp/fixloapp/client/src/pages/Terms.jsx"; then
    echo -e "${GREEN}✓${NC} Terms.jsx contains country-specific content"
    ((PASSED++))
  else
    echo -e "${RED}✗${NC} Terms.jsx missing country-specific content"
    ((FAILED++))
  fi
  
  if grep -q "NO REFUND POLICY" "/home/runner/work/fixloapp/fixloapp/client/src/pages/Terms.jsx"; then
    echo -e "${GREEN}✓${NC} Terms.jsx contains global no-refund policy"
    ((PASSED++))
  else
    echo -e "${RED}✗${NC} Terms.jsx missing no-refund policy"
    ((FAILED++))
  fi
else
  echo -e "${RED}✗${NC} Terms.jsx file not found"
  ((FAILED++))
fi
echo ""

echo "Phase 4: SEO & Sitemap Tests"
echo "-----------------------------"
if [ -f "/home/runner/work/fixloapp/fixloapp/sitemap.xml" ]; then
  country_count=$(grep -c "country/" /home/runner/work/fixloapp/fixloapp/sitemap.xml)
  if [ "$country_count" -ge 11 ]; then
    echo -e "${GREEN}✓${NC} Sitemap contains $country_count country pages (expected 11)"
    ((PASSED++))
  else
    echo -e "${RED}✗${NC} Sitemap contains only $country_count country pages (expected 11)"
    ((FAILED++))
  fi
else
  echo -e "${RED}✗${NC} Sitemap file not found"
  ((FAILED++))
fi

if [ -f "/home/runner/work/fixloapp/fixloapp/client/src/routes/CountryPage.jsx" ]; then
  echo -e "${GREEN}✓${NC} CountryPage.jsx exists"
  ((PASSED++))
  
  if grep -q "hreflang" "/home/runner/work/fixloapp/fixloapp/client/src/routes/CountryPage.jsx"; then
    echo -e "${GREEN}✓${NC} CountryPage.jsx contains hreflang tags"
    ((PASSED++))
  else
    echo -e "${RED}✗${NC} CountryPage.jsx missing hreflang tags"
    ((FAILED++))
  fi
else
  echo -e "${RED}✗${NC} CountryPage.jsx file not found"
  ((FAILED++))
fi
echo ""

echo "Phase 5: Legal & Compliance Tests"
echo "----------------------------------"
test_endpoint "US Compliance" "$BASE_URL/api/compliance/US"
test_endpoint "Canada Compliance" "$BASE_URL/api/compliance/CA"
test_endpoint "UK Compliance" "$BASE_URL/api/compliance/GB"
test_json_endpoint "US Tax Config" "$BASE_URL/api/compliance/tax/US" ".data.config.taxType"
test_json_endpoint "UK VAT Rate" "$BASE_URL/api/compliance/tax/GB" ".data.config.taxRate"
test_json_endpoint "Brazil Tax Type" "$BASE_URL/api/compliance/tax/BR" ".data.config.taxType"
test_json_endpoint "UK Tax Calculation" "$BASE_URL/api/compliance/tax/GB?amount=100" ".data.calculation.amount"
test_json_endpoint "Mexico Tax Included" "$BASE_URL/api/compliance/tax/MX" ".data.config.taxIncluded"
echo ""

echo "Phase 6: Configuration Files Check"
echo "-----------------------------------"
files=(
  "/home/runner/work/fixloapp/fixloapp/server/config/countries.js"
  "/home/runner/work/fixloapp/fixloapp/server/config/pricing.js"
  "/home/runner/work/fixloapp/fixloapp/server/config/taxes.js"
  "/home/runner/work/fixloapp/fixloapp/server/utils/countryDetection.js"
  "/home/runner/work/fixloapp/fixloapp/server/utils/compliance.js"
  "/home/runner/work/fixloapp/fixloapp/server/routes/country.js"
  "/home/runner/work/fixloapp/fixloapp/server/routes/pricing.js"
  "/home/runner/work/fixloapp/fixloapp/server/routes/compliance.js"
  "/home/runner/work/fixloapp/fixloapp/client/src/utils/countryDetection.js"
)

for file in "${files[@]}"; do
  if [ -f "$file" ]; then
    echo -e "${GREEN}✓${NC} $(basename $file) exists"
    ((PASSED++))
  else
    echo -e "${RED}✗${NC} $(basename $file) NOT FOUND"
    ((FAILED++))
  fi
done
echo ""

# Kill server
kill $SERVER_PID 2>/dev/null
sleep 2

# Summary
echo "=================================="
echo "Test Results Summary"
echo "=================================="
echo -e "Passed: ${GREEN}$PASSED${NC}"
echo -e "Failed: ${RED}$FAILED${NC}"
echo "Total: $((PASSED + FAILED))"
echo ""

if [ $FAILED -eq 0 ]; then
  echo -e "${GREEN}✅ All tests passed!${NC}"
  exit 0
else
  echo -e "${YELLOW}⚠️  Some tests failed. Review above output.${NC}"
  exit 1
fi
