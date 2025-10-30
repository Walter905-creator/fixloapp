import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { registerForPushNotificationsAsync, setupNotificationListeners } from '../utils/notifications';
import axios from 'axios';

export default function ProScreen({ navigation }) {
  const [pushToken, setPushToken] = useState(null);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);

  useEffect(() => {
    async function setupNotifications() {
      // Register for push notifications
      const token = await registerForPushNotificationsAsync();
      
      if (token) {
        setPushToken(token);
        setNotificationsEnabled(true);
        
        // Save token to backend (for now we'll use a placeholder Pro ID)
        try {
          await axios.post(`${process.env.EXPO_PUBLIC_API_URL}/api/notify/register-token`, {
            proId: 'temp-pro-id', // In real app, this would be the logged-in Pro's ID
            token,
            name: 'Test Pro', // Placeholder name
            trade: 'General Contractor' // Placeholder trade
          });
          console.log('✅ Push token registered with backend');
        } catch (error) {
          console.error('❌ Error registering token with backend:', error);
        }
      }

      // Setup notification listeners
      const listeners = setupNotificationListeners();
      
      // Cleanup listeners on unmount
      return () => {
        listeners.notificationListener.remove();
        listeners.responseListener.remove();
      };
    }

    setupNotifications();
  }, []);
  const testNotification = async () => {
    if (pushToken) {
      try {
        // Send a test notification
        await axios.post(`${process.env.EXPO_PUBLIC_API_URL}/api/notify/test`, {
          token: pushToken
        });
        Alert.alert('Test Sent!', 'Check for notification on your device');
      } catch (error) {
        Alert.alert('Error', 'Failed to send test notification');
        console.error('❌ Test notification error:', error);
      }
    } else {
      Alert.alert('No Token', 'Push token not available');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>👷 Welcome Pro!</Text>
      <Text style={styles.subtitle}>Join our network of trusted professionals</Text>
      
      <View style={styles.notificationStatus}>
        <Text style={styles.statusText}>
          🔔 Notifications: {notificationsEnabled ? '✅ Enabled' : '❌ Disabled'}
        </Text>
        {pushToken && (
          <Text style={styles.tokenText}>
            📱 Device registered for job alerts
          </Text>
        )}
      </View>
      
      <View style={styles.benefitsContainer}>
        <Text style={styles.benefitItem}>✅ Unlimited leads for $59.99/month</Text>
        <Text style={styles.benefitItem}>✅ Direct client connections</Text>
        <Text style={styles.benefitItem}>✅ Instant push notifications</Text>
        <Text style={styles.benefitItem}>✅ Professional profile & reviews</Text>
        <Text style={styles.benefitItem}>✅ Payment protection</Text>
      </View>

      <TouchableOpacity 
        style={styles.signupButton}
        onPress={() => navigation.navigate('Pro Signup')}
      >
        <Text style={styles.signupButtonText}>Sign Up as Pro - $59.99/month</Text>
      </TouchableOpacity>
      
      <TouchableOpacity 
        style={styles.loginButton}
        onPress={() => navigation.navigate('Login', { userType: 'pro' })}
      >
        <Text style={styles.loginButtonText}>Already a member? Login</Text>
      </TouchableOpacity>
      
      {pushToken && (
        <TouchableOpacity 
          style={styles.testButton}
          onPress={testNotification}
        >
          <Text style={styles.testButtonText}>Test Notification</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f8fafc',
    justifyContent: 'center'
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1e293b',
    textAlign: 'center',
    marginBottom: 10
  },
  subtitle: {
    fontSize: 16,
    color: '#64748b',
    textAlign: 'center',
    marginBottom: 20
  },
  notificationStatus: {
    backgroundColor: '#f1f5f9',
    padding: 15,
    borderRadius: 8,
    marginBottom: 20,
    alignItems: 'center'
  },
  statusText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 5
  },
  tokenText: {
    fontSize: 14,
    color: '#10b981',
    textAlign: 'center'
  },
  benefitsContainer: {
    marginBottom: 30
  },
  benefitItem: {
    fontSize: 16,
    color: '#374151',
    marginBottom: 12,
    paddingLeft: 10
  },
  signupButton: {
    backgroundColor: '#2563eb',
    paddingVertical: 18,
    paddingHorizontal: 20,
    borderRadius: 12,
    marginBottom: 15,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  signupButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold'
  },
  loginButton: {
    paddingVertical: 15,
    alignItems: 'center'
  },
  loginButtonText: {
    color: '#2563eb',
    fontSize: 16,
    fontWeight: '600'
  },
  testButton: {
    backgroundColor: '#10b981',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginTop: 10,
    alignItems: 'center'
  },
  testButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600'
  }
});
