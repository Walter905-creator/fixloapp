import React from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView,
  SafeAreaView
} from 'react-native';

export default function TrustSafetyScreen({ navigation }) {
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.header}>
          <Text style={styles.title}>Trust & Safety</Text>
          <Text style={styles.subtitle}>Your safety is our top priority</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🛡️ Background Checks</Text>
          <Text style={styles.text}>
            Every professional on Fixlo undergoes comprehensive background checks before being 
            approved to join our platform. We verify identity, check criminal records, and 
            validate professional credentials where applicable.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>✅ Verification Process</Text>
          <Text style={styles.text}>
            Our multi-step verification includes:
          </Text>
          <View style={styles.bulletPoint}>
            <Text style={styles.bullet}>• Identity verification</Text>
          </View>
          <View style={styles.bulletPoint}>
            <Text style={styles.bullet}>• Criminal background check</Text>
          </View>
          <View style={styles.bulletPoint}>
            <Text style={styles.bullet}>• License validation (where required)</Text>
          </View>
          <View style={styles.bulletPoint}>
            <Text style={styles.bullet}>• Insurance verification</Text>
          </View>
          <View style={styles.bulletPoint}>
            <Text style={styles.bullet}>• Reference checks</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🔒 Data Security</Text>
          <Text style={styles.text}>
            We use industry-standard encryption to protect your personal information. 
            Your payment details are never stored on our servers and are processed through 
            secure, PCI-compliant payment processors.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>👥 Community Standards</Text>
          <Text style={styles.text}>
            We maintain strict community guidelines to ensure respectful and professional 
            interactions. Any violations are taken seriously and may result in account suspension 
            or permanent removal from the platform.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📢 Reporting Issues</Text>
          <Text style={styles.text}>
            If you experience any safety concerns or inappropriate behavior, please report it 
            immediately through our support channels. We investigate all reports promptly and 
            take appropriate action.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>💼 Insurance & Liability</Text>
          <Text style={styles.text}>
            While Fixlo is a marketplace connecting homeowners with independent professionals, 
            we encourage all pros to maintain appropriate insurance coverage. We verify insurance 
            documentation during the onboarding process.
          </Text>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Questions about safety? Contact our support team anytime.
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
    fontSize: 20,
    fontWeight: '600',
    color: '#0f172a',
    marginBottom: 12,
  },
  text: {
    fontSize: 15,
    color: '#475569',
    lineHeight: 22,
  },
  bulletPoint: {
    marginTop: 8,
  },
  bullet: {
    fontSize: 15,
    color: '#475569',
    lineHeight: 22,
  },
  footer: {
    marginTop: 20,
    padding: 20,
    backgroundColor: '#dcfce7',
    borderRadius: 12,
  },
  footerText: {
    fontSize: 15,
    color: '#166534',
    textAlign: 'center',
    lineHeight: 22,
  },
});
