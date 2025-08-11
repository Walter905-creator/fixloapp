#!/bin/bash

# Fixlo Development Health Check Script
# Run this to verify your development environment is set up correctly

echo "🔍 Fixlo Development Environment Health Check"
echo "=============================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if we're in the right directory
if [ ! -f "package.json" ] || [ ! -d "server" ] || [ ! -d "client" ]; then
    echo -e "${RED}❌ Not in Fixlo root directory. Please run from the main project folder.${NC}"
    exit 1
fi

echo -e "${GREEN}✅ In correct Fixlo directory${NC}"

# Check if server is running
echo ""
echo "🔍 Checking backend server (port 3001)..."
if curl -s http://localhost:3001/api/health > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Backend server is running on port 3001${NC}"
    BACKEND_RUNNING=true
else
    echo -e "${RED}❌ Backend server is NOT running on port 3001${NC}"
    echo -e "${YELLOW}   To start: cd server && npm start${NC}"
    BACKEND_RUNNING=false
fi

# Check if frontend is running  
echo ""
echo "🔍 Checking frontend server (port 3000)..."
if curl -s http://localhost:3000 > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Frontend is accessible on port 3000${NC}"
    FRONTEND_RUNNING=true
else
    echo -e "${YELLOW}⚠️  Frontend is not running on port 3000${NC}"
    echo -e "${YELLOW}   To start: npm run build && npx serve -s . -p 3000${NC}"
    FRONTEND_RUNNING=false
fi

# Test API endpoint if backend is running
if [ "$BACKEND_RUNNING" = true ]; then
    echo ""
    echo "🧪 Testing service request API..."
    API_RESPONSE=$(curl -s -X POST http://localhost:3001/api/service-request \
        -H "Content-Type: application/json" \
        -d '{
            "serviceType": "Test",
            "name": "Health Check",
            "phone": "555-0000",
            "email": "test@healthcheck.com",
            "address": "Health Check Address",
            "description": "Automated health check test",
            "urgency": "low"
        }' 2>/dev/null)
    
    if echo "$API_RESPONSE" | grep -q '"success":true'; then
        echo -e "${GREEN}✅ Service request API is working correctly${NC}"
        API_WORKING=true
    else
        echo -e "${RED}❌ Service request API failed${NC}"
        echo -e "${YELLOW}   Response: $API_RESPONSE${NC}"
        API_WORKING=false
    fi
fi

# Check environment files
echo ""
echo "🔍 Checking environment configuration..."

if [ -f "server/.env" ]; then
    echo -e "${GREEN}✅ Server .env file exists${NC}"
    if grep -q "PORT=3001" server/.env; then
        echo -e "${GREEN}   ✅ PORT configured correctly${NC}"
    else
        echo -e "${YELLOW}   ⚠️  PORT not set to 3001 in server/.env${NC}"
    fi
    
    if grep -q "CORS_ALLOWED_ORIGINS" server/.env; then
        echo -e "${GREEN}   ✅ CORS_ALLOWED_ORIGINS configured${NC}"
    else
        echo -e "${YELLOW}   ⚠️  CORS_ALLOWED_ORIGINS not configured${NC}"
    fi
else
    echo -e "${RED}❌ Server .env file missing${NC}"
fi

if [ -f "client/.env" ]; then
    echo -e "${GREEN}✅ Client .env file exists${NC}"
    if grep -q "REACT_APP_API_URL=http://localhost:3001" client/.env; then
        echo -e "${GREEN}   ✅ API URL configured for localhost development${NC}"
    else
        echo -e "${YELLOW}   ⚠️  API URL may not be configured for localhost${NC}"
    fi
else
    echo -e "${YELLOW}⚠️  Client .env file missing (using defaults)${NC}"
fi

# Summary
echo ""
echo "📊 Health Check Summary"
echo "======================"

if [ "$BACKEND_RUNNING" = true ] && [ "$API_WORKING" = true ]; then
    echo -e "${GREEN}🎉 Your Fixlo development environment is ready!${NC}"
    echo ""
    echo "Next steps:"
    echo "• Open http://localhost:3000 to use the app"
    echo "• Click a service button to test service requests"
    echo "• Check server logs for API activity"
    
    if [ "$FRONTEND_RUNNING" = false ]; then
        echo ""
        echo "Optional: Start frontend with: npm run build && npx serve -s . -p 3000"
    fi
else
    echo -e "${RED}⚠️  Development environment needs setup${NC}"
    echo ""
    echo "Required actions:"
    
    if [ "$BACKEND_RUNNING" = false ]; then
        echo "1. Start backend server: cd server && npm start"
    fi
    
    if [ "$FRONTEND_RUNNING" = false ]; then
        echo "2. Build and start frontend: npm run build && npx serve -s . -p 3000"
    fi
    
    echo ""
    echo "Then run this script again to verify setup."
fi

echo ""
echo "📚 For detailed setup instructions, see: DEVELOPMENT-SETUP.md"