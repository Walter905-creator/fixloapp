# Fixlo Development Setup Guide

This guide explains how to properly start the Fixlo application for development to avoid the `ERR_CONNECTION_REFUSED` error.

## The Issue

The error `POST http://localhost:3001/api/service-request net::ERR_CONNECTION_REFUSED` occurs when:
- The frontend is running but the backend server is not
- The frontend tries to make API calls to `localhost:3001` but no server is listening

## Solution: Proper Development Startup

### 1. Start the Backend Server (Required)

```bash
# Navigate to server directory
cd server

# Install dependencies (first time only)
npm install

# Start the development server
npm run dev  # Uses nodemon for auto-reload
# OR
npm start    # Production mode
```

The server will start on port 3001 and display:
```
🚀 Fixlo Backend running on port 3001
✅ CORS Configuration loaded
```

### 2. Start the Frontend (Optional for testing)

For development testing, you can use the production build:

```bash
# Build the frontend (from root directory)
npm run build

# Serve the built frontend
npx serve -s . -p 3000
```

The frontend will be available at `http://localhost:3000`

## Verification Steps

### 1. Test Backend API

```bash
curl -X POST http://localhost:3001/api/service-request \
  -H "Content-Type: application/json" \
  -d '{
    "serviceType": "Plumbing",
    "name": "Test User",
    "phone": "555-1234",
    "email": "test@example.com",
    "address": "123 Test St",
    "description": "Test service request",
    "urgency": "medium"
  }'
```

Expected response:
```json
{"success":true,"message":"Service request received successfully!"}
```

### 2. Test Frontend Integration

1. Open `http://localhost:3000` in browser
2. Click any service button (e.g., "🚰 Plumbing")
3. Fill out the service request form
4. Check the SMS opt-in checkbox
5. Click "Submit Request"
6. Verify success message appears: "✅ Thanks! We received your [Service] request."

### 3. Monitor Server Logs

When a request is submitted, you should see logs like:
```
🔍 CORS Origin check: "http://localhost:3000"
✅ Origin "http://localhost:3000" is allowed
✅ New [ServiceType] request from [Name] processed successfully.
```

## Environment Configuration

### Backend (.env in /server directory)
```bash
PORT=3001
NODE_ENV=development
CORS_ALLOWED_ORIGINS=http://localhost:3000,http://localhost:3001,http://localhost:8000
```

### Frontend (.env in /client directory)
```bash
REACT_APP_API_URL=http://localhost:3001
```

## Troubleshooting

### "Connection Refused" Error
- **Cause**: Backend server not running
- **Solution**: Start the backend server first (`cd server && npm start`)

### "CORS Error"
- **Cause**: Frontend origin not in CORS_ALLOWED_ORIGINS
- **Solution**: Add your frontend URL to CORS_ALLOWED_ORIGINS in server/.env

### "Failed to fetch"
- **Cause**: Network connectivity or server not responding
- **Solution**: Check both frontend and backend are running on correct ports

## Production Deployment

For production, the frontend is served from Vercel and backend from Render:
- Frontend: `https://fixloapp.com` 
- Backend: `https://fixloapp.onrender.com`

The REACT_APP_API_URL automatically switches based on environment.

## Summary

**Always start the backend server first** - the frontend depends on it for API functionality. The service request feature will only work when both frontend and backend are running and properly configured.