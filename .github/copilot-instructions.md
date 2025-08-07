# Fixlo App Development Instructions

**ALWAYS reference these instructions first** and fallback to search or bash commands only when you encounter unexpected information that does not match the information provided here.

## Project Overview

Fixlo is a full-stack home services marketplace application connecting homeowners with verified professionals. The codebase consists of:
- **Web Application**: React frontend + Node.js/Express backend
- **Mobile App**: Expo/React Native application  
- **Deployment**: Vercel (frontend) + Render (backend)

## Technology Stack

**Frontend (client/)**: React 18.2.0, React Router, Tailwind CSS, Socket.io client, Axios
**Backend (server/)**: Node.js 18+, Express, MongoDB/Mongoose, Socket.io, Twilio, Stripe, JWT auth
**Mobile (fixlo-app/)**: Expo ~51.0.8, React Native 0.74.1, React Navigation

## Working Effectively

### CRITICAL TIMING AND TIMEOUT REQUIREMENTS
- **NEVER CANCEL** any build or install commands. Set timeouts to at least:
  - Root `npm install`: 60+ seconds (typically takes 1-2 seconds)
  - Root `npm run build`: 300+ seconds (typically takes 3-4 minutes) - **NEVER CANCEL**
  - Client `npm install`: 300+ seconds (typically takes 3-4 minutes) - **NEVER CANCEL**  
  - Server `npm install`: 60+ seconds (typically takes 10-15 seconds)
  - Mobile `npm install`: 120+ seconds (typically takes 1-2 minutes)
  - Client tests: 120+ seconds (typically takes 5-6 seconds)

### Bootstrap and Build Process

1. **Install root dependencies** (required for coordination):
   ```bash
   npm install
   ```

2. **Full production build** (builds client and deploys to root):
   ```bash
   npm run build
   ```
   - This runs: client install → client build → deploy build → generate sitemap
   - Takes 3-4 minutes total - **NEVER CANCEL**
   - Creates optimized production build in root directory

### Development Workflow

#### Backend Development
1. Navigate to server directory:
   ```bash
   cd server
   npm install
   ```

2. **Start development server**:
   ```bash
   npm run dev  # Uses nodemon for auto-reload
   # OR
   npm start    # Production mode
   ```
   - Server runs on port 3001 by default
   - Works in API-only mode without database (for basic testing)
   - **Database connection required** for full functionality

#### Frontend Development
1. Navigate to client directory:
   ```bash
   cd client
   npm install
   ```

2. **Known Issue**: `npm start` fails due to webpack-dev-server configuration conflict
   - **Solution**: Use production build testing instead:
   ```bash
   # Build the client
   npm run build
   # Serve from root directory  
   cd ..
   npx serve -s . -p 3000
   ```

3. **Frontend testing**:
   ```bash
   cd client
   npm run test -- --watchAll=false --passWithNoTests
   ```
   - Takes 5-6 seconds - **NEVER CANCEL**
   - Includes comprehensive geolocation service tests (25 tests)

#### Mobile App Development
1. Navigate to mobile app directory:
   ```bash
   cd fixlo-app
   npm install
   ```

2. **Start Expo development**:
   ```bash
   npx expo start --offline
   ```
   - Requires Expo CLI for full functionality
   - Metro bundler runs on port 8081

## Environment Configuration

### Required Environment Variables

**Server (.env)**:
```bash
# Core Configuration
PORT=3001
NODE_ENV=development
MONGODB_URI=your_mongodb_connection_string

# Authentication
JWT_SECRET=your_strong_jwt_secret
ADMIN_EMAIL=admin@fixloapp.com
ADMIN_PASSWORD=your_admin_password

# Third-party Services
TWILIO_ACCOUNT_SID=your_twilio_sid
TWILIO_AUTH_TOKEN=your_twilio_token
TWILIO_FROM_NUMBER=your_twilio_phone

# Payment Processing
STRIPE_SECRET_KEY=your_stripe_secret_key

# File Upload
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

**Client (.env)**:
```bash
REACT_APP_API_URL=http://localhost:3001  # For local development
# OR
REACT_APP_API_URL=https://fixloapp.onrender.com  # For production
```

## Validation and Testing

### Manual Validation Requirements
After making changes, **ALWAYS perform these validation steps**:

1. **Backend API validation**:
   ```bash
   cd server && npm start
   curl http://localhost:3001/api/health
   # Should return: {"status":"healthy",...}
   
   curl http://localhost:3001/api/cors-test  
   # Should return: {"message":"Fixlo CORS is working!",...}
   ```

2. **Frontend application validation**:
   ```bash
   # From root directory after npm run build
   npx serve -s . -p 3000
   curl http://localhost:3000 | grep "<title>"
   # Should return: "Fixlo – Book Trusted Home Services Near You"
   ```

3. **Test suite validation**:
   ```bash
   cd client
   npm run test -- --watchAll=false --passWithNoTests
   # Should pass all 25 geolocation service tests
   ```

### End-to-End User Scenarios
Test these complete workflows after changes:

1. **Homeowner Service Request**:
   - Navigate to root page (index.html)
   - Select a service type
   - Fill out service request form
   - Submit request (requires backend + database)

2. **Professional Dashboard**:
   - Navigate to `/admin` or `admin.html`
   - Login with admin credentials
   - View job requests and manage professionals

3. **Mobile App Testing**:
   - Start Expo development server
   - Test app functionality via Expo client

## Common Issues and Solutions

### Build Issues
- **Client webpack error**: Use production build testing instead of `npm start`
- **Missing dependencies**: Always run `npm install` in each directory before building
- **Cache issues**: Clear node_modules and package-lock.json, reinstall

### Development Issues
- **CORS errors**: Ensure server is running and CORS_ALLOWED_ORIGINS includes your frontend URL
- **Database errors**: Server runs in API-only mode without database for basic testing
- **Port conflicts**: Default ports are 3000 (frontend), 3001 (backend), 8081 (mobile)

## Project Structure Reference

### Root Directory
```
├── package.json           # Build coordination scripts
├── vercel.json           # Vercel deployment config
├── index.html            # Main homepage
├── admin.html            # Admin dashboard
├── client/               # React frontend application
├── server/               # Node.js backend API
├── fixlo-app/            # Expo mobile application
├── assets/               # Shared assets
└── *.sh                  # Deployment scripts
```

### Client Structure (client/)
```
├── src/
│   ├── App.js            # Main React application
│   ├── components/       # React components
│   └── utils/            # Utility functions and services
├── public/               # Static assets
└── build/                # Production build output
```

### Server Structure (server/)
```
├── index.js              # Main server entry point
├── routes/               # API route handlers
├── models/               # MongoDB data models
├── middleware/           # Express middleware
└── utils/                # Server utilities
```

## Build Artifacts and Deployment

- **Production builds** deploy client build to root directory
- **Vercel** serves frontend from root
- **Render** serves backend from server/ directory
- **Generated files**: sitemap.xml, asset-manifest.json (do not edit manually)

## Key Features to Test

When validating changes, ensure these core features work:
- Service request submission
- SMS notifications (requires Twilio)
- Payment processing (requires Stripe)
- File uploads (requires Cloudinary) 
- Real-time chat (requires Socket.io)
- Geolocation services (test suite available)
- Admin dashboard functionality
- Mobile app navigation

---

**Remember**: NEVER CANCEL builds or long-running commands. Use appropriate timeouts and wait for completion. This application has been tested and validated to work correctly when these instructions are followed precisely.