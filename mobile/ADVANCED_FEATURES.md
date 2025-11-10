# Mobile App Advanced Features Implementation

## Overview
This document describes the advanced features implemented for the Fixlo mobile app including token refresh logic, offline queue, push notification categories, background fetch, job filtering, and direct messaging.

## Features Implemented

### 1. Token Refresh Logic Before Expiration

**Files:**
- `mobile/utils/authStorage.js` - Enhanced with token expiry tracking
- `mobile/utils/apiClient.js` - API client with automatic token refresh
- `server/routes/auth.js` - Token refresh endpoint

**How it works:**
- Tokens are saved with expiration timestamps
- API client automatically refreshes tokens 5 minutes before expiry
- Uses interceptors to check token status before each API call
- Handles refresh failures gracefully by clearing session

**Usage:**
```javascript
import apiClient from './utils/apiClient';

// Use apiClient instead of axios for all API calls
const response = await apiClient.get('/api/jobs');
// Token will be automatically refreshed if needed
```

### 2. Offline Queue for Actions

**Files:**
- `mobile/utils/offlineQueue.js` - Offline queue manager
- `mobile/package.json` - Added @react-native-community/netinfo dependency

**How it works:**
- Monitors network connectivity using NetInfo
- Queues actions when offline or when API calls fail
- Automatically processes queue when back online
- Persists queue to AsyncStorage
- Supports retry logic with max attempts (3)

**Usage:**
```javascript
import { offlineQueue } from './utils/offlineQueue';

// Queue an action
await offlineQueue.addToQueue({
  type: 'CREATE_JOB',
  endpoint: '/api/jobs',
  method: 'POST',
  data: { title: 'New Job' },
});

// Listen to queue status
const unsubscribe = offlineQueue.addListener((status) => {
  console.log('Queue status:', status);
});
```

### 3. Advanced Push Notification Categories

**Files:**
- `mobile/utils/notifications.js` - Enhanced with categories and actions

**How it works:**
- Defines notification categories (NEW_JOB, JOB_UPDATE, NEW_MESSAGE, PAYMENT)
- Each category has specific action buttons
- iOS supports interactive notifications with actions
- Notification actions can be handled in the app

**Categories:**
- **NEW_JOB**: Accept, View Details, Dismiss
- **JOB_UPDATE**: View Update
- **NEW_MESSAGE**: Reply, View
- **PAYMENT**: View Payment

**Usage:**
```javascript
import { scheduleLocalNotification, NotificationCategories } from './utils/notifications';

await scheduleLocalNotification({
  title: 'New Job Available',
  body: 'Plumbing job in downtown',
  category: NotificationCategories.NEW_JOB,
  data: { jobId: '12345' },
});
```

### 4. Background Fetch for New Jobs

**Files:**
- `mobile/utils/backgroundFetch.js` - Background fetch service
- `mobile/package.json` - Added expo-background-fetch and expo-task-manager dependencies

**How it works:**
- Registers background fetch task with TaskManager
- Fetches new jobs every 15 minutes (iOS minimum)
- Sends local notifications for new jobs
- Works even when app is closed

**Usage:**
```javascript
import { registerBackgroundFetch, getBackgroundFetchStatus } from './utils/backgroundFetch';

// Register for background fetch (call once during initialization)
await registerBackgroundFetch();

// Check status
const status = await getBackgroundFetchStatus();
console.log('Background fetch status:', status);
```

### 5. Job Filtering by Trade/Location

**Files:**
- `mobile/utils/jobFilter.js` - Job filtering utility
- `mobile/components/JobFilterModal.js` - Filter UI component
- `mobile/package.json` - Added expo-location dependency

**How it works:**
- Filter jobs by trade categories (17 trades supported)
- Filter by distance using GPS location (Haversine formula)
- Filter by manual location (city, state, ZIP code)
- Saves filter preferences to AsyncStorage
- Calculates distance in miles

**Usage:**
```javascript
import { filterJobs, getCurrentLocation } from './utils/jobFilter';

// Get user location
const location = await getCurrentLocation();

// Filter jobs
const filtered = filterJobs(allJobs, {
  trades: ['Plumbing', 'Electrical'],
  maxDistance: 25,
  userLocation: location,
});
```

**UI Component:**
```javascript
import JobFilterModal from './components/JobFilterModal';

<JobFilterModal
  visible={showModal}
  onClose={() => setShowModal(false)}
  onApplyFilters={(filters) => {
    // Apply filters to job list
    const filtered = filterJobs(jobs, filters);
    setFilteredJobs(filtered);
  }}
/>
```

### 6. Direct Messaging Between Users

**Files:**
- `mobile/utils/messagingService.js` - Messaging service
- `mobile/screens/MessagesScreen.js` - Conversation list screen
- `mobile/screens/ChatScreen.js` - Individual chat screen
- `server/routes/messages.js` - Messaging API endpoints
- `server/index.js` - Socket.io handlers for real-time messaging

**How it works:**
- Real-time messaging using Socket.io
- Messages cached in AsyncStorage
- Read receipts support
- Conversation list with unread counts
- Individual chat view with message bubbles

**Server Endpoints:**
- `GET /api/conversations` - Get all conversations
- `POST /api/conversations` - Start new conversation
- `GET /api/messages/:conversationId` - Get messages
- `POST /api/messages` - Send message
- `POST /api/messages/:messageId/read` - Mark as read

**Usage:**
```javascript
import messagingService from './utils/messagingService';

// Send a message
await messagingService.sendMessage(
  conversationId,
  recipientId,
  'Hello!'
);

// Fetch conversations
const conversations = await messagingService.fetchConversations();

// Listen for new messages
const unsubscribe = messagingService.addListener((event, data) => {
  if (event === 'new_message') {
    console.log('New message:', data);
  }
});
```

## Integration

All features are integrated into the main App.js:

```javascript
// App.js initialization
useEffect(() => {
  initializeSocket();
  await offlineQueue.initialize();
  await messagingService.initialize();
  
  const session = await getSession();
  if (session.userType === 'pro') {
    await registerBackgroundFetch();
  }
}, []);
```

## Testing

To test these features:

1. **Token Refresh**: Wait for token to approach expiry (or manually set shorter expiry) and make API calls
2. **Offline Queue**: Turn off network, perform actions, turn network back on
3. **Notifications**: Send test notification, interact with action buttons
4. **Background Fetch**: Close app, wait 15+ minutes, check for new job notifications
5. **Job Filtering**: Apply different filters and verify results
6. **Messaging**: Send messages between users, test real-time delivery

## Dependencies Added

```json
{
  "@react-native-community/netinfo": "^11.4.1",
  "expo-background-fetch": "~13.0.1",
  "expo-location": "~18.0.4",
  "expo-task-manager": "~12.0.1"
}
```

## Server Changes

- Added `/api/auth/refresh` endpoint for token refresh
- Added `/api/conversations` and `/api/messages` endpoints
- Enhanced Socket.io to handle `message:send` and `message:read` events
- Made `io` instance available to routes via `app.set('io', io)`

## Performance Considerations

- Offline queue is limited to 100 items
- Messages are cached locally for faster loading
- Background fetch minimum interval is 15 minutes (iOS limitation)
- Token refresh buffer is 5 minutes before expiry

## Security Considerations

- JWT tokens include expiration
- Refresh tokens required for token refresh
- Messages require authentication
- Socket.io connections are authenticated
- CORS properly configured for all origins

## Future Enhancements

1. Add encryption for stored messages
2. Implement message delivery confirmations
3. Add typing indicators
4. Support for message attachments
5. Add push notification for new messages
6. Implement message search
7. Add conversation archiving
8. Support for group messaging

## Troubleshooting

**Token refresh not working:**
- Check that JWT_SECRET is set on server
- Verify refresh token is saved correctly
- Check server logs for refresh endpoint errors

**Offline queue not processing:**
- Verify NetInfo is properly initialized
- Check queue status with `offlineQueue.getStatus()`
- Ensure network permissions are granted

**Notifications not showing:**
- Check device notification permissions
- Verify push token is registered
- Test with local notifications first

**Background fetch not running:**
- iOS requires physical device for testing
- Check background modes are enabled
- Verify task is registered

**Job filtering not working:**
- Check location permissions
- Verify GPS coordinates are present on jobs
- Test with manual location filter first

**Messages not real-time:**
- Verify Socket.io connection is established
- Check server Socket.io handlers
- Ensure messagingService is initialized
