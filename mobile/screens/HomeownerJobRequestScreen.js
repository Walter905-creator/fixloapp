import React, { useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet, Alert, ScrollView } from 'react-native';
import axios from 'axios';

export default function HomeownerJobRequestScreen() {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [trade, setTrade] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!name || !phone || !address || !trade || !description) {
      Alert.alert("Missing Info", "Please fill out all fields.");
      return;
    }

    setLoading(true);
    try {
      const API_URL = process.env.EXPO_PUBLIC_API_URL || 'https://fixloapp.onrender.com';
      
      const res = await axios.post(`${API_URL}/api/notify/text`, {
        name,
        phone,
        address,
        trade,
        description
      });

      if (res.status === 200) {
        Alert.alert('✅ Request Sent!', 'Your project has been sent to available pros. You should receive calls/texts soon!');
        // Clear form
        setName('');
        setPhone('');
        setAddress('');
        setTrade('');
        setDescription('');
      } else {
        Alert.alert('❌ Error', 'Could not send request. Please try again.');
      }
    } catch (err) {
      if (__DEV__) {
      console.error('❌ Error sending job request:', err);
      }
      Alert.alert('❌ Network Error', 'Something went wrong. Please try again later.');
    }
    setLoading(false);
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.formContainer}>
        <Text style={styles.title}>🏠 Submit a Job Request</Text>
        <Text style={styles.subtitle}>Get connected with qualified professionals in your area</Text>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Your Name</Text>
          <TextInput 
            placeholder="Enter your full name" 
            style={styles.input} 
            value={name} 
            onChangeText={setName} 
          />
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Phone Number</Text>
          <TextInput 
            placeholder="(555) 123-4567" 
            style={styles.input} 
            value={phone} 
            onChangeText={setPhone}
            keyboardType="phone-pad" 
          />
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Address</Text>
          <TextInput 
            placeholder="Street address, City, State" 
            style={styles.input} 
            value={address} 
            onChangeText={setAddress} 
          />
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Trade Needed</Text>
          <TextInput 
            placeholder="e.g., Plumber, Electrician, HVAC, Roofing" 
            style={styles.input} 
            value={trade} 
            onChangeText={setTrade} 
          />
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Project Description</Text>
          <TextInput 
            placeholder="Describe your project in detail..."
            style={[styles.input, styles.textArea]} 
            multiline 
            numberOfLines={4}
            value={description} 
            onChangeText={setDescription} 
          />
        </View>

        <View style={styles.buttonContainer}>
          <Button 
            title={loading ? "Sending..." : "Submit Request"} 
            onPress={handleSubmit} 
            disabled={loading}
            color="#f97316"
          />
        </View>

        <Text style={styles.disclaimer}>
          By submitting, you agree to be contacted by professionals via phone/text about your project.
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f1f5f9'
  },
  formContainer: {
    padding: 20,
    paddingTop: 30
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#0f172a',
    marginBottom: 8,
    textAlign: 'center'
  },
  subtitle: {
    fontSize: 16,
    color: '#475569',
    marginBottom: 30,
    textAlign: 'center'
  },
  inputContainer: {
    marginBottom: 20
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8
  },
  input: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    backgroundColor: '#ffffff',
    padding: 15,
    borderRadius: 12,
    fontSize: 16
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top'
  },
  buttonContainer: {
    marginTop: 10,
    marginBottom: 20
  },
  disclaimer: {
    fontSize: 12,
    color: '#6b7280',
    textAlign: 'center',
    fontStyle: 'italic'
  }
});
