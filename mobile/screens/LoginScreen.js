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
import { saveSession } from '../utils/authStorage';

export default function LoginScreen({ navigation, route }) {
  const userType = route.params?.userType || 'homeowner';
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Missing Info', 'Please enter your email and password.');
      return;
    }

    setLoading(true);
    try {
      const normalizedEmail = email.toLowerCase().trim();
      
      // Demo accounts for App Review
      const DEMO_HOMEOWNER_EMAIL = 'demo.homeowner@fixloapp.com';
      const DEMO_HOMEOWNER_PASSWORD = 'Demo2025!';
      const DEMO_PRO_EMAIL = 'demo.pro@fixloapp.com';
      const DEMO_PRO_PASSWORD = 'Demo2025!';
      
      // Check for demo homeowner account
      if (userType === 'homeowner' && normalizedEmail === DEMO_HOMEOWNER_EMAIL && password === DEMO_HOMEOWNER_PASSWORD) {
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Save session data
        await saveSession(
          'demo_homeowner_token',
          { email: DEMO_HOMEOWNER_EMAIL, name: 'Demo Homeowner' },
          'homeowner'
        );
        
        Alert.alert(
          '✅ Login Successful!',
          'Welcome back, Demo Homeowner!',
          [
            {
              text: 'Continue',
              onPress: () => {
                navigation.replace('Homeowner');
              }
            }
          ]
        );
        setLoading(false);
        return;
      }
      
      // Check for demo pro account
      if (userType === 'pro' && normalizedEmail === DEMO_PRO_EMAIL && password === DEMO_PRO_PASSWORD) {
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Save session data
        await saveSession(
          'demo_pro_token',
          { email: DEMO_PRO_EMAIL, name: 'Demo Pro', trade: 'General Contractor' },
          'pro'
        );
        
        Alert.alert(
          '✅ Login Successful!',
          'Welcome back, Demo Pro!',
          [
            {
              text: 'Continue',
              onPress: () => {
                navigation.replace('Pro');
              }
            }
          ]
        );
        setLoading(false);
        return;
      }
      
      // For non-demo accounts, try backend authentication
      console.log('🔐 Attempting backend login for:', userType);
      
      // Only try backend for pro accounts (homeowner backend doesn't exist yet)
      if (userType === 'homeowner') {
        throw new Error('Please use demo account or sign up for a new account');
      }
      
      const apiUrl = buildApiUrl(API_ENDPOINTS.AUTH_LOGIN);
      console.log('API URL:', apiUrl);
      
      const response = await axios.post(apiUrl, {
        email: normalizedEmail,
        password
      }, {
        timeout: 30000,
        headers: {
          'Content-Type': 'application/json',
        }
      });

      console.log('✅ Login successful:', response.data);

      if (response.data.token) {
        // Save session data
        await saveSession(
          response.data.token,
          response.data.user || { email: normalizedEmail },
          userType
        );
        
        Alert.alert(
          '✅ Login Successful!',
          `Welcome back!`,
          [
            {
              text: 'Continue',
              onPress: () => {
                navigation.replace('Pro');
              }
            }
          ]
        );
      }
    } catch (error) {
      console.error('❌ Login error:', {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data,
        code: error.code,
      });
      
      // Handle demo account message
      if (error.message?.includes('demo account')) {
        Alert.alert(
          'Demo Account Required',
          `For App Review, please use:\n\nEmail: demo.${userType}@fixloapp.com\nPassword: Demo2025!`
        );
        setLoading(false);
        return;
      }
      
      // Network errors
      if (error.code === 'ECONNABORTED') {
        Alert.alert(
          'Connection Timeout',
          'The request took too long. Please check your internet connection and try again.'
        );
        setLoading(false);
        return;
      }
      
      if (!error.response) {
        Alert.alert(
          'Network Error',
          'Unable to connect to the server. Please check your internet connection and try again.'
        );
        setLoading(false);
        return;
      }
      
      // Server errors
      const status = error.response.status;
      const errorMessage = error.response.data?.message || error.response.data?.error;
      
      if (status === 401) {
        Alert.alert('Login Failed', errorMessage || 'Invalid email or password.');
      } else if (status === 404) {
        Alert.alert('Account Not Found', errorMessage || 'No account found with this email.');
      } else {
        Alert.alert(
          'Login Info', 
          `For App Review, please use:\n\nEmail: demo.${userType}@fixloapp.com\nPassword: Demo2025!`
        );
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = () => {
    navigation.navigate('Signup', { userType });
  };

  const handleForgotPassword = () => {
    if (!email) {
      Alert.alert('Enter Email', 'Please enter your email address first.');
      return;
    }
    Alert.alert(
      'Password Reset',
      'Password reset instructions will be sent to your email.',
      [{ text: 'OK' }]
    );
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
            {userType === 'pro' ? '👷 Pro Login' : '🏠 Homeowner Login'}
          </Text>
          <Text style={styles.subtitle}>
            Sign in to your {userType === 'pro' ? 'Pro' : 'Homeowner'} account
          </Text>

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
            <Text style={styles.label}>Password</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter your password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoCapitalize="none"
            />
          </View>

          <TouchableOpacity
            style={styles.forgotPassword}
            onPress={handleForgotPassword}
          >
            <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.loginButton, loading && styles.buttonDisabled]}
            onPress={handleLogin}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text style={styles.loginButtonText}>Sign In</Text>
            )}
          </TouchableOpacity>

          <View style={styles.signupContainer}>
            <Text style={styles.signupText}>Don't have an account? </Text>
            <TouchableOpacity onPress={handleSignup}>
              <Text style={styles.signupLink}>Sign Up</Text>
            </TouchableOpacity>
          </View>
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
    padding: 20
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 40
  },
  logo: {
    width: 250,
    height: 100
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
    marginBottom: 30,
    textAlign: 'center'
  },
  inputContainer: {
    marginBottom: 20
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8
  },
  input: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    backgroundColor: '#f9fafb',
    padding: 15,
    borderRadius: 10,
    fontSize: 16
  },
  forgotPassword: {
    alignSelf: 'flex-end',
    marginBottom: 25
  },
  forgotPasswordText: {
    color: '#2563eb',
    fontSize: 14,
    fontWeight: '600'
  },
  loginButton: {
    backgroundColor: '#2563eb',
    paddingVertical: 16,
    borderRadius: 10,
    alignItems: 'center',
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
  loginButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold'
  },
  signupContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center'
  },
  signupText: {
    fontSize: 16,
    color: '#64748b'
  },
  signupLink: {
    fontSize: 16,
    color: '#2563eb',
    fontWeight: '600'
  }
});
