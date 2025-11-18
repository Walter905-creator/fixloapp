/**
 * Job Detail Screen
 * Displays detailed information about a specific job/lead
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from 'react-native';
import axios from 'axios';
import { buildApiUrl, API_ENDPOINTS } from '../config/api';
import { subscribeToJobStatus } from '../utils/socketService';

export default function JobDetailScreen({ route, navigation }) {
  const { jobId } = route.params;
  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Fetch job details
  const fetchJobDetails = async (isRefresh = false) => {
    try {
      if (!isRefresh) {
        setLoading(true);
      }
      setError(null);

      const apiUrl = buildApiUrl(API_ENDPOINTS.LEADS_DETAIL(jobId));
      
      const response = await axios.get(apiUrl, {
        timeout: 30000,
      });

      if (response.data.success && response.data.data) {
        setJob(response.data.data);
      } else if (response.data) {
        // Handle case where API returns data directly without wrapper
        setJob(response.data);
      } else {
        throw new Error('Invalid response format');
      }
    } catch (err) {
      if (__DEV__) {
      console.error('❌ Error fetching job details:', {
      }
        message: err.message,
        status: err.response?.status,
        data: err.response?.data,
      });

      if (err.response?.status === 404) {
        setError('Job not found');
      } else if (!err.response) {
        setError('Unable to connect to server');
      } else {
        setError('Failed to load job details');
      }
    } finally {
      setLoading(false);
      if (isRefresh) {
        setRefreshing(false);
      }
    }
  };

  useEffect(() => {
    fetchJobDetails();

    // Subscribe to real-time job status updates
    const unsubscribe = subscribeToJobStatus(jobId, (update) => {

      setJob((prevJob) => ({
        ...prevJob,
        ...update,
      }));
    });

    return () => {
      unsubscribe();
    };
  }, [jobId]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchJobDetails(true);
  };

  const handleAcceptJob = async () => {
    Alert.alert(
      'Accept Job',
      'Are you sure you want to accept this job?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Accept',
          onPress: async () => {
            setActionLoading(true);
            try {
              // TODO: Implement accept job API call
              await new Promise(resolve => setTimeout(resolve, 1000));
              Alert.alert('Success', 'Job accepted successfully!');
              navigation.goBack();
            } catch (error) {
              Alert.alert('Error', 'Failed to accept job');
            } finally {
              setActionLoading(false);
            }
          },
        },
      ]
    );
  };

  const handleContactClient = () => {
    if (!job) return;

    Alert.alert(
      'Contact Client',
      `Contact information:\n\nPhone: ${job.phone || 'Not provided'}\nEmail: ${job.email || 'Not provided'}`,
      [{ text: 'OK' }]
    );
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#f97316" />
        <Text style={styles.loadingText}>Loading job details...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>⚠️ {error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={() => fetchJobDetails()}>
          <Text style={styles.retryButtonText}>Try Again</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!job) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>Job not found</Text>
        <TouchableOpacity style={styles.retryButton} onPress={() => navigation.goBack()}>
          <Text style={styles.retryButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {/* Header Section */}
      <View style={styles.header}>
        <Text style={styles.title}>
          {job.trade ? job.trade.replace(/_/g, ' ').toUpperCase() : 'Service Request'}
        </Text>
        <View style={styles.statusBadge}>
          <Text style={styles.statusText}>
            {job.status === 'pending' ? '⏳ Pending' : '✅ ' + job.status}
          </Text>
        </View>
      </View>

      {/* Location Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>📍 Location</Text>
        <Text style={styles.sectionContent}>
          {job.address || 'Location not specified'}
        </Text>
        {job.city && job.state && (
          <Text style={styles.sectionSubContent}>
            {job.city}, {job.state} {job.zipCode}
          </Text>
        )}
      </View>

      {/* Description Section */}
      {job.description && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📝 Description</Text>
          <Text style={styles.sectionContent}>{job.description}</Text>
        </View>
      )}

      {/* Details Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>ℹ️ Details</Text>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Posted:</Text>
          <Text style={styles.detailValue}>
            {new Date(job.createdAt).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </Text>
        </View>
        {job.urgency && (
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Urgency:</Text>
            <Text style={[styles.detailValue, styles.urgencyText]}>
              {job.urgency.toUpperCase()}
            </Text>
          </View>
        )}
        {job.budget && (
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Budget:</Text>
            <Text style={styles.detailValue}>${job.budget}</Text>
          </View>
        )}
      </View>

      {/* Contact Information (for Pros) */}
      {job.phone || job.email ? (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📞 Contact</Text>
          {job.phone && (
            <Text style={styles.sectionContent}>Phone: {job.phone}</Text>
          )}
          {job.email && (
            <Text style={styles.sectionContent}>Email: {job.email}</Text>
          )}
        </View>
      ) : null}

      {/* Action Buttons */}
      <View style={styles.actionSection}>
        <TouchableOpacity
          style={[styles.actionButton, styles.acceptButton]}
          onPress={handleAcceptJob}
          disabled={actionLoading}
        >
          {actionLoading ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text style={styles.actionButtonText}>✅ Accept Job</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, styles.contactButton]}
          onPress={handleContactClient}
        >
          <Text style={styles.actionButtonText}>📞 Contact Client</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#f8fafc',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#64748b',
  },
  errorText: {
    fontSize: 18,
    color: '#dc2626',
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: '#f97316',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  retryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  header: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 12,
  },
  statusBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#fef3c7',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#92400e',
  },
  section: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 12,
  },
  sectionContent: {
    fontSize: 16,
    color: '#475569',
    lineHeight: 24,
    marginBottom: 8,
  },
  sectionSubContent: {
    fontSize: 14,
    color: '#64748b',
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  detailLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#64748b',
  },
  detailValue: {
    fontSize: 16,
    color: '#1e293b',
  },
  urgencyText: {
    color: '#dc2626',
    fontWeight: '600',
  },
  actionSection: {
    marginTop: 8,
  },
  actionButton: {
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  acceptButton: {
    backgroundColor: '#10b981',
  },
  contactButton: {
    backgroundColor: '#2563eb',
  },
  actionButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
});
