import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  Alert,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import axios from 'axios';
import { buildApiUrl, API_ENDPOINTS } from '../config/api';
import { subscribeToJobUpdates, subscribeToNewJobs } from '../utils/socketService';
import { clearSession } from '../utils/authStorage';

export default function HomeownerScreen({ navigation }) {
  const [jobRequests, setJobRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  // Fetch job requests from the API
  const fetchJobRequests = async (isRefresh = false) => {
    try {
      if (!isRefresh) {
        setLoading(true);
      }
      setError(null);

      const apiUrl = buildApiUrl(API_ENDPOINTS.LEADS_LIST);

      const response = await axios.get(apiUrl, {
        timeout: 30000,
        params: {
          limit: 20,
          page: 1,
        }
      });

      if (response.data.success && response.data.data?.leads) {
        setJobRequests(response.data.data.leads);
      } else {
        setJobRequests([]);
      }
    } catch (err) {
      if (__DEV__) {
      console.error('❌ Error fetching job requests:', {
      }
        message: err.message,
        status: err.response?.status,
        data: err.response?.data,
        code: err.code,
      });

      // Handle specific error cases
      if (err.code === 'ECONNABORTED') {
        setError('Connection timeout. Please try again.');
      } else if (!err.response) {
        setError('Unable to connect to server. Please check your internet connection.');
      } else if (err.response.status === 503) {
        setError('Service temporarily unavailable. Please try again later.');
      } else {
        setError('Failed to load job requests. Please try again.');
      }
      
      setJobRequests([]);
    } finally {
      setLoading(false);
      if (isRefresh) {
        setRefreshing(false);
      }
    }
  };

  // Load job requests when component mounts
  useEffect(() => {
    fetchJobRequests();

    // Subscribe to real-time job updates
    const unsubscribeUpdates = subscribeToJobUpdates((update) => {

      // Update the job in the list
      setJobRequests((prevJobs) =>
        prevJobs.map((job) =>
          job._id === update.jobId ? { ...job, ...update } : job
        )
      );
    });

    // Subscribe to new jobs
    const unsubscribeNew = subscribeToNewJobs((newJob) => {

      // Add new job to the list
      setJobRequests((prevJobs) => [newJob, ...prevJobs]);
    });

    // Cleanup subscriptions on unmount
    return () => {
      unsubscribeUpdates();
      unsubscribeNew();
    };
  }, []);

  // Handle pull-to-refresh
  const onRefresh = () => {
    setRefreshing(true);
    fetchJobRequests(true);
  };

  // Render a single job request item
  const renderJobRequest = (request) => {
    return (
      <TouchableOpacity
        key={request._id}
        style={styles.requestCard}
        onPress={() => navigation.navigate('Job Detail', { jobId: request._id })}
      >
        <Text style={styles.requestTitle}>
          {request.trade ? request.trade.replace(/_/g, ' ').toUpperCase() : 'Service Request'}
        </Text>
        <Text style={styles.requestDetail}>📍 {request.address || 'Location not specified'}</Text>
        {request.description && (
          <Text style={styles.requestDescription} numberOfLines={2}>
            {request.description}
          </Text>
        )}
        <View style={styles.requestMeta}>
          <Text style={styles.requestStatus}>
            {request.status === 'pending' ? '⏳ Pending' : '✅ ' + request.status}
          </Text>
          <Text style={styles.requestDate}>
            {new Date(request.createdAt).toLocaleDateString()}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <View style={styles.content}>
          <Text style={styles.title}>🏠 Homeowner Dashboard</Text>
          <Text style={styles.subtitle}>Find trusted professionals for your home</Text>
        
          <TouchableOpacity 
            style={styles.button}
            onPress={() => navigation.navigate('Post a Job')}
          >
            <Text style={styles.buttonText}>+ Post a Job Request</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.logoutButton}
            onPress={async () => {
              await clearSession();
              Alert.alert('Logged Out', 'You have been logged out successfully');
              navigation.replace('Fixlo');
            }}
          >
            <Text style={styles.logoutButtonText}>🚪 Logout</Text>
          </TouchableOpacity>

          {/* Job Requests Section */}
          <View style={styles.requestsSection}>
            <Text style={styles.sectionTitle}>My Active Requests</Text>
            
            {loading && !refreshing ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#f97316" />
                <Text style={styles.loadingText}>Loading your requests...</Text>
              </View>
            ) : error ? (
              <View style={styles.errorContainer}>
                <Text style={styles.errorText}>⚠️ {error}</Text>
                <TouchableOpacity 
                  style={styles.retryButton}
                  onPress={() => fetchJobRequests()}
                >
                  <Text style={styles.retryButtonText}>Try Again</Text>
                </TouchableOpacity>
              </View>
            ) : jobRequests.length > 0 ? (
              <>
                {jobRequests.map(renderJobRequest)}
                <TouchableOpacity
                  style={styles.refreshButton}
                  onPress={() => fetchJobRequests()}
                >
                  <Text style={styles.refreshButtonText}>🔄 Refresh</Text>
                </TouchableOpacity>
              </>
            ) : (
              <View style={styles.emptyState}>
                <Text style={styles.emptyStateEmoji}>📋</Text>
                <Text style={styles.emptyStateTitle}>No Active Requests</Text>
                <Text style={styles.emptyStateText}>
                  You haven't posted any job requests yet.
                </Text>
                <TouchableOpacity 
                  style={styles.createButton}
                  onPress={() => navigation.navigate('Post a Job')}
                >
                  <Text style={styles.createButtonText}>Create Your First Request</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        
          <Text style={styles.note}>✅ Free for homeowners!</Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1e293b',
    textAlign: 'center',
    marginTop: 20,
    marginBottom: 10
  },
  subtitle: {
    fontSize: 16,
    color: '#64748b',
    textAlign: 'center',
    marginBottom: 30
  },
  button: {
    backgroundColor: '#f97316',
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderRadius: 10,
    marginVertical: 8,
    alignItems: 'center',
    minHeight: 50,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600'
  },
  requestsSection: {
    marginTop: 30,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 15,
  },
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 15,
    fontSize: 16,
    color: '#64748b',
  },
  errorContainer: {
    padding: 30,
    backgroundColor: '#fef2f2',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#fecaca',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 16,
    color: '#dc2626',
    textAlign: 'center',
    marginBottom: 15,
  },
  retryButton: {
    backgroundColor: '#dc2626',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  retryButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  requestCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  requestTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 8,
  },
  requestDetail: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 6,
  },
  requestDescription: {
    fontSize: 14,
    color: '#475569',
    lineHeight: 20,
    marginBottom: 10,
  },
  requestMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  requestStatus: {
    fontSize: 13,
    color: '#f97316',
    fontWeight: '600',
  },
  requestDate: {
    fontSize: 12,
    color: '#94a3b8',
  },
  emptyState: {
    padding: 40,
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  emptyStateEmoji: {
    fontSize: 48,
    marginBottom: 15,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 10,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#64748b',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 22,
  },
  createButton: {
    backgroundColor: '#f97316',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  createButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  refreshButton: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: '#f97316',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 10,
  },
  refreshButtonText: {
    color: '#f97316',
    fontSize: 16,
    fontWeight: '600',
  },
  note: {
    textAlign: 'center',
    marginTop: 30,
    fontSize: 16,
    color: '#059669',
    fontWeight: '600'
  },
  logoutButton: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: '#dc2626',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
    marginVertical: 8,
    alignItems: 'center',
    minHeight: 50,
  },
  logoutButtonText: {
    color: '#dc2626',
    fontSize: 16,
    fontWeight: '600'
  }
});
