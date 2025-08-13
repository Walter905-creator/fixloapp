import React, { useState } from 'react';
import api from '../lib/api';

export default function ProUpload() {
  const [file, setFile] = useState(null);
  const [url, setUrl] = useState('');
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  const handleUpload = async () => {
    if (!file) {
      setError('Please select an image file');
      return;
    }

    setUploading(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('image', file);

      const res = await api.post('/api/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      if (res.data.success) {
        setUrl(res.data.data.url);
        setError('');
      } else {
        setError('Upload failed');
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="upload-form p-6 bg-white rounded-lg shadow-md">
      <h3 className="text-lg font-semibold mb-4">Upload Profile Photo</h3>
      
      {error && (
        <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded" role="alert" aria-live="polite">
          {error}
        </div>
      )}
      
      <div className="space-y-4">
        <div>
          <label htmlFor="profile-image-upload" className="block text-sm font-medium text-gray-700 mb-2">
            Choose profile image
          </label>
          <input 
            id="profile-image-upload"
            type="file" 
            accept="image/*"
            onChange={(e) => setFile(e.target.files[0])}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            aria-describedby="file-help"
          />
          <p id="file-help" className="mt-1 text-sm text-gray-500">
            Accepted formats: JPG, PNG, JPEG. Maximum size: 5MB.
          </p>
        </div>
        
        <button 
          onClick={handleUpload} 
          disabled={uploading || !file}
          className="bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          aria-describedby={uploading ? "upload-status" : undefined}
        >
          {uploading ? 'Uploading...' : 'Upload Image'}
        </button>
        
        {uploading && (
          <div id="upload-status" className="text-sm text-gray-600" aria-live="polite">
            Please wait while your image is being uploaded...
          </div>
        )}
        
        {url && (
          <div className="mt-4">
            <p className="text-green-600 mb-2" role="status" aria-live="polite">Upload successful!</p>
            <img 
              src={url} 
              alt="Uploaded profile photo" 
              className="rounded-full w-32 h-32 object-cover border-2 border-gray-200" 
            />
          </div>
        )}
      </div>
    </div>
  );
}