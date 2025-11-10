import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Alert, Platform } from 'react-native';

// Notification categories with actions
export const NotificationCategories = {
  NEW_JOB: 'NEW_JOB',
  JOB_UPDATE: 'JOB_UPDATE',
  NEW_MESSAGE: 'NEW_MESSAGE',
  PAYMENT: 'PAYMENT',
};

// Set notification handler
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

/**
 * Set up notification categories with action buttons
 */
export async function setupNotificationCategories() {
  if (Platform.OS === 'ios') {
    await Notifications.setNotificationCategoryAsync(NotificationCategories.NEW_JOB, [
      {
        identifier: 'ACCEPT',
        buttonTitle: 'Accept Job',
        options: {
          opensAppToForeground: true,
        },
      },
      {
        identifier: 'VIEW',
        buttonTitle: 'View Details',
        options: {
          opensAppToForeground: true,
        },
      },
      {
        identifier: 'DISMISS',
        buttonTitle: 'Dismiss',
        options: {
          opensAppToForeground: false,
        },
      },
    ]);

    await Notifications.setNotificationCategoryAsync(NotificationCategories.JOB_UPDATE, [
      {
        identifier: 'VIEW',
        buttonTitle: 'View Update',
        options: {
          opensAppToForeground: true,
        },
      },
    ]);

    await Notifications.setNotificationCategoryAsync(NotificationCategories.NEW_MESSAGE, [
      {
        identifier: 'REPLY',
        buttonTitle: 'Reply',
        options: {
          opensAppToForeground: true,
        },
      },
      {
        identifier: 'VIEW',
        buttonTitle: 'View',
        options: {
          opensAppToForeground: true,
        },
      },
    ]);

    await Notifications.setNotificationCategoryAsync(NotificationCategories.PAYMENT, [
      {
        identifier: 'VIEW',
        buttonTitle: 'View Payment',
        options: {
          opensAppToForeground: true,
        },
      },
    ]);

    console.log('✅ Notification categories configured');
  }
}

export async function registerForPushNotificationsAsync() {
  let token;

  if (Device.isDevice) {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      Alert.alert('Permission Required', 'Push notifications are needed to receive job alerts!');
      return null;
    }

    // Set up notification categories
    await setupNotificationCategories();

    try {
      // Get the Expo push token
      token = (await Notifications.getExpoPushTokenAsync({
        projectId: 'your-expo-project-id', // You'll get this when you create an Expo project
      })).data;
      
      console.log('✅ Expo Push Token:', token);
    } catch (error) {
      console.error('❌ Error getting push token:', error);
      return null;
    }
  } else {
    Alert.alert('Device Required', 'Must use physical device for Push Notifications');
  }

  return token;
}

/**
 * Schedule a local notification
 * @param {Object} options - Notification options
 * @param {string} options.title - Notification title
 * @param {string} options.body - Notification body
 * @param {Object} options.data - Additional data
 * @param {string} options.category - Notification category
 * @param {number} options.seconds - Delay in seconds (optional)
 */
export async function scheduleLocalNotification({
  title,
  body,
  data = {},
  category = null,
  seconds = 0,
}) {
  try {
    const notificationId = await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data,
        categoryIdentifier: category,
        sound: true,
        priority: Notifications.AndroidNotificationPriority.HIGH,
      },
      trigger: seconds > 0 ? { seconds } : null,
    });
    
    console.log('✅ Local notification scheduled:', notificationId);
    return notificationId;
  } catch (error) {
    console.error('❌ Error scheduling notification:', error);
    return null;
  }
}

export function setupNotificationListeners() {
  // Listen for notifications received while app is in foreground
  const notificationListener = Notifications.addNotificationReceivedListener(notification => {
    console.log('🔔 Notification received:', notification);
  });

  // Listen for user tapping on notification
  const responseListener = Notifications.addNotificationResponseReceivedListener(response => {
    console.log('👆 Notification tapped:', response);
    const { actionIdentifier, notification } = response;
    const { data, categoryIdentifier } = notification.request.content;
    
    console.log('Action:', actionIdentifier, 'Category:', categoryIdentifier, 'Data:', data);
    
    // Handle different actions
    // This will be handled in the App.js to navigate to appropriate screens
  });

  return {
    notificationListener,
    responseListener,
  };
}

