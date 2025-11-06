import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';
import { Alert } from 'react-native';
import LoginScreen from '../screens/LoginScreen';
import SignupScreen from '../screens/SignupScreen';
import axios from 'axios';

const mockNavigate = jest.fn();
const mockReplace = jest.fn();
const mockNavigation = {
  navigate: mockNavigate,
  goBack: jest.fn(),
  replace: mockReplace,
};

describe('Authentication Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    Alert.alert = jest.fn();
  });

  describe('LoginScreen Tests', () => {
    test('displays login form for homeowner', () => {
      const route = { params: { userType: 'homeowner' } };
      render(<LoginScreen navigation={mockNavigation} route={route} />);
      
      expect(screen.getByText('🏠 Homeowner Login')).toBeTruthy();
      expect(screen.getByText('Sign in to your Homeowner account')).toBeTruthy();
    });

    test('displays login form for pro', () => {
      const route = { params: { userType: 'pro' } };
      render(<LoginScreen navigation={mockNavigation} route={route} />);
      
      expect(screen.getByText('👷 Pro Login')).toBeTruthy();
      expect(screen.getByText('Sign in to your Pro account')).toBeTruthy();
    });

    test('shows error when fields are empty', () => {
      const route = { params: { userType: 'homeowner' } };
      render(<LoginScreen navigation={mockNavigation} route={route} />);
      
      const signInButton = screen.getByText('Sign In');
      fireEvent.press(signInButton);
      
      expect(Alert.alert).toHaveBeenCalledWith(
        'Missing Info',
        'Please enter your email and password.'
      );
    });

    test('successful login navigates to correct screen for homeowner', async () => {
      const route = { params: { userType: 'homeowner' } };
      axios.post.mockResolvedValue({ data: { token: 'test-token-123' } });
      
      render(<LoginScreen navigation={mockNavigation} route={route} />);
      
      fireEvent.changeText(screen.getByPlaceholderText('your@email.com'), 'user@example.com');
      fireEvent.changeText(screen.getByPlaceholderText('Enter your password'), 'password123');
      
      fireEvent.press(screen.getByText('Sign In'));
      
      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith(
          '✅ Login Successful!',
          'Welcome back!',
          expect.any(Array)
        );
      });
    });

    test('successful login navigates to correct screen for pro', async () => {
      const route = { params: { userType: 'pro' } };
      axios.post.mockResolvedValue({ data: { token: 'test-token-456' } });
      
      render(<LoginScreen navigation={mockNavigation} route={route} />);
      
      fireEvent.changeText(screen.getByPlaceholderText('your@email.com'), 'pro@example.com');
      fireEvent.changeText(screen.getByPlaceholderText('Enter your password'), 'password123');
      
      fireEvent.press(screen.getByText('Sign In'));
      
      await waitFor(() => {
        expect(axios.post).toHaveBeenCalledWith(
          expect.stringContaining('/api/auth/pro/login'),
          expect.objectContaining({
            email: 'pro@example.com',
            password: 'password123'
          })
        );
      });
    });

    test('handles invalid credentials error', async () => {
      const route = { params: { userType: 'homeowner' } };
      axios.post.mockRejectedValue({ 
        response: { status: 401, data: { message: 'Invalid credentials' } }
      });
      
      render(<LoginScreen navigation={mockNavigation} route={route} />);
      
      fireEvent.changeText(screen.getByPlaceholderText('your@email.com'), 'wrong@example.com');
      fireEvent.changeText(screen.getByPlaceholderText('Enter your password'), 'wrongpass');
      
      fireEvent.press(screen.getByText('Sign In'));
      
      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith(
          'Login Failed',
          'Invalid email or password.'
        );
      });
    });

    test('handles account not found error', async () => {
      const route = { params: { userType: 'homeowner' } };
      axios.post.mockRejectedValue({ 
        response: { status: 404 }
      });
      
      render(<LoginScreen navigation={mockNavigation} route={route} />);
      
      fireEvent.changeText(screen.getByPlaceholderText('your@email.com'), 'notfound@example.com');
      fireEvent.changeText(screen.getByPlaceholderText('Enter your password'), 'password');
      
      fireEvent.press(screen.getByText('Sign In'));
      
      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith(
          'Account Not Found',
          'No account found with this email.'
        );
      });
    });

    test('forgot password shows alert when email is entered', () => {
      const route = { params: { userType: 'homeowner' } };
      render(<LoginScreen navigation={mockNavigation} route={route} />);
      
      fireEvent.changeText(screen.getByPlaceholderText('your@email.com'), 'user@example.com');
      
      const forgotPasswordButton = screen.getByText('Forgot Password?');
      fireEvent.press(forgotPasswordButton);
      
      expect(Alert.alert).toHaveBeenCalledWith(
        'Password Reset',
        'Password reset instructions will be sent to your email.',
        expect.any(Array)
      );
    });

    test('forgot password shows alert when email is not entered', () => {
      const route = { params: { userType: 'homeowner' } };
      render(<LoginScreen navigation={mockNavigation} route={route} />);
      
      const forgotPasswordButton = screen.getByText('Forgot Password?');
      fireEvent.press(forgotPasswordButton);
      
      expect(Alert.alert).toHaveBeenCalledWith(
        'Enter Email',
        'Please enter your email address first.'
      );
    });

    test('tapping signup link navigates to signup screen', () => {
      const route = { params: { userType: 'homeowner' } };
      render(<LoginScreen navigation={mockNavigation} route={route} />);
      
      const signupLink = screen.getByText('Sign Up');
      fireEvent.press(signupLink);
      
      expect(mockNavigate).toHaveBeenCalledWith('Signup', { userType: 'homeowner' });
    });
  });

  describe('SignupScreen Tests', () => {
    test('displays signup form for homeowner', () => {
      const route = { params: { userType: 'homeowner' } };
      render(<SignupScreen navigation={mockNavigation} route={route} />);
      
      expect(screen.getByText('🏠 Homeowner Sign Up')).toBeTruthy();
      expect(screen.getByText('Create your Homeowner account')).toBeTruthy();
    });

    test('displays signup form for pro', () => {
      const route = { params: { userType: 'pro' } };
      render(<SignupScreen navigation={mockNavigation} route={route} />);
      
      expect(screen.getByText('👷 Pro Sign Up')).toBeTruthy();
      expect(screen.getByText('Create your Pro account')).toBeTruthy();
    });

    test('shows error when fields are empty', () => {
      const route = { params: { userType: 'homeowner' } };
      render(<SignupScreen navigation={mockNavigation} route={route} />);
      
      const createButton = screen.getByText('Create Account');
      fireEvent.press(createButton);
      
      expect(Alert.alert).toHaveBeenCalledWith(
        'Missing Info',
        'Please fill out all fields.'
      );
    });

    test('shows error when passwords do not match', () => {
      const route = { params: { userType: 'homeowner' } };
      render(<SignupScreen navigation={mockNavigation} route={route} />);
      
      fireEvent.changeText(screen.getByPlaceholderText('John Smith'), 'Test User');
      fireEvent.changeText(screen.getByPlaceholderText('your@email.com'), 'test@example.com');
      fireEvent.changeText(screen.getByPlaceholderText('(555) 123-4567'), '5551234567');
      fireEvent.changeText(screen.getByPlaceholderText('At least 6 characters'), 'password123');
      fireEvent.changeText(screen.getByPlaceholderText('Re-enter password'), 'password456');
      
      fireEvent.press(screen.getByText('Create Account'));
      
      expect(Alert.alert).toHaveBeenCalledWith(
        'Password Mismatch',
        'Passwords do not match.'
      );
    });

    test('shows error when password is too short', () => {
      const route = { params: { userType: 'homeowner' } };
      render(<SignupScreen navigation={mockNavigation} route={route} />);
      
      fireEvent.changeText(screen.getByPlaceholderText('John Smith'), 'Test User');
      fireEvent.changeText(screen.getByPlaceholderText('your@email.com'), 'test@example.com');
      fireEvent.changeText(screen.getByPlaceholderText('(555) 123-4567'), '5551234567');
      fireEvent.changeText(screen.getByPlaceholderText('At least 6 characters'), 'abc');
      fireEvent.changeText(screen.getByPlaceholderText('Re-enter password'), 'abc');
      
      fireEvent.press(screen.getByText('Create Account'));
      
      expect(Alert.alert).toHaveBeenCalledWith(
        'Weak Password',
        'Password must be at least 6 characters.'
      );
    });

    test('successful signup for homeowner navigates to homeowner screen', async () => {
      const route = { params: { userType: 'homeowner' } };
      axios.post.mockResolvedValue({ data: { token: 'new-token-123' } });
      
      render(<SignupScreen navigation={mockNavigation} route={route} />);
      
      fireEvent.changeText(screen.getByPlaceholderText('John Smith'), 'John Smith');
      fireEvent.changeText(screen.getByPlaceholderText('your@email.com'), 'john@example.com');
      fireEvent.changeText(screen.getByPlaceholderText('(555) 123-4567'), '5551234567');
      fireEvent.changeText(screen.getByPlaceholderText('At least 6 characters'), 'password123');
      fireEvent.changeText(screen.getByPlaceholderText('Re-enter password'), 'password123');
      
      fireEvent.press(screen.getByText('Create Account'));
      
      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith(
          '🎉 Account Created!',
          'Welcome to Fixlo, John Smith!',
          expect.any(Array)
        );
      });
    });

    test('successful signup for pro navigates to pro signup screen', async () => {
      const route = { params: { userType: 'pro' } };
      axios.post.mockResolvedValue({ data: { token: 'new-token-456' } });
      
      render(<SignupScreen navigation={mockNavigation} route={route} />);
      
      fireEvent.changeText(screen.getByPlaceholderText('John Smith'), 'Pro Smith');
      fireEvent.changeText(screen.getByPlaceholderText('your@email.com'), 'pro@example.com');
      fireEvent.changeText(screen.getByPlaceholderText('(555) 123-4567'), '5551234567');
      fireEvent.changeText(screen.getByPlaceholderText('At least 6 characters'), 'password123');
      fireEvent.changeText(screen.getByPlaceholderText('Re-enter password'), 'password123');
      
      fireEvent.press(screen.getByText('Create Account'));
      
      await waitFor(() => {
        expect(axios.post).toHaveBeenCalledWith(
          expect.stringContaining('/api/auth/pro/register'),
          expect.objectContaining({
            name: 'Pro Smith',
            email: 'pro@example.com',
            phone: '5551234567',
            password: 'password123'
          })
        );
      });
    });

    test('handles account already exists error', async () => {
      const route = { params: { userType: 'homeowner' } };
      axios.post.mockRejectedValue({ 
        response: { status: 409, data: { message: 'Account exists' } }
      });
      
      render(<SignupScreen navigation={mockNavigation} route={route} />);
      
      fireEvent.changeText(screen.getByPlaceholderText('John Smith'), 'Existing User');
      fireEvent.changeText(screen.getByPlaceholderText('your@email.com'), 'existing@example.com');
      fireEvent.changeText(screen.getByPlaceholderText('(555) 123-4567'), '5551234567');
      fireEvent.changeText(screen.getByPlaceholderText('At least 6 characters'), 'password123');
      fireEvent.changeText(screen.getByPlaceholderText('Re-enter password'), 'password123');
      
      fireEvent.press(screen.getByText('Create Account'));
      
      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith(
          'Account Exists',
          'An account with this email already exists.'
        );
      });
    });

    test('tapping login link navigates to login screen', () => {
      const route = { params: { userType: 'homeowner' } };
      render(<SignupScreen navigation={mockNavigation} route={route} />);
      
      const loginLink = screen.getByText('Sign In');
      fireEvent.press(loginLink);
      
      expect(mockNavigate).toHaveBeenCalledWith('Login', { userType: 'homeowner' });
    });

    test('displays pro subscription disclaimer', () => {
      const route = { params: { userType: 'pro' } };
      render(<SignupScreen navigation={mockNavigation} route={route} />);
      
      expect(screen.getByText(/After creating your account/i)).toBeTruthy();
      expect(screen.getByText(/\$59.99\/month/i)).toBeTruthy();
    });

    test('email is trimmed and lowercased', async () => {
      const route = { params: { userType: 'homeowner' } };
      axios.post.mockResolvedValue({ data: { token: 'token' } });
      
      render(<SignupScreen navigation={mockNavigation} route={route} />);
      
      fireEvent.changeText(screen.getByPlaceholderText('John Smith'), 'Test');
      fireEvent.changeText(screen.getByPlaceholderText('your@email.com'), '  TEST@EXAMPLE.COM  ');
      fireEvent.changeText(screen.getByPlaceholderText('(555) 123-4567'), '555');
      fireEvent.changeText(screen.getByPlaceholderText('At least 6 characters'), 'pass123');
      fireEvent.changeText(screen.getByPlaceholderText('Re-enter password'), 'pass123');
      
      fireEvent.press(screen.getByText('Create Account'));
      
      await waitFor(() => {
        expect(axios.post).toHaveBeenCalledWith(
          expect.any(String),
          expect.objectContaining({
            email: 'test@example.com'
          })
        );
      });
    });
  });
});
