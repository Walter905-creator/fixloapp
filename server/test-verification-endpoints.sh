#!/bin/bash

# Test Referral Verification Endpoints
# This script tests the new verification endpoints

echo "===================================="
echo "Testing Referral Verification Flow"
echo "===================================="
echo ""

# Test phone numbers
TEST_PHONE1="15164449953"
TEST_PHONE2="(516) 444-9953"

echo "Test 1: Send verification code with numeric phone"
echo "URL: POST /api/referrals/send-verification"
echo "Phone: $TEST_PHONE1"
echo ""

# Note: This will try to send a real SMS if Twilio is configured
# In a real test, we'd need Twilio credentials in .env

curl -X POST http://localhost:3001/api/referrals/send-verification \
  -H "Content-Type: application/json" \
  -d "{\"phone\":\"$TEST_PHONE1\",\"method\":\"sms\"}" \
  -s -w "\nHTTP Status: %{http_code}\n" || echo "Server not running"

echo ""
echo "-----------------------------------"
echo ""

echo "Test 2: Send verification code with formatted phone"
echo "Phone: $TEST_PHONE2"
echo ""

curl -X POST http://localhost:3001/api/referrals/send-verification \
  -H "Content-Type: application/json" \
  -d "{\"phone\":\"$TEST_PHONE2\",\"method\":\"sms\"}" \
  -s -w "\nHTTP Status: %{http_code}\n" || echo "Server not running"

echo ""
echo "-----------------------------------"
echo ""

echo "Test 3: Verify code (will fail without valid code)"
echo "Phone: $TEST_PHONE1"
echo "Code: 123456 (test)"
echo ""

curl -X POST http://localhost:3001/api/referrals/verify-code \
  -H "Content-Type: application/json" \
  -d "{\"phone\":\"$TEST_PHONE1\",\"code\":\"123456\"}" \
  -s -w "\nHTTP Status: %{http_code}\n" || echo "Server not running"

echo ""
echo "-----------------------------------"
echo ""

echo "Test 4: Invalid phone number"
echo "Phone: invalid"
echo ""

curl -X POST http://localhost:3001/api/referrals/send-verification \
  -H "Content-Type: application/json" \
  -d "{\"phone\":\"invalid\",\"method\":\"sms\"}" \
  -s -w "\nHTTP Status: %{http_code}\n" || echo "Server not running"

echo ""
echo "===================================="
echo "Tests Complete"
echo "===================================="
