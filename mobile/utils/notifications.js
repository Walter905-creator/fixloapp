import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Alert } from 'react-native';

// Set notification handler
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

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

export function setupNotificationListeners() {
  // Listen for notifications received while app is in foreground
  const notificationListener = Notifications.addNotificationReceivedListener(notification => {
    console.log('🔔 Notification received:', notification);
  });

  // Listen for user tapping on notification
  const responseListener = Notifications.addNotificationResponseReceivedListener(response => {
    console.log('👆 Notification tapped:', response);
    // You can navigate to specific screens here based on notification data
  });

  return {
    notificationListener,
    responseListener,
  };
}
