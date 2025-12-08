import React from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView,
  SafeAreaView
} from 'react-native';

export default function AboutScreen({ navigation }) {
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.header}>
          <Text style={styles.title}>About Fixlo</Text>
          <Text style={styles.subtitle}>Connecting homeowners with trusted professionals</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Our Mission</Text>
          <Text style={styles.text}>
            Fixlo is dedicated to making home services simple, reliable, and accessible. 
            We connect homeowners with verified professionals who deliver quality work you can trust.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>What We Do</Text>
          <Text style={styles.text}>
            We operate a marketplace that connects homeowners with independent professionals 
            offering services such as plumbing, electrical, carpentry, painting, HVAC, roofing, 
            landscaping, house cleaning, junk removal, and related home services.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quality & Trust</Text>
          <Text style={styles.text}>
            All professionals on our platform undergo background checks and verification. 
            We prioritize safety, quality, and customer satisfaction in every interaction.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Our Values</Text>
          <View style={styles.valueItem}>
            <Text style={styles.valueEmoji}>🛡️</Text>
            <View style={styles.valueContent}>
              <Text style={styles.valueTitle}>Trust & Safety</Text>
              <Text style={styles.valueText}>Verified and background-checked professionals</Text>
            </View>
          </View>
          <View style={styles.valueItem}>
            <Text style={styles.valueEmoji}>⭐</Text>
            <View style={styles.valueContent}>
              <Text style={styles.valueTitle}>Quality Service</Text>
              <Text style={styles.valueText}>Committed to excellence in every job</Text>
            </View>
          </View>
          <View style={styles.valueItem}>
            <Text style={styles.valueEmoji}>💬</Text>
            <View style={styles.valueContent}>
              <Text style={styles.valueTitle}>Clear Communication</Text>
              <Text style={styles.valueText}>Stay updated throughout your service journey</Text>
            </View>
          </View>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Join thousands of homeowners who trust Fixlo for their home service needs.
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
  valueItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  valueEmoji: {
    fontSize: 24,
    marginRight: 12,
  },
  valueContent: {
    flex: 1,
  },
  valueTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0f172a',
    marginBottom: 4,
  },
  valueText: {
    fontSize: 14,
    color: '#64748b',
    lineHeight: 20,
  },
  footer: {
    marginTop: 20,
    padding: 20,
    backgroundColor: '#dbeafe',
    borderRadius: 12,
  },
  footerText: {
    fontSize: 15,
    color: '#1e3a8a',
    textAlign: 'center',
    lineHeight: 22,
  },
});
