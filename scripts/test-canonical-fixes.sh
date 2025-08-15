#!/bin/bash

# Test canonical URL fixes locally
echo "🔍 Testing Canonical URL Fixes"
echo "================================"

BUILD_DIR="client/build"

if [ ! -d "$BUILD_DIR" ]; then
  echo "❌ Build directory not found. Please run 'npm run build' first."
  exit 1
fi

ROUTES=(
  "/"
  "/how-it-works"
  "/contact"
  "/services"
  "/services/plumbing"
  "/signup"
  "/pro/signup"
)

EXPECTED_CANONICALS=(
  "https://www.fixloapp.com/"
  "https://www.fixloapp.com/how-it-works"
  "https://www.fixloapp.com/contact"
  "https://www.fixloapp.com/services"
  "https://www.fixloapp.com/services/plumbing"
  "https://www.fixloapp.com/signup"
  "https://www.fixloapp.com/pro/signup"
)

ALL_PASSED=true

for i in "${!ROUTES[@]}"; do
  route="${ROUTES[i]}"
  expected="${EXPECTED_CANONICALS[i]}"
  
  # Determine file path
  if [ "$route" = "/" ]; then
    file_path="$BUILD_DIR/index.html"
  else
    file_path="$BUILD_DIR$route/index.html"
  fi
  
  if [ ! -f "$file_path" ]; then
    echo "❌ $route: File not found ($file_path)"
    ALL_PASSED=false
    continue
  fi
  
  # Extract canonical URL
  canonical=$(grep -o 'canonical" href="[^"]*"' "$file_path" | sed 's/canonical" href="//; s/"//')
  
  if [ "$canonical" = "$expected" ]; then
    echo "✅ $route: $canonical"
  else
    echo "❌ $route: Expected $expected, got $canonical"
    ALL_PASSED=false
  fi
done

echo ""
if [ "$ALL_PASSED" = true ]; then
  echo "🎉 All canonical URLs are correctly set!"
  echo ""
  echo "📈 Expected Impact on Google Search Console:"
  echo "  • 'Duplicate without user-selected canonical' should decrease from 408 pages"
  echo "  • Each route now has its own unique canonical URL"
  echo "  • Search engines will see correct canonical URLs immediately"
  echo ""
  echo "🚀 Deploy these changes to production to fix the indexing issues!"
else
  echo "❌ Some canonical URLs need fixing. Please check the build process."
fi