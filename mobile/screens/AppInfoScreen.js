import React from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView,
  SafeAreaView,
  Platform
} from 'react-native';
import Constants from 'expo-constants';

export default function AppInfoScreen({ navigation }) {
  const appVersion = Constants.expoConfig?.version || '1.0.2';
  const buildNumber = Constants.expoConfig?.ios?.buildNumber || Constants.expoConfig?.android?.versionCode || '33';
  const expoVersion = Constants.expoConfig?.sdkVersion || 'N/A';

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.header}>
          <Text style={styles.title}>App Information</Text>
          <Text style={styles.subtitle}>Fixlo Mobile</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Version Details</Text>
          
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>App Version</Text>
            <Text style={styles.infoValue}>{appVersion}</Text>
          </View>
          
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Build Number</Text>
            <Text style={styles.infoValue}>Build {buildNumber}</Text>
          </View>
          
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Platform</Text>
            <Text style={styles.infoValue}>{Platform.OS === 'ios' ? 'iOS' : 'Android'}</Text>
          </View>
          
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Expo SDK</Text>
            <Text style={styles.infoValue}>{expoVersion}</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About Fixlo</Text>
          <Text style={styles.text}>
            Fixlo is your trusted marketplace for home services. We connect homeowners with 
            verified professionals for plumbing, electrical, carpentry, painting, HVAC, roofing, 
            landscaping, cleaning, and more.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Features</Text>
          <View style={styles.feature}>
            <Text style={styles.featureIcon}>✅</Text>
            <Text style={styles.featureText}>Background-checked professionals</Text>
          </View>
          <View style={styles.feature}>
            <Text style={styles.featureIcon}>✅</Text>
            <Text style={styles.featureText}>Real-time job matching</Text>
          </View>
          <View style={styles.feature}>
            <Text style={styles.featureIcon}>✅</Text>
            <Text style={styles.featureText}>Secure messaging platform</Text>
          </View>
          <View style={styles.feature}>
            <Text style={styles.featureIcon}>✅</Text>
            <Text style={styles.featureText}>SMS notifications</Text>
          </View>
          <View style={styles.feature}>
            <Text style={styles.featureIcon}>✅</Text>
            <Text style={styles.featureText}>In-app payments for pros</Text>
          </View>
          <View style={styles.feature}>
            <Text style={styles.featureIcon}>✅</Text>
            <Text style={styles.featureText}>Offline support</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Updates & Improvements</Text>
          <Text style={styles.updateTitle}>Build 34 - Latest</Text>
          <Text style={styles.updateText}>
            • Replaced all placeholder content with real Fixlo website content{'\n'}
            • Updated pricing to $59.99/month for Pro subscription{'\n'}
            • Enhanced notification settings with detailed explanations{'\n'}
            • Improved profile editing user experience{'\n'}
            • Updated FAQ with accurate pricing information{'\n'}
            • Bug fixes and performance improvements
          </Text>
          <Text style={styles.updateTitle}>Build 33</Text>
          <Text style={styles.updateText}>
            • Added comprehensive settings and account management{'\n'}
            • New informational pages (How It Works, About, FAQ, etc.){'\n'}
            • Legal pages (Terms, Privacy, Cookie Policy){'\n'}
            • Enhanced navigation and user experience
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Contact & Support</Text>
          <Text style={styles.text}>
            Email: pro4u.improvements@gmail.com{'\n'}
            Website: www.fixloapp.com{'\n\n'}
            Response time: Within 1 business day
          </Text>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            © 2025 Fixlo. All rights reserved.
          </Text>
          <Text style={styles.footerSubtext}>
            Made with ❤️ for homeowners and professionals
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
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#0f172a',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 18,
    color: '#64748b',
  },
  section: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
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
    fontSize: 18,
    fontWeight: '600',
    color: '#0f172a',
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  infoLabel: {
    fontSize: 15,
    color: '#64748b',
  },
  infoValue: {
    fontSize: 15,
    fontWeight: '600',
    color: '#0f172a',
  },
  text: {
    fontSize: 14,
    color: '#475569',
    lineHeight: 22,
  },
  feature: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  featureIcon: {
    fontSize: 18,
    marginRight: 10,
  },
  featureText: {
    flex: 1,
    fontSize: 14,
    color: '#475569',
    lineHeight: 20,
  },
  updateTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0f172a',
    marginBottom: 8,
  },
  updateText: {
    fontSize: 14,
    color: '#64748b',
    lineHeight: 22,
  },
  footer: {
    marginTop: 20,
    padding: 20,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 14,
    color: '#94a3b8',
    marginBottom: 8,
  },
  footerSubtext: {
    fontSize: 12,
    color: '#cbd5e1',
  },
});
