# AI Assistant Setup Guide

## Quick Start (Development)

### 1. Start Backend Server
```bash
cd server
npm install
npm start
```
Backend will run on: `http://localhost:3001`

### 2. Start Frontend
```bash
cd client
npm install
npm run build
npx serve -s build -p 3000
```
Frontend will run on: `http://localhost:3000`

### 3. Access AI Assistant
Navigate to: `http://localhost:3000/#/ai-assistant`

## Environment Configuration

### Client (.env)
```
REACT_APP_API_URL=http://localhost:3001
```

### Server (.env)
```
PORT=3001
NODE_ENV=development
CORS_ALLOWED_ORIGINS=https://www.fixloapp.com,https://fixloapp.com,http://localhost:3000,http://localhost:3001,http://localhost:8000,http://localhost:8080
```

## AI Assistant Features

- **Enhanced Fallback System**: Works without OpenAI API key
- **Topic Recognition**: Electrical, plumbing, HVAC, roofing, painting, carpentry
- **Safety Guidance**: Always prioritizes safety and professional recommendations
- **Interactive Chat**: Real-time conversation interface
- **CORS Enabled**: Properly configured for cross-origin requests

## API Endpoint

**POST** `/api/ai/ask`
```json
{
  "message": "How do I fix a leaky faucet?",
  "context": "optional context"
}
```

Response:
```json
{
  "success": true,
  "response": "Comprehensive plumbing guidance...",
  "timestamp": "2025-08-12T03:18:25.532Z",
  "source": "enhanced_fallback"
}
```

## Troubleshooting

### ERR_CONNECTION_REFUSED
- Ensure backend server is running on port 3001
- Check `REACT_APP_API_URL` in client/.env
- Verify CORS configuration in server

### No Response from AI
- Check browser console for network errors
- Verify backend logs for API requests
- Confirm `/api/ai/ask` endpoint is accessible

## Production Deployment

1. Deploy backend to production server (e.g., Render)
2. Update client `.env`: `REACT_APP_API_URL=https://your-backend.com`
3. Configure OpenAI API key for full AI functionality (optional)