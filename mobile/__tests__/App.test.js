import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';
import App from '../App';

describe('App Launch & Navigation Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('app launches and renders home screen with Fixlo branding', () => {
    render(<App />);
    
    // Check for Welcome message
    expect(screen.getByText('Welcome to Fixlo')).toBeTruthy();
    expect(screen.getByText('Connect with trusted professionals in your area')).toBeTruthy();
  });

  test('displays Fixlo logo on home screen', () => {
    render(<App />);
    
    // Check for logo image by looking for images in the component
    const images = screen.UNSAFE_getAllByType('Image');
    expect(images.length).toBeGreaterThan(0);
  });

  test('home screen displays main navigation buttons', () => {
    render(<App />);
    
    // Check for main navigation buttons
    expect(screen.getByText(/I am a Homeowner/i)).toBeTruthy();
    expect(screen.getByText(/I am a Pro/i)).toBeTruthy();
  });

  test('home screen displays login links', () => {
    render(<App />);
    
    // Check for login links
    expect(screen.getByText(/Homeowner Login/i)).toBeTruthy();
    expect(screen.getByText(/Pro Login/i)).toBeTruthy();
  });

  test('tapping "I am a Homeowner" button navigates to Homeowner screen', async () => {
    render(<App />);
    
    const homeownerButton = screen.getByText(/I am a Homeowner/i);
    fireEvent.press(homeownerButton);
    
    // Wait for navigation to complete
    await waitFor(() => {
      expect(screen.queryByText(/Homeowner Dashboard/i)).toBeTruthy();
    }, { timeout: 3000 });
  });

  test('tapping "I am a Pro" button navigates to Pro screen', async () => {
    render(<App />);
    
    const proButton = screen.getByText(/I am a Pro/i);
    fireEvent.press(proButton);
    
    // Wait for navigation to complete
    await waitFor(() => {
      expect(screen.queryByText(/Welcome Pro/i)).toBeTruthy();
    }, { timeout: 3000 });
  });

  test('tapping Homeowner Login navigates to Login screen', async () => {
    render(<App />);
    
    const loginLink = screen.getByText(/Homeowner Login/i);
    fireEvent.press(loginLink);
    
    // Wait for navigation to complete
    await waitFor(() => {
      expect(screen.queryByText(/Homeowner Login/i)).toBeTruthy();
      expect(screen.queryByText(/Sign in to your Homeowner account/i)).toBeTruthy();
    }, { timeout: 3000 });
  });

  test('app does not crash on initial render', () => {
    const { toJSON } = render(<App />);
    expect(toJSON()).toBeTruthy();
  });

  test('navigation between screens maintains app stability', async () => {
    render(<App />);
    
    // Navigate to Homeowner screen
    const homeownerButton = screen.getByText(/I am a Homeowner/i);
    fireEvent.press(homeownerButton);
    
    await waitFor(() => {
      expect(screen.queryByText(/Homeowner Dashboard/i)).toBeTruthy();
    }, { timeout: 3000 });
    
    // App should still be rendered and stable
    expect(screen.queryByText(/Homeowner Dashboard/i)).toBeTruthy();
  });
});
