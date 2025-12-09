import React from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  Alert
} from 'react-native';
import { clearSession } from '../utils/authStorage';

export default function SettingsScreen({ navigation, route }) {
  const userType = route?.params?.userType || 'homeowner';

  const handleLogout = async () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        {
          text: 'Cancel',
          style: 'cancel'
        },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            try {
              await clearSession();
              navigation.reset({
                index: 0,
                routes: [{ name: 'Fixlo' }],
              });
            } catch (error) {
              console.error('Error logging out:', error);
              Alert.alert('Error', 'Failed to logout. Please try again.');
            }
          }
        }
      ]
    );
  };

  const settingsSections = [
    {
      title: 'Account',
      items: [
        { label: 'Edit Profile', icon: '👤', screen: 'Edit Profile' },
        { label: 'Notification Settings', icon: '🔔', screen: 'Notification Settings' },
        { label: 'Delete Account', icon: '🗑️', screen: 'Delete Account', danger: true },
      ]
    },
    {
      title: 'Support & Information',
      items: [
        { label: 'How Fixlo Works', icon: '❓', screen: 'How It Works' },
        { label: 'About Fixlo', icon: 'ℹ️', screen: 'About' },
        { label: 'Contact Support', icon: '💬', screen: 'Contact' },
        { label: 'FAQ', icon: '📚', screen: 'FAQ' },
        { label: 'Trust & Safety', icon: '🛡️', screen: 'Trust & Safety' },
      ]
    },
    {
      title: 'Legal',
      items: [
        { label: 'Terms of Service', icon: '📄', screen: 'Terms' },
        { label: 'Privacy Policy', icon: '🔒', screen: 'Privacy' },
        { label: 'Cookie Policy', icon: '🍪', screen: 'Cookie Policy' },
      ]
    },
    {
      title: 'App',
      items: [
        { label: 'App Information', icon: '📱', screen: 'App Info' },
        { label: 'Help Center', icon: '🆘', screen: 'Help Center' },
      ]
    }
  ];

  // Add referral for pros
  if (userType === 'pro') {
    settingsSections[0].items.push(
      { label: 'Referral Program', icon: '🎁', screen: 'Referral' }
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.header}>
          <Text style={styles.title}>Settings</Text>
          <Text style={styles.subtitle}>Manage your account and preferences</Text>
        </View>

        {settingsSections.map((section, idx) => (
          <View key={idx} style={styles.section}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            {section.items.map((item, itemIdx) => (
              <TouchableOpacity
                key={itemIdx}
                style={styles.settingItem}
                onPress={() => navigation.navigate(item.screen, { userType })}
              >
                <Text style={styles.settingIcon}>{item.icon}</Text>
                <Text style={[styles.settingLabel, item.danger && styles.dangerLabel]}>
                  {item.label}
                </Text>
                <Text style={styles.chevron}>›</Text>
              </TouchableOpacity>
            ))}
          </View>
        ))}

        <TouchableOpacity 
          style={styles.logoutButton}
          onPress={handleLogout}
        >
          <Text style={styles.logoutButtonText}>🚪 Logout</Text>
        </TouchableOpacity>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Fixlo Mobile App</Text>
          <Text style={styles.version}>Version 1.0.2</Text>
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
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  settingIcon: {
    fontSize: 22,
    marginRight: 12,
  },
  settingLabel: {
    flex: 1,
    fontSize: 16,
    color: '#0f172a',
    fontWeight: '500',
  },
  dangerLabel: {
    color: '#dc2626',
  },
  chevron: {
    fontSize: 24,
    color: '#cbd5e1',
    fontWeight: '300',
  },
  logoutButton: {
    backgroundColor: '#dc2626',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#dc2626',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  logoutButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: 'white',
  },
  footer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  footerText: {
    fontSize: 14,
    color: '#94a3b8',
    marginBottom: 4,
  },
  version: {
    fontSize: 12,
    color: '#cbd5e1',
  },
});
