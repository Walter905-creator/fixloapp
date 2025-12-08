import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView,
  SafeAreaView,
  Switch,
  TouchableOpacity,
  Alert
} from 'react-native';

export default function NotificationSettingsScreen({ navigation }) {
  // Settings are managed in local state; persistence will be added when backend is ready
  const [smsNotifications, setSmsNotifications] = useState(true);
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [pushNotifications, setPushNotifications] = useState(true);
  const [jobAlerts, setJobAlerts] = useState(true);
  const [messageAlerts, setMessageAlerts] = useState(true);
  const [promotionalEmails, setPromotionalEmails] = useState(false);

  const handleSave = () => {
    // Settings are saved to local state; backend sync will be implemented when API is ready
    Alert.alert(
      'Settings Saved',
      'Your notification preferences have been updated.',
      [{ text: 'OK' }]
    );
  };

  const SettingRow = ({ label, description, value, onValueChange }) => (
    <View style={styles.settingRow}>
      <View style={styles.settingInfo}>
        <Text style={styles.settingLabel}>{label}</Text>
        {description && (
          <Text style={styles.settingDescription}>{description}</Text>
        )}
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: '#cbd5e1', true: '#fdba74' }}
        thumbColor={value ? '#f97316' : '#f1f5f9'}
        ios_backgroundColor="#cbd5e1"
      />
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.header}>
          <Text style={styles.title}>Notification Settings</Text>
          <Text style={styles.subtitle}>Manage how you receive updates</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Notification Channels</Text>
          
          <SettingRow
            label="SMS Notifications"
            description="Receive text messages for important updates"
            value={smsNotifications}
            onValueChange={setSmsNotifications}
          />
          
          <SettingRow
            label="Email Notifications"
            description="Get updates via email"
            value={emailNotifications}
            onValueChange={setEmailNotifications}
          />
          
          <SettingRow
            label="Push Notifications"
            description="Receive in-app notifications"
            value={pushNotifications}
            onValueChange={setPushNotifications}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Notification Types</Text>
          
          <SettingRow
            label="Job Alerts"
            description="New job requests and matches"
            value={jobAlerts}
            onValueChange={setJobAlerts}
          />
          
          <SettingRow
            label="Message Alerts"
            description="New messages from homeowners/pros"
            value={messageAlerts}
            onValueChange={setMessageAlerts}
          />
          
          <SettingRow
            label="Promotional Emails"
            description="Marketing and promotional content"
            value={promotionalEmails}
            onValueChange={setPromotionalEmails}
          />
        </View>

        <View style={styles.infoBox}>
          <Text style={styles.infoTitle}>📱 SMS Opt-Out</Text>
          <Text style={styles.infoText}>
            To stop receiving SMS messages at any time, reply STOP to any message. 
            You can re-enable SMS notifications here.
          </Text>
        </View>

        <TouchableOpacity 
          style={styles.saveButton}
          onPress={handleSave}
        >
          <Text style={styles.saveButtonText}>Save Preferences</Text>
        </TouchableOpacity>

        <View style={styles.note}>
          <Text style={styles.noteText}>
            💡 Some notifications are essential for account security and service delivery, 
            and cannot be disabled.
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
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#0f172a',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: '#64748b',
    lineHeight: 24,
  },
  section: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 4,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748b',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  settingInfo: {
    flex: 1,
    marginRight: 16,
  },
  settingLabel: {
    fontSize: 16,
    color: '#0f172a',
    fontWeight: '500',
    marginBottom: 4,
  },
  settingDescription: {
    fontSize: 13,
    color: '#64748b',
    lineHeight: 18,
  },
  infoBox: {
    backgroundColor: '#dbeafe',
    borderRadius: 10,
    padding: 16,
    marginBottom: 20,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e3a8a',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#1e40af',
    lineHeight: 20,
  },
  saveButton: {
    backgroundColor: '#f97316',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#f97316',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 5,
  },
  saveButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: 'white',
  },
  note: {
    padding: 16,
    backgroundColor: '#fef3c7',
    borderRadius: 10,
  },
  noteText: {
    fontSize: 13,
    color: '#78350f',
    lineHeight: 18,
  },
});
