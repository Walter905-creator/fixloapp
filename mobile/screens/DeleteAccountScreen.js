import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  Alert,
  TextInput,
  ActivityIndicator
} from 'react-native';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { clearSession } from '../utils/authStorage';

export default function DeleteAccountScreen({ navigation }) {
  const [confirmText, setConfirmText] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const API_URL = process.env.EXPO_PUBLIC_API_URL || 'https://fixloapp.onrender.com';

  const handleDeleteAccount = async () => {
    // Validate confirmation text
    if (confirmText.toLowerCase() !== 'delete') {
      Alert.alert('Error', 'Please type "DELETE" to confirm account deletion.');
      return;
    }

    // Show final confirmation
    Alert.alert(
      '⚠️ Delete Account',
      'Are you absolutely sure? This action cannot be undone. All your data, including your profile, reviews, and job history will be permanently deleted.',
      [
        {
          text: 'Cancel',
          style: 'cancel'
        },
        {
          text: 'Delete Forever',
          style: 'destructive',
          onPress: async () => {
            try {
              setLoading(true);

              // Get user ID from storage
              const userId = await AsyncStorage.getItem('userId');
              const userEmail = await AsyncStorage.getItem('userEmail');

              if (!userId) {
                throw new Error('User not authenticated');
              }

              // Call delete API
              const response = await axios.delete(
                `${API_URL}/api/auth/account/${userId}`,
                {
                  data: {
                    confirmEmail: email || userEmail
                  },
                  headers: {
                    'Content-Type': 'application/json',
                  }
                }
              );

              if (response.data.success) {
                // Clear local session
                await clearSession();

                // Show success message
                Alert.alert(
                  'Account Deleted',
                  'Your account has been permanently deleted. Thank you for using Fixlo.',
                  [
                    {
                      text: 'OK',
                      onPress: () => {
                        // Navigate back to login
                        navigation.reset({
                          index: 0,
                          routes: [{ name: 'Fixlo' }],
                        });
                      }
                    }
                  ]
                );
              } else {
                throw new Error(response.data.error || 'Failed to delete account');
              }

              setLoading(false);
            } catch (error) {
              console.error('Account deletion error:', error);
              setLoading(false);
              Alert.alert(
                'Deletion Failed', 
                error.response?.data?.error || error.message || 'Unable to delete account. Please try again or contact support.'
              );
            }
          }
        }
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.header}>
          <Text style={styles.warningIcon}>⚠️</Text>
          <Text style={styles.title}>Delete Account</Text>
          <Text style={styles.subtitle}>This action cannot be undone</Text>
        </View>

        <View style={styles.warningBox}>
          <Text style={styles.warningTitle}>What will be deleted:</Text>
          <View style={styles.warningList}>
            <Text style={styles.warningItem}>• Your profile and personal information</Text>
            <Text style={styles.warningItem}>• All job requests and history</Text>
            <Text style={styles.warningItem}>• Reviews and ratings</Text>
            <Text style={styles.warningItem}>• Subscription (if active)</Text>
            <Text style={styles.warningItem}>• Messages and notifications</Text>
            <Text style={styles.warningItem}>• All account data permanently</Text>
          </View>
        </View>

        <View style={styles.infoBox}>
          <Text style={styles.infoTitle}>💡 Before you go</Text>
          <Text style={styles.infoText}>
            If you're having issues or concerns, please contact our support team. 
            We're here to help and may be able to resolve your concerns without 
            deleting your account.
          </Text>
          <TouchableOpacity 
            style={styles.supportButton}
            onPress={() => navigation.navigate('Contact')}
          >
            <Text style={styles.supportButtonText}>Contact Support</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.confirmationSection}>
          <Text style={styles.label}>Email (optional for verification):</Text>
          <TextInput
            style={styles.input}
            placeholder="your@email.com"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            autoCorrect={false}
          />

          <Text style={styles.label}>Type "DELETE" to confirm:</Text>
          <TextInput
            style={styles.input}
            placeholder="Type DELETE"
            value={confirmText}
            onChangeText={setConfirmText}
            autoCapitalize="characters"
            autoCorrect={false}
          />
        </View>

        <TouchableOpacity 
          style={[styles.deleteButton, loading && styles.disabledButton]}
          onPress={handleDeleteAccount}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text style={styles.deleteButtonText}>Delete My Account Forever</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.cancelButton}
          onPress={() => navigation.goBack()}
          disabled={loading}
        >
          <Text style={styles.cancelButtonText}>Cancel - Keep My Account</Text>
        </TouchableOpacity>

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Need help? Contact us at support@fixloapp.com
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f1f5f9',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  header: {
    marginBottom: 30,
    alignItems: 'center',
  },
  warningIcon: {
    fontSize: 48,
    marginBottom: 10,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#dc2626',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: '#64748b',
    textAlign: 'center',
  },
  warningBox: {
    backgroundColor: '#fee2e2',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#fca5a5',
  },
  warningTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#991b1b',
    marginBottom: 12,
  },
  warningList: {
    marginLeft: 10,
  },
  warningItem: {
    fontSize: 14,
    color: '#991b1b',
    marginBottom: 8,
    lineHeight: 20,
  },
  infoBox: {
    backgroundColor: '#dbeafe',
    borderRadius: 12,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#93c5fd',
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1e40af',
    marginBottom: 10,
  },
  infoText: {
    fontSize: 14,
    color: '#1e40af',
    lineHeight: 20,
    marginBottom: 16,
  },
  supportButton: {
    backgroundColor: '#2563eb',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  supportButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
  confirmationSection: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 3,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0f172a',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#0f172a',
    backgroundColor: 'white',
    marginBottom: 16,
  },
  deleteButton: {
    backgroundColor: '#dc2626',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: '#dc2626',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  disabledButton: {
    opacity: 0.6,
  },
  deleteButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: 'white',
  },
  cancelButton: {
    backgroundColor: 'white',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 2,
    borderColor: '#cbd5e1',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0f172a',
  },
  footer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  footerText: {
    fontSize: 12,
    color: '#94a3b8',
    textAlign: 'center',
  },
});
