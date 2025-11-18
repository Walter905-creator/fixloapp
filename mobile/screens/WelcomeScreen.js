import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image, ScrollView } from 'react-native';

/**
 * WelcomeScreen - Initial landing page for selecting user type
 * This screen lets users choose between Homeowner and Pro paths
 */
export default function WelcomeScreen({ navigation }) {
  return (
    <ScrollView contentContainerStyle={styles.scrollContainer}>
      <View style={styles.container}>
        <View style={styles.content}>
          <Image 
            source={require('../assets/fixlo-logo.png')} 
            style={styles.logo}
            resizeMode="contain"
          />
          <Text style={styles.title}>Welcome to Fixlo</Text>
          <Text style={styles.subtitle}>Connect with trusted professionals in your area</Text>

          <TouchableOpacity
            style={styles.button}
            activeOpacity={0.7}
            onPress={() => navigation.navigate('Home')}
          >
            <Text style={styles.buttonText}>🏠 Browse Services</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, { backgroundColor: '#2563eb' }]}
            activeOpacity={0.7}
            onPress={() => navigation.navigate('Pro')}
          >
            <Text style={styles.buttonText}>👷 I am a Pro</Text>
          </TouchableOpacity>

          <View style={styles.authLinksContainer}>
            <TouchableOpacity
              style={styles.authLink}
              onPress={() => navigation.navigate('Login', { userType: 'homeowner' })}
            >
              <Text style={styles.authLinkText}>🏠 Homeowner Login</Text>
            </TouchableOpacity>
            
            <Text style={styles.authDivider}>•</Text>
            
            <TouchableOpacity
              style={styles.authLink}
              onPress={() => navigation.navigate('Login', { userType: 'pro' })}
            >
              <Text style={styles.authLinkText}>👷 Pro Login</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollContainer: {
    flexGrow: 1,
  },
  container: {
    flex: 1,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    minHeight: '100%',
  },
  content: {
    width: '100%',
    maxWidth: 600,
    alignItems: 'center'
  },
  logo: {
    width: 300,
    height: 120,
    marginBottom: 30,
  },
  title: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#0f172a',
    marginBottom: 10,
    textAlign: 'center'
  },
  subtitle: {
    fontSize: 18,
    color: '#475569',
    marginBottom: 50,
    textAlign: 'center'
  },
  button: {
    backgroundColor: '#f97316',
    paddingVertical: 18,
    paddingHorizontal: 30,
    borderRadius: 12,
    marginVertical: 12,
    width: '100%',
    alignItems: 'center',
    minHeight: 60,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  buttonText: {
    color: 'white',
    fontSize: 20,
    fontWeight: '600'
  },
  authLinksContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 30,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    width: '100%'
  },
  authLink: {
    padding: 10
  },
  authLinkText: {
    color: '#2563eb',
    fontSize: 16,
    fontWeight: '600'
  },
  authDivider: {
    color: '#94a3b8',
    fontSize: 16,
    marginHorizontal: 10
  },
});
