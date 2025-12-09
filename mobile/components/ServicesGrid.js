import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';

/**
 * ServicesGrid Component
 * 
 * Displays the service categories available on Fixlo
 * Content sourced from: https://fixloapp.com (HomePage.jsx)
 * 
 * Services include: Plumbing, Electrical, Cleaning, Roofing, HVAC, 
 * Carpentry, Painting, Landscaping, Junk Removal, Decks, Handyman
 */

const SERVICES = [
  { 
    id: 'plumbing',
    title: 'Plumbing', 
    desc: 'Faucets, pipes, drains, and more',
    icon: '🔧',
    category: 'plumbing'
  },
  { 
    id: 'electrical',
    title: 'Electrical', 
    desc: 'Lighting, wiring, outlets, and more',
    icon: '⚡',
    category: 'electrical'
  },
  { 
    id: 'cleaning',
    title: 'Cleaning', 
    desc: 'Housekeeping, carpets, windows',
    icon: '🧹',
    category: 'cleaning'
  },
  { 
    id: 'roofing',
    title: 'Roofing', 
    desc: 'Repairs, replacements, inspections',
    icon: '🏠',
    category: 'roofing'
  },
  { 
    id: 'hvac',
    title: 'HVAC', 
    desc: 'Heating, cooling, vents',
    icon: '❄️',
    category: 'hvac'
  },
  { 
    id: 'carpentry',
    title: 'Carpentry', 
    desc: 'Framing, trim, installs',
    icon: '🪚',
    category: 'carpentry'
  },
  { 
    id: 'painting',
    title: 'Painting', 
    desc: 'Interior and exterior painting',
    icon: '🎨',
    category: 'painting'
  },
  { 
    id: 'landscaping',
    title: 'Landscaping', 
    desc: 'Lawn, garden, hardscape',
    icon: '🌳',
    category: 'landscaping'
  },
  { 
    id: 'junk-removal',
    title: 'Junk Removal', 
    desc: 'Haul away unwanted items',
    icon: '🚛',
    category: 'junk-removal'
  },
  { 
    id: 'decks',
    title: 'Decks', 
    desc: 'Build, repair, staining',
    icon: '🪵',
    category: 'decks'
  },
  { 
    id: 'handyman',
    title: 'Handyman', 
    desc: 'Small jobs, quick fixes',
    icon: '🔨',
    category: 'handyman'
  }
];

export default function ServicesGrid({ navigation }) {
  const handleServicePress = (service) => {
    // Navigate to job request screen with pre-selected service category
    navigation.navigate('Post a Job', { 
      selectedService: service.category,
      serviceTitle: service.title 
    });
  };

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>
        Book trusted home services: plumbing, electrical, junk removal, cleaning & more.
      </Text>
      
      <View style={styles.grid}>
        {SERVICES.map((service) => (
          <TouchableOpacity
            key={service.id}
            style={styles.card}
            activeOpacity={0.7}
            onPress={() => handleServicePress(service)}
          >
            <View style={styles.cardContent}>
              <Text style={styles.icon}>{service.icon}</Text>
              <Text style={styles.title}>{service.title}</Text>
              <Text style={styles.desc}>{service.desc}</Text>
              <View style={styles.arrow}>
                <Text style={styles.arrowText}>Explore →</Text>
              </View>
            </View>
          </TouchableOpacity>
        ))}
      </View>

      {/* Popular Services Info */}
      <View style={styles.popularContainer}>
        <Text style={styles.popularHeading}>Popular services near you</Text>
        <View style={styles.popularList}>
          <Text style={styles.popularItem}>⭐ Trusted pros</Text>
          <Text style={styles.popularItem}>🛡️ Background checks</Text>
          <Text style={styles.popularItem}>💬 Fast quotes</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 20,
  },
  heading: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#0f172a',
    textAlign: 'center',
    marginBottom: 24,
    paddingHorizontal: 16,
    lineHeight: 30,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 8,
  },
  card: {
    width: '50%',
    padding: 8,
  },
  cardContent: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    minHeight: 160,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  icon: {
    fontSize: 36,
    marginBottom: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#0f172a',
    marginBottom: 6,
  },
  desc: {
    fontSize: 14,
    color: '#64748b',
    lineHeight: 20,
    marginBottom: 12,
  },
  arrow: {
    marginTop: 'auto',
  },
  arrowText: {
    color: '#f97316',
    fontSize: 14,
    fontWeight: '600',
  },
  popularContainer: {
    marginTop: 24,
    marginHorizontal: 16,
    padding: 20,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  popularHeading: {
    fontSize: 18,
    fontWeight: '600',
    color: '#0f172a',
    marginBottom: 16,
  },
  popularList: {
    gap: 10,
  },
  popularItem: {
    fontSize: 14,
    color: '#475569',
    lineHeight: 22,
    marginBottom: 8,
  },
});
