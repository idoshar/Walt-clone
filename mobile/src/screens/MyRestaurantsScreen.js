import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import { getMyRestaurants } from '../api/restaurants';
import { useAuth } from '../auth/AuthContext';
import ThemeToggle from '../components/ThemeToggle'; // מייבאים את כפתור החלפת התמה
import { useAppTheme } from '../theme/ThemeContext';

export default function MyRestaurantsScreen({ navigation }) {
  const { token } = useAuth();
  const { theme } = useAppTheme();
  const styles = createStyles(theme.colors);

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
        <ActivityIndicator size="large" color={theme.colors.primary} />
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

        <View style={styles.headerActions}>
          <ThemeToggle compact /> {/* כפתור החלפת דארק מוד */}
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => navigation.navigate('CreateRestaurant')}
          >
            <Text style={styles.addButtonText}>+ Add</Text>
          </TouchableOpacity>
        </View>
      </View>

      <FlatList
        data={restaurants}
        keyExtractor={(item) => String(item.id)}
        refreshing={loading}
        onRefresh={loadRestaurants}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.card}
            activeOpacity={0.85}
            onPress={() =>
              navigation.navigate('RestaurantProducts', {
                restaurantId: item.id,
                restaurantName: item.name,
              })
            }
          >
            {item.image ? (
              <Image
                source={{ uri: item.image }}
                style={styles.restaurantImage}
                resizeMode="cover"
              />
            ) : (
              <View style={styles.imagePlaceholder}>
                <Text style={styles.imagePlaceholderText}>No image</Text>
              </View>
            )}

            <View style={styles.cardContent}>
              <View style={styles.cardTopRow}>
                <Text style={styles.restaurantName} numberOfLines={1}>
                  {item.name}
                </Text>

                <View style={styles.countBadge}>
                  <Text style={styles.countBadgeText}>
                    {item.productCount || 0} items
                  </Text>
                </View>
              </View>

              <Text style={styles.metaText} numberOfLines={1}>
                {item.cuisine || 'No cuisine'}
              </Text>

              <Text style={styles.addressText} numberOfLines={1}>
                {item.address || 'No address'}
              </Text>
            </View>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

function createStyles(colors) {
  return StyleSheet.create({
    container: {
      flex: 1,
      paddingHorizontal: 16,
      paddingTop: 16,
      backgroundColor: colors.background,
    },
    listContent: {
      paddingBottom: 24,
    },
    center: {
      flex: 1,
      padding: 24,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.background,
    },
    headerRow: {
      marginBottom: 18,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    headerActions: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    screenTitle: {
      fontSize: 28,
      fontWeight: '800',
      color: colors.text,
    },
    title: {
      fontSize: 24,
      fontWeight: '800',
      marginBottom: 8,
      textAlign: 'center',
      color: colors.text,
    },
    helperText: {
      marginTop: 8,
      color: colors.textMuted || '#5f6b7a',
      textAlign: 'center',
    },
    errorText: {
      color: colors.danger || '#b00020',
      textAlign: 'center',
      marginVertical: 12,
    },
    primaryButton: {
      marginTop: 18,
      paddingVertical: 12,
      paddingHorizontal: 20,
      borderRadius: 12,
      backgroundColor: colors.primary || '#009de0',
    },
    primaryButtonText: {
      color: colors.onPrimary || '#fff',
      fontWeight: '700',
    },
    addButton: {
      paddingVertical: 9,
      paddingHorizontal: 15,
      borderRadius: 14,
      backgroundColor: colors.primary || '#009de0',
    },
    addButtonText: {
      color: colors.onPrimary || '#fff',
      fontWeight: '800',
    },
    card: {
      marginBottom: 16,
      borderRadius: 20,
      backgroundColor: colors.surface || '#fff',
      overflow: 'hidden',
      elevation: 3,
      shadowColor: '#000',
      shadowOpacity: 0.08,
      shadowRadius: 12,
      shadowOffset: { width: 0, height: 4 },
    },
    restaurantImage: {
      width: '100%',
      height: 190,
      backgroundColor: colors.border || '#eef1f4',
    },
    imagePlaceholder: {
      width: '100%',
      height: 190,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.border || '#eef1f4',
    },
    imagePlaceholderText: {
      color: colors.textMuted || '#5f6b7a',
      fontWeight: '700',
    },
    cardContent: {
      padding: 16,
    },
    cardTopRow: {
      marginBottom: 6,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    restaurantName: {
      flex: 1,
      fontSize: 20,
      fontWeight: '800',
      color: colors.text,
      marginRight: 10,
    },
    countBadge: {
      paddingVertical: 5,
      paddingHorizontal: 10,
      borderRadius: 999,
      backgroundColor: colors.primarySoft || '#e6f6fd',
    },
    countBadgeText: {
      color: colors.primary || '#009de0',
      fontSize: 13,
      fontWeight: '800',
    },
    metaText: {
      color: colors.textMuted || '#4b5563',
      marginBottom: 5,
      fontSize: 15,
    },
    addressText: {
      color: colors.textMuted || '#6b7280',
      fontSize: 14,
    },
  });
}