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
import AppCard from '../components/AppCard';
import AppState from '../components/AppState';
import ThemeToggle from '../components/ThemeToggle';
import { sortRestaurantsByDistance } from '../location/distance';
import {
  LOCATION_STATUS,
  requestCurrentLocation,
} from '../location/locationService';
import { useAppTheme } from '../theme/ThemeContext';

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
  const { theme } = useAppTheme();
  const styles = createStyles(theme.colors);

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
  const isAdmin = user?.role === 'admin';

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style={theme.mode === 'dark' ? 'light' : 'dark'} />

      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            colors={[theme.colors.primary]}
            onRefresh={() => loadRestaurants({ refreshing: true })}
            refreshing={isRefreshing}
            tintColor={theme.colors.primary}
          />
        }
      >
        <View style={styles.header}>
          <View style={styles.brandRow}>
            <View style={styles.brandText}>
              <Text style={styles.eyebrow}>DISCOVER FOOD</Text>

              <Text style={styles.title}>Wolt Delivery</Text>

              <Text style={styles.subtitle}>
                Hello, {user?.fullName || user?.username || 'customer'}
              </Text>
            </View>

            <ThemeToggle compact />
          </View>
        </View>

        <View style={styles.headerActions}>
          <Pressable
            accessibilityRole="button"
            onPress={() => navigation.navigate('MyRestaurants')}
            style={({ pressed }) => [
              styles.myRestaurantsButton,
              pressed ? styles.pressedButton : null,
            ]}
          >
            <Text style={styles.myRestaurantsButtonText}>🍽️ My Restaurants</Text>
          </Pressable>

          {isAdmin ? (
            <Pressable
              accessibilityRole="button"
              onPress={() => navigation.navigate('Admin')}
              style={({ pressed }) => [
                styles.adminButton,
                pressed ? styles.pressedButton : null,
              ]}
            >
              <Text style={styles.adminButtonText}>Admin</Text>
            </Pressable>
          ) : null}

          <Pressable
            accessibilityRole="button"
            onPress={signOut}
            style={({ pressed }) => [
              styles.signOutButton,
              pressed ? styles.pressedButton : null,
            ]}
          >
            <Text style={styles.signOutText}>Sign out</Text>
          </Pressable>
        </View>

        <AppCard style={styles.locationCard}>
          <View style={styles.locationIcon}>
            <Text style={styles.locationIconText}>⌖</Text>
          </View>

          <View style={styles.locationTextContainer}>
            <Text style={styles.locationTitle}>Nearby restaurants</Text>

            <Text
              style={[
                styles.locationMessage,
                locationState === 'error' ? styles.locationMessageError : null,
                locationState === 'success'
                  ? styles.locationMessageSuccess
                  : null,
              ]}
            >
              {locationMessage}
            </Text>
          </View>

          <Pressable
            disabled={isLocationLoading}
            onPress={handleUseMyLocation}
            style={({ pressed }) => [
              styles.locationButton,
              isLocationLoading ? styles.disabledButton : null,
              pressed && !isLocationLoading ? styles.pressedButton : null,
            ]}
          >
            {isLocationLoading ? (
              <ActivityIndicator color={theme.colors.onPrimary} />
            ) : (
              <Text style={styles.locationButtonText}>
                {locationState === 'success' ? 'Update' : 'Use location'}
              </Text>
            )}
          </Pressable>
        </AppCard>

        <View style={styles.sectionHeader}>
          <View style={styles.sectionText}>
            <Text style={styles.sectionTitle}>Restaurants</Text>
            <Text style={styles.sectionSubtitle}>{restaurantsMessage}</Text>
          </View>

          {!isLoadingRestaurants ? (
            <Pressable
              accessibilityRole="button"
              onPress={() => loadRestaurants()}
              style={({ pressed }) => [
                styles.refreshButton,
                pressed ? styles.pressedButton : null,
              ]}
            >
              <Text style={styles.refreshButtonText}>Refresh</Text>
            </Pressable>
          ) : null}
        </View>

        <View style={styles.categoryList}>
          {cuisines.map((cuisine) => {
            const isSelected = cuisine === selectedCuisine;

            return (
              <Pressable
                key={cuisine}
                onPress={() => setSelectedCuisine(cuisine)}
                style={({ pressed }) => [
                  styles.categoryChip,
                  isSelected ? styles.categoryChipSelected : null,
                  pressed ? styles.pressedButton : null,
                ]}
              >
                <Text
                  style={[
                    styles.categoryChipText,
                    isSelected ? styles.categoryChipTextSelected : null,
                  ]}
                >
                  {cuisine}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {isLoadingRestaurants ? (
          <AppState
            message="Fetching restaurants from the backend."
            title="Loading restaurants..."
            type="loading"
          />
        ) : null}

        {isRestaurantsError ? (
          <AppState
            actionLabel="Try again"
            message={restaurantsMessage}
            onAction={() => loadRestaurants()}
            title="Could not load restaurants"
            type="error"
          />
        ) : null}

        {!isLoadingRestaurants &&
        !isRestaurantsError &&
        visibleRestaurants.length === 0 ? (
          <AppState
            message="There are no restaurants in this category right now."
            title="No restaurants found"
            type="empty"
          />
        ) : null}

        {!isLoadingRestaurants &&
          !isRestaurantsError &&
          visibleRestaurants.map((restaurant) => (
            <Pressable
              key={restaurant.id}
              accessibilityLabel={'Open ' + restaurant.name + ' menu'}
              accessibilityRole="button"
              onPress={() =>
                navigation.navigate('RestaurantDetails', {
                  restaurantId: restaurant.id,
                  restaurant,
                })
              }
              style={({ pressed }) => [
                styles.restaurantCard,
                pressed ? styles.pressedButton : null,
              ]}
            >
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

                  {restaurant.cuisine ? (
                    <View style={styles.cuisineBadge}>
                      <Text style={styles.cuisineBadgeText}>
                        {restaurant.cuisine}
                      </Text>
                    </View>
                  ) : null}
                </View>

                {restaurant.description ? (
                  <Text
                    numberOfLines={2}
                    style={styles.restaurantDescription}
                  >
                    {restaurant.description}
                  </Text>
                ) : null}

                <Text numberOfLines={1} style={styles.restaurantAddress}>
                  {restaurant.address || 'Address unavailable'}
                </Text>

                {userCoordinates ? (
                  <Text style={styles.restaurantDistance}>
                    {formatDistance(restaurant.distanceKm)}
                  </Text>
                ) : null}
              </View>
            </Pressable>
          ))}
      </ScrollView>
    </SafeAreaView>
  );
}

function createStyles(colors) {
  return StyleSheet.create({
    container: {
      backgroundColor: colors.background,
      flex: 1,
    },
    content: {
      flexGrow: 1,
      gap: 16,
      padding: 20,
      paddingBottom: 36,
    },
    header: {
      gap: 14,
      marginBottom: 4,
    },
    brandRow: {
      alignItems: 'flex-start',
      flexDirection: 'row',
      gap: 12,
      justifyContent: 'space-between',
    },
    brandText: {
      flex: 1,
    },
    eyebrow: {
      color: colors.primary,
      fontSize: 12,
      fontWeight: '800',
      letterSpacing: 1.1,
      marginBottom: 5,
    },
    title: {
      color: colors.text,
      fontSize: 30,
      fontWeight: '800',
      letterSpacing: -0.7,
    },
    subtitle: {
      color: colors.textMuted,
      fontSize: 15,
      marginTop: 5,
    },
    headerActions: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
    },
    myRestaurantsButton: {
      alignItems: 'center',
      backgroundColor: colors.primary,
      borderRadius: 12,
      justifyContent: 'center',
      minHeight: 40,
      paddingHorizontal: 13,
      paddingVertical: 8,
    },
    myRestaurantsButtonText: {
      color: colors.onPrimary,
      fontSize: 13,
      fontWeight: '800',
    },
    adminButton: {
      alignItems: 'center',
      backgroundColor: colors.primarySoft,
      borderColor: colors.primary,
      borderRadius: 12,
      borderWidth: 1,
      justifyContent: 'center',
      minHeight: 40,
      paddingHorizontal: 13,
      paddingVertical: 8,
    },
    adminButtonText: {
      color: colors.primary,
      fontSize: 13,
      fontWeight: '800',
    },
    signOutButton: {
      alignItems: 'center',
      borderColor: colors.border,
      borderRadius: 12,
      borderWidth: 1,
      justifyContent: 'center',
      minHeight: 40,
      paddingHorizontal: 13,
      paddingVertical: 8,
    },
    signOutText: {
      color: colors.textMuted,
      fontSize: 13,
      fontWeight: '800',
    },
    pressedButton: {
      opacity: 0.72,
    },
    locationCard: {
      alignItems: 'center',
      flexDirection: 'row',
      gap: 12,
      padding: 16,
    },
    locationIcon: {
      alignItems: 'center',
      backgroundColor: colors.primarySoft,
      borderRadius: 18,
      height: 44,
      justifyContent: 'center',
      width: 44,
    },
    locationIconText: {
      color: colors.primary,
      fontSize: 25,
      fontWeight: '800',
      marginTop: -1,
    },
    locationTextContainer: {
      flex: 1,
    },
    locationTitle: {
      color: colors.text,
      fontSize: 15,
      fontWeight: '800',
    },
    locationMessage: {
      color: colors.textMuted,
      fontSize: 13,
      lineHeight: 18,
      marginTop: 3,
    },
    locationMessageError: {
      color: colors.danger,
    },
    locationMessageSuccess: {
      color: colors.success,
    },
    locationButton: {
      alignItems: 'center',
      backgroundColor: colors.primary,
      borderRadius: 12,
      justifyContent: 'center',
      minHeight: 42,
      minWidth: 82,
      paddingHorizontal: 12,
      paddingVertical: 9,
    },
    locationButtonText: {
      color: colors.onPrimary,
      fontSize: 12,
      fontWeight: '800',
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
    sectionText: {
      flex: 1,
      paddingRight: 12,
    },
    sectionTitle: {
      color: colors.text,
      fontSize: 22,
      fontWeight: '800',
      letterSpacing: -0.3,
    },
    sectionSubtitle: {
      color: colors.textMuted,
      fontSize: 13,
      marginTop: 3,
    },
    refreshButton: {
      alignItems: 'center',
      backgroundColor: colors.primarySoft,
      borderRadius: 12,
      justifyContent: 'center',
      minHeight: 40,
      paddingHorizontal: 12,
      paddingVertical: 8,
    },
    refreshButtonText: {
      color: colors.primary,
      fontSize: 13,
      fontWeight: '800',
    },
    categoryList: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
    },
    categoryChip: {
      backgroundColor: colors.surface,
      borderColor: colors.border,
      borderRadius: 999,
      borderWidth: 1,
      paddingHorizontal: 14,
      paddingVertical: 9,
    },
    categoryChipSelected: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    categoryChipText: {
      color: colors.textMuted,
      fontSize: 14,
      fontWeight: '700',
    },
    categoryChipTextSelected: {
      color: colors.onPrimary,
    },
    restaurantCard: {
      flexDirection: 'row',
      gap: 14,
      overflow: 'hidden',
      padding: 14,
    },
    restaurantImage: {
      borderRadius: 14,
      height: 82,
      width: 82,
    },
    restaurantImagePlaceholder: {
      alignItems: 'center',
      backgroundColor: colors.primarySoft,
      borderRadius: 14,
      height: 82,
      justifyContent: 'center',
      width: 82,
    },
    restaurantImageInitial: {
      color: colors.primary,
      fontSize: 32,
      fontWeight: '800',
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
      color: colors.text,
      flex: 1,
      fontSize: 17,
      fontWeight: '800',
    },
    cuisineBadge: {
      backgroundColor: colors.primarySoft,
      borderRadius: 999,
      paddingHorizontal: 8,
      paddingVertical: 4,
    },
    cuisineBadgeText: {
      color: colors.primary,
      fontSize: 11,
      fontWeight: '800',
    },
    restaurantDescription: {
      color: colors.textMuted,
      fontSize: 13,
      lineHeight: 18,
    },
    restaurantAddress: {
      color: colors.textMuted,
      fontSize: 12,
    },
    restaurantDistance: {
      color: colors.success,
      fontSize: 12,
      fontWeight: '800',
    },
  });
}