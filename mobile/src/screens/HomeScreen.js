import { StatusBar } from 'expo-status-bar';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Pressable,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { getRestaurants } from '../api/restaurants';
import { useAuth } from '../auth/AuthContext';
import { sortRestaurantsByDistance } from '../location/distance';
import {
  LOCATION_STATUS,
  requestCurrentLocation,
} from '../location/locationService';

const ALL_CUISINES = 'All';

function formatDistance(distanceKm) {
  if (distanceKm === null || distanceKm === undefined) {
    return 'Distance unavailable';
  }

  if (distanceKm < 1) {
    return `${Math.round(distanceKm * 1000)} m away`;
  }

  return `${distanceKm.toFixed(1)} km away`;
}

function hasRestaurantImage(restaurant) {
  return (
    typeof restaurant?.image === 'string' &&
    restaurant.image.trim().length > 0
  );
}

function getRestaurantInitial(restaurant) {
  return restaurant?.name?.trim()?.charAt(0)?.toUpperCase() || 'R';
}

export default function HomeScreen({ navigation }) {
  const { signOut, user } = useAuth();

  const [restaurants, setRestaurants] = useState([]);
  const [restaurantsState, setRestaurantsState] = useState('loading');
  const [restaurantsMessage, setRestaurantsMessage] = useState(
    'Loading restaurants...'
  );
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedCuisine, setSelectedCuisine] = useState(ALL_CUISINES);
  const [locationState, setLocationState] = useState('idle');
  const [locationMessage, setLocationMessage] = useState(
    'Use your location to sort restaurants by distance.'
  );
  const [userCoordinates, setUserCoordinates] = useState(null);

  const loadRestaurants = useCallback(async ({ refreshing = false } = {}) => {
    if (refreshing) {
      setIsRefreshing(true);
    } else {
      setRestaurantsState('loading');
      setRestaurantsMessage('Loading restaurants...');
    }

    try {
      const nextRestaurants = await getRestaurants();

      setRestaurants(nextRestaurants);
      setRestaurantsState('success');
      setRestaurantsMessage(
        nextRestaurants.length > 0
          ? `${nextRestaurants.length} restaurant${nextRestaurants.length === 1 ? '' : 's'} available.`
          : 'No restaurants are available right now.'
      );
    } catch (error) {
      setRestaurantsState('error');
      setRestaurantsMessage(
        error.message || 'Could not load restaurants. Please try again.'
      );
    } finally {
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadRestaurants();
  }, [loadRestaurants]);

  const cuisines = useMemo(() => {
    const restaurantCuisines = restaurants
      .map((restaurant) => restaurant.cuisine?.trim())
      .filter(Boolean);

    return [
      ALL_CUISINES,
      ...Array.from(new Set(restaurantCuisines)).sort((first, second) =>
        first.localeCompare(second)
      ),
    ];
  }, [restaurants]);

  const visibleRestaurants = useMemo(() => {
    const filteredRestaurants =
      selectedCuisine === ALL_CUISINES
        ? restaurants
        : restaurants.filter(
            (restaurant) => restaurant.cuisine === selectedCuisine
          );

    if (!userCoordinates) {
      return filteredRestaurants;
    }

    return sortRestaurantsByDistance(filteredRestaurants, userCoordinates);
  }, [restaurants, selectedCuisine, userCoordinates]);

  const handleUseMyLocation = useCallback(async () => {
    setLocationState('loading');
    setLocationMessage('Requesting location permission...');

    const result = await requestCurrentLocation();

    if (result.status === LOCATION_STATUS.AVAILABLE) {
      setUserCoordinates(result.coordinates);
      setLocationState('success');
      setLocationMessage(
        'Restaurants are now sorted from nearest to farthest.'
      );
      return;
    }

    setUserCoordinates(null);
    setLocationState('error');
    setLocationMessage(result.message);
  }, []);

  const isLoadingRestaurants = restaurantsState === 'loading';
  const isRestaurantsError = restaurantsState === 'error';
  const isLocationLoading = locationState === 'loading';

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />

      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={() => loadRestaurants({ refreshing: true })}
          />
        }
      >
        <View style={styles.header}>
          <View style={styles.headerText}>
            <Text style={styles.title}>Wolt Delivery</Text>
            <Text style={styles.subtitle}>
              Hello, {user?.fullName || user?.username || 'customer'}
            </Text>
          </View>

          <View style={styles.headerActions}>
            {user?.role === 'admin' && (
              <Pressable
                onPress={() => navigation.navigate('Admin')}
                style={styles.adminButton}
              >
                <Text style={styles.adminButtonText}>Admin</Text>
              </Pressable>
            )}

            <Pressable onPress={signOut} style={styles.signOutButton}>
              <Text style={styles.signOutText}>Sign out</Text>
            </Pressable>
          </View>
        </View>

        <View style={styles.locationCard}>
          <View style={styles.locationTextContainer}>
            <Text style={styles.sectionTitle}>Nearby restaurants</Text>
            <Text style={styles.locationMessage}>{locationMessage}</Text>
          </View>

          <Pressable
            disabled={isLocationLoading}
            onPress={handleUseMyLocation}
            style={[
              styles.locationButton,
              isLocationLoading && styles.disabledButton,
            ]}
          >
            {isLocationLoading ? (
              <ActivityIndicator />
            ) : (
              <Text style={styles.locationButtonText}>
                {locationState === 'success' ? 'Update location' : 'Use location'}
              </Text>
            )}
          </Pressable>
        </View>

        <View style={styles.sectionHeader}>
          <View>
            <Text style={styles.sectionTitle}>Restaurants</Text>
            <Text style={styles.sectionSubtitle}>{restaurantsMessage}</Text>
          </View>

          {!isLoadingRestaurants && (
            <Pressable
              onPress={() => loadRestaurants()}
              style={styles.refreshButton}
            >
              <Text style={styles.refreshButtonText}>Refresh</Text>
            </Pressable>
          )}
        </View>

        <View style={styles.categoryList}>
          {cuisines.map((cuisine) => {
            const isSelected = cuisine === selectedCuisine;

            return (
              <Pressable
                key={cuisine}
                onPress={() => setSelectedCuisine(cuisine)}
                style={[
                  styles.categoryChip,
                  isSelected && styles.categoryChipSelected,
                ]}
              >
                <Text
                  style={[
                    styles.categoryChipText,
                    isSelected && styles.categoryChipTextSelected,
                  ]}
                >
                  {cuisine}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {isLoadingRestaurants && (
          <View style={styles.stateCard}>
            <ActivityIndicator size="large" />
            <Text style={styles.stateTitle}>Loading restaurants...</Text>
          </View>
        )}

        {isRestaurantsError && (
          <View style={styles.stateCard}>
            <Text style={styles.stateTitle}>Could not load restaurants</Text>
            <Text style={styles.stateMessage}>{restaurantsMessage}</Text>

            <Pressable
              onPress={() => loadRestaurants()}
              style={styles.retryButton}
            >
              <Text style={styles.retryButtonText}>Try again</Text>
            </Pressable>
          </View>
        )}

        {!isLoadingRestaurants &&
          !isRestaurantsError &&
          visibleRestaurants.length === 0 && (
            <View style={styles.stateCard}>
              <Text style={styles.stateTitle}>No restaurants found</Text>
              <Text style={styles.stateMessage}>
                There are no restaurants in this category right now.
              </Text>
            </View>
          )}

        {!isLoadingRestaurants &&
          !isRestaurantsError &&
          visibleRestaurants.map((restaurant) => (
            <View key={restaurant.id} style={styles.restaurantCard}>
              {hasRestaurantImage(restaurant) ? (
                <Image
                  source={{ uri: restaurant.image }}
                  style={styles.restaurantImage}
                />
              ) : (
                <View style={styles.restaurantImagePlaceholder}>
                  <Text style={styles.restaurantImageInitial}>
                    {getRestaurantInitial(restaurant)}
                  </Text>
                </View>
              )}

              <View style={styles.restaurantContent}>
                <View style={styles.restaurantTitleRow}>
                  <Text numberOfLines={1} style={styles.restaurantName}>
                    {restaurant.name}
                  </Text>

                  {restaurant.cuisine && (
                    <View style={styles.cuisineBadge}>
                      <Text style={styles.cuisineBadgeText}>
                        {restaurant.cuisine}
                      </Text>
                    </View>
                  )}
                </View>

                {restaurant.description && (
                  <Text numberOfLines={2} style={styles.restaurantDescription}>
                    {restaurant.description}
                  </Text>
                )}

                <Text numberOfLines={1} style={styles.restaurantAddress}>
                  {restaurant.address || 'Address unavailable'}
                </Text>

                {userCoordinates && (
                  <Text style={styles.restaurantDistance}>
                    {formatDistance(restaurant.distanceKm)}
                  </Text>
                )}
              </View>
            </View>
          ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#f7f7f7',
    flex: 1,
  },
  content: {
    flexGrow: 1,
    gap: 16,
    padding: 20,
    paddingBottom: 32,
  },
  header: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  headerText: {
    flex: 1,
    paddingRight: 12,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
  },
  subtitle: {
    fontSize: 15,
    marginTop: 4,
  },
  headerActions: {
    alignItems: 'flex-end',
    gap: 6,
  },
  adminButton: {
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  adminButtonText: {
    fontSize: 13,
    fontWeight: '700',
  },
  signOutButton: {
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  signOutText: {
    fontSize: 13,
    fontWeight: '700',
  },
  locationCard: {
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 16,
    flexDirection: 'row',
    gap: 12,
    padding: 16,
  },
  locationTextContainer: {
    flex: 1,
  },
  locationMessage: {
    fontSize: 14,
    lineHeight: 20,
    marginTop: 4,
  },
  locationButton: {
    alignItems: 'center',
    borderRadius: 10,
    minWidth: 108,
    paddingHorizontal: 12,
    paddingVertical: 11,
  },
  locationButtonText: {
    fontSize: 13,
    fontWeight: '700',
  },
  disabledButton: {
    opacity: 0.55,
  },
  sectionHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  sectionSubtitle: {
    fontSize: 14,
    marginTop: 3,
  },
  refreshButton: {
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  refreshButtonText: {
    fontSize: 14,
    fontWeight: '700',
  },
  categoryList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  categoryChip: {
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 9,
  },
  categoryChipSelected: {
    backgroundColor: '#222222',
  },
  categoryChipText: {
    fontSize: 14,
    fontWeight: '600',
  },
  categoryChipTextSelected: {
    color: '#ffffff',
  },
  stateCard: {
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 16,
    gap: 12,
    padding: 24,
  },
  stateTitle: {
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
  },
  stateMessage: {
    fontSize: 14,
    lineHeight: 21,
    textAlign: 'center',
  },
  retryButton: {
    borderRadius: 10,
    paddingHorizontal: 18,
    paddingVertical: 11,
  },
  retryButtonText: {
    fontSize: 14,
    fontWeight: '700',
  },
  restaurantCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    flexDirection: 'row',
    gap: 14,
    overflow: 'hidden',
    padding: 14,
  },
  restaurantImage: {
    borderRadius: 12,
    height: 76,
    width: 76,
  },
  restaurantImagePlaceholder: {
    alignItems: 'center',
    borderRadius: 12,
    height: 76,
    justifyContent: 'center',
    width: 76,
  },
  restaurantImageInitial: {
    fontSize: 30,
    fontWeight: '700',
  },
  restaurantContent: {
    flex: 1,
    gap: 5,
    justifyContent: 'center',
  },
  restaurantTitleRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  restaurantName: {
    flex: 1,
    fontSize: 17,
    fontWeight: '700',
  },
  cuisineBadge: {
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  cuisineBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  restaurantDescription: {
    fontSize: 13,
    lineHeight: 18,
  },
  restaurantAddress: {
    fontSize: 12,
  },
  restaurantDistance: {
    fontSize: 12,
    fontWeight: '700',
  },
});
