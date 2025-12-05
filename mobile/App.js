import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { View, Text, TouchableOpacity, StyleSheet, Image, ActivityIndicator } from 'react-native';
import HomeownerScreen from './screens/HomeownerScreen';
import ProScreen from './screens/ProScreen';
import ProSignupScreen from './screens/ProSignupScreen';
import HomeownerJobRequestScreen from './screens/HomeownerJobRequestScreen';
import LoginScreen from './screens/LoginScreen';
import SignupScreen from './screens/SignupScreen';
import JobDetailScreen from './screens/JobDetailScreen';
import MessagesScreen from './screens/MessagesScreen';
import ChatScreen from './screens/ChatScreen';
import SubscriptionScreen from './screens/SubscriptionScreen';
import { IAPProvider } from './context/IAPContext';
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

function HomeScreen({ navigation }) {
  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Image 
          source={require('./assets/fixlo-logo.png')} 
          style={styles.logo}
          resizeMode="contain"
        />
        <Text style={styles.title}>Welcome to Fixlo</Text>
        <Text style={styles.subtitle}>Connect with trusted professionals in your area</Text>

        <TouchableOpacity
          style={styles.button}
          activeOpacity={0.7}
          onPress={() => navigation.navigate('Homeowner')}
        >
          <Text style={styles.buttonText}>🏠 I am a Homeowner</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, { backgroundColor: '#2563eb' }]}
          activeOpacity={0.7}
          onPress={() => navigation.navigate('Pro')}
        >
          <Text style={styles.buttonText}>👷 I am a Pro</Text>
        </TouchableOpacity>

        <View style={styles.authLinksContainer}>
          <TouchableOpacity
            style={styles.authLink}
            onPress={() => navigation.navigate('Login', { userType: 'homeowner' })}
          >
            <Text style={styles.authLinkText}>🏠 Homeowner Login</Text>
          </TouchableOpacity>
          
          <Text style={styles.authDivider}>•</Text>
          
          <TouchableOpacity
            style={styles.authLink}
            onPress={() => navigation.navigate('Login', { userType: 'pro' })}
          >
            <Text style={styles.authLinkText}>👷 Pro Login</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

export default function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [initialRoute, setInitialRoute] = useState('Fixlo');

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
      // Set a maximum initialization timeout to prevent infinite loading
      const INIT_TIMEOUT = 10000; // 10 seconds max
      
      const initPromise = (async () => {
        // Initialize services with individual error handling
        try {
          initializeSocket();
          console.log('✅ Socket initialization started');
        } catch (error) {
          console.error('❌ Socket initialization failed (non-blocking):', error);
        }

        try {
          await offlineQueue.initialize();
          console.log('✅ Offline queue initialized');
        } catch (error) {
          console.error('❌ Offline queue initialization failed (non-blocking):', error);
        }

        try {
          await messagingService.initialize();
          console.log('✅ Messaging service initialized');
        } catch (error) {
          console.error('❌ Messaging service initialization failed (non-blocking):', error);
        }

        // Check for saved session and auto-login
        try {
          await checkSession();
        } catch (error) {
          console.error('❌ Session check failed (non-blocking):', error);
        }

        // Register background fetch for pro users (non-blocking)
        try {
          const session = await getSession();
          if (session.userType === 'pro') {
            registerBackgroundFetch().catch(err => 
              console.error('❌ Background fetch registration failed (non-critical):', err)
            );
            console.log('✅ Background fetch registration initiated');
          }
        } catch (error) {
          console.error('❌ Background fetch check failed (non-blocking):', error);
        }
      })();

      // Race between initialization and timeout
      await Promise.race([
        initPromise,
        new Promise((resolve) => setTimeout(() => {
          console.warn('⚠️ Service initialization timeout - proceeding anyway');
          resolve();
        }, INIT_TIMEOUT))
      ]);

    } catch (error) {
      console.error('❌ Error initializing services:', error);
    } finally {
      // Always allow the app to render, even if initialization fails
      setIsLoading(false);
      console.log('✅ App initialization complete - rendering navigation');
    }
  };

  const checkSession = async () => {
    try {
      const session = await getSession();
      console.log('📱 Session check:', session);

      if (session && session.isAuthenticated) {
        // Auto-login based on user type
        if (session.userType === 'homeowner') {
          setInitialRoute('Homeowner');
        } else if (session.userType === 'pro') {
          setInitialRoute('Pro');
        }
        console.log('✅ Auto-login successful:', session.userType);
      } else {
        console.log('ℹ️ No saved session found - showing welcome screen');
      }
    } catch (error) {
      console.error('❌ Error checking session:', error);
      // Fallback to welcome screen on error
      setInitialRoute('Fixlo');
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
      <IAPProvider>
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
              name="Fixlo" 
              component={HomeScreen} 
              options={{ title: 'Fixlo - Home Services' }}
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
              name="ProScreen" 
              component={ProScreen} 
              options={{ title: 'Pro Dashboard' }}
            />
            <Stack.Screen 
              name="Pro Signup" 
              component={ProSignupScreen} 
              options={{ title: 'Join Fixlo Pro' }}
            />
            <Stack.Screen 
              name="Subscription" 
              component={SubscriptionScreen} 
              options={{ title: 'Fixlo Pro Subscription' }}
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
      </IAPProvider>
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20
  },
  content: {
    width: '100%',
    maxWidth: 600,
    alignItems: 'center'
  },
  logo: {
    width: 300,
    height: 120,
    marginBottom: 30,
  },
  title: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#0f172a',
    marginBottom: 10,
    textAlign: 'center'
  },
  subtitle: {
    fontSize: 18,
    color: '#475569',
    marginBottom: 50,
    textAlign: 'center'
  },
  button: {
    backgroundColor: '#f97316',
    paddingVertical: 18,
    paddingHorizontal: 30,
    borderRadius: 12,
    marginVertical: 12,
    width: '100%',
    alignItems: 'center',
    minHeight: 60,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  buttonText: {
    color: 'white',
    fontSize: 20,
    fontWeight: '600'
  },
  authLinksContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 30,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    width: '100%'
  },
  authLink: {
    padding: 10
  },
  authLinkText: {
    color: '#2563eb',
    fontSize: 16,
    fontWeight: '600'
  },
  authDivider: {
    color: '#94a3b8',
    fontSize: 16,
    marginHorizontal: 10
  },
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
  loadingText: {
    fontSize: 16,
    color: '#64748b',
    marginTop: 10,
  },
});
// Force bundle refresh - 1764643649
// Build 26 - 1764686937
