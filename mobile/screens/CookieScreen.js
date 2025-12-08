import React from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView,
  SafeAreaView
} from 'react-native';

export default function CookieScreen({ navigation }) {
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.header}>
          <Text style={styles.title}>Cookie Policy</Text>
          <Text style={styles.lastUpdated}>Last updated: October 22, 2025</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>What Are Cookies?</Text>
          <Text style={styles.text}>
            Cookies are small text files that are placed on your device when you visit our website 
            or use our mobile application. They help us provide you with a better experience by 
            remembering your preferences and understanding how you use our Platform.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Types of Cookies We Use</Text>
          
          <Text style={styles.subsectionTitle}>1. Essential Cookies</Text>
          <Text style={styles.text}>
            These cookies are necessary for the Platform to function properly. They enable core 
            functionality such as security, network management, and accessibility.
          </Text>

          <Text style={styles.subsectionTitle}>2. Performance Cookies</Text>
          <Text style={styles.text}>
            These cookies help us understand how visitors interact with our Platform by collecting 
            and reporting information anonymously. This helps us improve the Platform's performance.
          </Text>

          <Text style={styles.subsectionTitle}>3. Functionality Cookies</Text>
          <Text style={styles.text}>
            These cookies enable the Platform to provide enhanced functionality and personalization. 
            They may remember your preferences, such as language settings or region.
          </Text>

          <Text style={styles.subsectionTitle}>4. Analytics Cookies</Text>
          <Text style={styles.text}>
            We use analytics cookies to track how users interact with our Platform. This information 
            helps us understand usage patterns and improve our services.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Third-Party Cookies</Text>
          <Text style={styles.text}>
            We may use third-party services that set cookies on your device:{'\n\n'}
            • Payment Processing: Stripe may use cookies to facilitate secure payments{'\n'}
            • Analytics: To understand usage patterns and improve our Platform{'\n'}
            • Communications: Twilio for SMS delivery and notifications
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Managing Cookies</Text>
          <Text style={styles.text}>
            Most web browsers automatically accept cookies, but you can usually modify your browser 
            settings to decline cookies if you prefer. Please note that disabling cookies may affect 
            the functionality of our Platform.{'\n\n'}
            To manage cookies in your browser:{'\n'}
            • Chrome: Settings → Privacy and Security → Cookies{'\n'}
            • Safari: Preferences → Privacy → Cookies and Website Data{'\n'}
            • Firefox: Options → Privacy & Security → Cookies{'\n'}
            • Edge: Settings → Privacy & Security → Cookies
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Mobile App Data</Text>
          <Text style={styles.text}>
            Our mobile application may store data locally on your device to enhance performance and 
            provide offline functionality. This data is used similarly to cookies on web browsers 
            and includes:{'\n\n'}
            • User preferences and settings{'\n'}
            • Cached content for faster loading{'\n'}
            • Session tokens for authentication{'\n\n'}
            You can clear this data through your device's app settings or by uninstalling the app.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Updates to This Policy</Text>
          <Text style={styles.text}>
            We may update this Cookie Policy from time to time to reflect changes in our practices 
            or legal requirements. The "Last updated" date at the top indicates when this policy 
            was last revised.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Contact Us</Text>
          <Text style={styles.text}>
            If you have questions about our use of cookies or this Cookie Policy, please contact us 
            at pro4u.improvements@gmail.com
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
    marginTop: 12,
    marginBottom: 8,
  },
  text: {
    fontSize: 14,
    color: '#475569',
    lineHeight: 22,
  },
});
