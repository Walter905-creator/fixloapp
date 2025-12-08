import React from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  Linking,
  Alert
} from 'react-native';

export default function ContactScreen({ navigation }) {
  const handleEmail = () => {
    Linking.openURL('mailto:pro4u.improvements@gmail.com').catch(() => {
      Alert.alert('Error', 'Unable to open email app');
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.header}>
          <Text style={styles.title}>Contact & Support</Text>
          <Text style={styles.subtitle}>We're here to help</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📧 Email Support</Text>
          <TouchableOpacity 
            style={styles.contactButton}
            onPress={handleEmail}
          >
            <Text style={styles.email}>pro4u.improvements@gmail.com</Text>
          </TouchableOpacity>
          <Text style={styles.responseTime}>Response within 1 business day</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>💬 What can we help you with?</Text>
          <View style={styles.helpItem}>
            <Text style={styles.helpText}>• Account questions</Text>
          </View>
          <View style={styles.helpItem}>
            <Text style={styles.helpText}>• Technical support</Text>
          </View>
          <View style={styles.helpItem}>
            <Text style={styles.helpText}>• Billing inquiries</Text>
          </View>
          <View style={styles.helpItem}>
            <Text style={styles.helpText}>• Partnership opportunities</Text>
          </View>
          <View style={styles.helpItem}>
            <Text style={styles.helpText}>• General feedback</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🏢 Business Hours</Text>
          <Text style={styles.text}>
            Monday - Friday: 9:00 AM - 6:00 PM EST{'\n'}
            Saturday - Sunday: Closed
          </Text>
          <Text style={styles.note}>
            {'\n'}We aim to respond to all inquiries within one business day.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🔍 Before contacting us</Text>
          <Text style={styles.text}>
            Check our FAQ section for quick answers to common questions. 
            Many issues can be resolved instantly!
          </Text>
          <TouchableOpacity 
            style={styles.faqButton}
            onPress={() => navigation.navigate('FAQ')}
          >
            <Text style={styles.faqButtonText}>View FAQ</Text>
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
  contactButton: {
    backgroundColor: '#f97316',
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
  },
  email: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
    textAlign: 'center',
  },
  responseTime: {
    fontSize: 14,
    color: '#64748b',
    fontStyle: 'italic',
    textAlign: 'center',
  },
  text: {
    fontSize: 15,
    color: '#475569',
    lineHeight: 22,
  },
  note: {
    fontSize: 14,
    color: '#64748b',
    fontStyle: 'italic',
    lineHeight: 20,
  },
  helpItem: {
    marginBottom: 8,
  },
  helpText: {
    fontSize: 15,
    color: '#475569',
    lineHeight: 24,
  },
  faqButton: {
    marginTop: 15,
    backgroundColor: '#2563eb',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  faqButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
});
