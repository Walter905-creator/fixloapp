# AI Assistant Network Error - Troubleshooting Guide

## Issue Description
The AI Assistant component shows "Network Error" when trying to communicate with the backend API.

**Error Example:**
```
AIAssistant.jsx:39 AI Assistant error: Sn {message: 'Network Error', name: 'AxiosError', code: 'ERR_NETWORK', config: {…}, request: XMLHttpRequest, …}
```

## Root Cause
The network error occurs when the backend server is not running or not accessible on the expected port (3001).

## Solution

### Quick Fix - Use the Startup Script
```bash
# Make sure you're in the project root directory
./start-development.sh
```

This script will:
- Install all dependencies
- Start the backend server on port 3001
- Build and serve the frontend on port 3000
- Verify both services are running

### Manual Setup

#### 1. Start the Backend Server
```bash
cd server
npm install
npm start
```

**Expected Output:**
```
🚀 Fixlo Backend running on port 3001
✅ CORS Configuration loaded
```

#### 2. Build and Serve the Frontend
```bash
cd client
npm install
npm run build
cd build
python3 -m http.server 3000
```

Or serve the frontend using any static server:
```bash
npx serve -s client/build -p 3000
```

#### 3. Test the AI Assistant
1. Open http://localhost:3000/#/ai-assistant
2. Type a question like "How do I fix a leaky faucet?"
3. Click send - you should get a detailed response

## Verification Steps

### 1. Check Backend Health
```bash
curl http://localhost:3001/api/health
```
**Expected Response:**
```json
{"status":"healthy","timestamp":"...","environment":"development"}
```

### 2. Test AI Endpoint Directly
```bash
curl -X POST http://localhost:3001/api/ai/ask \
  -H "Content-Type: application/json" \
  -H "Origin: http://localhost:3000" \
  -d '{"message":"Test question"}'
```

### 3. Check CORS Configuration
The server logs should show:
```
✅ Origin "http://localhost:3000" is allowed
```

## Environment Configuration

### Client Environment (.env in client/)
```bash
REACT_APP_API_URL=http://localhost:3001
```

### Server Environment (.env in server/)
```bash
PORT=3001
NODE_ENV=development
CORS_ALLOWED_ORIGINS=http://localhost:3000,http://localhost:3001
```

## Common Issues and Solutions

### Issue: Port 3001 is busy
```bash
# Find and kill the process using port 3001
lsof -ti:3001 | xargs kill -9
```

### Issue: Port 3000 is busy
```bash
# Find and kill the process using port 3000
lsof -ti:3000 | xargs kill -9
```

### Issue: CORS errors
Make sure the CORS_ALLOWED_ORIGINS includes your frontend URL:
```bash
export CORS_ALLOWED_ORIGINS="http://localhost:3000,http://localhost:3001"
```

### Issue: Dependencies not installed
```bash
# Install all dependencies
cd server && npm install && cd ..
cd client && npm install && cd ..
```

## Production Notes

In production, the AI Assistant uses:
- Frontend: https://fixloapp.com
- Backend: https://fixloapp.onrender.com
- Environment: REACT_APP_API_URL=https://fixloapp.onrender.com

The system includes smart fallback responses when OpenAI API is not configured, so it works even without external AI services.

## Success Indicators

When working correctly, you should see:
1. Backend server running on port 3001
2. Frontend accessible on port 3000
3. AI Assistant responds to questions
4. Server logs show successful API calls
5. No network errors in browser console

## Screenshots

The AI Assistant should look and work like this when properly configured:
- Clean interface with message input
- Immediate responses to questions
- Formatted markdown responses
- No error messages in console

For additional support, check the server logs and browser console for specific error messages.