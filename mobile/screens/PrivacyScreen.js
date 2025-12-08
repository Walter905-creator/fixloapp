import React from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView,
  SafeAreaView
} from 'react-native';

export default function PrivacyScreen({ navigation }) {
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.header}>
          <Text style={styles.title}>Privacy Policy</Text>
          <Text style={styles.lastUpdated}>Last updated: October 22, 2025</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>1. Overview</Text>
          <Text style={styles.text}>
            This Privacy Policy explains how Fixlo collects, uses, discloses, and safeguards your 
            information when you use our marketplace platform that connects homeowners with independent 
            professionals offering home services.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>2. Information We Collect</Text>
          <Text style={styles.subsectionTitle}>Personal Information:</Text>
          <Text style={styles.text}>
            • Name, email address, phone number, and postal address{'\n'}
            • Date of birth (for age verification){'\n'}
            • Profile photos and other uploaded content
          </Text>
          <Text style={styles.subsectionTitle}>Professional Information (for Pros):</Text>
          <Text style={styles.text}>
            • Trade specialties, certifications, and licenses{'\n'}
            • Business information and service areas{'\n'}
            • Background check results (via Checkr){'\n'}
            • Work history and professional references
          </Text>
          <Text style={styles.subsectionTitle}>Device and Usage Information:</Text>
          <Text style={styles.text}>
            • Device identifiers, IP addresses, and browser information{'\n'}
            • Platform usage patterns and interaction data{'\n'}
            • Location data (with your permission){'\n'}
            • Cookies and similar tracking technologies
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>3. How We Use Your Information</Text>
          <Text style={styles.text}>
            • Service Matching: Connect homeowners with qualified pros{'\n'}
            • Platform Operations: Provide, maintain, and improve our services{'\n'}
            • Communication: Send service updates and notifications{'\n'}
            • Payment Processing: Handle subscriptions through Stripe{'\n'}
            • Safety & Security: Conduct background checks{'\n'}
            • Customer Support: Respond to inquiries{'\n'}
            • Legal Compliance: Meet legal obligations{'\n'}
            • Analytics: Analyze usage patterns
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>4. Information Sharing</Text>
          <Text style={styles.text}>
            We do not sell, rent, or trade your personal information. We may share your information with:{'\n\n'}
            • Service Providers: Stripe (payments), Checkr (background checks), Twilio (SMS){'\n'}
            • Platform Users: Pro profiles visible to homeowners; job details shared with matching pros{'\n'}
            • Legal Requirements: When required by law or to protect our rights
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>5. SMS & Communication Consent</Text>
          <Text style={styles.text}>
            By providing your phone number and opting in, you consent to receive SMS messages from Fixlo 
            regarding job leads, account updates, and platform announcements.{'\n\n'}
            Message frequency varies. Message and data rates may apply. Reply STOP to opt out, or HELP 
            for help. Consent is not a condition of using our services.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>6. Data Retention & Deletion</Text>
          <Text style={styles.text}>
            We retain your personal information for as long as necessary to provide our services:{'\n\n'}
            • Active Accounts: Data retained while your account is active{'\n'}
            • Inactive Accounts: Data may be retained for up to 7 years{'\n'}
            • Financial Records: Retained as required by law{'\n\n'}
            You may request deletion of your personal information by contacting us at 
            pro4u.improvements@gmail.com. We will respond within 30 days.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>7. Security Measures</Text>
          <Text style={styles.text}>
            We implement appropriate security measures to protect your information:{'\n\n'}
            • Data encryption in transit and at rest{'\n'}
            • Secure servers and access controls{'\n'}
            • Regular security audits{'\n'}
            • Employee training on data protection{'\n\n'}
            However, no method of transmission over the internet is 100% secure.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>8. Children's Privacy</Text>
          <Text style={styles.text}>
            Our Platform is not intended for individuals under 18 years of age. We do not knowingly 
            collect personal information from children under 18.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>9. Your Rights</Text>
          <Text style={styles.text}>
            Depending on your location, you may have rights to:{'\n\n'}
            • Access, correct, or delete your personal information{'\n'}
            • Object to or restrict certain data processing{'\n'}
            • Data portability{'\n'}
            • Withdraw consent for communications{'\n\n'}
            Contact us at pro4u.improvements@gmail.com to exercise your rights.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>10. Contact</Text>
          <Text style={styles.text}>
            Questions about this Privacy Policy? Contact pro4u.improvements@gmail.com
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
  lastUpdated: {
    fontSize: 14,
    color: '#64748b',
    fontStyle: 'italic',
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
    marginBottom: 12,
  },
  subsectionTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#334155',
    marginTop: 10,
    marginBottom: 6,
  },
  text: {
    fontSize: 14,
    color: '#475569',
    lineHeight: 22,
  },
});
