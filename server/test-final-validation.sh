#!/bin/bash

echo "################################################################################"
echo "# Final Validation: Deterministic MongoDB Connection Behavior"
echo "################################################################################"
echo ""

# Test 1: Missing MONGO_URI
echo "TEST 1: Server should exit when MONGO_URI is missing"
echo "================================================================"
node index.js > /tmp/test1.log 2>&1
EXIT_CODE=$?
echo "Exit code: $EXIT_CODE"
grep -E "MONGO_URI is missing|FATAL ERROR" /tmp/test1.log | head -3
if [ $EXIT_CODE -eq 1 ]; then
  echo "✅ PASS: Server exits with code 1"
else
  echo "❌ FAIL: Server exit code was $EXIT_CODE (expected 1)"
fi
echo ""

# Test 2: Malformed MONGO_URI
echo "TEST 2: Server should exit when MONGO_URI is malformed"
echo "================================================================"
MONGO_URI="invalid-uri" node index.js > /tmp/test2.log 2>&1
EXIT_CODE=$?
echo "Exit code: $EXIT_CODE"
grep -E "MALFORMED URI|FATAL ERROR" /tmp/test2.log | head -3
if [ $EXIT_CODE -eq 1 ]; then
  echo "✅ PASS: Server exits with code 1"
else
  echo "❌ FAIL: Server exit code was $EXIT_CODE (expected 1)"
fi
echo ""

# Test 3: Unreachable MongoDB
echo "TEST 3: Server should exit when MongoDB is unreachable"
echo "================================================================"
MONGO_URI="mongodb://192.0.2.1:27017/test" node index.js > /tmp/test3.log 2>&1
EXIT_CODE=$?
echo "Exit code: $EXIT_CODE"
grep -E "Connecting to Mongo|MongoDB FAILED|Server startup FAILED" /tmp/test3.log | head -5
if [ $EXIT_CODE -eq 1 ]; then
  echo "✅ PASS: Server exits with code 1"
else
  echo "❌ FAIL: Server exit code was $EXIT_CODE (expected 1)"
fi
echo ""

# Test 4: Check for DB-less mode
echo "TEST 4: Verify no DB-less mode exists"
echo "================================================================"
if grep -q "DB-less mode\|without database connection" /tmp/test*.log; then
  echo "❌ FAIL: DB-less mode still exists"
  grep "DB-less\|without database" /tmp/test*.log
else
  echo "✅ PASS: No DB-less mode detected"
fi
echo ""

echo "################################################################################"
echo "# Summary"
echo "################################################################################"
echo "All tests verify deterministic MongoDB connection behavior:"
echo "  - Server fails to start without valid MONGO_URI"
echo "  - Server fails to start with invalid MONGO_URI"
echo "  - Server fails to start when MongoDB is unreachable"
echo "  - No DB-less mode or silent fallback exists"
echo ""
