import { StatusBar } from 'expo-status-bar';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { checkBackendHealth } from './src/api/health';
import {
  LOCATION_STATUS,
  requestCurrentLocation,
} from './src/location/locationService';
import { sortRestaurantsByDistance } from './src/location/distance';

const SAMPLE_RESTAURANTS = [
  {
    id: 'restaurant-nearby',
    name: 'Nearby restaurant',
    latitude: 31.7683,
    longitude: 35.2137,
  },
  {
    id: 'restaurant-far',
    name: 'Far restaurant',
    latitude: 32.077,
    longitude: 34.774,
  },
  {
    id: 'restaurant-no-location',
    name: 'Restaurant without coordinates',
  },
];

function formatDistance(distanceKm) {
  if (distanceKm === null) {
    return 'Distance unavailable';
  }

  if (distanceKm < 1) {
    return `${Math.round(distanceKm * 1000)} m away`;
  }

  return `${distanceKm.toFixed(1)} km away`;
}

export default function App() {
  const [connectionState, setConnectionState] = useState('loading');
  const [message, setMessage] = useState('Checking backend connection...');
  const [locationState, setLocationState] = useState('idle');
  const [locationMessage, setLocationMessage] = useState(
    'Use your location to enable nearby restaurant sorting.'
  );
  const [nearbyRestaurants, setNearbyRestaurants] = useState([]);

  const checkConnection = useCallback(async () => {
    setConnectionState('loading');
    setMessage('Checking backend connection...');

    try {
      const healthData = await checkBackendHealth();

      setConnectionState('success');
      setMessage(
        `Connected successfully. Service: ${healthData.service || 'backend'}`
      );
    } catch (error) {
      setConnectionState('error');
      setMessage(error.message || 'Could not connect to the backend.');
    }
  }, []);

  const handleUseMyLocation = useCallback(async () => {
    setLocationState('loading');
    setLocationMessage('Requesting location permission...');
    setNearbyRestaurants([]);

    const result = await requestCurrentLocation();

    if (result.status === LOCATION_STATUS.AVAILABLE) {
      const sortedRestaurants = sortRestaurantsByDistance(
        SAMPLE_RESTAURANTS,
        result.coordinates
      );

      setLocationState('success');
      setNearbyRestaurants(sortedRestaurants);
      setLocationMessage(
        `Location received: ${result.coordinates.latitude.toFixed(5)}, ` +
          `${result.coordinates.longitude.toFixed(5)}`
      );
      return;
    }

    setLocationState('error');
    setLocationMessage(result.message);
  }, []);

  useEffect(() => {
    checkConnection();
  }, [checkConnection]);

  const isConnectionLoading = connectionState === 'loading';
  const isConnectionSuccess = connectionState === 'success';
  const isLocationLoading = locationState === 'loading';

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Wolt Delivery</Text>
        <Text style={styles.subtitle}>Mobile app setup</Text>

        <View style={styles.statusCard}>
          <Text style={styles.statusLabel}>Backend connection</Text>

          {isConnectionLoading && <ActivityIndicator size="large" />}

          <Text style={styles.statusText}>
            {isConnectionLoading
              ? 'Loading...'
              : isConnectionSuccess
                ? 'Connected'
                : 'Connection failed'}
          </Text>

          <Text style={styles.message}>{message}</Text>

          {!isConnectionLoading && (
            <Pressable style={styles.button} onPress={checkConnection}>
              <Text style={styles.buttonText}>Retry connection</Text>
            </Pressable>
          )}
        </View>

        <View style={styles.statusCard}>
          <Text style={styles.statusLabel}>Nearby restaurants</Text>

          {isLocationLoading && <ActivityIndicator size="large" />}

          <Text style={styles.statusText}>
            {isLocationLoading
              ? 'Getting location...'
              : locationState === 'success'
                ? 'Location ready'
                : locationState === 'error'
                  ? 'Location unavailable'
                  : 'Location not requested'}
          </Text>

          <Text style={styles.message}>{locationMessage}</Text>

          {!isLocationLoading && (
            <Pressable style={styles.button} onPress={handleUseMyLocation}>
              <Text style={styles.buttonText}>Use my location</Text>
            </Pressable>
          )}
        </View>

        {nearbyRestaurants.length > 0 && (
          <View style={styles.statusCard}>
            <Text style={styles.statusLabel}>Sorting preview</Text>

            {nearbyRestaurants.map((restaurant) => (
              <View key={restaurant.id} style={styles.restaurantRow}>
                <Text style={styles.restaurantName}>{restaurant.name}</Text>
                <Text style={styles.restaurantDistance}>
                  {formatDistance(restaurant.distanceKm)}
                </Text>
              </View>
            ))}
          </View>
        )}

        <Text style={styles.apiText}>
          API: {process.env.EXPO_PUBLIC_API_BASE_URL || 'Not configured'}
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f7f7f7',
  },
  content: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 24,
    gap: 16,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    marginBottom: 16,
  },
  statusCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 24,
    gap: 16,
  },
  statusLabel: {
    fontSize: 16,
    fontWeight: '600',
  },
  statusText: {
    fontSize: 22,
    fontWeight: '700',
  },
  message: {
    fontSize: 15,
    lineHeight: 22,
  },
  button: {
    alignItems: 'center',
    borderRadius: 10,
    paddingVertical: 14,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '700',
  },
  restaurantRow: {
    borderTopWidth: 1,
    borderTopColor: '#e5e5e5',
    paddingTop: 12,
    gap: 4,
  },
  restaurantName: {
    fontSize: 16,
    fontWeight: '600',
  },
  restaurantDistance: {
    fontSize: 14,
  },
  apiText: {
    fontSize: 12,
    marginTop: 8,
  },
});