# Cloudinary Image Upload and Reviews System

This implementation adds professional image upload capabilities and a reviews system to the Fixlo application.

## Features Added

### 1. Image Upload System (`/api/upload`)
- **Cloudinary Integration**: Secure cloud image storage with automatic optimization
- **File Validation**: Supports images up to 10MB with format validation
- **Image Processing**: Automatic resizing, quality optimization, and format conversion
- **Error Handling**: Comprehensive error handling for upload failures

### 2. Reviews System (`/api/reviews`)
- **Professional Reviews**: Customers can leave reviews for professionals
- **Rating System**: 1-5 star ratings with aggregated statistics
- **Review Management**: Get, post, and view reviews per professional
- **Statistics**: Average ratings and review counts

### 3. Frontend Components

#### ProImageUpload.jsx
- **Drag & Drop**: Modern drag-and-drop interface for image uploads
- **Multiple Files**: Support for uploading multiple images at once
- **Preview**: Real-time preview of uploaded images
- **Progress Indicators**: Visual feedback during upload process
- **Validation**: Client-side file type and size validation

## Setup Instructions

### 1. Environment Configuration

Add these variables to your `.env` file:

```env
# Cloudinary Configuration
CLOUDINARY_CLOUD_NAME=your_cloud_name_here
CLOUDINARY_API_KEY=your_api_key_here
CLOUDINARY_API_SECRET=your_real_secret_here
```

### 2. Get Cloudinary Credentials

1. Sign up at [Cloudinary](https://cloudinary.com/)
2. Go to your Dashboard
3. Copy your Cloud Name, API Key, and API Secret
4. Replace the placeholder values in your `.env` file

### 3. Backend Dependencies

The following packages are automatically installed:
- `cloudinary` - Cloudinary SDK for Node.js
- `multer` - Middleware for handling multipart/form-data

### 4. Frontend Usage

Import and use the ProImageUpload component:

```jsx
import ProImageUpload from './components/ProImageUpload';

function MyComponent() {
  const handleImageUploaded = (images) => {
    console.log('Uploaded images:', images);
    // Handle the uploaded images array
  };

  return (
    <ProImageUpload 
      onImageUploaded={handleImageUploaded}
      maxImages={5}
    />
  );
}
```

## API Endpoints

### Image Upload
```
POST /api/upload
Content-Type: multipart/form-data

Body: form-data with 'image' field containing the file

Response:
{
  "success": true,
  "data": {
    "url": "https://res.cloudinary.com/...",
    "publicId": "fixlo-pro-images/...",
    "width": 1200,
    "height": 800,
    "format": "jpg",
    "bytes": 234567
  }
}
```

### Reviews

#### Get Reviews for a Professional
```
GET /api/reviews/:proId?page=1&limit=10

Response:
{
  "success": true,
  "data": {
    "reviews": [...],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 25,
      "pages": 3
    },
    "stats": {
      "averageRating": 4.5,
      "totalReviews": 25
    }
  }
}
```

#### Submit a Review
```
POST /api/reviews
Content-Type: application/json

Body:
{
  "proId": "507f1f77bcf86cd799439011",
  "customerName": "John Doe",
  "customerEmail": "john@example.com",
  "rating": 5,
  "comment": "Excellent service!",
  "jobDate": "2024-01-15"
}

Response:
{
  "success": true,
  "data": {
    "_id": "...",
    "proId": "...",
    "customerName": "John Doe",
    "rating": 5,
    "comment": "Excellent service!",
    "createdAt": "..."
  },
  "message": "Review submitted successfully"
}
```

#### Get Review Statistics
```
GET /api/reviews/:proId/stats

Response:
{
  "success": true,
  "data": {
    "averageRating": 4.5,
    "totalReviews": 25,
    "fiveStars": 15,
    "fourStars": 7,
    "threeStars": 2,
    "twoStars": 1,
    "oneStar": 0
  }
}
```

## Files Created/Modified

### Backend Files
- `server/models/Review.js` - MongoDB schema for reviews
- `server/routes/upload.js` - Cloudinary image upload endpoint
- `server/routes/reviews.js` - Reviews CRUD operations
- `server/index.js` - Added new route handlers
- `server/.env.example` - Added Cloudinary configuration template

### Frontend Files
- `src/components/ProImageUpload.jsx` - Image upload component

### Dependencies Added
- Backend: `cloudinary`, `multer`

## Security Features

- **File Type Validation**: Only image files are accepted
- **File Size Limits**: 10MB maximum per file
- **CORS Protection**: Proper CORS configuration for cross-origin requests
- **Input Sanitization**: All user inputs are validated and sanitized
- **Rate Limiting**: API endpoints are protected with rate limiting

## Error Handling

- **Upload Failures**: Graceful handling of network and Cloudinary errors
- **Validation Errors**: Clear error messages for invalid inputs
- **Database Errors**: Proper error responses for database issues
- **File Type/Size**: Client and server-side validation with user feedback

## Performance Optimizations

- **Image Optimization**: Automatic compression and format conversion
- **Lazy Loading**: Reviews are paginated for better performance
- **Caching**: Cloudinary provides global CDN caching
- **Database Indexing**: Optimized queries with proper indexing