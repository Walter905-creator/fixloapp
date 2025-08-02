# 🚀 RENDER DEPLOYMENT GUIDE

## Render.com Backend Deployment

### 📋 Deployment Steps

1. **Create New Web Service**
   - Connect your GitHub repository
   - Select `server` directory as root
   - Set build command: `npm install`
   - Set start command: `npm start`

2. **Environment Variables**
   ```
   NODE_ENV=production
   PORT=10000
   MONGO_URI=your_mongodb_connection_string
   JWT_SECRET=your_secure_jwt_secret
   STRIPE_SECRET_KEY=your_stripe_secret_key
   TWILIO_ACCOUNT_SID=your_twilio_sid
   TWILIO_AUTH_TOKEN=your_twilio_token
   TWILIO_PHONE=your_twilio_phone_number
   CLIENT_URL=https://your-frontend-domain.com
   ```

3. **Database Setup**
   - Create MongoDB Atlas cluster
   - Whitelist Render.com IP addresses
   - Add connection string to environment variables

### 🔧 Configuration Files

#### render.yaml (Optional)
```yaml
services:
  - type: web
    name: fixlo-backend
    env: node
    buildCommand: cd server && npm install
    startCommand: cd server && npm start
    envVars:
      - key: NODE_ENV
        value: production
```

### 🌐 Custom Domain
- Add custom domain in Render dashboard
- Update CORS configuration to include new domain
- Update frontend API URL to point to custom domain

### 📊 Monitoring
- View logs in Render dashboard
- Set up health checks
- Monitor CPU and memory usage

---
*Render deployment made simple*