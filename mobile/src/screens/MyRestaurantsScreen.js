import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import { getMyRestaurants } from '../api/restaurants';
import { useAuth } from '../auth/AuthContext';

export default function MyRestaurantsScreen({ navigation }) {
  const { token } = useAuth();

  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  async function loadRestaurants() {
    try {
      setLoading(true);
      setError('');

      const data = await getMyRestaurants(token);
      setRestaurants(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message || 'Failed to load restaurants');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadRestaurants();
  }, []);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
        <Text style={styles.helperText}>Loading your restaurants...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.center}>
        <Text style={styles.title}>Could not load restaurants</Text>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.primaryButton} onPress={loadRestaurants}>
          <Text style={styles.primaryButtonText}>Try again</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (restaurants.length === 0) {
    return (
      <View style={styles.center}>
        <Text style={styles.title}>No restaurants yet</Text>
        <Text style={styles.helperText}>
          Restaurants you create will appear here.
        </Text>
        <TouchableOpacity
          style={styles.primaryButton}
          onPress={() => navigation.navigate('CreateRestaurant')}
        >
          <Text style={styles.primaryButtonText}>Create restaurant</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.screenTitle}>My Restaurants</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => navigation.navigate('CreateRestaurant')}
        >
          <Text style={styles.addButtonText}>+ Add</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={restaurants}
        keyExtractor={(item) => String(item.id)}
        refreshing={loading}
        onRefresh={loadRestaurants}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.card}
            onPress={() =>
              navigation.navigate('RestaurantProducts', {
                restaurantId: item.id,
                restaurantName: item.name,
              })
            }
          >
            <Text style={styles.restaurantName}>{item.name}</Text>
            <Text style={styles.metaText}>{item.cuisine || 'No cuisine'}</Text>
            <Text style={styles.metaText}>{item.address || 'No address'}</Text>
            <Text style={styles.productCount}>
              {item.productCount || 0} menu items
            </Text>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f7f8fa',
  },
  center: {
    flex: 1,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f7f8fa',
  },
  headerRow: {
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  screenTitle: {
    fontSize: 28,
    fontWeight: '800',
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    marginBottom: 8,
    textAlign: 'center',
  },
  helperText: {
    marginTop: 8,
    color: '#5f6b7a',
    textAlign: 'center',
  },
  errorText: {
    color: '#b00020',
    textAlign: 'center',
    marginVertical: 12,
  },
  primaryButton: {
    marginTop: 18,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    backgroundColor: '#009de0',
  },
  primaryButtonText: {
    color: '#fff',
    fontWeight: '700',
  },
  addButton: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 12,
    backgroundColor: '#009de0',
  },
  addButtonText: {
    color: '#fff',
    fontWeight: '800',
  },
  card: {
    padding: 16,
    marginBottom: 12,
    borderRadius: 18,
    backgroundColor: '#fff',
  },
  restaurantName: {
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 6,
  },
  metaText: {
    color: '#5f6b7a',
    marginBottom: 3,
  },
  productCount: {
    marginTop: 8,
    color: '#009de0',
    fontWeight: '700',
  },
});