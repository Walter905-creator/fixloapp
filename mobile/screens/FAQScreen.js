import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView,
  SafeAreaView,
  TouchableOpacity
} from 'react-native';

const FAQ_DATA = [
  {
    category: 'General',
    questions: [
      {
        q: 'What is Fixlo?',
        a: 'Fixlo is a marketplace that connects homeowners with verified professionals for home services like plumbing, electrical, carpentry, painting, and more.'
      },
      {
        q: 'How does Fixlo work?',
        a: 'Simply post your job request, get matched with background-checked pros, compare quotes, and choose the best fit for your project.'
      },
      {
        q: 'Is Fixlo free to use?',
        a: 'Yes! Homeowners can post job requests and connect with pros for free. Professionals pay a monthly subscription to access leads.'
      }
    ]
  },
  {
    category: 'For Homeowners',
    questions: [
      {
        q: 'How do I post a job?',
        a: 'Create an account, describe your project, and our platform will match you with qualified pros in your area.'
      },
      {
        q: 'Are the pros verified?',
        a: 'Yes! All professionals undergo background checks and verification before joining our platform.'
      },
      {
        q: 'What if I\'m not satisfied?',
        a: 'Contact our support team and we\'ll help resolve any issues with your service.'
      }
    ]
  },
  {
    category: 'For Professionals',
    questions: [
      {
        q: 'How do I become a Fixlo Pro?',
        a: 'Sign up for a Pro account, complete the verification process including background check, and subscribe to start receiving job leads.'
      },
      {
        q: 'How much does it cost?',
        a: 'Fixlo Pro subscription is $59.99/month with unlimited access to job leads in your area.'
      },
      {
        q: 'How do I get paid?',
        a: 'Payment is arranged directly between you and the homeowner. Fixlo does not process job payments.'
      }
    ]
  },
  {
    category: 'Safety & Trust',
    questions: [
      {
        q: 'How are pros vetted?',
        a: 'All pros undergo background checks, license verification (where applicable), and identity confirmation.'
      },
      {
        q: 'What if something goes wrong?',
        a: 'Contact our support team immediately. We take all reports seriously and investigate thoroughly.'
      }
    ]
  }
];

function FAQItem({ question, answer }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <View style={styles.faqItem}>
      <TouchableOpacity 
        style={styles.questionContainer}
        onPress={() => setExpanded(!expanded)}
      >
        <Text style={styles.question}>{question}</Text>
        <Text style={styles.expandIcon}>{expanded ? '−' : '+'}</Text>
      </TouchableOpacity>
      {expanded && (
        <View style={styles.answerContainer}>
          <Text style={styles.answer}>{answer}</Text>
        </View>
      )}
    </View>
  );
}

export default function FAQScreen({ navigation }) {
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.header}>
          <Text style={styles.title}>Frequently Asked Questions</Text>
          <Text style={styles.subtitle}>Find answers to common questions</Text>
        </View>

        {FAQ_DATA.map((category, idx) => (
          <View key={idx} style={styles.categorySection}>
            <Text style={styles.categoryTitle}>{category.category}</Text>
            {category.questions.map((item, qIdx) => (
              <FAQItem 
                key={qIdx} 
                question={item.q} 
                answer={item.a} 
              />
            ))}
          </View>
        ))}

        <View style={styles.footer}>
          <Text style={styles.footerTitle}>Still have questions?</Text>
          <Text style={styles.footerText}>
            Contact our support team and we'll be happy to help!
          </Text>
          <TouchableOpacity 
            style={styles.contactButton}
            onPress={() => navigation.navigate('Contact')}
          >
            <Text style={styles.contactButtonText}>Contact Support</Text>
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
  categorySection: {
    marginBottom: 20,
  },
  categoryTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 12,
  },
  faqItem: {
    backgroundColor: 'white',
    borderRadius: 12,
    marginBottom: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 3,
  },
  questionContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  question: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: '#0f172a',
    lineHeight: 22,
  },
  expandIcon: {
    fontSize: 24,
    fontWeight: '300',
    color: '#f97316',
    marginLeft: 12,
  },
  answerContainer: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    paddingTop: 0,
  },
  answer: {
    fontSize: 15,
    color: '#475569',
    lineHeight: 22,
  },
  footer: {
    marginTop: 20,
    padding: 20,
    backgroundColor: '#dbeafe',
    borderRadius: 12,
    alignItems: 'center',
  },
  footerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1e3a8a',
    marginBottom: 8,
  },
  footerText: {
    fontSize: 15,
    color: '#1e40af',
    textAlign: 'center',
    marginBottom: 16,
  },
  contactButton: {
    backgroundColor: '#2563eb',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  contactButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
});
