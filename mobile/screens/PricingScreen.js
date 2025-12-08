import React from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView,
  SafeAreaView,
  TouchableOpacity
} from 'react-native';

const PRICING_FEATURES = [
  '✅ Unlimited job leads in your area',
  '✅ Direct messaging with homeowners',
  '✅ Profile highlighting in search results',
  '✅ Background check verification badge',
  '✅ Customer reviews and ratings',
  '✅ Lead notifications via SMS',
  '✅ Mobile and web dashboard access',
  '✅ Priority customer support'
];

export default function PricingScreen({ navigation }) {
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.header}>
          <Text style={styles.title}>Fixlo Pro Pricing</Text>
          <Text style={styles.subtitle}>Grow your business with unlimited leads</Text>
        </View>

        <View style={styles.pricingCard}>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>MOST POPULAR</Text>
          </View>
          <Text style={styles.planName}>Pro Monthly</Text>
          <View style={styles.priceContainer}>
            <Text style={styles.currency}>$</Text>
            <Text style={styles.price}>29</Text>
            <Text style={styles.period}>.99/mo</Text>
          </View>
          <Text style={styles.billingNote}>Billed monthly • Cancel anytime</Text>
          
          <View style={styles.featuresContainer}>
            <Text style={styles.featuresTitle}>Everything you need:</Text>
            {PRICING_FEATURES.map((feature, idx) => (
              <View key={idx} style={styles.feature}>
                <Text style={styles.featureText}>{feature}</Text>
              </View>
            ))}
          </View>

          <TouchableOpacity 
            style={styles.ctaButton}
            onPress={() => navigation.navigate('Pro Signup')}
          >
            <Text style={styles.ctaButtonText}>Start Your Subscription</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.guaranteeSection}>
          <Text style={styles.guaranteeTitle}>💯 30-Day Satisfaction Guarantee</Text>
          <Text style={styles.guaranteeText}>
            Not satisfied? Cancel within 30 days for a full refund, no questions asked.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Why Fixlo Pro?</Text>
          <View style={styles.benefit}>
            <Text style={styles.benefitEmoji}>📈</Text>
            <View style={styles.benefitContent}>
              <Text style={styles.benefitTitle}>Grow Your Business</Text>
              <Text style={styles.benefitText}>
                Access unlimited job leads in your service area and connect with homeowners 
                actively seeking your services.
              </Text>
            </View>
          </View>
          <View style={styles.benefit}>
            <Text style={styles.benefitEmoji}>⏱️</Text>
            <View style={styles.benefitContent}>
              <Text style={styles.benefitTitle}>Save Time</Text>
              <Text style={styles.benefitText}>
                Stop searching for leads. Let qualified homeowners come to you through our platform.
              </Text>
            </View>
          </View>
          <View style={styles.benefit}>
            <Text style={styles.benefitEmoji}>🏆</Text>
            <View style={styles.benefitContent}>
              <Text style={styles.benefitTitle}>Build Your Reputation</Text>
              <Text style={styles.benefitText}>
                Get reviews, showcase your work, and stand out with a verified pro badge.
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.faqSection}>
          <Text style={styles.faqTitle}>Common Questions</Text>
          <Text style={styles.faqQuestion}>Can I cancel anytime?</Text>
          <Text style={styles.faqAnswer}>
            Yes! Cancel your subscription at any time with no penalties or fees.
          </Text>
          <Text style={styles.faqQuestion}>How do payments work?</Text>
          <Text style={styles.faqAnswer}>
            Secure monthly billing through Apple App Store. Your subscription automatically renews 
            each month unless cancelled.
          </Text>
          <Text style={styles.faqQuestion}>What services can I offer?</Text>
          <Text style={styles.faqAnswer}>
            Plumbing, electrical, carpentry, painting, HVAC, roofing, landscaping, cleaning, 
            junk removal, and more!
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
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#64748b',
    lineHeight: 24,
    textAlign: 'center',
  },
  pricingCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 24,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
    borderWidth: 2,
    borderColor: '#f97316',
  },
  badge: {
    backgroundColor: '#f97316',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    alignSelf: 'center',
    marginBottom: 16,
  },
  badgeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  planName: {
    fontSize: 24,
    fontWeight: '700',
    color: '#0f172a',
    textAlign: 'center',
    marginBottom: 12,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'center',
    marginBottom: 8,
  },
  currency: {
    fontSize: 24,
    fontWeight: '600',
    color: '#0f172a',
    marginTop: 8,
  },
  price: {
    fontSize: 56,
    fontWeight: '700',
    color: '#0f172a',
  },
  period: {
    fontSize: 18,
    fontWeight: '600',
    color: '#64748b',
    marginTop: 16,
  },
  billingNote: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
    marginBottom: 24,
  },
  featuresContainer: {
    marginBottom: 24,
  },
  featuresTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0f172a',
    marginBottom: 12,
  },
  feature: {
    marginBottom: 10,
  },
  featureText: {
    fontSize: 15,
    color: '#475569',
    lineHeight: 22,
  },
  ctaButton: {
    backgroundColor: '#f97316',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#f97316',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  ctaButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: 'white',
  },
  guaranteeSection: {
    backgroundColor: '#dcfce7',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
  },
  guaranteeTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#166534',
    marginBottom: 8,
    textAlign: 'center',
  },
  guaranteeText: {
    fontSize: 14,
    color: '#166534',
    textAlign: 'center',
    lineHeight: 20,
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
    marginBottom: 16,
  },
  benefit: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  benefitEmoji: {
    fontSize: 28,
    marginRight: 12,
  },
  benefitContent: {
    flex: 1,
  },
  benefitTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0f172a',
    marginBottom: 4,
  },
  benefitText: {
    fontSize: 14,
    color: '#64748b',
    lineHeight: 20,
  },
  faqSection: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
  },
  faqTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#0f172a',
    marginBottom: 16,
  },
  faqQuestion: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0f172a',
    marginTop: 12,
    marginBottom: 6,
  },
  faqAnswer: {
    fontSize: 14,
    color: '#64748b',
    lineHeight: 20,
  },
});
