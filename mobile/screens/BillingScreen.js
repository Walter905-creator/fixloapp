import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  Alert,
  Linking,
  ActivityIndicator
} from 'react-native';
import { getSession } from '../utils/authStorage';
import { API_URL } from '../config/api';

export default function BillingScreen({ navigation }) {
  const [loading, setLoading] = useState(true);
  const [subscription, setSubscription] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    loadSubscriptionStatus();
  }, []);

  const loadSubscriptionStatus = async () => {
    try {
      setLoading(true);
      const session = await getSession();
      
      if (!session?.token) {
        Alert.alert('Error', 'Please login to view billing information');
        navigation.goBack();
        return;
      }

      const response = await fetch(`${API_URL}/api/subscription/status`, {
        headers: {
          'Authorization': `Bearer ${session.token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to load subscription status');
      }

      const data = await response.json();
      setSubscription(data.subscription);
    } catch (error) {
      console.error('Error loading subscription:', error);
      Alert.alert('Error', 'Failed to load subscription information');
    } finally {
      setLoading(false);
    }
  };

  const handlePause = async () => {
    Alert.alert(
      'Pause Subscription',
      'Pausing your subscription will stop new leads but keep your account active. You can resume anytime.',
      [
        {
          text: 'Cancel',
          style: 'cancel'
        },
        {
          text: 'Pause',
          style: 'destructive',
          onPress: async () => {
            try {
              setActionLoading(true);
              const session = await getSession();
              
              const response = await fetch(`${API_URL}/api/subscription/pause`, {
                method: 'POST',
                headers: {
                  'Authorization': `Bearer ${session.token}`,
                  'Content-Type': 'application/json'
                },
                body: JSON.stringify({ reason: 'User requested pause' })
              });

              if (!response.ok) {
                const data = await response.json();
                throw new Error(data.message || 'Failed to pause subscription');
              }

              Alert.alert('Success', 'Your subscription has been paused. You will not receive new leads.');
              loadSubscriptionStatus();
            } catch (error) {
              console.error('Error pausing subscription:', error);
              Alert.alert('Error', error.message || 'Failed to pause subscription');
            } finally {
              setActionLoading(false);
            }
          }
        }
      ]
    );
  };

  const handleResume = async () => {
    Alert.alert(
      'Resume Subscription',
      'Resuming your subscription will start sending you new leads again.',
      [
        {
          text: 'Cancel',
          style: 'cancel'
        },
        {
          text: 'Resume',
          onPress: async () => {
            try {
              setActionLoading(true);
              const session = await getSession();
              
              const response = await fetch(`${API_URL}/api/subscription/resume`, {
                method: 'POST',
                headers: {
                  'Authorization': `Bearer ${session.token}`,
                  'Content-Type': 'application/json'
                }
              });

              if (!response.ok) {
                const data = await response.json();
                throw new Error(data.message || 'Failed to resume subscription');
              }

              Alert.alert('Success', 'Your subscription has been resumed. You will receive new leads.');
              loadSubscriptionStatus();
            } catch (error) {
              console.error('Error resuming subscription:', error);
              Alert.alert('Error', error.message || 'Failed to resume subscription');
            } finally {
              setActionLoading(false);
            }
          }
        }
      ]
    );
  };

  const handleManageSubscription = () => {
    Alert.alert(
      'Manage Subscription',
      'You will be redirected to the App Store to manage your subscription.',
      [
        {
          text: 'Cancel',
          style: 'cancel'
        },
        {
          text: 'Open App Store',
          onPress: () => {
            Linking.openURL('https://apps.apple.com/account/subscriptions');
          }
        }
      ]
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#f97316" />
          <Text style={styles.loadingText}>Loading subscription...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return '#10b981';
      case 'paused': return '#f59e0b';
      case 'cancelled': return '#dc2626';
      default: return '#64748b';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'active': return 'Active';
      case 'paused': return 'Paused';
      case 'cancelled': return 'Cancelled';
      case 'pending': return 'Pending';
      default: return status;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.header}>
          <Text style={styles.title}>Billing & Subscription</Text>
          <Text style={styles.subtitle}>Manage your Fixlo Pro subscription</Text>
        </View>

        {/* Subscription Status Card */}
        <View style={styles.statusCard}>
          <View style={styles.statusHeader}>
            <Text style={styles.statusLabel}>Subscription Status</Text>
            <View style={[styles.statusBadge, { backgroundColor: getStatusColor(subscription?.status) }]}>
              <Text style={styles.statusBadgeText}>{getStatusText(subscription?.status)}</Text>
            </View>
          </View>
          
          {subscription?.pausedAt && (
            <View style={styles.pausedInfo}>
              <Text style={styles.pausedText}>
                ⏸️ Paused on {new Date(subscription.pausedAt).toLocaleDateString()}
              </Text>
              {subscription.pauseReason && (
                <Text style={styles.pausedReason}>{subscription.pauseReason}</Text>
              )}
            </View>
          )}

          {subscription?.subscriptionStartDate && (
            <Text style={styles.infoText}>
              Started: {new Date(subscription.subscriptionStartDate).toLocaleDateString()}
            </Text>
          )}

          <View style={styles.leadStatus}>
            <Text style={styles.leadStatusLabel}>Receiving Leads:</Text>
            <Text style={[styles.leadStatusValue, { color: subscription?.receivingLeads ? '#10b981' : '#dc2626' }]}>
              {subscription?.receivingLeads ? '✅ Yes' : '❌ No'}
            </Text>
          </View>
        </View>

        {/* Actions */}
        <View style={styles.actionsSection}>
          <Text style={styles.sectionTitle}>Actions</Text>
          
          {subscription?.canPause && (
            <TouchableOpacity
              style={styles.actionButton}
              onPress={handlePause}
              disabled={actionLoading}
            >
              <Text style={styles.actionIcon}>⏸️</Text>
              <View style={styles.actionContent}>
                <Text style={styles.actionTitle}>Pause Subscription</Text>
                <Text style={styles.actionDescription}>
                  Stop receiving leads but keep your account
                </Text>
              </View>
            </TouchableOpacity>
          )}

          {subscription?.canResume && (
            <TouchableOpacity
              style={[styles.actionButton, styles.resumeButton]}
              onPress={handleResume}
              disabled={actionLoading}
            >
              <Text style={styles.actionIcon}>▶️</Text>
              <View style={styles.actionContent}>
                <Text style={styles.actionTitle}>Resume Subscription</Text>
                <Text style={styles.actionDescription}>
                  Start receiving leads again
                </Text>
              </View>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={styles.actionButton}
            onPress={handleManageSubscription}
            disabled={actionLoading}
          >
            <Text style={styles.actionIcon}>⚙️</Text>
            <View style={styles.actionContent}>
              <Text style={styles.actionTitle}>Manage Subscription</Text>
              <Text style={styles.actionDescription}>
                Change plan, update payment, or cancel
              </Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Info Box */}
        <View style={styles.infoBox}>
          <Text style={styles.infoBoxTitle}>💡 About Pause</Text>
          <Text style={styles.infoBoxText}>
            Pausing is a great way to temporarily stop leads without cancelling your subscription. 
            Perfect for vacations or busy periods. Your account and data remain safe.
          </Text>
        </View>

        {/* App Store Note */}
        <View style={styles.noteBox}>
          <Text style={styles.noteText}>
            ℹ️ To cancel your subscription, use the "Manage Subscription" button above to go to the App Store.
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#64748b',
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#0f172a',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#64748b',
  },
  statusCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  statusHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  statusLabel: {
    fontSize: 18,
    fontWeight: '600',
    color: '#0f172a',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusBadgeText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  pausedInfo: {
    backgroundColor: '#fef3c7',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  pausedText: {
    fontSize: 14,
    color: '#92400e',
    fontWeight: '500',
  },
  pausedReason: {
    fontSize: 12,
    color: '#92400e',
    marginTop: 4,
  },
  infoText: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 8,
  },
  leadStatus: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
  },
  leadStatusLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#0f172a',
  },
  leadStatusValue: {
    fontSize: 16,
    fontWeight: '600',
  },
  actionsSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#0f172a',
    marginBottom: 12,
  },
  actionButton: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  resumeButton: {
    borderWidth: 2,
    borderColor: '#10b981',
  },
  actionIcon: {
    fontSize: 28,
    marginRight: 16,
  },
  actionContent: {
    flex: 1,
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0f172a',
    marginBottom: 4,
  },
  actionDescription: {
    fontSize: 14,
    color: '#64748b',
  },
  infoBox: {
    backgroundColor: '#dbeafe',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  infoBoxTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e40af',
    marginBottom: 8,
  },
  infoBoxText: {
    fontSize: 14,
    color: '#1e3a8a',
    lineHeight: 20,
  },
  noteBox: {
    backgroundColor: '#f3f4f6',
    borderRadius: 12,
    padding: 16,
  },
  noteText: {
    fontSize: 13,
    color: '#4b5563',
    lineHeight: 20,
  },
});
