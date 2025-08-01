#!/bin/bash
# Test script to verify the fixes

echo "🧪 Testing Fixlo Bug Fixes"
echo "=========================="

# Start server in background
cd server
npm start &
SERVER_PID=$!
sleep 5

echo "📡 Testing Service Request API..."
response=$(curl -s -X POST http://localhost:3000/api/homeowner-lead \
  -H "Content-Type: application/json" \
  -d '{
    "service": "Plumbing",
    "name": "Test User", 
    "email": "test@example.com",
    "phone": "555-1234",
    "address": "123 Test St",
    "description": "Test plumbing request"
  }')

if echo "$response" | grep -q '"success":true'; then
    echo "✅ Service Request API working"
else
    echo "❌ Service Request API failed: $response"
fi

echo "🏠 Testing Admin Route..."
admin_status=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/admin)
if [ "$admin_status" = "200" ]; then
    echo "✅ Admin route accessible"
else
    echo "❌ Admin route failed with status: $admin_status"
fi

echo "🌍 Testing Geolocation Headers..."
geolocation_header=$(curl -s -I http://localhost:3000/admin | grep -i "permissions-policy")
if echo "$geolocation_header" | grep -q "geolocation=(self)"; then
    echo "✅ Geolocation enabled"
else
    echo "❌ Geolocation not properly configured: $geolocation_header"
fi

# Clean up
kill $SERVER_PID
echo "🏁 Test complete"