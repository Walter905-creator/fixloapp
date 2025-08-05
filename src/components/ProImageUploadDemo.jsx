import React, { useState } from 'react';
import ProImageUpload from './ProImageUpload';

const ProImageUploadDemo = () => {
  const [uploadedImages, setUploadedImages] = useState([]);

  const handleImageUploaded = (images) => {
    setUploadedImages(images);
    console.log('Images uploaded:', images);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-md">
          <div className="p-6 border-b border-gray-200">
            <h1 className="text-2xl font-bold text-gray-900">
              Professional Image Upload Demo
            </h1>
            <p className="text-gray-600 mt-2">
              Test the Cloudinary image upload functionality for professionals
            </p>
          </div>
          
          <div className="p-6">
            <ProImageUpload 
              onImageUploaded={handleImageUploaded}
              maxImages={5}
            />
          </div>
          
          {uploadedImages.length > 0 && (
            <div className="p-6 border-t border-gray-200 bg-gray-50">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Upload Results (for debugging)
              </h2>
              <pre className="bg-white p-4 rounded border text-sm overflow-auto">
                {JSON.stringify(uploadedImages, null, 2)}
              </pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProImageUploadDemo;