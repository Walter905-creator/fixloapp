# Fixlo Pro Authentication System

A complete professional authentication and management system for the Fixlo platform.

## ✅ Features

- **Secure Pro Sign In / Sign Up** - JWT-based authentication with bcrypt password hashing
- **Pro Dashboard** - Comprehensive dashboard with account management, leads, and reviews
- **Upload Profile Picture & Work Portfolio** - Cloudinary integration for image hosting
- **Homeowner Review System** - Customer review display and rating management
- **JWT Auth + Role-based access** - Token-based authentication with route protection
- **Full GitHub Agent integration** - Push-ready with working API + React UI

## 🔧 Tech Stack

**Backend:**
- Express.js (API server)
- MongoDB (database)
- JWT (authentication)
- Multer (image upload handling)
- Cloudinary (image storage)
- bcrypt (password hashing)

**Frontend:**
- React.js (UI framework)
- React Router (client-side routing)
- TailwindCSS (styling)
- Axios (HTTP client)

## 📁 File Structure

```
agent-tasks/pro-auth/
├── install.sh              # Dependency installation script
├── push-files.sh           # File deployment script
├── models/
│   └── Review.js           # Review data model
├── routes/
│   └── proRoutes.js        # Pro authentication API routes
├── utils/
│   └── cloudinary.js       # Cloudinary configuration
├── middleware/
│   └── auth.js             # JWT authentication middleware
└── components/
    ├── ProSignin.js        # Professional sign-in page
    ├── ProSignup.js        # Professional registration page
    ├── ProDashboard.js     # Professional dashboard
    ├── ReviewList.js       # Customer reviews component
    └── PhotoGallery.js     # Work portfolio gallery
```

## 🚀 Installation

1. **Install Dependencies:**
   ```bash
   ./agent-tasks/pro-auth/install.sh
   ```

2. **Environment Variables:**
   Add these to your backend `.env` file:
   ```env
   CLOUDINARY_NAME=your_cloudinary_name
   CLOUDINARY_KEY=your_cloudinary_api_key
   CLOUDINARY_SECRET=your_cloudinary_api_secret
   JWT_SECRET=your_jwt_secret_key
   MONGODB_URI=your_mongodb_connection_string
   ```

3. **Deploy Files:**
   ```bash
   ./agent-tasks/pro-auth/push-files.sh
   ```

4. **Update Backend Routes:**
   Add to your `server/index.js`:
   ```javascript
   app.use('/api/pros', require('./routes/proRoutes'));
   ```

5. **Update Frontend Routes:**
   Add to your `src/App.js`:
   ```jsx
   <Route path="/pro/signin" element={<ProSignin />} />
   <Route path="/pro/signup" element={<ProSignup />} />
   <Route path="/pro/dashboard" element={<ProDashboard />} />
   ```

## 📋 API Endpoints

### Authentication
- `POST /api/pros/register` - Register new professional
- `POST /api/pros/login` - Professional login

### Dashboard & Profile
- `GET /api/pros/dashboard` - Get dashboard data (authenticated)
- `POST /api/pros/upload/profile` - Upload profile image (authenticated)
- `POST /api/pros/upload/gallery` - Upload work portfolio images (authenticated)

### Reviews
- `POST /api/pros/reviews` - Add customer review
- `GET /api/pros/reviews/:proId` - Get reviews for professional

## 🎯 Usage

### Professional Registration
1. Navigate to `/pro/signup`
2. Fill out the registration form with:
   - Personal information (name, email, phone)
   - Professional details (trade, location, date of birth)
   - Account credentials (password)
3. Submit to create account and receive JWT token

### Professional Sign In
1. Navigate to `/pro/signin`
2. Enter email and password
3. Receive JWT token and redirect to dashboard

### Dashboard Features
- **Profile Management**: Upload profile picture
- **Portfolio**: Add work photos to gallery
- **Reviews**: View customer reviews and ratings
- **Stats**: Track completed jobs and average rating
- **Account Status**: Monitor active/inactive status

## 🔒 Security Features

- **Password Hashing**: bcrypt with salt rounds
- **JWT Tokens**: Secure authentication with 24-hour expiration
- **Route Protection**: Dashboard requires valid authentication
- **Input Validation**: Server-side validation for all endpoints
- **File Upload Security**: Restricted file types and size limits

## 🖼️ Screenshots

**Professional Sign In:**
![Pro Signin](https://github.com/user-attachments/assets/15670621-bac4-4fbe-9d4a-7eb279cdcee9)

**Professional Registration:**
![Pro Signup](https://github.com/user-attachments/assets/4b273941-2822-4dc6-9e56-409a6633df40)

## 🧪 Testing

The system includes comprehensive error handling and validation:

- Form validation on frontend
- JWT token verification
- Authenticated route protection
- Image upload validation
- Database error handling

## 📞 Support

For issues or questions about the pro authentication system, refer to the main Fixlo documentation or contact support.