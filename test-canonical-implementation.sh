#!/bin/bash

# Test script to verify canonical URL implementation in local build
echo "🔍 Testing Canonical URL Implementation..."

FAILED=0
PASSED=0

# Test function
test_canonical() {
  local file="$1"
  local expected_canonical="$2"
  local description="$3"
  
  if [ -f "$file" ]; then
    canonical=$(grep -o 'rel="canonical" href="[^"]*"' "$file" | sed 's/rel="canonical" href="//g' | sed 's/"//g' || echo "NOT_FOUND")
    if [ "$canonical" = "$expected_canonical" ]; then
      echo "✅ $description: $canonical"
      ((PASSED++))
    else
      echo "❌ $description: Expected '$expected_canonical', got '$canonical'"
      ((FAILED++))
    fi
  else
    echo "❌ $description: File not found: $file"
    ((FAILED++))
  fi
}

# Test cases
test_canonical "index.html" "https://www.fixloapp.com/" "Homepage"
test_canonical "how-it-works/index.html" "https://www.fixloapp.com/how-it-works" "How It Works"
test_canonical "contact/index.html" "https://www.fixloapp.com/contact" "Contact"
test_canonical "signup/index.html" "https://www.fixloapp.com/signup" "Signup"
test_canonical "services/index.html" "https://www.fixloapp.com/services" "Services"
test_canonical "services/plumbing/index.html" "https://www.fixloapp.com/services/plumbing" "Plumbing Service"
test_canonical "services/electrical/index.html" "https://www.fixloapp.com/services/electrical" "Electrical Service"
test_canonical "pro/signup/index.html" "https://www.fixloapp.com/pro/signup" "Pro Signup"

echo ""
echo "📊 Test Results:"
echo "✅ Passed: $PASSED"
echo "❌ Failed: $FAILED"

if [ $FAILED -eq 0 ]; then
  echo "🎉 All canonical URL tests passed!"
  exit 0
else
  echo "⚠️  Some tests failed. Check the output above."
  exit 1
fi