#!/bin/bash
# Lead Hunter Test Suite
# Validates all modes work correctly

set -e  # Exit on error

echo "🧪 Lead Hunter Test Suite"
echo "=========================="
echo ""

cd "$(dirname "$0")"

# Test 1: Observer Mode
echo "📍 Test 1: Observer Mode (read-only)"
echo "-----------------------------------"
node lead-hunter/index.js observer
echo ""
echo "✅ Observer mode passed"
echo ""

# Test 2: Tuning Mode
echo "📍 Test 2: Tuning Mode (read-only)"
echo "-----------------------------------"
node lead-hunter/index.js tuning
echo ""
echo "✅ Tuning mode passed"
echo ""

# Test 3: Guarded Mode (dry run)
echo "📍 Test 3: Guarded Mode (dry run)"
echo "-----------------------------------"
LEAD_HUNTER_MODE=guarded node lead-hunter/index.js guarded --dry-run
echo ""
echo "✅ Guarded mode dry run passed"
echo ""

# Test 4: Invalid Mode
echo "📍 Test 4: Invalid Mode (should fail)"
echo "-----------------------------------"
if node lead-hunter/index.js invalid 2>&1 | grep -q "Invalid mode"; then
  echo "✅ Invalid mode handling works correctly"
else
  echo "❌ Invalid mode handling failed"
  exit 1
fi
echo ""

# Test 5: Guarded Mode without opt-in
echo "📍 Test 5: Guarded Mode without opt-in (should fail)"
echo "-----------------------------------"
if node lead-hunter/index.js guarded 2>&1 | grep -q "requires explicit opt-in"; then
  echo "✅ Opt-in enforcement works correctly"
else
  echo "❌ Opt-in enforcement failed"
  exit 1
fi
echo ""

# Test 6: Help command
echo "📍 Test 6: Help Command"
echo "-----------------------------------"
node lead-hunter/index.js --help | head -5
echo "✅ Help command works"
echo ""

# Test 7: Verify generated files
echo "📍 Test 7: Verify Generated Files"
echo "-----------------------------------"
if [ -f "logs/lead-hunter-opportunities-$(date +%Y-%m-%d).json" ]; then
  echo "✅ Opportunities log created"
else
  echo "❌ Opportunities log not found"
  exit 1
fi

if [ -f "logs/lead-hunter-tuning-$(date +%Y-%m-%d).json" ]; then
  echo "✅ Tuning recommendations created"
else
  echo "❌ Tuning recommendations not found"
  exit 1
fi

if [ -d "proposals/pending" ]; then
  echo "✅ Proposals directory exists"
else
  echo "❌ Proposals directory not found"
  exit 1
fi
echo ""

# Test 8: Verify SEO Agent untouched
echo "📍 Test 8: Verify SEO Agent Untouched"
echo "-----------------------------------"
if git diff --quiet HEAD -- ../seo-agent/ 2>/dev/null || [ ! -d "../.git" ]; then
  echo "✅ SEO agent code unchanged"
else
  echo "❌ SEO agent code was modified!"
  exit 1
fi
echo ""

echo "=========================="
echo "✅ All tests passed!"
echo ""
echo "Lead Hunter is ready for deployment:"
echo "  - Observer mode: Safe to run daily"
echo "  - Tuning mode: Safe to run weekly"
echo "  - Guarded mode: Requires LEAD_HUNTER_MODE=guarded"
echo ""
echo "Next steps:"
echo "  1. Review generated files in logs/"
echo "  2. Set up cron jobs (see README.md)"
echo "  3. Monitor performance for 1-2 weeks"
echo "  4. Enable guarded mode when ready"
