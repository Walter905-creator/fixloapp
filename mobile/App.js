import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { View, Text, TouchableOpacity, StyleSheet, Image, ActivityIndicator } from 'react-native';
import HomeScreen from './screens/HomeScreen';
import WelcomeScreen from './screens/WelcomeScreen';
import HomeownerScreen from './screens/HomeownerScreen';
import ProScreen from './screens/ProScreen';
import ProSignupScreen from './screens/ProSignupScreen';
import HomeownerJobRequestScreen from './screens/HomeownerJobRequestScreen';
import LoginScreen from './screens/LoginScreen';
import SignupScreen from './screens/SignupScreen';
import JobDetailScreen from './screens/JobDetailScreen';
import MessagesScreen from './screens/MessagesScreen';
import ChatScreen from './screens/ChatScreen';
import { getSession } from './utils/authStorage';
import { initializeSocket, disconnectSocket } from './utils/socketService';
import { offlineQueue } from './utils/offlineQueue';
import { messagingService } from './utils/messagingService';
import { registerBackgroundFetch } from './utils/backgroundFetch';

const Stack = createNativeStackNavigator();

// Error Boundary Component to prevent app crashes
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('🚨 App Error Caught:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <View style={styles.errorContainer}>
          <Text style={styles.errorTitle}>😔 Something went wrong</Text>
          <Text style={styles.errorText}>
            The app encountered an unexpected error. Please restart the app.
          </Text>
          <TouchableOpacity
            style={styles.errorButton}
            onPress={() => this.setState({ hasError: false, error: null })}
          >
            <Text style={styles.errorButtonText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return this.props.children;
  }
}

export default function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [initialRoute, setInitialRoute] = useState('Home');

  useEffect(() => {
    // Initialize all services
    initializeServices();

    // Cleanup on unmount
    return () => {
      disconnectSocket();
      offlineQueue.destroy();
      messagingService.destroy();
    };
  }, []);

  const initializeServices = async () => {
    try {
      // Initialize Socket.io connection
      initializeSocket();

      // Initialize offline queue manager
      await offlineQueue.initialize();

      // Initialize messaging service
      await messagingService.initialize();

      // Check for saved session and auto-login
      await checkSession();

      // Register background fetch for pro users
      const session = await getSession();
      if (session.userType === 'pro') {
        await registerBackgroundFetch();
        console.log('✅ Background fetch registered for pro user');
      }
    } catch (error) {
      console.error('❌ Error initializing services:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const checkSession = async () => {
    try {
      const session = await getSession();
      console.log('📱 Session check:', session);

      if (session.isAuthenticated) {
        // Auto-login based on user type
        if (session.userType === 'homeowner') {
          setInitialRoute('Homeowner');
        } else if (session.userType === 'pro') {
          setInitialRoute('Pro');
        }
        console.log('✅ Auto-login successful:', session.userType);
      } else {
        console.log('ℹ️ No saved session found');
      }
    } catch (error) {
      console.error('❌ Error checking session:', error);
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <Image 
          source={require('./assets/fixlo-logo.png')} 
          style={styles.logo}
          resizeMode="contain"
        />
        <ActivityIndicator size="large" color="#f97316" style={{ marginTop: 20 }} />
        <Text style={styles.loadingText}>Loading Fixlo...</Text>
      </View>
    );
  }

  return (
    <ErrorBoundary>
      <NavigationContainer>
        <Stack.Navigator
          initialRouteName={initialRoute}
          screenOptions={{
            headerStyle: {
              backgroundColor: '#f97316',
            },
            headerTintColor: '#fff',
            headerTitleStyle: {
              fontWeight: 'bold',
            },
          }}
        >
          <Stack.Screen 
            name="Home" 
            component={HomeScreen} 
            options={{ title: 'Fixlo - Home Services' }}
          />
          <Stack.Screen 
            name="Welcome" 
            component={WelcomeScreen} 
            options={{ title: 'Welcome to Fixlo' }}
          />
          <Stack.Screen 
            name="Login" 
            component={LoginScreen} 
            options={{ title: 'Sign In' }}
          />
          <Stack.Screen 
            name="Signup" 
            component={SignupScreen} 
            options={{ title: 'Create Account' }}
          />
          <Stack.Screen 
            name="Homeowner" 
            component={HomeownerScreen} 
            options={{ title: 'Homeowner Dashboard' }}
          />
          <Stack.Screen 
            name="Pro" 
            component={ProScreen} 
            options={{ title: 'Pro Dashboard' }}
          />
          <Stack.Screen 
            name="Pro Signup" 
            component={ProSignupScreen} 
            options={{ title: 'Join as Pro - $59.99/month' }}
          />
          <Stack.Screen 
            name="Post a Job" 
            component={HomeownerJobRequestScreen} 
            options={{ title: 'Submit Job Request' }}
          />
          <Stack.Screen 
            name="Job Detail" 
            component={JobDetailScreen} 
            options={{ title: 'Job Details' }}
          />
          <Stack.Screen 
            name="Messages" 
            component={MessagesScreen} 
            options={{ title: 'Messages' }}
          />
          <Stack.Screen 
            name="Chat" 
            component={ChatScreen} 
            options={{ title: 'Chat' }}
          />
        </Stack.Navigator>
      </NavigationContainer>
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  errorContainer: {
    flex: 1,
    backgroundColor: '#fef2f2',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20
  },
  errorTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#dc2626',
    marginBottom: 10,
    textAlign: 'center'
  },
  errorText: {
    fontSize: 16,
    color: '#991b1b',
    textAlign: 'center',
    marginBottom: 30,
    lineHeight: 24
  },
  errorButton: {
    backgroundColor: '#dc2626',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8
  },
  errorButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600'
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  logo: {
    width: 300,
    height: 120,
    marginBottom: 30,
  },
  loadingText: {
    fontSize: 16,
    color: '#64748b',
    marginTop: 10,
  },
});
