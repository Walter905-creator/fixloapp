# � Fixlo

A full-stack web application connecting homeowners with verified handyman professionals.

**🚀 Latest Update: Cache busting and deployment fixes implemented - Thu Aug 1 23:15:00 UTC 2025**

## Features

- **Service Request System**: Homeowners can request services from verified professionals
- **SMS Notifications**: Twilio integration for real-time notifications to pros
- **AI Assistant**: OpenAI-powered assistant for home improvement guidance
- **Admin Dashboard**: Manage professionals and view job requests
- **Subscription System**: Stripe integration for professional memberships
- **Real-time Chat**: Socket.io for live communication
- **Background Checks**: Integration with Checkr for professional verification

## Tech Stack

### Backend
- **Node.js** with Express
- **MongoDB** with Mongoose
- **Socket.io** for real-time communication
- **Twilio** for SMS notifications
- **Stripe** for payments
- **OpenAI** for AI assistant
- **JWT** for authentication

### Frontend
- **React** with React Router
- **Axios** for API calls
- **Socket.io Client** for real-time features

## Setup Instructions

### Prerequisites
- Node.js (v14 or higher)
- MongoDB
- Twilio account
- Stripe account
- OpenAI API key

### Server Setup

1. Navigate to the server directory:
   ```bash
   cd server
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file based on `.env.example`:
   ```bash
   cp .env.example .env
   ```

4. Fill in your environment variables:
   - `MONGO_URI`: Your MongoDB connection string
   - `JWT_SECRET`: A secure random string for JWT tokens
   - `ADMIN_EMAIL` & `ADMIN_PASSWORD`: Admin login credentials
   - `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_PHONE`: Twilio credentials
   - `STRIPE_SECRET_KEY`, `STRIPE_FIRST_MONTH_PRICE_ID`, `STRIPE_MONTHLY_PRICE_ID`: Stripe credentials
   - `OPENAI_API_KEY`: OpenAI API key

5. Start the server:
   ```bash
   npm start
   ```

### Client Setup

1. Navigate to the client directory:
   ```bash
   cd client
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file based on `.env.example`:
   ```bash
   cp .env.example .env
   ```

4. Set your API URL:
   ```
   REACT_APP_API_URL=http://localhost:10000
   ```

5. Start the development server:
   ```bash
   npm start
   ```

## API Endpoints

### Authentication
- `POST /api/auth/login` - Admin login

### Admin Routes
- `GET /api/admin/pros` - Get all professionals
- `POST /api/admin/pros` - Add new professional
- `PUT /api/admin/pros/:id/toggle` - Toggle SMS notifications
- `DELETE /api/admin/pros/:id` - Delete professional
- `GET /api/admin/job-requests` - Get all job requests

### Services
- `POST /api/notify/text` - Send SMS notifications to pros
- `POST /api/ai/ask` - AI assistant endpoint
- `POST /api/stripe/create-checkout-session` - Create Stripe checkout session

### Webhooks
- `POST /webhook/checkr` - Checkr webhook for background checks

## Database Models

### Pro
- `name`: String (required)
- `phone`: String (required)
- `trade`: String (required)
- `wantsNotifications`: Boolean (default: true)

### JobRequest
- `trade`: String
- `name`: String
- `email`: String
- `phone`: String
- `address`: String
- `description`: String
- `createdAt`: Date

## Environment Variables

### Server (.env)
```
MONGO_URI=mongodb://localhost:27017/handyman-connect
JWT_SECRET=your_jwt_secret_here
ADMIN_EMAIL=pro4u.improvememnts@gmail.com
ADMIN_PASSWORD=your_admin_password
TWILIO_ACCOUNT_SID=your_twilio_account_sid
TWILIO_AUTH_TOKEN=your_twilio_auth_token
TWILIO_PHONE=+1234567890
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key
STRIPE_FIRST_MONTH_PRICE_ID=price_your_first_month_price_id
STRIPE_MONTHLY_PRICE_ID=price_your_monthly_price_id
OPENAI_API_KEY=sk-your_openai_api_key
CLIENT_URL=http://localhost:3000
PORT=10000
```

### Client (.env)
```
REACT_APP_API_URL=http://localhost:10000
```

## Usage

1. **For Homeowners**: Visit the homepage, select a service, fill out the form, and submit a request
2. **For Professionals**: Subscribe via Stripe, get added to the system by admin, receive SMS notifications for new jobs
3. **For Admins**: Login at `/admin/login`, manage professionals and view job requests at `/admin`

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.
# Force new deployment Sun Jun 29 03:25:23 UTC 2025
Deploy trigger: Fri Aug  1 23:17:56 UTC 2025 - Force cache bust deployment

<!-- trigger build -->
