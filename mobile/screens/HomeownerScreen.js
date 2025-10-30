import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';

export default function HomeownerScreen({ navigation }) {
  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>🏠 Homeowner Dashboard</Text>
        <Text style={styles.subtitle}>Find trusted professionals for your home</Text>
      
      <TouchableOpacity 
        style={styles.button}
        onPress={() => navigation.navigate('Post a Job')}
      >
        <Text style={styles.buttonText}>Post a Job Request</Text>
      </TouchableOpacity>
      
      <TouchableOpacity 
        style={[styles.button, styles.secondaryButton]}
        activeOpacity={0.7}
        onPress={() => {
          // Future: Navigate to active requests list
          Alert.alert('Coming Soon', 'View your active job requests');
        }}
      >
        <Text style={[styles.buttonText, styles.secondaryButtonText]}>My Active Requests</Text>
      </TouchableOpacity>
      
      <TouchableOpacity 
        style={[styles.button, styles.secondaryButton]}
        activeOpacity={0.7}
        onPress={() => {
          // Future: Navigate to pros list
          Alert.alert('Coming Soon', 'Browse professional profiles');
        }}
      >
        <Text style={[styles.buttonText, styles.secondaryButtonText]}>Browse Professionals</Text>
      </TouchableOpacity>
      
        <Text style={styles.note}>✅ Free for homeowners!</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f8fafc',
    justifyContent: 'center',
    alignItems: 'center'
  },
  content: {
    width: '100%',
    maxWidth: 600,
    alignItems: 'stretch'
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1e293b',
    textAlign: 'center',
    marginBottom: 10
  },
  subtitle: {
    fontSize: 16,
    color: '#64748b',
    textAlign: 'center',
    marginBottom: 40
  },
  button: {
    backgroundColor: '#f97316',
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderRadius: 10,
    marginVertical: 8,
    alignItems: 'center',
    minHeight: 50
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: '#f97316'
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600'
  },
  secondaryButtonText: {
    color: '#f97316'
  },
  note: {
    textAlign: 'center',
    marginTop: 30,
    fontSize: 16,
    color: '#059669',
    fontWeight: '600'
  }
});
