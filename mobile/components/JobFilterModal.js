/**
 * Job Filter Component
 * UI for filtering jobs by trade, location, and distance
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Switch,
  TextInput,
} from 'react-native';
import {
  TRADE_CATEGORIES,
  DISTANCE_OPTIONS,
  getCurrentLocation,
  saveFilterPreferences,
  loadFilterPreferences,
} from '../utils/jobFilter';

export default function JobFilterModal({ visible, onClose, onApplyFilters }) {
  const [selectedTrades, setSelectedTrades] = useState([]);
  const [maxDistance, setMaxDistance] = useState(null);
  const [useLocation, setUseLocation] = useState(false);
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [zipCode, setZipCode] = useState('');
  const [userLocation, setUserLocation] = useState(null);

  useEffect(() => {
    loadSavedPreferences();
  }, []);

  useEffect(() => {
    if (useLocation && !userLocation) {
      fetchUserLocation();
    }
  }, [useLocation]);

  const loadSavedPreferences = async () => {
    const preferences = await loadFilterPreferences();
    if (preferences) {
      setSelectedTrades(preferences.trades || []);
      setMaxDistance(preferences.maxDistance || null);
      setCity(preferences.city || '');
      setState(preferences.state || '');
      setZipCode(preferences.zipCode || '');
      setUseLocation(preferences.useLocation || false);
    }
  };

  const fetchUserLocation = async () => {
    const location = await getCurrentLocation();
    if (location) {
      setUserLocation(location);

    } else {
      setUseLocation(false);
    }
  };

  const toggleTrade = (trade) => {
    setSelectedTrades(prev => {
      if (prev.includes(trade)) {
        return prev.filter(t => t !== trade);
      } else {
        return [...prev, trade];
      }
    });
  };

  const handleApply = async () => {
    const filters = {
      trades: selectedTrades,
      maxDistance: useLocation ? maxDistance : null,
      userLocation: useLocation ? userLocation : null,
      city: !useLocation ? city : '',
      state: !useLocation ? state : '',
      zipCode: !useLocation ? zipCode : '',
      useLocation,
    };

    // Save preferences
    await saveFilterPreferences(filters);

    // Apply filters
    onApplyFilters(filters);
    onClose();
  };

  const handleClear = () => {
    setSelectedTrades([]);
    setMaxDistance(null);
    setUseLocation(false);
    setCity('');
    setState('');
    setZipCode('');
    setUserLocation(null);
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={false}
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose}>
            <Text style={styles.closeButton}>✕</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Filter Jobs</Text>
          <TouchableOpacity onPress={handleClear}>
            <Text style={styles.clearButton}>Clear</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content}>
          {/* Trade Selection */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>🔧 Select Trades</Text>
            <View style={styles.tradeGrid}>
              {TRADE_CATEGORIES.map((trade) => (
                <TouchableOpacity
                  key={trade}
                  style={[
                    styles.tradeButton,
                    selectedTrades.includes(trade) && styles.tradeButtonSelected,
                  ]}
                  onPress={() => toggleTrade(trade)}
                >
                  <Text
                    style={[
                      styles.tradeButtonText,
                      selectedTrades.includes(trade) && styles.tradeButtonTextSelected,
                    ]}
                  >
                    {trade}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Location Method */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>📍 Location</Text>
            <View style={styles.switchRow}>
              <Text style={styles.switchLabel}>Use my current location</Text>
              <Switch
                value={useLocation}
                onValueChange={setUseLocation}
                trackColor={{ false: '#d1d5db', true: '#f97316' }}
                thumbColor={useLocation ? '#ffffff' : '#f4f3f4'}
              />
            </View>
          </View>

          {/* Distance Filter (when using location) */}
          {useLocation && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>📏 Maximum Distance</Text>
              <View style={styles.distanceGrid}>
                {DISTANCE_OPTIONS.map((option) => (
                  <TouchableOpacity
                    key={option.label}
                    style={[
                      styles.distanceButton,
                      maxDistance === option.value && styles.distanceButtonSelected,
                    ]}
                    onPress={() => setMaxDistance(option.value)}
                  >
                    <Text
                      style={[
                        styles.distanceButtonText,
                        maxDistance === option.value && styles.distanceButtonTextSelected,
                      ]}
                    >
                      {option.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          {/* Manual Location (when not using current location) */}
          {!useLocation && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>🏙️ Manual Location</Text>
              <TextInput
                style={styles.input}
                placeholder="City"
                value={city}
                onChangeText={setCity}
                placeholderTextColor="#9ca3af"
              />
              <TextInput
                style={styles.input}
                placeholder="State (e.g., CA)"
                value={state}
                onChangeText={setState}
                maxLength={2}
                autoCapitalize="characters"
                placeholderTextColor="#9ca3af"
              />
              <TextInput
                style={styles.input}
                placeholder="ZIP Code"
                value={zipCode}
                onChangeText={setZipCode}
                keyboardType="numeric"
                maxLength={5}
                placeholderTextColor="#9ca3af"
              />
            </View>
          )}
        </ScrollView>

        {/* Apply Button */}
        <View style={styles.footer}>
          <TouchableOpacity style={styles.applyButton} onPress={handleApply}>
            <Text style={styles.applyButtonText}>
              Apply Filters {selectedTrades.length > 0 && `(${selectedTrades.length} trades)`}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 15,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
  },
  closeButton: {
    fontSize: 24,
    color: '#6b7280',
    width: 30,
  },
  clearButton: {
    fontSize: 16,
    color: '#f97316',
    fontWeight: '600',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  section: {
    marginTop: 20,
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 12,
  },
  tradeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tradeButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#d1d5db',
    marginRight: 8,
    marginBottom: 8,
  },
  tradeButtonSelected: {
    backgroundColor: '#f97316',
    borderColor: '#f97316',
  },
  tradeButtonText: {
    fontSize: 14,
    color: '#4b5563',
    fontWeight: '500',
  },
  tradeButtonTextSelected: {
    color: '#ffffff',
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 12,
  },
  switchLabel: {
    fontSize: 15,
    color: '#374151',
  },
  distanceGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  distanceButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#d1d5db',
    marginRight: 8,
    marginBottom: 8,
  },
  distanceButtonSelected: {
    backgroundColor: '#2563eb',
    borderColor: '#2563eb',
  },
  distanceButtonText: {
    fontSize: 14,
    color: '#4b5563',
    fontWeight: '500',
  },
  distanceButtonTextSelected: {
    color: '#ffffff',
  },
  input: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 15,
    color: '#111827',
    marginBottom: 12,
  },
  footer: {
    padding: 20,
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  applyButton: {
    backgroundColor: '#f97316',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  applyButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
});
