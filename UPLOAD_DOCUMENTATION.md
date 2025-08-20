# Fixlo File Upload Documentation

## Overview

The Fixlo application provides comprehensive file upload functionality for various use cases including client folders, work portfolios, and individual image uploads. The system uses Cloudinary for cloud storage with automatic optimization and multiple file format support.

## Features

### 🌟 Upload Types Supported

1. **Single Image Upload** (`/api/upload`)
   - Individual image files (JPG, PNG, GIF, etc.)
   - 10MB size limit
   - Automatic optimization and resizing

2. **Client Folder Upload** (`/api/upload/client`) - **NEW!**
   - Multiple files of various types
   - Support for images, documents (PDF, Word, Excel), videos, text files
   - 50MB per file limit, up to 20 files per request
   - Organized into client-specific folders
   - Metadata support (client name, project type, description)

3. **Work Portfolio Upload** (`/api/upload/work`)
   - Multiple images for showcasing completed work
   - 10MB per image, up to 10 images per request
   - Portfolio metadata (title, description, service type, etc.)

## Configuration

### Required Environment Variables

Add these to your `server/.env` file:

```bash
# Cloudinary Configuration (REQUIRED for uploads)
CLOUDINARY_CLOUD_NAME=your_cloud_name_here
CLOUDINARY_API_KEY=your_api_key_here  
CLOUDINARY_API_SECRET=your_api_secret_here
```

### Getting Cloudinary Credentials

1. Go to [cloudinary.com](https://cloudinary.com) and create a free account
2. Access your dashboard to find:
   - **Cloud Name**: Found in the dashboard URL and account details
   - **API Key**: Found in the API Keys section
   - **API Secret**: Found in the API Keys section (keep this secure!)

### Setup Script

Run the automated setup script to check your configuration:

```bash
./setup-upload.sh
```

This script will:
- Check if all required environment variables are configured
- Test server connectivity
- Validate upload endpoint functionality
- Provide helpful setup instructions

## API Endpoints

### 1. Single Image Upload

**Endpoint**: `POST /api/upload`
**Content-Type**: `multipart/form-data`

**Parameters**:
- `image` (file): Image file to upload

**Example Response**:
```json
{
  "success": true,
  "url": "https://res.cloudinary.com/...",
  "data": {
    "url": "https://res.cloudinary.com/...",
    "publicId": "fixlo/uploads/...",
    "width": 800,
    "height": 600,
    "format": "jpg",
    "bytes": 125000
  }
}
```

### 2. Client Folder Upload

**Endpoint**: `POST /api/upload/client`
**Content-Type**: `multipart/form-data`

**Parameters**:
- `files` (files): Multiple files to upload (up to 20)
- `clientName` (string): Name of the client
- `projectType` (string, optional): Type of project
- `description` (string, optional): Project description
- `folderName` (string, optional): Custom folder name

**Example Response**:
```json
{
  "success": true,
  "message": "Client folder uploaded successfully",
  "data": {
    "folderName": "fixlo/clients/john-doe-1645123456789",
    "clientInfo": {
      "clientName": "John Doe",
      "projectType": "Kitchen Renovation",
      "description": "Before and after photos",
      "uploadedAt": "2024-02-18T10:30:00.000Z"
    },
    "files": [
      {
        "originalName": "before.jpg",
        "url": "https://res.cloudinary.com/...",
        "publicId": "fixlo/clients/john-doe-1645123456789/before",
        "resourceType": "image",
        "format": "jpg",
        "bytes": 250000
      }
    ],
    "fileCount": 1
  }
}
```

### 3. Work Portfolio Upload

**Endpoint**: `POST /api/upload/work`
**Content-Type**: `multipart/form-data`

**Parameters**:
- `photos` (files): Multiple image files (up to 10)
- `title` (string, optional): Portfolio entry title
- `description` (string, optional): Work description
- `serviceType` (string, optional): Type of service
- `clientName` (string, optional): Client name
- `completionDate` (string, optional): Completion date

## File Type Support

### Images
- JPEG, JPG, PNG, GIF, WebP
- Automatic optimization and format conversion
- Responsive image generation

### Documents (Client Folder Only)
- PDF files
- Microsoft Word (.doc, .docx)
- Microsoft Excel (.xls, .xlsx)
- Plain text files (.txt)

### Videos (Client Folder Only)
- MP4, MPEG, QuickTime (.mov)
- Uploaded as-is (no optimization currently)

## Testing Interface

Access the comprehensive upload testing interface at:
```
http://localhost:3001/upload-test.html
```

This interface provides:
- Drag & drop file upload
- Real-time upload progress
- Error handling demonstration
- Multiple upload type testing
- Visual feedback for success/failure states

## Error Handling

### Common Error Responses

1. **Missing Cloudinary Configuration**:
```json
{
  "success": false,
  "error": "Image upload service not configured. Please configure Cloudinary credentials in environment variables.",
  "details": {
    "CLOUDINARY_CLOUD_NAME": "missing",
    "CLOUDINARY_API_KEY": "missing", 
    "CLOUDINARY_API_SECRET": "missing"
  }
}
```

2. **No Files Provided**:
```json
{
  "success": false,
  "error": "No files provided"
}
```

3. **File Type Not Allowed**:
```json
{
  "success": false,
  "error": "File type not allowed. Supported types: images, PDFs, Word docs, Excel files, text files, and videos"
}
```

4. **File Too Large**:
```json
{
  "success": false,
  "error": "File too large"
}
```

## Folder Organization

Files are automatically organized in Cloudinary:

- **Single uploads**: `fixlo/uploads/`
- **Client folders**: `fixlo/clients/{clientName}-{timestamp}/`
- **Work portfolio**: `fixlo/work-portfolio/`
- **Professional profiles**: `fixlo-pros/` (from other endpoints)

## Security Features

- File type validation on server side
- File size limits per upload type
- CORS protection
- Rate limiting (inherited from server configuration)
- Secure file URLs from Cloudinary

## Frontend Integration

### JavaScript Example

```javascript
// Single file upload
async function uploadFile(file) {
  const formData = new FormData();
  formData.append('image', file);
  
  const response = await fetch('/api/upload', {
    method: 'POST',
    body: formData
  });
  
  const result = await response.json();
  return result;
}

// Client folder upload
async function uploadClientFolder(files, clientName, projectType) {
  const formData = new FormData();
  
  files.forEach(file => {
    formData.append('files', file);
  });
  
  formData.append('clientName', clientName);
  formData.append('projectType', projectType);
  
  const response = await fetch('/api/upload/client', {
    method: 'POST',
    body: formData
  });
  
  const result = await response.json();
  return result;
}
```

## Troubleshooting

### Upload Not Working?

1. **Check Cloudinary Configuration**:
   ```bash
   ./setup-upload.sh
   ```

2. **Verify Server is Running**:
   ```bash
   curl http://localhost:3001/api/health
   ```

3. **Test Upload Endpoint**:
   ```bash
   curl -X POST http://localhost:3001/api/upload \
     -H "Content-Type: application/json" \
     -d '{}'
   ```
   Should return: `{"success":false,"error":"No image file provided"}`

4. **Check File Types**: Ensure files are supported formats

5. **Check File Size**: Verify files are under size limits

### Common Issues

- **CORS Errors**: Server CORS is pre-configured for common origins
- **413 Payload Too Large**: Reduce file sizes or number of files
- **Cloudinary Quota**: Free accounts have monthly upload limits

## Production Deployment

### Environment Variables

Ensure these are set in your production environment:
- `CLOUDINARY_CLOUD_NAME`
- `CLOUDINARY_API_KEY`  
- `CLOUDINARY_API_SECRET`

### Considerations

- Monitor Cloudinary usage and quotas
- Implement user authentication for sensitive uploads
- Consider adding virus scanning for document uploads
- Set up monitoring for upload failures
- Consider CDN caching for frequently accessed files

## Support

For issues with file uploads:

1. Run the setup script: `./setup-upload.sh`
2. Check the test interface: `/upload-test.html`
3. Review server logs for error details
4. Verify Cloudinary account status and quotas

## Changelog

- **v1.0.0**: Added client folder upload functionality
- **v1.0.0**: Enhanced error messaging with configuration details
- **v1.0.0**: Created comprehensive test interface
- **v1.0.0**: Added support for multiple file types
- **v1.0.0**: Implemented setup and configuration script