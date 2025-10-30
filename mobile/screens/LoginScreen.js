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
      const API_URL = process.env.EXPO_PUBLIC_API_URL || 'https://fixloapp.onrender.com';
      const endpoint = userType === 'pro' ? '/api/auth/pro/login' : '/api/auth/homeowner/login';
      
      const response = await axios.post(`${API_URL}${endpoint}`, {
        email: email.toLowerCase().trim(),
        password
      });

      if (response.data.token) {
        Alert.alert(
          '✅ Login Successful!',
          `Welcome back!`,
          [
            {
              text: 'Continue',
              onPress: () => {
                if (userType === 'pro') {
                  navigation.replace('Pro');
                } else {
                  navigation.replace('Homeowner');
                }
              }
            }
          ]
        );
      }
    } catch (error) {
      console.error('Login error:', error);
      
      if (error.response?.status === 401) {
        Alert.alert('Login Failed', 'Invalid email or password.');
      } else if (error.response?.status === 404) {
        Alert.alert('Account Not Found', 'No account found with this email.');
      } else {
        Alert.alert('Error', 'Unable to login. Please try again.');
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
