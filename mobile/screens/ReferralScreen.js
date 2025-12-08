import React from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView,
  SafeAreaView,
  TouchableOpacity
} from 'react-native';

export default function ReferralScreen({ navigation }) {
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.header}>
          <Text style={styles.title}>Referral Program</Text>
          <Text style={styles.subtitle}>Coming Soon!</Text>
        </View>

        <View style={styles.heroSection}>
          <Text style={styles.heroEmoji}>🎁</Text>
          <Text style={styles.heroTitle}>Earn Rewards for Referrals</Text>
          <Text style={styles.heroText}>
            Our referral program is currently under development. Soon you'll be able to earn 
            rewards by referring other professionals to Fixlo!
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>How It Will Work</Text>
          
          <View style={styles.step}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepNumberText}>1</Text>
            </View>
            <View style={styles.stepContent}>
              <Text style={styles.stepTitle}>Share Your Referral Code</Text>
              <Text style={styles.stepText}>
                Get your unique referral link and share it with other professionals
              </Text>
            </View>
          </View>

          <View style={styles.step}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepNumberText}>2</Text>
            </View>
            <View style={styles.stepContent}>
              <Text style={styles.stepTitle}>They Sign Up</Text>
              <Text style={styles.stepText}>
                When they join Fixlo Pro using your link
              </Text>
            </View>
          </View>

          <View style={styles.step}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepNumberText}>3</Text>
            </View>
            <View style={styles.stepContent}>
              <Text style={styles.stepTitle}>You Both Earn</Text>
              <Text style={styles.stepText}>
                Receive rewards when they complete their first month
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Benefits Coming Soon</Text>
          <View style={styles.benefit}>
            <Text style={styles.benefitIcon}>💰</Text>
            <Text style={styles.benefitText}>Earn credits for each successful referral</Text>
          </View>
          <View style={styles.benefit}>
            <Text style={styles.benefitIcon}>🎯</Text>
            <Text style={styles.benefitText}>Unlimited referrals - no cap on earnings</Text>
          </View>
          <View style={styles.benefit}>
            <Text style={styles.benefitIcon}>🏆</Text>
            <Text style={styles.benefitText}>Special bonuses for top referrers</Text>
          </View>
          <View style={styles.benefit}>
            <Text style={styles.benefitIcon}>🤝</Text>
            <Text style={styles.benefitText}>Your referrals get a bonus too</Text>
          </View>
        </View>

        <View style={styles.notifySection}>
          <Text style={styles.notifyTitle}>Stay Updated</Text>
          <Text style={styles.notifyText}>
            We'll notify you as soon as the referral program launches. Make sure your 
            notification settings are enabled!
          </Text>
          <TouchableOpacity 
            style={styles.notifyButton}
            onPress={() => navigation.navigate('Notification Settings')}
          >
            <Text style={styles.notifyButtonText}>Check Notification Settings</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Have questions about the upcoming referral program? Contact our support team!
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
    color: '#f97316',
    fontWeight: '600',
  },
  heroSection: {
    backgroundColor: '#fef3c7',
    borderRadius: 16,
    padding: 30,
    alignItems: 'center',
    marginBottom: 20,
  },
  heroEmoji: {
    fontSize: 60,
    marginBottom: 16,
  },
  heroTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#78350f',
    marginBottom: 12,
    textAlign: 'center',
  },
  heroText: {
    fontSize: 15,
    color: '#92400e',
    lineHeight: 22,
    textAlign: 'center',
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
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#0f172a',
    marginBottom: 16,
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
  benefit: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  benefitIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  benefitText: {
    flex: 1,
    fontSize: 15,
    color: '#475569',
    lineHeight: 22,
  },
  notifySection: {
    backgroundColor: '#dbeafe',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    alignItems: 'center',
  },
  notifyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1e3a8a',
    marginBottom: 12,
  },
  notifyText: {
    fontSize: 14,
    color: '#1e40af',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 16,
  },
  notifyButton: {
    backgroundColor: '#2563eb',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  notifyButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: 'white',
  },
  footer: {
    padding: 20,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 20,
  },
});
