import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, ScrollView } from 'react-native';
import { registerForPushNotificationsAsync, setupNotificationListeners } from '../utils/notifications';
import { subscribeToNewJobs } from '../utils/socketService';
import { clearSession } from '../utils/authStorage';
import { offlineQueue } from '../utils/offlineQueue';
import JobFilterModal from '../components/JobFilterModal';
import { filterJobs } from '../utils/jobFilter';
import axios from 'axios';

export default function ProScreen({ navigation }) {
  const [pushToken, setPushToken] = useState(null);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [newJobCount, setNewJobCount] = useState(0);
  const [offlineStatus, setOfflineStatus] = useState({ isOnline: true, queueSize: 0 });
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [jobs, setJobs] = useState([]);
  const [filteredJobs, setFilteredJobs] = useState([]);
  const [activeFilters, setActiveFilters] = useState(null);

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
      
      // Subscribe to real-time new jobs
      const unsubscribeJobs = subscribeToNewJobs((job) => {
        console.log('📢 New job notification:', job);
        setNewJobCount((prev) => prev + 1);
        setJobs((prev) => [job, ...prev]);
        Alert.alert(
          '🆕 New Job Available!',
          `${job.trade || 'Service'} - ${job.address || 'Location TBD'}`,
          [
            { text: 'View Later', style: 'cancel' },
            { text: 'View Now', onPress: () => navigation.navigate('Job Detail', { jobId: job._id }) }
          ]
        );
      });

      // Listen to offline queue status
      const unsubscribeQueue = offlineQueue.addListener((status) => {
        setOfflineStatus(status);
      });
      
      // Cleanup listeners on unmount
      return () => {
        listeners.notificationListener.remove();
        listeners.responseListener.remove();
        unsubscribeJobs();
        unsubscribeQueue();
      };
    }

    setupNotifications();
    
    // Get initial offline queue status
    setOfflineStatus(offlineQueue.getStatus());
  }, []);

  useEffect(() => {
    // Apply filters whenever jobs or active filters change
    if (activeFilters) {
      const filtered = filterJobs(jobs, activeFilters);
      setFilteredJobs(filtered);
    } else {
      setFilteredJobs(jobs);
    }
  }, [jobs, activeFilters]);

  const handleApplyFilters = (filters) => {
    setActiveFilters(filters);
    console.log('✅ Filters applied:', filters);
  };

  const handleClearFilters = () => {
    setActiveFilters(null);
    console.log('🗑️ Filters cleared');
  };
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

  const handleLogout = async () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            await clearSession();
            navigation.reset({
              index: 0,
              routes: [{ name: 'Fixlo' }],
            });
          },
        },
      ]
    );
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>👷 Welcome Pro!</Text>
        <Text style={styles.subtitle}>Join our network of trusted professionals</Text>
        
        {/* Notification Status */}
        <View style={styles.statusCard}>
          <Text style={styles.statusTitle}>📱 System Status</Text>
          <View style={styles.statusRow}>
            <Text style={styles.statusLabel}>🔔 Notifications:</Text>
            <Text style={[styles.statusValue, notificationsEnabled && styles.statusValueGood]}>
              {notificationsEnabled ? '✅ Enabled' : '❌ Disabled'}
            </Text>
          </View>
          {pushToken && (
            <Text style={styles.statusSubtext}>Device registered for job alerts</Text>
          )}
          {newJobCount > 0 && (
            <View style={styles.newJobsBadge}>
              <Text style={styles.newJobsText}>
                🆕 {newJobCount} new job{newJobCount > 1 ? 's' : ''} available!
              </Text>
            </View>
          )}
        </View>

        {/* Offline Queue Status */}
        <View style={styles.statusCard}>
          <Text style={styles.statusTitle}>📶 Network Status</Text>
          <View style={styles.statusRow}>
            <Text style={styles.statusLabel}>Connection:</Text>
            <Text style={[styles.statusValue, offlineStatus.isOnline && styles.statusValueGood]}>
              {offlineStatus.isOnline ? '✅ Online' : '⚠️ Offline'}
            </Text>
          </View>
          {offlineStatus.queueSize > 0 && (
            <View style={styles.warningBox}>
              <Text style={styles.warningText}>
                📥 {offlineStatus.queueSize} action{offlineStatus.queueSize > 1 ? 's' : ''} queued
              </Text>
              <Text style={styles.warningSubtext}>
                {offlineStatus.isProcessing ? 'Processing...' : 'Will sync when online'}
              </Text>
            </View>
          )}
        </View>

        {/* Job Filters */}
        <View style={styles.filterSection}>
          <View style={styles.filterHeader}>
            <Text style={styles.filterTitle}>🔍 Job Filters</Text>
            {activeFilters && (
              <TouchableOpacity onPress={handleClearFilters}>
                <Text style={styles.clearFiltersText}>Clear</Text>
              </TouchableOpacity>
            )}
          </View>
          <TouchableOpacity
            style={styles.filterButton}
            onPress={() => setShowFilterModal(true)}
          >
            <Text style={styles.filterButtonText}>
              {activeFilters 
                ? `Filtering: ${activeFilters.trades?.length || 0} trades, ${activeFilters.maxDistance ? `${activeFilters.maxDistance}mi` : 'any distance'}`
                : '📋 Set Job Preferences'}
            </Text>
          </TouchableOpacity>
          {activeFilters && (
            <Text style={styles.filterResultText}>
              Showing {filteredJobs.length} of {jobs.length} jobs
            </Text>
          )}
        </View>

        {/* Action Buttons */}
        <TouchableOpacity
          style={styles.button}
          activeOpacity={0.7}
          onPress={() => navigation.navigate('Messages')}
        >
          <Text style={styles.buttonText}>💬 Messages</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.button}
          activeOpacity={0.7}
          onPress={testNotification}
        >
          <Text style={styles.buttonText}>🔔 Test Notification</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, { backgroundColor: '#dc2626' }]}
          activeOpacity={0.7}
          onPress={handleLogout}
        >
          <Text style={styles.buttonText}>🚪 Logout</Text>
        </TouchableOpacity>
      </View>

      {/* Job Filter Modal */}
      <JobFilterModal
        visible={showFilterModal}
        onClose={() => setShowFilterModal(false)}
        onApplyFilters={handleApplyFilters}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  content: {
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1e293b',
    textAlign: 'center',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: '#64748b',
    textAlign: 'center',
    marginBottom: 24,
  },
  statusCard: {
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statusTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 12,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  statusLabel: {
    fontSize: 14,
    color: '#64748b',
  },
  statusValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#dc2626',
  },
  statusValueGood: {
    color: '#16a34a',
  },
  statusSubtext: {
    fontSize: 13,
    color: '#94a3b8',
    marginTop: 4,
  },
  newJobsBadge: {
    backgroundColor: '#fef3c7',
    padding: 12,
    borderRadius: 8,
    marginTop: 12,
  },
  newJobsText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#92400e',
    textAlign: 'center',
  },
  warningBox: {
    backgroundColor: '#fef3c7',
    padding: 12,
    borderRadius: 8,
    marginTop: 12,
  },
  warningText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#92400e',
  },
  warningSubtext: {
    fontSize: 12,
    color: '#b45309',
    marginTop: 4,
  },
  filterSection: {
    marginBottom: 16,
  },
  filterHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  filterTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
  },
  clearFiltersText: {
    fontSize: 14,
    color: '#f97316',
    fontWeight: '600',
  },
  filterButton: {
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#e5e7eb',
    borderStyle: 'dashed',
  },
  filterButtonText: {
    fontSize: 15,
    color: '#374151',
    textAlign: 'center',
  },
  filterResultText: {
    fontSize: 13,
    color: '#64748b',
    marginTop: 8,
    textAlign: 'center',
  },
  button: {
    backgroundColor: '#f97316',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    marginVertical: 8,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 3,
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  benefitsContainer: {
    marginBottom: 30,
  },
  benefitItem: {
    fontSize: 16,
    color: '#374151',
    marginBottom: 12,
    paddingLeft: 10,
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
    fontWeight: 'bold',
  },
  loginButton: {
    paddingVertical: 15,
    alignItems: 'center',
  },
  loginButtonText: {
    color: '#2563eb',
    fontSize: 16,
    fontWeight: '600',
  },
  testButton: {
    backgroundColor: '#10b981',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginTop: 10,
    alignItems: 'center',
  },
  testButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  logoutButton: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: '#dc2626',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginTop: 10,
    alignItems: 'center',
  },
  logoutButtonText: {
    color: '#dc2626',
    fontSize: 16,
    fontWeight: '600',
  },
  newJobsText: {
    fontSize: 14,
    color: '#f97316',
    fontWeight: 'bold',
    marginTop: 5,
    textAlign: 'center',
  },
});
