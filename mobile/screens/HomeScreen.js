import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Image,
  Dimensions,
} from 'react-native';

const { width } = Dimensions.get('window');

const SERVICES = [
  {
    id: 'plumbing',
    title: 'Plumbing',
    desc: 'Faucets, pipes, drains, and more',
    icon: '🔧',
    color: '#3b82f6'
  },
  {
    id: 'electrical',
    title: 'Electrical',
    desc: 'Lighting, wiring, outlets, and more',
    icon: '⚡',
    color: '#eab308'
  },
  {
    id: 'cleaning',
    title: 'Cleaning',
    desc: 'Housekeeping, carpets, windows',
    icon: '🧹',
    color: '#06b6d4'
  },
  {
    id: 'roofing',
    title: 'Roofing',
    desc: 'Repairs, replacements, inspections',
    icon: '🏠',
    color: '#8b5cf6'
  },
  {
    id: 'hvac',
    title: 'HVAC',
    desc: 'Heating, cooling, vents',
    icon: '❄️',
    color: '#0ea5e9'
  },
  {
    id: 'carpentry',
    title: 'Carpentry',
    desc: 'Framing, trim, installs',
    icon: '🪚',
    color: '#f59e0b'
  },
  {
    id: 'painting',
    title: 'Painting',
    desc: 'Interior and exterior painting',
    icon: '🎨',
    color: '#ec4899'
  },
  {
    id: 'landscaping',
    title: 'Landscaping',
    desc: 'Lawn, garden, hardscape',
    icon: '🌳',
    color: '#10b981'
  },
  {
    id: 'junk-removal',
    title: 'Junk Removal',
    desc: 'Haul away unwanted items',
    icon: '🚛',
    color: '#f97316'
  },
  {
    id: 'handyman',
    title: 'Handyman',
    desc: 'Small jobs, quick fixes',
    icon: '🔨',
    color: '#6366f1'
  },
];

const POPULAR_SERVICES = [
  'Plumbing in New York',
  'Electrical in Los Angeles',
  'Cleaning in Chicago',
  'HVAC in Houston',
  'Plumbing in Phoenix',
  'Roofing in Philadelphia',
];

export default function HomeScreen({ navigation }) {
  const [searchQuery, setSearchQuery] = useState('');

  const handleServicePress = (service) => {
    // Navigate to service detail or job request
    navigation.navigate('Post a Job', { 
      service: service.title,
      category: service.id 
    });
  };

  const handleSearch = () => {
    if (searchQuery.trim()) {
      navigation.navigate('Post a Job', { 
        service: searchQuery 
      });
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      {/* Header */}
      <View style={styles.header}>
        <Image 
          source={require('../assets/fixlo-logo.png')} 
          style={styles.headerLogo}
          resizeMode="contain"
        />
      </View>

      {/* Search Section */}
      <View style={styles.searchSection}>
        <Text style={styles.mainTitle}>Search services{'\n'}near you</Text>
        <Text style={styles.subtitle}>
          Discover vetted pros, compare quotes, and book with confidence.
        </Text>

        <View style={styles.searchContainer}>
          <TextInput
            style={styles.searchInput}
            placeholder="What service do you need?"
            placeholderTextColor="#94a3b8"
            value={searchQuery}
            onChangeText={setSearchQuery}
            onSubmitEditing={handleSearch}
          />
          <TouchableOpacity 
            style={styles.searchButton}
            onPress={handleSearch}
            activeOpacity={0.8}
          >
            <Text style={styles.searchButtonText}>Search</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.trustBadges}>
          <View style={styles.badge}>
            <Text style={styles.badgeIcon}>⭐</Text>
            <Text style={styles.badgeText}>Trusted pros</Text>
          </View>
          <View style={styles.badge}>
            <Text style={styles.badgeIcon}>🛡️</Text>
            <Text style={styles.badgeText}>Background checks</Text>
          </View>
          <View style={styles.badge}>
            <Text style={styles.badgeIcon}>💬</Text>
            <Text style={styles.badgeText}>Fast quotes</Text>
          </View>
        </View>
      </View>

      {/* Pro Value Banner */}
      <View style={styles.proBanner}>
        <Text style={styles.proBannerTitle}>Are you a Pro?</Text>
        <Text style={styles.proBannerText}>
          Join Fixlo and connect with thousands of homeowners looking for your services.
        </Text>
        <TouchableOpacity
          style={styles.proBannerButton}
          onPress={() => navigation.navigate('Pro Signup')}
          activeOpacity={0.8}
        >
          <Text style={styles.proBannerButtonText}>Join as a Pro →</Text>
        </TouchableOpacity>
      </View>

      {/* Services Grid */}
      <View style={styles.servicesSection}>
        <Text style={styles.sectionTitle}>
          Book trusted home services: plumbing, electrical, junk removal, cleaning & more.
        </Text>

        <View style={styles.servicesGrid}>
          {SERVICES.map((service) => (
            <TouchableOpacity
              key={service.id}
              style={styles.serviceCard}
              onPress={() => handleServicePress(service)}
              activeOpacity={0.7}
            >
              <View style={[styles.serviceIconContainer, { backgroundColor: service.color + '20' }]}>
                <Text style={styles.serviceIcon}>{service.icon}</Text>
              </View>
              <View style={styles.serviceContent}>
                <Text style={styles.serviceTitle}>{service.title}</Text>
                <Text style={styles.serviceDesc}>{service.desc}</Text>
                <Text style={styles.serviceLink}>Explore →</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Popular Services */}
        <View style={styles.popularSection}>
          <Text style={styles.popularTitle}>Popular services near you</Text>
          <View style={styles.popularGrid}>
            {POPULAR_SERVICES.map((service, index) => (
              <TouchableOpacity
                key={index}
                style={styles.popularItem}
                onPress={() => navigation.navigate('Post a Job', { service })}
                activeOpacity={0.7}
              >
                <Text style={styles.popularText}>{service}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>

      {/* How It Works */}
      <View style={styles.howItWorksSection}>
        <Text style={styles.sectionTitle}>How Fixlo Works</Text>
        
        <View style={styles.stepContainer}>
          <View style={styles.step}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepNumberText}>1</Text>
            </View>
            <Text style={styles.stepTitle}>Describe Your Project</Text>
            <Text style={styles.stepDesc}>
              Tell us what you need help with. It only takes a minute.
            </Text>
          </View>

          <View style={styles.step}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepNumberText}>2</Text>
            </View>
            <Text style={styles.stepTitle}>Get Matched with Pros</Text>
            <Text style={styles.stepDesc}>
              We'll connect you with trusted professionals in your area.
            </Text>
          </View>

          <View style={styles.step}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepNumberText}>3</Text>
            </View>
            <Text style={styles.stepTitle}>Compare & Hire</Text>
            <Text style={styles.stepDesc}>
              Review quotes, check credentials, and hire the best pro for your job.
            </Text>
          </View>
        </View>
      </View>

      {/* Bottom CTA */}
      <View style={styles.bottomCTA}>
        <Text style={styles.ctaTitle}>Ready to get started?</Text>
        <TouchableOpacity
          style={styles.ctaButton}
          onPress={() => navigation.navigate('Post a Job')}
          activeOpacity={0.8}
        >
          <Text style={styles.ctaButtonText}>Post a Job Now</Text>
        </TouchableOpacity>
      </View>

      {/* Quick Links */}
      <View style={styles.quickLinks}>
        <TouchableOpacity
          style={styles.quickLink}
          onPress={() => navigation.navigate('Homeowner')}
          activeOpacity={0.7}
        >
          <Text style={styles.quickLinkText}>My Dashboard</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.quickLink}
          onPress={() => navigation.navigate('Login', { userType: 'homeowner' })}
          activeOpacity={0.7}
        >
          <Text style={styles.quickLinkText}>Sign In</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  contentContainer: {
    paddingBottom: 40,
  },
  header: {
    backgroundColor: '#ffffff',
    paddingVertical: 15,
    paddingHorizontal: 20,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  headerLogo: {
    width: 150,
    height: 50,
  },
  searchSection: {
    backgroundColor: '#ffffff',
    paddingVertical: 30,
    paddingHorizontal: 20,
  },
  mainTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#0f172a',
    textAlign: 'center',
    lineHeight: 40,
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: '#64748b',
    textAlign: 'center',
    marginBottom: 25,
    lineHeight: 24,
  },
  searchContainer: {
    flexDirection: 'row',
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  searchInput: {
    flex: 1,
    paddingHorizontal: 15,
    fontSize: 16,
    color: '#0f172a',
  },
  searchButton: {
    backgroundColor: '#f97316',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  searchButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  trustBadges: {
    flexDirection: 'row',
    justifyContent: 'center',
    flexWrap: 'wrap',
    marginTop: 20,
    gap: 15,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  badgeIcon: {
    fontSize: 16,
  },
  badgeText: {
    fontSize: 14,
    color: '#475569',
    fontWeight: '600',
  },
  proBanner: {
    backgroundColor: '#2563eb',
    marginHorizontal: 20,
    marginVertical: 20,
    padding: 20,
    borderRadius: 12,
  },
  proBannerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 10,
  },
  proBannerText: {
    fontSize: 14,
    color: '#dbeafe',
    marginBottom: 15,
    lineHeight: 20,
  },
  proBannerButton: {
    backgroundColor: '#ffffff',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  proBannerButtonText: {
    color: '#2563eb',
    fontSize: 16,
    fontWeight: '600',
  },
  servicesSection: {
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#0f172a',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 30,
  },
  servicesGrid: {
    gap: 15,
  },
  serviceCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 15,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 15,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  serviceIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  serviceIcon: {
    fontSize: 30,
  },
  serviceContent: {
    flex: 1,
  },
  serviceTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#0f172a',
    marginBottom: 4,
  },
  serviceDesc: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 8,
  },
  serviceLink: {
    fontSize: 14,
    color: '#f97316',
    fontWeight: '600',
  },
  popularSection: {
    marginTop: 30,
    backgroundColor: '#ffffff',
    padding: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  popularTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#0f172a',
    marginBottom: 15,
  },
  popularGrid: {
    gap: 12,
  },
  popularItem: {
    paddingVertical: 8,
  },
  popularText: {
    fontSize: 14,
    color: '#2563eb',
    fontWeight: '500',
  },
  howItWorksSection: {
    paddingHorizontal: 20,
    paddingVertical: 30,
    backgroundColor: '#ffffff',
    marginTop: 20,
  },
  stepContainer: {
    gap: 25,
  },
  step: {
    alignItems: 'center',
  },
  stepNumber: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#f97316',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
  },
  stepNumberText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  stepTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#0f172a',
    marginBottom: 8,
    textAlign: 'center',
  },
  stepDesc: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 20,
  },
  bottomCTA: {
    backgroundColor: '#f97316',
    marginHorizontal: 20,
    marginTop: 30,
    padding: 25,
    borderRadius: 12,
    alignItems: 'center',
  },
  ctaTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 15,
  },
  ctaButton: {
    backgroundColor: '#ffffff',
    paddingVertical: 14,
    paddingHorizontal: 30,
    borderRadius: 8,
  },
  ctaButtonText: {
    color: '#f97316',
    fontSize: 16,
    fontWeight: '600',
  },
  quickLinks: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 30,
    marginTop: 25,
    paddingHorizontal: 20,
  },
  quickLink: {
    paddingVertical: 10,
  },
  quickLinkText: {
    fontSize: 16,
    color: '#2563eb',
    fontWeight: '600',
  },
});
