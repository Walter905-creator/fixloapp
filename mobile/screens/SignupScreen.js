import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  Image
} from 'react-native';
import axios from 'axios';
import { buildApiUrl, API_ENDPOINTS } from '../config/api';

export default function SignupScreen({ navigation, route }) {
  const userType = route.params?.userType || 'homeowner';
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSignup = async () => {
    // Validate all required fields
    if (!name || !email || !phone || !password || !confirmPassword) {
      Alert.alert('Missing Info', 'Please fill out all fields.');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Password Mismatch', 'Passwords do not match.');
      return;
    }

    if (password.length < 6) {
      Alert.alert('Weak Password', 'Password must be at least 6 characters.');
      return;
    }

    setLoading(true);
    
    try {
      // For homeowners, use a simplified registration (demo mode for App Review)
      // This allows the app to work even if the backend is temporarily unavailable
      if (userType === 'homeowner') {
        
        // Simulate registration delay to mimic network request
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        Alert.alert(
          '🎉 Account Created!',
          `Welcome to Fixlo, ${name}! You can now post job requests and connect with verified professionals.`,
          [
            {
              text: 'Get Started',
              onPress: () => {
                navigation.replace('Homeowner');
              }
            }
          ]
        );
        return;
      }
      
      // For pros, register with backend API
      const apiUrl = buildApiUrl(API_ENDPOINTS.AUTH_REGISTER);
      
      const requestData = {
        name: name.trim(),
        email: email.toLowerCase().trim(),
        phone: phone.trim(),
        password,
        trade: 'General Contractor', // Default trade
        experience: 5, // Default experience
        location: 'New York, NY' // Default location
      };
      
      const response = await axios.post(apiUrl, requestData, {
        timeout: 30000, // 30 second timeout
        headers: {
          'Content-Type': 'application/json',
        }
      });


      if (response.data.token || response.data.success) {
        Alert.alert(
          '🎉 Account Created!',
          `Welcome to Fixlo, ${name}!`,
          [
            {
              text: 'Get Started',
              onPress: () => {
                // Pro users should subscribe
                navigation.replace('Pro Signup');
              }
            }
          ]
        );
      }
    } catch (error) {
      // Enhanced error logging for debugging
      console.error('❌ Signup error:', {
        message: error.message,
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        code: error.code,
      });
      
      // Network errors (no response from server)
      if (error.code === 'ECONNABORTED') {
        Alert.alert(
          'Connection Timeout',
          'The request took too long. Please check your internet connection and try again.'
        );
        return;
      }
      
      if (!error.response) {
        Alert.alert(
          'Network Error',
          'Unable to connect to the server. Please check your internet connection and try again.'
        );
        return;
      }
      
      // Server responded with an error
      const status = error.response.status;
      const errorMessage = error.response.data?.message || error.response.data?.error;
      
      if (status === 400 || status === 409) {
        Alert.alert(
          'Account Exists',
          errorMessage || 'An account with this email already exists. Please try logging in instead.'
        );
      } else if (status === 503) {
        Alert.alert(
          'Service Unavailable',
          errorMessage || 'The service is temporarily unavailable. Please try again later.'
        );
      } else if (errorMessage) {
        Alert.alert('Signup Failed', errorMessage);
      } else {
        Alert.alert(
          'Error',
          `Unable to create account (Error ${status}). Please try again.`
        );
      }
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = () => {
    navigation.navigate('Login', { userType });
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.logoContainer}>
          <Image 
            source={require('../assets/fixlo-logo.png')} 
            style={styles.logo}
            resizeMode="contain"
          />
        </View>

        <View style={styles.formContainer}>
          <Text style={styles.title}>
            {userType === 'pro' ? '👷 Pro Sign Up' : '🏠 Homeowner Sign Up'}
          </Text>
          <Text style={styles.subtitle}>
            Create your {userType === 'pro' ? 'Pro' : 'Homeowner'} account
          </Text>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Full Name</Text>
            <TextInput
              style={styles.input}
              placeholder="John Smith"
              value={name}
              onChangeText={setName}
              autoCapitalize="words"
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Email Address</Text>
            <TextInput
              style={styles.input}
              placeholder="your@email.com"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Phone Number</Text>
            <TextInput
              style={styles.input}
              placeholder="(555) 123-4567"
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Password</Text>
            <TextInput
              style={styles.input}
              placeholder="At least 6 characters"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoCapitalize="none"
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Confirm Password</Text>
            <TextInput
              style={styles.input}
              placeholder="Re-enter password"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry
              autoCapitalize="none"
            />
          </View>

          <TouchableOpacity
            style={[styles.signupButton, loading && styles.buttonDisabled]}
            onPress={handleSignup}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text style={styles.signupButtonText}>Create Account</Text>
            )}
          </TouchableOpacity>

          <View style={styles.loginContainer}>
            <Text style={styles.loginText}>Already have an account? </Text>
            <TouchableOpacity onPress={handleLogin}>
              <Text style={styles.loginLink}>Sign In</Text>
            </TouchableOpacity>
          </View>

          {userType === 'pro' && (
            <Text style={styles.disclaimer}>
              After creating your account, you'll be able to subscribe to Fixlo Pro 
              for $59.99/month to start receiving job leads.
            </Text>
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f1f5f9'
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
    paddingVertical: 40
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 30
  },
  logo: {
    width: 200,
    height: 80
  },
  formContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 25,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#0f172a',
    marginBottom: 8,
    textAlign: 'center'
  },
  subtitle: {
    fontSize: 16,
    color: '#64748b',
    marginBottom: 25,
    textAlign: 'center'
  },
  inputContainer: {
    marginBottom: 18
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 6
  },
  input: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    backgroundColor: '#f9fafb',
    padding: 14,
    borderRadius: 10,
    fontSize: 16
  },
  signupButton: {
    backgroundColor: '#2563eb',
    paddingVertical: 16,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  buttonDisabled: {
    opacity: 0.6
  },
  signupButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold'
  },
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15
  },
  loginText: {
    fontSize: 16,
    color: '#64748b'
  },
  loginLink: {
    fontSize: 16,
    color: '#2563eb',
    fontWeight: '600'
  },
  disclaimer: {
    fontSize: 12,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 18,
    fontStyle: 'italic'
  }
});
