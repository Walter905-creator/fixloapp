/**
 * Background Fetch Service
 * Handles background fetching of new jobs and notifications
 */

import * as BackgroundFetch from 'expo-background-fetch';
import * as TaskManager from 'expo-task-manager';
import * as Notifications from 'expo-notifications';
import { getAuthToken, getUserType } from './authStorage';
import { getApiUrl } from '../config/api';
import axios from 'axios';

const BACKGROUND_FETCH_TASK = 'FIXLO_BACKGROUND_FETCH';
const FETCH_INTERVAL = 15 * 60; // 15 minutes (minimum allowed by iOS)

/**
 * Define the background fetch task
 */
TaskManager.defineTask(BACKGROUND_FETCH_TASK, async () => {
  try {
    console.log('🔄 Background fetch running...');
    
    // Check if user is authenticated
    const token = await getAuthToken();
    const userType = await getUserType();
    
    if (!token || userType !== 'pro') {
      console.log('⚠️ Not authenticated or not a pro user, skipping fetch');
      return BackgroundFetch.BackgroundFetchResult.NoData;
    }
    
    // Fetch new jobs from API
    const response = await axios.get(`${getApiUrl()}/api/pro/jobs/new`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      params: {
        since: Date.now() - (FETCH_INTERVAL * 1000), // Jobs since last fetch
      },
    });
    
    const newJobs = response.data.jobs || [];
    
    if (newJobs.length > 0) {
      console.log(`✅ Found ${newJobs.length} new job(s) in background`);
      
      // Send local notification for new jobs
      for (const job of newJobs.slice(0, 3)) { // Limit to 3 notifications
        await Notifications.scheduleNotificationAsync({
          content: {
            title: '🆕 New Job Available!',
            body: `${job.trade || 'Service'} - ${job.location || 'Location TBD'}`,
            data: { jobId: job._id, type: 'NEW_JOB' },
            categoryIdentifier: 'NEW_JOB',
            sound: true,
          },
          trigger: null, // Immediate
        });
      }
      
      if (newJobs.length > 3) {
        await Notifications.scheduleNotificationAsync({
          content: {
            title: `📋 ${newJobs.length} New Jobs Available`,
            body: 'Open the app to view all new opportunities',
            data: { type: 'MULTIPLE_JOBS' },
            sound: true,
          },
          trigger: null,
        });
      }
      
      return BackgroundFetch.BackgroundFetchResult.NewData;
    }
    
    console.log('ℹ️ No new jobs found in background fetch');
    return BackgroundFetch.BackgroundFetchResult.NoData;
    
  } catch (error) {
    console.error('❌ Background fetch error:', error);
    return BackgroundFetch.BackgroundFetchResult.Failed;
  }
});

/**
 * Register background fetch task
 */
export async function registerBackgroundFetch() {
  try {
    // Check if task is already registered
    const isRegistered = await TaskManager.isTaskRegisteredAsync(BACKGROUND_FETCH_TASK);
    
    if (isRegistered) {
      console.log('✅ Background fetch already registered');
      return true;
    }
    
    // Register the task
    await BackgroundFetch.registerTaskAsync(BACKGROUND_FETCH_TASK, {
      minimumInterval: FETCH_INTERVAL, // 15 minutes
      stopOnTerminate: false, // Continue after app is closed
      startOnBoot: true, // Start on device boot
    });
    
    console.log('✅ Background fetch registered successfully');
    return true;
    
  } catch (error) {
    console.error('❌ Failed to register background fetch:', error);
    return false;
  }
}

/**
 * Unregister background fetch task
 */
export async function unregisterBackgroundFetch() {
  try {
    await BackgroundFetch.unregisterTaskAsync(BACKGROUND_FETCH_TASK);
    console.log('✅ Background fetch unregistered');
    return true;
  } catch (error) {
    console.error('❌ Failed to unregister background fetch:', error);
    return false;
  }
}

/**
 * Get background fetch status
 */
export async function getBackgroundFetchStatus() {
  try {
    const status = await BackgroundFetch.getStatusAsync();
    const isRegistered = await TaskManager.isTaskRegisteredAsync(BACKGROUND_FETCH_TASK);
    
    const statusMap = {
      [BackgroundFetch.BackgroundFetchStatus.Restricted]: 'Restricted',
      [BackgroundFetch.BackgroundFetchStatus.Denied]: 'Denied',
      [BackgroundFetch.BackgroundFetchStatus.Available]: 'Available',
    };
    
    return {
      status: statusMap[status] || 'Unknown',
      isRegistered,
      canFetch: status === BackgroundFetch.BackgroundFetchStatus.Available,
    };
  } catch (error) {
    console.error('❌ Error getting background fetch status:', error);
    return null;
  }
}

export default {
  registerBackgroundFetch,
  unregisterBackgroundFetch,
  getBackgroundFetchStatus,
};
