import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import HomeownerScreen from './screens/HomeownerScreen';
import ProScreen from './screens/ProScreen';
import ProSignupScreen from './screens/ProSignupScreen';
import HomeownerJobRequestScreen from './screens/HomeownerJobRequestScreen';

const Stack = createNativeStackNavigator();

function HomeScreen({ navigation }) {
  return (
    <View style={styles.container}>
      <View style={styles.logoContainer}>
        <Text style={styles.logoText}>Fixlo</Text>
        <Text style={styles.logoSubtext}>🔧 Home Repair Professionals</Text>
      </View>
      <Text style={styles.title}>Welcome to Fixlo</Text>
      <Text style={styles.subtitle}>Connect with trusted professionals in your area</Text>

      <TouchableOpacity
        style={styles.button}
        onPress={() => navigation.navigate('Homeowner')}
      >
        <Text style={styles.buttonText}>🏠 I am a Homeowner</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.button, { backgroundColor: '#2563eb' }]}
        onPress={() => navigation.navigate('Pro')}
      >
        <Text style={styles.buttonText}>👷 I am a Pro</Text>
      </TouchableOpacity>
    </View>
  );
}

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerStyle: {
            backgroundColor: '#f97316',
          },
          headerTintColor: '#fff',
          headerTitleStyle: {
            fontWeight: 'bold',
          },
        }}
      >
        <Stack.Screen 
          name="Fixlo" 
          component={HomeScreen} 
          options={{ title: 'Fixlo - Home Services' }}
        />
        <Stack.Screen 
          name="Homeowner" 
          component={HomeownerScreen} 
          options={{ title: 'Homeowner Dashboard' }}
        />
        <Stack.Screen 
          name="Pro" 
          component={ProScreen} 
          options={{ title: 'Pro Dashboard' }}
        />
        <Stack.Screen 
          name="Pro Signup" 
          component={ProSignupScreen} 
          options={{ title: 'Join as Pro - $59.99/month' }}
        />
        <Stack.Screen 
          name="Post a Job" 
          component={HomeownerJobRequestScreen} 
          options={{ title: 'Submit Job Request' }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 30,
    padding: 20,
    backgroundColor: '#667eea',
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  logoText: {
    fontSize: 36,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 5,
  },
  logoSubtext: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.9)',
    textAlign: 'center',
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
    width: '85%',
    alignItems: 'center',
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
  }
});
