import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';
import { Alert } from 'react-native';
import HomeownerScreen from '../screens/HomeownerScreen';
import HomeownerJobRequestScreen from '../screens/HomeownerJobRequestScreen';
import axios from 'axios';

// Mock navigation
const mockNavigate = jest.fn();
const mockNavigation = {
  navigate: mockNavigate,
  goBack: jest.fn(),
  replace: jest.fn(),
};

describe('Homeowner Flow Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    Alert.alert = jest.fn();
  });

  describe('Homeowner Dashboard', () => {
    test('displays homeowner dashboard with welcome message', () => {
      render(<HomeownerScreen navigation={mockNavigation} />);
      
      expect(screen.getByText(/Homeowner Dashboard/i)).toBeTruthy();
      expect(screen.getByText(/Find trusted professionals for your home/i)).toBeTruthy();
    });

    test('displays "Post a Job Request" button', () => {
      render(<HomeownerScreen navigation={mockNavigation} />);
      
      expect(screen.getByText('Post a Job Request')).toBeTruthy();
    });

    test('displays "Free for homeowners!" message', () => {
      render(<HomeownerScreen navigation={mockNavigation} />);
      
      expect(screen.getByText(/Free for homeowners!/i)).toBeTruthy();
    });

    test('tapping "Post a Job Request" navigates to job request form', () => {
      render(<HomeownerScreen navigation={mockNavigation} />);
      
      const postJobButton = screen.getByText('Post a Job Request');
      fireEvent.press(postJobButton);
      
      expect(mockNavigate).toHaveBeenCalledWith('Post a Job');
    });

    test('tapping "My Active Requests" shows coming soon alert', () => {
      render(<HomeownerScreen navigation={mockNavigation} />);
      
      const activeRequestsButton = screen.getByText('My Active Requests');
      fireEvent.press(activeRequestsButton);
      
      expect(Alert.alert).toHaveBeenCalledWith('Coming Soon', 'View your active job requests');
    });

    test('tapping "Browse Professionals" shows coming soon alert', () => {
      render(<HomeownerScreen navigation={mockNavigation} />);
      
      const browseProsButton = screen.getByText('Browse Professionals');
      fireEvent.press(browseProsButton);
      
      expect(Alert.alert).toHaveBeenCalledWith('Coming Soon', 'Browse professional profiles');
    });
  });

  describe('Service Request Form', () => {
    test('displays service request form with all required fields', () => {
      render(<HomeownerJobRequestScreen navigation={mockNavigation} />);
      
      expect(screen.getByText(/Submit a Job Request/i)).toBeTruthy();
      expect(screen.getByPlaceholderText('Enter your full name')).toBeTruthy();
      expect(screen.getByPlaceholderText('(555) 123-4567')).toBeTruthy();
      expect(screen.getByPlaceholderText('Street address, City, State')).toBeTruthy();
      expect(screen.getByPlaceholderText(/Plumber, Electrician/i)).toBeTruthy();
      expect(screen.getByPlaceholderText(/Describe your project/i)).toBeTruthy();
    });

    test('displays submit button', () => {
      render(<HomeownerJobRequestScreen navigation={mockNavigation} />);
      
      expect(screen.getByText('Submit Request')).toBeTruthy();
    });

    test('shows error alert when submitting incomplete form', () => {
      render(<HomeownerJobRequestScreen navigation={mockNavigation} />);
      
      const submitButton = screen.getByText('Submit Request');
      fireEvent.press(submitButton);
      
      expect(Alert.alert).toHaveBeenCalledWith(
        'Missing Info',
        'Please fill out all fields.'
      );
    });

    test('form fields accept user input', () => {
      render(<HomeownerJobRequestScreen navigation={mockNavigation} />);
      
      const nameInput = screen.getByPlaceholderText('Enter your full name');
      const phoneInput = screen.getByPlaceholderText('(555) 123-4567');
      const addressInput = screen.getByPlaceholderText('Street address, City, State');
      const tradeInput = screen.getByPlaceholderText(/Plumber, Electrician/i);
      const descriptionInput = screen.getByPlaceholderText(/Describe your project/i);
      
      fireEvent.changeText(nameInput, 'John Smith');
      fireEvent.changeText(phoneInput, '555-123-4567');
      fireEvent.changeText(addressInput, '123 Main St, Seattle, WA');
      fireEvent.changeText(tradeInput, 'Plumber');
      fireEvent.changeText(descriptionInput, 'Fix leaking sink in kitchen');
      
      expect(nameInput.props.value).toBe('John Smith');
      expect(phoneInput.props.value).toBe('555-123-4567');
      expect(addressInput.props.value).toBe('123 Main St, Seattle, WA');
      expect(tradeInput.props.value).toBe('Plumber');
      expect(descriptionInput.props.value).toBe('Fix leaking sink in kitchen');
    });

    test('successfully submits complete form and shows success message', async () => {
      axios.post.mockResolvedValue({ status: 200, data: { success: true } });
      
      render(<HomeownerJobRequestScreen navigation={mockNavigation} />);
      
      // Fill out all fields
      fireEvent.changeText(screen.getByPlaceholderText('Enter your full name'), 'John Smith');
      fireEvent.changeText(screen.getByPlaceholderText('(555) 123-4567'), '555-123-4567');
      fireEvent.changeText(screen.getByPlaceholderText('Street address, City, State'), '123 Main St');
      fireEvent.changeText(screen.getByPlaceholderText(/Plumber, Electrician/i), 'Plumber');
      fireEvent.changeText(screen.getByPlaceholderText(/Describe your project/i), 'Fix sink');
      
      // Submit form
      const submitButton = screen.getByText('Submit Request');
      fireEvent.press(submitButton);
      
      await waitFor(() => {
        expect(axios.post).toHaveBeenCalled();
        expect(Alert.alert).toHaveBeenCalledWith(
          '✅ Request Sent!',
          expect.stringContaining('Your project has been sent')
        );
      });
    });

    test('displays error message when API call fails', async () => {
      axios.post.mockRejectedValue(new Error('Network error'));
      
      render(<HomeownerJobRequestScreen navigation={mockNavigation} />);
      
      // Fill out all fields
      fireEvent.changeText(screen.getByPlaceholderText('Enter your full name'), 'John Smith');
      fireEvent.changeText(screen.getByPlaceholderText('(555) 123-4567'), '555-123-4567');
      fireEvent.changeText(screen.getByPlaceholderText('Street address, City, State'), '123 Main St');
      fireEvent.changeText(screen.getByPlaceholderText(/Plumber, Electrician/i), 'Plumber');
      fireEvent.changeText(screen.getByPlaceholderText(/Describe your project/i), 'Fix sink');
      
      // Submit form
      const submitButton = screen.getByText('Submit Request');
      fireEvent.press(submitButton);
      
      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith(
          '❌ Network Error',
          'Something went wrong. Please try again later.'
        );
      });
    });

    test('clears form after successful submission', async () => {
      axios.post.mockResolvedValue({ status: 200, data: { success: true } });
      
      render(<HomeownerJobRequestScreen navigation={mockNavigation} />);
      
      // Fill and submit
      const nameInput = screen.getByPlaceholderText('Enter your full name');
      fireEvent.changeText(nameInput, 'John Smith');
      fireEvent.changeText(screen.getByPlaceholderText('(555) 123-4567'), '555-123-4567');
      fireEvent.changeText(screen.getByPlaceholderText('Street address, City, State'), '123 Main St');
      fireEvent.changeText(screen.getByPlaceholderText(/Plumber, Electrician/i), 'Plumber');
      fireEvent.changeText(screen.getByPlaceholderText(/Describe your project/i), 'Fix sink');
      
      fireEvent.press(screen.getByText('Submit Request'));
      
      await waitFor(() => {
        expect(nameInput.props.value).toBe('');
      });
    });

    test('displays loading state during submission', () => {
      axios.post.mockImplementation(() => new Promise(() => {})); // Never resolves
      
      render(<HomeownerJobRequestScreen navigation={mockNavigation} />);
      
      // Fill out form
      fireEvent.changeText(screen.getByPlaceholderText('Enter your full name'), 'John Smith');
      fireEvent.changeText(screen.getByPlaceholderText('(555) 123-4567'), '555-123-4567');
      fireEvent.changeText(screen.getByPlaceholderText('Street address, City, State'), '123 Main St');
      fireEvent.changeText(screen.getByPlaceholderText(/Plumber, Electrician/i), 'Plumber');
      fireEvent.changeText(screen.getByPlaceholderText(/Describe your project/i), 'Fix sink');
      
      // Submit form
      fireEvent.press(screen.getByText('Submit Request'));
      
      // Check for loading text
      expect(screen.getByText('Sending...')).toBeTruthy();
    });

    test('displays disclaimer about being contacted', () => {
      render(<HomeownerJobRequestScreen navigation={mockNavigation} />);
      
      expect(screen.getByText(/By submitting, you agree to be contacted/i)).toBeTruthy();
    });
  });
});
