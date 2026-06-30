import { StatusBar } from 'expo-status-bar';
import { useCallback, useMemo, useRef, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
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
import { useCart } from '../cart/CartContext';
import AppCard from '../components/AppCard';
import RestaurantDiscoveryCarousel from '../components/RestaurantDiscoveryCarousel';
import AppState from '../components/AppState';
import SponsoredRestaurantCard from '../components/SponsoredRestaurantCard';
import ThemeToggle from '../components/ThemeToggle';
import CurrencySelector from '../components/CurrencySelector';
import { sortRestaurantsByDistance } from '../location/distance';
import {
  LOCATION_STATUS,
  requestCurrentLocation,
} from '../location/locationService';
import { useAppTheme } from '../theme/ThemeContext';
import { getFeaturedRestaurants } from '../utils/featuredRestaurants';
import { getRestaurantImage } from '../utils/restaurantImages';

const ALL_CUISINES = 'All';
const LIVE_RESTAURANT_REFRESH_MS = 10000;

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
  const { itemCount } = useCart();
  const { theme } = useAppTheme();
  const styles = useMemo(() => createStyles(theme.colors), [theme.colors]);

  const [restaurants, setRestaurants] = useState([]);
  const [restaurantsState, setRestaurantsState] = useState('loading');
  const [restaurantsMessage, setRestaurantsMessage] = useState('Loading restaurants...');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedCuisine, setSelectedCuisine] = useState(ALL_CUISINES);
  const [locationState, setLocationState] = useState('idle');
  const [locationMessage, setLocationMessage] = useState(
    'Use your location to sort restaurants by distance.'
  );
  const [userCoordinates, setUserCoordinates] = useState(null);
  const hasLoadedRestaurantsRef = useRef(false);

  const loadRestaurants = useCallback(
    async ({ refreshing = false, background = false } = {}) => {
      if (refreshing) {
        setIsRefreshing(true);
      } else if (!background) {
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
        if (!background) {
          setRestaurantsState('error');
          setRestaurantsMessage(
            error.message || 'Could not load restaurants. Please try again.'
          );
        }
      } finally {
        setIsRefreshing(false);
      }
    },
    []
  );

  useFocusEffect(
    useCallback(() => {
      loadRestaurants({
        background: hasLoadedRestaurantsRef.current
      });

      hasLoadedRestaurantsRef.current = true;

      const intervalId = setInterval(() => {
        loadRestaurants({ background: true });
      }, LIVE_RESTAURANT_REFRESH_MS);

      return () => clearInterval(intervalId);
    }, [loadRestaurants])
  );

  const cuisines = useMemo(() => {
    const restaurantCuisines = restaurants
      .map((r) => r.cuisine?.trim())
      .filter(Boolean);
    return [
      ALL_CUISINES,
      ...Array.from(new Set(restaurantCuisines)).sort((a, b) =>
        a.localeCompare(b)
      ),
    ];
  }, [restaurants]);

  const visibleRestaurants = useMemo(() => {
    const filtered =
      selectedCuisine === ALL_CUISINES
        ? restaurants
        : restaurants.filter((r) => r.cuisine === selectedCuisine);

    if (!userCoordinates) return filtered;
    return sortRestaurantsByDistance(filtered, userCoordinates);
  }, [restaurants, selectedCuisine, userCoordinates]);

  const featuredRestaurants = useMemo(
    () => getFeaturedRestaurants(restaurants),
    [restaurants]
  );

  const nearbyRestaurants = useMemo(() => {
    if (!userCoordinates) {
      return [];
    }

    return visibleRestaurants
      .filter((restaurant) => restaurant.distanceKm !== null)
      .slice(0, 6);
  }, [userCoordinates, visibleRestaurants]);

  const handleUseMyLocation = useCallback(async () => {
    setLocationState('loading');
    setLocationMessage('Requesting location permission...');

    const result = await requestCurrentLocation();

    if (result.status === LOCATION_STATUS.AVAILABLE) {
      setUserCoordinates(result.coordinates);
      setLocationState('success');
      setLocationMessage('Restaurants are now sorted from nearest to farthest.');
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
  const userLabel = user?.fullName || user?.username || 'Customer';
  const userInitial = userLabel.trim().charAt(0).toUpperCase() || 'C';
  const hasProfileImage =
    typeof user?.image === 'string' && user.image.trim().length > 0;

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

          <CurrencySelector />

          <Pressable
            accessibilityLabel={`Open profile for ${userLabel}`}
            accessibilityRole="button"
            onPress={() => navigation.navigate('Profile')}
            style={({ pressed }) => [
              styles.accountButton,
              pressed ? styles.pressedButton : null,
            ]}
          >
            {hasProfileImage ? (
              <Image
                source={{ uri: user.image }}
                style={styles.accountAvatar}
              />
            ) : (
              <View
                style={[
                  styles.accountAvatar,
                  styles.accountAvatarPlaceholder,
                ]}
              >
                <Text style={styles.accountAvatarInitial}>{userInitial}</Text>
              </View>
            )}

            <View style={styles.accountDetails}>
              <Text numberOfLines={1} style={styles.accountName}>
                {userLabel}
              </Text>
              <Text numberOfLines={1} style={styles.accountHint}>
                View profile and manage your photo
              </Text>
            </View>

            <Text style={styles.accountArrow}>›</Text>
          </Pressable>

          <View style={styles.headerActions}>
            <Pressable
              accessibilityLabel={
                itemCount > 0
                  ? `Open cart with ${itemCount} item${itemCount === 1 ? '' : 's'}`
                  : 'Open empty cart'
              }
              accessibilityRole="button"
              onPress={() => navigation.navigate('Cart')}
              style={({ pressed }) => [
                styles.cartButton,
                pressed ? styles.pressedButton : null,
              ]}
            >
              <Text style={styles.cartButtonText}>Cart</Text>
              {itemCount > 0 ? (
                <View style={styles.cartBadge}>
                  <Text style={styles.cartBadgeText}>
                    {itemCount > 99 ? '99+' : itemCount}
                  </Text>
                </View>
              ) : null}
            </Pressable>

            <Pressable
              accessibilityRole="button"
              onPress={() => navigation.navigate('MyOrders')}
              style={({ pressed }) => [
                styles.myRestaurantsButton,
                pressed ? styles.pressedButton : null,
              ]}
            >
              <Text style={styles.myRestaurantsButtonText}>My Orders</Text>
            </Pressable>

            <Pressable
              accessibilityRole="button"
              onPress={() => navigation.navigate('MyRestaurants')}
              style={({ pressed }) => [
                styles.myRestaurantsButton,
                pressed ? styles.pressedButton : null,
              ]}
            >
              <Text style={styles.myRestaurantsButtonText}>My Restaurants</Text>
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

          {/* Search bar — navigates to SearchScreen */}
          <Pressable
            accessibilityRole="button"
            onPress={() => navigation.navigate('Search')}
            style={({ pressed }) => [
              styles.searchBar,
              pressed ? styles.pressedButton : null,
            ]}
          >
            <Text style={styles.searchIcon}>🔍</Text>
            <Text style={styles.searchPlaceholder}>
              Search restaurants or dishes...
            </Text>
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
                locationState === 'success' ? styles.locationMessageSuccess : null,
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

        {!isLoadingRestaurants && !isRestaurantsError ? (
            <SponsoredRestaurantCard
              navigation={navigation}
              restaurants={restaurants
                .filter((restaurant) => restaurant?.isSponsored === true)
                .sort((leftRestaurant, rightRestaurant) => {
                  const leftRank = Number(leftRestaurant.sponsoredRank);
                  const rightRank = Number(rightRestaurant.sponsoredRank);

                  const normalizedLeftRank =
                    Number.isInteger(leftRank) && leftRank > 0
                      ? leftRank
                      : Number.MAX_SAFE_INTEGER;

                  const normalizedRightRank =
                    Number.isInteger(rightRank) && rightRank > 0
                      ? rightRank
                      : Number.MAX_SAFE_INTEGER;

                  if (normalizedLeftRank !== normalizedRightRank) {
                    return normalizedLeftRank - normalizedRightRank;
                  }

                  return String(leftRestaurant.name || '').localeCompare(
                    String(rightRestaurant.name || '')
                  );
                })}
            />
          ) : null}

        {!isLoadingRestaurants && !isRestaurantsError && restaurants.length > 0 ? (
          <RestaurantDiscoveryCarousel
            eyebrow="Selected from restaurants available today"
            emptyMessage="No featured restaurants are available right now."
            onPressRestaurant={(restaurant) =>
              navigation.navigate('RestaurantDetails', {
                restaurantId: restaurant.id,
                restaurant,
              })
            }
            restaurants={featuredRestaurants}
            title="Featured restaurants"
          />
        ) : null}

        {!isLoadingRestaurants && !isRestaurantsError && userCoordinates ? (
          <RestaurantDiscoveryCarousel
            eyebrow={
              selectedCuisine === ALL_CUISINES
                ? 'Sorted by distance from your location'
                : `${selectedCuisine} restaurants sorted by distance`
            }
            emptyMessage="No nearby restaurants with a saved location are available right now."
            onPressRestaurant={(restaurant) =>
              navigation.navigate('RestaurantDetails', {
                restaurantId: restaurant.id,
                restaurant,
              })
            }
            restaurants={nearbyRestaurants}
            showDistance
            title="Nearby restaurants"
          />
        ) : null}

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
              <Image
                source={{ uri: getRestaurantImage(restaurant) }}
                style={styles.restaurantImage}
              />

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
                  <Text numberOfLines={2} style={styles.restaurantDescription}>
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
    container: { backgroundColor: colors.background, flex: 1 },
    content: { flexGrow: 1, gap: 16, padding: 20, paddingBottom: 36 },
    header: { gap: 14, marginBottom: 4 },
    brandRow: {
      alignItems: 'flex-start',
      flexDirection: 'row',
      gap: 12,
      justifyContent: 'space-between',
    },
    brandText: { flex: 1 },
    eyebrow: {
      color: colors.primary,
      fontSize: 12,
      fontWeight: '800',
      letterSpacing: 1.1,
      marginBottom: 5,
    },
    title: { color: colors.text, fontSize: 30, fontWeight: '800', letterSpacing: -0.7 },
    subtitle: { color: colors.textMuted, fontSize: 15, marginTop: 5 },
    accountButton: {
      alignItems: 'center',
      backgroundColor: colors.surface,
      borderColor: colors.border,
      borderRadius: 16,
      borderWidth: 1,
      flexDirection: 'row',
      gap: 12,
      padding: 12,
    },
    accountAvatar: {
      borderRadius: 999,
      height: 48,
      width: 48,
    },
    accountAvatarPlaceholder: {
      alignItems: 'center',
      backgroundColor: colors.primarySoft,
      justifyContent: 'center',
    },
    accountAvatarInitial: {
      color: colors.primary,
      fontSize: 20,
      fontWeight: '800',
    },
    accountDetails: {
      flex: 1,
      gap: 3,
      minWidth: 0,
    },
    accountName: {
      color: colors.text,
      fontSize: 15,
      fontWeight: '800',
    },
    accountHint: {
      color: colors.textMuted,
      fontSize: 12,
    },
    accountArrow: {
      color: colors.primary,
      fontSize: 28,
      fontWeight: '400',
      lineHeight: 30,
    },
    headerActions: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    cartButton: {
      alignItems: 'center',
      backgroundColor: colors.primary,
      borderRadius: 12,
      flexDirection: 'row',
      gap: 7,
      justifyContent: 'center',
      minHeight: 40,
      paddingHorizontal: 13,
      paddingVertical: 8,
    },
    cartButtonText: {
      color: '#FFFFFF',
      fontSize: 13,
      fontWeight: '800',
    },
    cartBadge: {
      alignItems: 'center',
      backgroundColor: '#FFFFFF',
      borderRadius: 999,
      justifyContent: 'center',
      minWidth: 20,
      paddingHorizontal: 5,
      paddingVertical: 2,
    },
    cartBadgeText: {
      color: colors.primary,
      fontSize: 10,
      fontWeight: '800',
    },
    myRestaurantsButton: {
      alignItems: 'center',
      backgroundColor: colors.surface,
      borderColor: colors.border,
      borderRadius: 12,
      borderWidth: 1,
      justifyContent: 'center',
      minHeight: 40,
      paddingHorizontal: 13,
      paddingVertical: 8,
    },
    myRestaurantsButtonText: { color: colors.text, fontSize: 13, fontWeight: '800' },
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
    adminButtonText: { color: colors.primary, fontSize: 13, fontWeight: '800' },
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
    signOutText: { color: colors.textMuted, fontSize: 13, fontWeight: '800' },
    searchBar: {
      alignItems: 'center',
      backgroundColor: colors.surface,
      borderColor: colors.border,
      borderRadius: 14,
      borderWidth: 1,
      flexDirection: 'row',
      gap: 10,
      paddingHorizontal: 16,
      paddingVertical: 13,
    },
    searchIcon: { fontSize: 16 },
    searchPlaceholder: { color: colors.textMuted, flex: 1, fontSize: 15 },
    pressedButton: { opacity: 0.72 },
    locationCard: { alignItems: 'center', flexDirection: 'row', gap: 12, padding: 16 },
    locationIcon: {
      alignItems: 'center',
      backgroundColor: colors.primarySoft,
      borderRadius: 18,
      height: 44,
      justifyContent: 'center',
      width: 44,
    },
    locationIconText: { color: colors.primary, fontSize: 25, fontWeight: '800', marginTop: -1 },
    locationTextContainer: { flex: 1 },
    locationTitle: { color: colors.text, fontSize: 15, fontWeight: '800' },
    locationMessage: { color: colors.textMuted, fontSize: 13, lineHeight: 18, marginTop: 3 },
    locationMessageError: { color: colors.danger },
    locationMessageSuccess: { color: colors.success },
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
    locationButtonText: { color: colors.onPrimary, fontSize: 12, fontWeight: '800' },
    disabledButton: { opacity: 0.55 },
    sectionHeader: {
      alignItems: 'center',
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginTop: 4,
    },
    sectionText: { flex: 1, paddingRight: 12 },
    sectionTitle: { color: colors.text, fontSize: 22, fontWeight: '800', letterSpacing: -0.3 },
    sectionSubtitle: { color: colors.textMuted, fontSize: 13, marginTop: 3 },
    refreshButton: {
      alignItems: 'center',
      backgroundColor: colors.primarySoft,
      borderRadius: 12,
      justifyContent: 'center',
      minHeight: 40,
      paddingHorizontal: 12,
      paddingVertical: 8,
    },
    refreshButtonText: { color: colors.primary, fontSize: 13, fontWeight: '800' },
    categoryList: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    categoryChip: {
      backgroundColor: colors.surface,
      borderColor: colors.border,
      borderRadius: 999,
      borderWidth: 1,
      paddingHorizontal: 14,
      paddingVertical: 9,
    },
    categoryChipSelected: { backgroundColor: colors.primary, borderColor: colors.primary },
    categoryChipText: { color: colors.textMuted, fontSize: 14, fontWeight: '700' },
    categoryChipTextSelected: { color: colors.onPrimary },
    restaurantCard: { flexDirection: 'row', gap: 14, overflow: 'hidden', padding: 14 },
    restaurantImage: { borderRadius: 14, height: 82, width: 82 },
    restaurantImagePlaceholder: {
      alignItems: 'center',
      backgroundColor: colors.primarySoft,
      borderRadius: 14,
      height: 82,
      justifyContent: 'center',
      width: 82,
    },
    restaurantImageInitial: { color: colors.primary, fontSize: 32, fontWeight: '800' },
    restaurantContent: { flex: 1, gap: 5, justifyContent: 'center' },
    restaurantTitleRow: { alignItems: 'center', flexDirection: 'row', gap: 8 },
    restaurantName: { color: colors.text, flex: 1, fontSize: 17, fontWeight: '800' },
    cuisineBadge: {
      backgroundColor: colors.primarySoft,
      borderRadius: 999,
      paddingHorizontal: 8,
      paddingVertical: 4,
    },
    cuisineBadgeText: { color: colors.primary, fontSize: 11, fontWeight: '800' },
    restaurantDescription: { color: colors.textMuted, fontSize: 13, lineHeight: 18 },
    restaurantAddress: { color: colors.textMuted, fontSize: 12 },
    restaurantDistance: { color: colors.success, fontSize: 12, fontWeight: '800' },
  });
}
