import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';
import HomeownerScreen from './screens/HomeownerScreen';
import ProScreen from './screens/ProScreen';
import ProSignupScreen from './screens/ProSignupScreen';
import HomeownerJobRequestScreen from './screens/HomeownerJobRequestScreen';

const Stack = createNativeStackNavigator();

function HomeScreen({ navigation }) {
  return (
    <View style={styles.container}>
      <Image 
        source={require('./assets/fixlo-logo.png')} 
        style={styles.logo}
        resizeMode="contain"
      />
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
