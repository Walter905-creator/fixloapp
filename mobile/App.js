import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { View, Text, TouchableOpacity, StyleSheet, Image, ActivityIndicator, ScrollView } from 'react-native';
import ServicesGrid from './components/ServicesGrid';
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
// Informational Screens
import HowItWorksScreen from './screens/HowItWorksScreen';
import AboutScreen from './screens/AboutScreen';
import ContactScreen from './screens/ContactScreen';
import FAQScreen from './screens/FAQScreen';
import TrustSafetyScreen from './screens/TrustSafetyScreen';
import PricingScreen from './screens/PricingScreen';
import HomeownerBenefitsScreen from './screens/HomeownerBenefitsScreen';
// Legal Screens
import TermsScreen from './screens/TermsScreen';
import PrivacyScreen from './screens/PrivacyScreen';
import CookieScreen from './screens/CookieScreen';
// Account & Settings Screens
import SettingsScreen from './screens/SettingsScreen';
import EditProfileScreen from './screens/EditProfileScreen';
import NotificationSettingsScreen from './screens/NotificationSettingsScreen';
import ReferralScreen from './screens/ReferralScreen';
import DeleteAccountScreen from './screens/DeleteAccountScreen';
// Misc Screens
import AppInfoScreen from './screens/AppInfoScreen';
import HelpCenterScreen from './screens/HelpCenterScreen';
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
    <ScrollView style={styles.scrollContainer} contentContainerStyle={styles.scrollContent}>
      {/* Hero Section - Content from fixloapp.com */}
      <View style={styles.heroSection}>
        <Image 
          source={require('./assets/fixlo-logo.png')} 
          style={styles.logo}
          resizeMode="contain"
        />
        <Text style={styles.heroTitle}>
          Search services{'\n'}near you
        </Text>
        <Text style={styles.heroSubtitle}>
          Discover vetted pros, compare quotes, and book with confidence.
        </Text>

        {/* Primary CTAs */}
        <TouchableOpacity
          style={styles.primaryButton}
          activeOpacity={0.7}
          onPress={() => navigation.navigate('Homeowner')}
        >
          <Text style={styles.buttonText}>🏠 I am a Homeowner</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.primaryButton, styles.proButton]}
          activeOpacity={0.7}
          onPress={() => navigation.navigate('Pro Signup')}
        >
          <Text style={styles.buttonText}>👷 I am a Pro</Text>
        </TouchableOpacity>

        {/* Trust Indicators */}
        <View style={styles.trustBadges}>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>⭐ Trusted pros</Text>
          </View>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>🛡️ Background checks</Text>
          </View>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>💬 Fast quotes</Text>
          </View>
        </View>
      </View>

      {/* Services Grid - Content from fixloapp.com */}
      <ServicesGrid navigation={navigation} />

      {/* Auth Links */}
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

      {/* Footer Info Links - Navigation to existing screens */}
      <View style={styles.footerSection}>
        <Text style={styles.footerHeading}>More Information</Text>
        
        <View style={styles.footerLinks}>
          <TouchableOpacity
            style={styles.footerLink}
            onPress={() => navigation.navigate('How It Works')}
          >
            <Text style={styles.footerLinkText}>How It Works</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.footerLink}
            onPress={() => navigation.navigate('About')}
          >
            <Text style={styles.footerLinkText}>About Fixlo</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.footerLink}
            onPress={() => navigation.navigate('Contact')}
          >
            <Text style={styles.footerLinkText}>Contact & Support</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.footerLink}
            onPress={() => navigation.navigate('FAQ')}
          >
            <Text style={styles.footerLinkText}>FAQ</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.footerLink}
            onPress={() => navigation.navigate('Trust & Safety')}
          >
            <Text style={styles.footerLinkText}>Trust & Safety</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.footerLink}
            onPress={() => navigation.navigate('Pricing')}
          >
            <Text style={styles.footerLinkText}>Pro Pricing</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.legalLinks}>
          <TouchableOpacity
            style={styles.legalLink}
            onPress={() => navigation.navigate('Terms')}
          >
            <Text style={styles.legalLinkText}>Terms of Service</Text>
          </TouchableOpacity>
          
          <Text style={styles.legalDivider}>•</Text>
          
          <TouchableOpacity
            style={styles.legalLink}
            onPress={() => navigation.navigate('Privacy')}
          >
            <Text style={styles.legalLinkText}>Privacy Policy</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.copyright}>© 2024 Fixlo. All rights reserved.</Text>
      </View>
    </ScrollView>
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
            
            {/* Informational Screens */}
            <Stack.Screen 
              name="How It Works" 
              component={HowItWorksScreen} 
              options={{ title: 'How Fixlo Works' }}
            />
            <Stack.Screen 
              name="About" 
              component={AboutScreen} 
              options={{ title: 'About Fixlo' }}
            />
            <Stack.Screen 
              name="Contact" 
              component={ContactScreen} 
              options={{ title: 'Contact & Support' }}
            />
            <Stack.Screen 
              name="FAQ" 
              component={FAQScreen} 
              options={{ title: 'FAQ' }}
            />
            <Stack.Screen 
              name="Trust & Safety" 
              component={TrustSafetyScreen} 
              options={{ title: 'Trust & Safety' }}
            />
            <Stack.Screen 
              name="Pricing" 
              component={PricingScreen} 
              options={{ title: 'Pro Pricing' }}
            />
            <Stack.Screen 
              name="Homeowner Benefits" 
              component={HomeownerBenefitsScreen} 
              options={{ title: 'Homeowner Benefits' }}
            />
            
            {/* Legal Screens */}
            <Stack.Screen 
              name="Terms" 
              component={TermsScreen} 
              options={{ title: 'Terms of Service' }}
            />
            <Stack.Screen 
              name="Privacy" 
              component={PrivacyScreen} 
              options={{ title: 'Privacy Policy' }}
            />
            <Stack.Screen 
              name="Cookie Policy" 
              component={CookieScreen} 
              options={{ title: 'Cookie Policy' }}
            />
            
            {/* Account & Settings Screens */}
            <Stack.Screen 
              name="Settings" 
              component={SettingsScreen} 
              options={{ title: 'Settings' }}
            />
            <Stack.Screen 
              name="Edit Profile" 
              component={EditProfileScreen} 
              options={{ title: 'Edit Profile' }}
            />
            <Stack.Screen 
              name="Notification Settings" 
              component={NotificationSettingsScreen} 
              options={{ title: 'Notifications' }}
            />
            <Stack.Screen 
              name="Referral" 
              component={ReferralScreen} 
              options={{ title: 'Referral Program' }}
            />
            <Stack.Screen 
              name="Delete Account" 
              component={DeleteAccountScreen} 
              options={{ title: 'Delete Account' }}
            />
            
            {/* Misc Screens */}
            <Stack.Screen 
              name="App Info" 
              component={AppInfoScreen} 
              options={{ title: 'App Information' }}
            />
            <Stack.Screen 
              name="Help Center" 
              component={HelpCenterScreen} 
              options={{ title: 'Help Center' }}
            />
          </Stack.Navigator>
        </NavigationContainer>
      </IAPProvider>
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  // HomeScreen Styles - Updated to mirror fixloapp.com
  scrollContainer: {
    flex: 1,
    backgroundColor: '#f1f5f9',
  },
  scrollContent: {
    paddingBottom: 40,
  },
  heroSection: {
    paddingHorizontal: 20,
    paddingTop: 40,
    paddingBottom: 20,
    alignItems: 'center',
    backgroundColor: '#ffffff',
  },
  logo: {
    width: 280,
    height: 100,
    marginBottom: 24,
  },
  heroTitle: {
    fontSize: 38,
    fontWeight: 'bold',
    color: '#0f172a',
    textAlign: 'center',
    marginBottom: 12,
    lineHeight: 46,
  },
  heroSubtitle: {
    fontSize: 17,
    color: '#64748b',
    textAlign: 'center',
    marginBottom: 32,
    paddingHorizontal: 10,
    lineHeight: 24,
  },
  primaryButton: {
    backgroundColor: '#f97316',
    paddingVertical: 18,
    paddingHorizontal: 30,
    borderRadius: 12,
    marginVertical: 10,
    width: '100%',
    maxWidth: 400,
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
  proButton: {
    backgroundColor: '#2563eb',
  },
  buttonText: {
    color: 'white',
    fontSize: 20,
    fontWeight: '600',
  },
  trustBadges: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginTop: 30,
    gap: 12,
  },
  badge: {
    backgroundColor: '#f1f5f9',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  badgeText: {
    fontSize: 14,
    color: '#0f172a',
    fontWeight: '500',
  },
  authLinksContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 30,
    marginBottom: 20,
    paddingTop: 20,
    paddingBottom: 20,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    backgroundColor: '#ffffff',
    paddingHorizontal: 20,
  },
  authLink: {
    padding: 10,
  },
  authLinkText: {
    color: '#2563eb',
    fontSize: 16,
    fontWeight: '600',
  },
  authDivider: {
    color: '#94a3b8',
    fontSize: 16,
    marginHorizontal: 10,
  },
  footerSection: {
    backgroundColor: '#ffffff',
    paddingVertical: 32,
    paddingHorizontal: 20,
    marginTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
  },
  footerHeading: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#0f172a',
    marginBottom: 20,
    textAlign: 'center',
  },
  footerLinks: {
    marginBottom: 24,
  },
  footerLink: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  footerLinkText: {
    fontSize: 16,
    color: '#2563eb',
    fontWeight: '500',
  },
  legalLinks: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 20,
    marginTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
  },
  legalLink: {
    padding: 8,
  },
  legalLinkText: {
    fontSize: 14,
    color: '#64748b',
    fontWeight: '500',
  },
  legalDivider: {
    color: '#cbd5e1',
    fontSize: 14,
    marginHorizontal: 8,
  },
  copyright: {
    textAlign: 'center',
    fontSize: 13,
    color: '#94a3b8',
    marginTop: 16,
  },
  // Old container styles (kept for compatibility)
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
  infoLinksContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
    flexWrap: 'wrap',
    paddingHorizontal: 20,
  },
  infoLink: {
    padding: 8,
  },
  infoLinkText: {
    color: '#64748b',
    fontSize: 14,
    fontWeight: '500',
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
// Build 34 - Home Screen website sync: services grid, hero section, footer links - 1733720000
