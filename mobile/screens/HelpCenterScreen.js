import React from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  Linking
} from 'react-native';

export default function HelpCenterScreen({ navigation }) {
  const handleEmail = () => {
    Linking.openURL('mailto:pro4u.improvements@gmail.com');
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.header}>
          <Text style={styles.title}>Help Center</Text>
          <Text style={styles.subtitle}>We're here to help!</Text>
        </View>

        <View style={styles.quickLinksSection}>
          <Text style={styles.sectionTitle}>Quick Links</Text>
          
          <TouchableOpacity 
            style={styles.linkCard}
            onPress={() => navigation.navigate('FAQ')}
          >
            <Text style={styles.linkIcon}>❓</Text>
            <View style={styles.linkContent}>
              <Text style={styles.linkTitle}>Frequently Asked Questions</Text>
              <Text style={styles.linkDescription}>Find answers to common questions</Text>
            </View>
            <Text style={styles.chevron}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.linkCard}
            onPress={() => navigation.navigate('How It Works')}
          >
            <Text style={styles.linkIcon}>📖</Text>
            <View style={styles.linkContent}>
              <Text style={styles.linkTitle}>How Fixlo Works</Text>
              <Text style={styles.linkDescription}>Learn about our platform</Text>
            </View>
            <Text style={styles.chevron}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.linkCard}
            onPress={() => navigation.navigate('Contact')}
          >
            <Text style={styles.linkIcon}>💬</Text>
            <View style={styles.linkContent}>
              <Text style={styles.linkTitle}>Contact Support</Text>
              <Text style={styles.linkDescription}>Get in touch with our team</Text>
            </View>
            <Text style={styles.chevron}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.linkCard}
            onPress={() => navigation.navigate('Trust & Safety')}
          >
            <Text style={styles.linkIcon}>🛡️</Text>
            <View style={styles.linkContent}>
              <Text style={styles.linkTitle}>Trust & Safety</Text>
              <Text style={styles.linkDescription}>Learn about our safety measures</Text>
            </View>
            <Text style={styles.chevron}>›</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Common Topics</Text>
          
          <View style={styles.topicItem}>
            <Text style={styles.topicTitle}>📱 Getting Started</Text>
            <Text style={styles.topicText}>
              New to Fixlo? Check out our How It Works page to learn the basics of posting 
              jobs or signing up as a pro.
            </Text>
          </View>

          <View style={styles.topicItem}>
            <Text style={styles.topicTitle}>💳 Billing & Payments</Text>
            <Text style={styles.topicText}>
              Questions about subscriptions, payments, or billing? Contact our support team 
              for assistance.
            </Text>
          </View>

          <View style={styles.topicItem}>
            <Text style={styles.topicTitle}>🔐 Account Security</Text>
            <Text style={styles.topicText}>
              Keep your account secure by using a strong password and enabling all security 
              features in your settings.
            </Text>
          </View>

          <View style={styles.topicItem}>
            <Text style={styles.topicTitle}>🔔 Notifications</Text>
            <Text style={styles.topicText}>
              Manage your notification preferences in Settings → Notification Settings to 
              control how you receive updates.
            </Text>
          </View>
        </View>

        <View style={styles.contactSection}>
          <Text style={styles.contactTitle}>Still Need Help?</Text>
          <Text style={styles.contactText}>
            Our support team is ready to assist you with any questions or concerns.
          </Text>
          <TouchableOpacity 
            style={styles.contactButton}
            onPress={handleEmail}
          >
            <Text style={styles.contactButtonText}>Email Support</Text>
          </TouchableOpacity>
          <Text style={styles.responseTime}>Response within 1 business day</Text>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            📧 pro4u.improvements@gmail.com{'\n'}
            🌐 www.fixloapp.com
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
  quickLinksSection: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#0f172a',
    marginBottom: 16,
  },
  linkCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 3,
  },
  linkIcon: {
    fontSize: 28,
    marginRight: 12,
  },
  linkContent: {
    flex: 1,
  },
  linkTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0f172a',
    marginBottom: 4,
  },
  linkDescription: {
    fontSize: 13,
    color: '#64748b',
  },
  chevron: {
    fontSize: 24,
    color: '#cbd5e1',
    fontWeight: '300',
  },
  section: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
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
  topicItem: {
    marginBottom: 20,
  },
  topicTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0f172a',
    marginBottom: 8,
  },
  topicText: {
    fontSize: 14,
    color: '#64748b',
    lineHeight: 20,
  },
  contactSection: {
    backgroundColor: '#dbeafe',
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    marginBottom: 20,
  },
  contactTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1e3a8a',
    marginBottom: 12,
  },
  contactText: {
    fontSize: 15,
    color: '#1e40af',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 22,
  },
  contactButton: {
    backgroundColor: '#2563eb',
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 10,
    marginBottom: 10,
  },
  contactButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: 'white',
  },
  responseTime: {
    fontSize: 13,
    color: '#1e40af',
    fontStyle: 'italic',
  },
  footer: {
    padding: 20,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 22,
  },
});
