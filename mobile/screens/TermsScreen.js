import React from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView,
  SafeAreaView
} from 'react-native';

export default function TermsScreen({ navigation }) {
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.header}>
          <Text style={styles.title}>Terms & Conditions</Text>
          <Text style={styles.lastUpdated}>Last updated: September 16, 2025</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>1. Overview</Text>
          <Text style={styles.text}>
            Welcome to Fixlo. Fixlo operates a marketplace that connects homeowners with independent 
            professionals offering services such as plumbing, electrical, carpentry, painting, HVAC, 
            roofing, landscaping, house-cleaning, junk removal, and related home services. By accessing 
            or using our website, applications, or any related tools, you agree to these Terms & Conditions.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>2. Marketplace Role</Text>
          <Text style={styles.text}>
            Fixlo is a platform and does not perform services. Pros are independent third parties, 
            not employees, agents, or joint-venturers of Fixlo. We do not supervise, direct, or 
            control a Pro's work and are not responsible for the quality, timing, legality, or 
            outcomes of any Services performed by Pros.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>3. Accounts & Eligibility</Text>
          <Text style={styles.text}>
            • You must be at least 18 years old to use the Platform.{'\n'}
            • You agree to provide accurate, current, and complete information.{'\n'}
            • You are responsible for all activity under your account and for maintaining 
            the confidentiality of your login.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>4. Subscriptions, Payments & Fees</Text>
          <Text style={styles.text}>
            Pros may purchase subscriptions through our payment processor. Pricing and plan 
            details are shown at checkout.{'\n\n'}
            • Billing: By starting a subscription, you authorize recurring charges until you cancel.{'\n'}
            • Cancellations: You can cancel any time; your plan remains active through the current 
            billing period. Unless otherwise stated, fees are non-refundable.{'\n'}
            • Chargebacks & Disputes: Contact Fixlo first at pro4u.improvements@gmail.com. 
            We may suspend accounts with unresolved payment issues.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>5. Background Checks for Pros</Text>
          <Text style={styles.text}>
            If offered, Pros may undergo identity verification and/or background screenings through 
            third-party providers. Screening availability and scope vary by jurisdiction. Fixlo does 
            not guarantee that a screening will identify all relevant history. Pros are solely 
            responsible for complying with all laws applicable to their work.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>6. Communications & SMS Consent</Text>
          <Text style={styles.text}>
            By providing your phone number and opting in, you agree to receive SMS messages about 
            quotes, scheduling, and service updates. Message frequency varies. Message and data rates 
            may apply. Reply STOP to opt out, or HELP for help. Consent is not a condition of purchase.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>7. User Content & Reviews</Text>
          <Text style={styles.text}>
            • You are responsible for the content you submit.{'\n'}
            • Do not post unlawful, misleading, defamatory, infringing, or harmful content.{'\n'}
            • By submitting content, you grant Fixlo a non-exclusive, worldwide, royalty-free license 
            to host, display, and use it for operating and improving the Platform.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>8. Disclaimers</Text>
          <Text style={styles.text}>
            THE PLATFORM IS PROVIDED "AS IS" AND "AS AVAILABLE." TO THE MAXIMUM EXTENT PERMITTED BY LAW, 
            FIXLO DISCLAIMS ALL WARRANTIES, EXPRESS OR IMPLIED, INCLUDING IMPLIED WARRANTIES OF 
            MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND NON-INFRINGEMENT.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>9. Limitation of Liability</Text>
          <Text style={styles.text}>
            TO THE MAXIMUM EXTENT PERMITTED BY LAW, FIXLO WILL NOT BE LIABLE FOR INDIRECT, INCIDENTAL, 
            SPECIAL, CONSEQUENTIAL, EXEMPLARY, OR PUNITIVE DAMAGES. IN NO EVENT WILL FIXLO'S TOTAL 
            LIABILITY EXCEED THE GREATER OF (A) THE AMOUNT YOU PAID TO FIXLO IN THE 6 MONTHS PRIOR 
            TO THE CLAIM OR (B) USD $100.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>10. Governing Law</Text>
          <Text style={styles.text}>
            These Terms are governed by the laws of the State of North Carolina, USA, without regard 
            to conflict-of-laws principles. You agree to the exclusive jurisdiction and venue of state 
            and federal courts located in Charlotte, North Carolina.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>11. Contact</Text>
          <Text style={styles.text}>
            Questions about these Terms? Contact pro4u.improvements@gmail.com
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
  text: {
    fontSize: 14,
    color: '#475569',
    lineHeight: 22,
  },
});
