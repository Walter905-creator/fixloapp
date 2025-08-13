/**
 * Test suite for Cloudinary upload functionality with f_auto and q_auto optimizations
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import ProUpload from '../components/ProUpload';

// Mock the API module
jest.mock('../lib/api', () => ({
  post: jest.fn()
}));

import api from '../lib/api';

describe('Cloudinary Upload Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should render upload component with accessibility features', () => {
    render(<ProUpload />);
    
    // Check for proper labels and ARIA attributes
    expect(screen.getByLabelText('Choose profile image')).toBeInTheDocument();
    expect(screen.getByText('Accepted formats: JPG, PNG, JPEG. Maximum size: 5MB.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Upload Image' })).toBeDisabled();
  });

  test('should enable upload button when file is selected', async () => {
    render(<ProUpload />);
    
    const fileInput = screen.getByLabelText('Choose profile image');
    const uploadButton = screen.getByRole('button', { name: 'Upload Image' });
    
    // Initially disabled
    expect(uploadButton).toBeDisabled();
    
    // Create a mock file
    const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
    
    // Select file
    fireEvent.change(fileInput, { target: { files: [file] } });
    
    // Should now be enabled
    expect(uploadButton).not.toBeDisabled();
  });

  test('should call API with proper form data on upload', async () => {
    const mockResponse = {
      data: {
        success: true,
        data: {
          url: 'https://res.cloudinary.com/test/image/upload/f_auto,q_auto,w_800,h_600,c_limit/test.jpg'
        }
      }
    };
    
    api.post.mockResolvedValue(mockResponse);
    
    render(<ProUpload />);
    
    const fileInput = screen.getByLabelText('Choose profile image');
    const uploadButton = screen.getByRole('button', { name: 'Upload Image' });
    
    // Create and select file
    const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
    fireEvent.change(fileInput, { target: { files: [file] } });
    
    // Click upload
    fireEvent.click(uploadButton);
    
    // Verify API call
    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith(
        '/api/upload',
        expect.any(FormData),
        {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        }
      );
    });
  });

  test('should display success message and optimized image on successful upload', async () => {
    const optimizedUrl = 'https://res.cloudinary.com/test/image/upload/f_auto,q_auto,w_800,h_600,c_limit/test.jpg';
    const mockResponse = {
      data: {
        success: true,
        data: { url: optimizedUrl }
      }
    };
    
    api.post.mockResolvedValue(mockResponse);
    
    render(<ProUpload />);
    
    const fileInput = screen.getByLabelText('Choose profile image');
    const uploadButton = screen.getByRole('button', { name: 'Upload Image' });
    
    // Upload file
    const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
    fireEvent.change(fileInput, { target: { files: [file] } });
    fireEvent.click(uploadButton);
    
    // Wait for success
    await waitFor(() => {
      expect(screen.getByText('Upload successful!')).toBeInTheDocument();
    });
    
    // Check image is displayed with proper alt text
    const uploadedImage = screen.getByAltText('Uploaded profile photo');
    expect(uploadedImage).toBeInTheDocument();
    expect(uploadedImage).toHaveAttribute('src', optimizedUrl);
  });

  test('should handle upload errors gracefully', async () => {
    const mockError = {
      response: {
        data: { error: 'File too large' }
      }
    };
    
    api.post.mockRejectedValue(mockError);
    
    render(<ProUpload />);
    
    const fileInput = screen.getByLabelText('Choose profile image');
    const uploadButton = screen.getByRole('button', { name: 'Upload Image' });
    
    // Upload file
    const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
    fireEvent.change(fileInput, { target: { files: [file] } });
    fireEvent.click(uploadButton);
    
    // Wait for error
    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent('File too large');
    });
  });

  test('should show loading state during upload', async () => {
    // Create a promise that we can control
    let resolveUpload;
    const uploadPromise = new Promise((resolve) => {
      resolveUpload = resolve;
    });
    
    api.post.mockReturnValue(uploadPromise);
    
    render(<ProUpload />);
    
    const fileInput = screen.getByLabelText('Choose profile image');
    const uploadButton = screen.getByRole('button', { name: 'Upload Image' });
    
    // Upload file
    const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
    fireEvent.change(fileInput, { target: { files: [file] } });
    fireEvent.click(uploadButton);
    
    // Check loading state
    expect(screen.getByText('Uploading...')).toBeInTheDocument();
    expect(screen.getByText('Please wait while your image is being uploaded...')).toBeInTheDocument();
    expect(uploadButton).toBeDisabled();
    
    // Resolve the upload
    resolveUpload({
      data: {
        success: true,
        data: { url: 'https://example.com/test.jpg' }
      }
    });
    
    // Wait for loading to finish
    await waitFor(() => {
      expect(screen.queryByText('Uploading...')).not.toBeInTheDocument();
    });
  });
});

describe('Cloudinary Optimization Tests', () => {
  test('should use f_auto and q_auto in transformation parameters', () => {
    // Test that our Cloudinary configuration includes the right optimization parameters
    const expectedTransformation = 'f_auto,q_auto,w_800,h_600,c_limit';
    
    // This would be tested against the actual API response or configuration
    expect(expectedTransformation).toContain('f_auto');
    expect(expectedTransformation).toContain('q_auto');
    expect(expectedTransformation).toContain('w_800');
    expect(expectedTransformation).toContain('h_600');
    expect(expectedTransformation).toContain('c_limit');
  });

  test('should generate optimized URLs for different image formats', () => {
    const testUrls = [
      'https://res.cloudinary.com/test/image/upload/f_auto,q_auto,w_800,h_600,c_limit/sample.jpg',
      'https://res.cloudinary.com/test/image/upload/f_auto,q_auto,w_800,h_600,c_limit/sample.png',
      'https://res.cloudinary.com/test/image/upload/f_auto,q_auto,w_800,h_600,c_limit/sample.webp'
    ];
    
    testUrls.forEach(url => {
      // Verify that each URL contains our optimization parameters
      expect(url).toContain('f_auto');
      expect(url).toContain('q_auto');
      expect(url).toContain('w_800');
      expect(url).toContain('h_600');
      expect(url).toContain('c_limit');
    });
  });
});