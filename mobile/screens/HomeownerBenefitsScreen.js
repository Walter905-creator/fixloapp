import React from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView,
  SafeAreaView,
  TouchableOpacity
} from 'react-native';

const HOMEOWNER_BENEFITS = [
  {
    icon: '🔍',
    title: 'Find Trusted Pros',
    description: 'Access a network of background-checked, verified professionals in your area.'
  },
  {
    icon: '💰',
    title: 'Compare Quotes',
    description: 'Get multiple quotes from different pros and choose the best value for your project.'
  },
  {
    icon: '⭐',
    title: 'Read Reviews',
    description: 'See ratings and reviews from other homeowners before making your decision.'
  },
  {
    icon: '💬',
    title: 'Direct Communication',
    description: 'Message pros directly through our secure platform to discuss your project details.'
  },
  {
    icon: '📱',
    title: 'Stay Updated',
    description: 'Receive SMS notifications about your job status and pro responses.'
  },
  {
    icon: '🛡️',
    title: 'Safety First',
    description: 'All pros undergo background checks and verification for your peace of mind.'
  },
  {
    icon: '🎯',
    title: 'Wide Range of Services',
    description: 'From plumbing to landscaping, find pros for any home service you need.'
  },
  {
    icon: '✅',
    title: '100% Free',
    description: 'Post jobs, get quotes, and connect with pros at no cost to you.'
  }
];

export default function HomeownerBenefitsScreen({ navigation }) {
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.header}>
          <Text style={styles.title}>Homeowner Benefits</Text>
          <Text style={styles.subtitle}>Everything you need to get your home projects done right</Text>
        </View>

        <View style={styles.heroSection}>
          <Text style={styles.heroTitle}>🏠 Free for Homeowners</Text>
          <Text style={styles.heroText}>
            Post unlimited job requests and connect with as many pros as you need. 
            No hidden fees, no subscriptions required.
          </Text>
        </View>

        {HOMEOWNER_BENEFITS.map((benefit, idx) => (
          <View key={idx} style={styles.benefitCard}>
            <View style={styles.benefitHeader}>
              <Text style={styles.benefitIcon}>{benefit.icon}</Text>
              <Text style={styles.benefitTitle}>{benefit.title}</Text>
            </View>
            <Text style={styles.benefitDescription}>{benefit.description}</Text>
          </View>
        ))}

        <View style={styles.howItWorksSection}>
          <Text style={styles.sectionTitle}>How It Works</Text>
          <View style={styles.step}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepNumberText}>1</Text>
            </View>
            <View style={styles.stepContent}>
              <Text style={styles.stepTitle}>Post Your Job</Text>
              <Text style={styles.stepText}>
                Describe what you need and where you're located
              </Text>
            </View>
          </View>
          <View style={styles.step}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepNumberText}>2</Text>
            </View>
            <View style={styles.stepContent}>
              <Text style={styles.stepTitle}>Review Responses</Text>
              <Text style={styles.stepText}>
                Get quotes from multiple verified pros
              </Text>
            </View>
          </View>
          <View style={styles.step}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepNumberText}>3</Text>
            </View>
            <View style={styles.stepContent}>
              <Text style={styles.stepTitle}>Choose & Schedule</Text>
              <Text style={styles.stepText}>
                Pick the best pro and book your service
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.ctaSection}>
          <Text style={styles.ctaTitle}>Ready to get started?</Text>
          <TouchableOpacity 
            style={styles.ctaButton}
            onPress={() => navigation.navigate('Post a Job')}
          >
            <Text style={styles.ctaButtonText}>Post a Job Request</Text>
          </TouchableOpacity>
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
  heroSection: {
    backgroundColor: '#dbeafe',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
  },
  heroTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1e3a8a',
    marginBottom: 10,
    textAlign: 'center',
  },
  heroText: {
    fontSize: 15,
    color: '#1e40af',
    lineHeight: 22,
    textAlign: 'center',
  },
  benefitCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 18,
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
  benefitHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  benefitIcon: {
    fontSize: 28,
    marginRight: 12,
  },
  benefitTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#0f172a',
    flex: 1,
  },
  benefitDescription: {
    fontSize: 14,
    color: '#64748b',
    lineHeight: 20,
    marginLeft: 40,
  },
  howItWorksSection: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    marginTop: 20,
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
    fontSize: 22,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 20,
    textAlign: 'center',
  },
  step: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  stepNumber: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#f97316',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  stepNumberText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
  },
  stepContent: {
    flex: 1,
  },
  stepTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0f172a',
    marginBottom: 4,
  },
  stepText: {
    fontSize: 14,
    color: '#64748b',
    lineHeight: 20,
  },
  ctaSection: {
    backgroundColor: '#dcfce7',
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    marginBottom: 20,
  },
  ctaTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#166534',
    marginBottom: 16,
    textAlign: 'center',
  },
  ctaButton: {
    backgroundColor: '#16a34a',
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 10,
    shadowColor: '#16a34a',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 5,
  },
  ctaButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: 'white',
  },
});
