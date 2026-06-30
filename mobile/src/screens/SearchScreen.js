import { useCallback, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { getRestaurants } from '../api/restaurants';
import { useCart } from '../cart/CartContext';
import ProductImage from '../components/ProductImage';
import ThemeToggle from '../components/ThemeToggle';
import { useAppTheme } from '../theme/ThemeContext';
import { useCurrency } from '../currency/CurrencyContext';
import { getRestaurantImage } from '../utils/restaurantImages';


// Search restaurants + their products locally — no extra endpoint needed.
function searchData(restaurants, query) {
  const q = query.trim().toLowerCase();

  if (!q) return { restaurants: [], products: [] };

  const matchedRestaurants = restaurants.filter(
    (r) =>
      r.name?.toLowerCase().includes(q) ||
      r.cuisine?.toLowerCase().includes(q) ||
      r.address?.toLowerCase().includes(q) ||
      r.description?.toLowerCase().includes(q)
  );

  // Collect all products from all restaurants and match by name/description/category
  const allProducts = restaurants.flatMap((r) =>
    (r.products || []).map((p) => ({ ...p, restaurant: r }))
  );

  const matchedProducts = allProducts.filter(
    (p) =>
      p.name?.toLowerCase().includes(q) ||
      p.description?.toLowerCase().includes(q) ||
      p.category?.toLowerCase().includes(q)
  );

  return { restaurants: matchedRestaurants, products: matchedProducts };
}

export default function SearchScreen({ navigation }) {
  const { addItem } = useCart();
  const { formatPrice } = useCurrency();
  const { theme } = useAppTheme();
  const styles = useMemo(() => createStyles(theme.colors), [theme.colors]);

  const inputRef = useRef(null);

  const [query, setQuery] = useState('');
  const [allRestaurants, setAllRestaurants] = useState([]);
  const [loadState, setLoadState] = useState('idle'); // idle | loading | ready | error
  const [loadError, setLoadError] = useState('');

  // Load all restaurants (with products) once on first search
  const ensureDataLoaded = useCallback(async () => {
    if (loadState === 'ready' || loadState === 'loading') return;

    setLoadState('loading');
    setLoadError('');

    try {
      const restaurants = await getRestaurants();

      // Fetch products for each restaurant in parallel
      const { getRestaurantProducts } = await import('../api/restaurants');
      const withProducts = await Promise.all(
        restaurants.map(async (r) => {
          try {
            const products = await getRestaurantProducts(r.id);
            return { ...r, products };
          } catch {
            return { ...r, products: [] };
          }
        })
      );

      setAllRestaurants(withProducts);
      setLoadState('ready');
    } catch (err) {
      setLoadState('error');
      setLoadError(err.message || 'Could not load data. Please try again.');
    }
  }, [loadState]);

  const handleQueryChange = useCallback(
    (text) => {
      setQuery(text);
      ensureDataLoaded();
    },
    [ensureDataLoaded]
  );

  const results = useMemo(
    () => searchData(allRestaurants, query),
    [allRestaurants, query]
  );

  const isLoading = loadState === 'loading';
  const isError = loadState === 'error';
  const hasQuery = query.trim().length > 0;
  const hasResults =
    results.restaurants.length > 0 || results.products.length > 0;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.screenHeader}>
        <Text style={styles.screenTitle}>Search</Text>
        <ThemeToggle compact />
      </View>

      <View style={styles.searchBar}>
        <Pressable onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={styles.backButtonText}>←</Text>
        </Pressable>

        <TextInput
          ref={inputRef}
          autoFocus
          placeholder="Search restaurants or dishes..."
          placeholderTextColor={theme.colors.textMuted}
          returnKeyType="search"
          style={styles.input}
          value={query}
          onChangeText={handleQueryChange}
        />

        {query.length > 0 ? (
          <Pressable onPress={() => setQuery('')} style={styles.clearButton}>
            <Text style={styles.clearButtonText}>✕</Text>
          </Pressable>
        ) : null}
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        {/* Loading */}
        {isLoading ? (
          <View style={styles.stateBox}>
            <ActivityIndicator color={theme.colors.primary} size="large" />
            <Text style={styles.stateTitle}>Loading...</Text>
            <Text style={styles.stateMessage}>
              Fetching restaurants and dishes
            </Text>
          </View>
        ) : null}

        {/* Error */}
        {isError ? (
          <View style={styles.stateBox}>
            <Text style={styles.stateEmoji}>⚠️</Text>
            <Text style={styles.stateTitle}>Something went wrong</Text>
            <Text style={styles.stateMessage}>{loadError}</Text>
            <Pressable
              style={({ pressed }) => [
                styles.retryButton,
                pressed ? styles.pressed : null,
              ]}
              onPress={() => {
                setLoadState('idle');
                ensureDataLoaded();
              }}
            >
              <Text style={styles.retryButtonText}>Try again</Text>
            </Pressable>
          </View>
        ) : null}

        {/* Empty prompt */}
        {!isLoading && !isError && !hasQuery ? (
          <View style={styles.stateBox}>
            <Text style={styles.stateEmoji}>🔍</Text>
            <Text style={styles.stateTitle}>What are you craving?</Text>
            <Text style={styles.stateMessage}>
              Search for restaurants, cuisines, or specific dishes
            </Text>
          </View>
        ) : null}

        {/* No results */}
        {!isLoading && !isError && hasQuery && !hasResults ? (
          <View style={styles.stateBox}>
            <Text style={styles.stateEmoji}>😕</Text>
            <Text style={styles.stateTitle}>No results for "{query}"</Text>
            <Text style={styles.stateMessage}>
              Try a different name, cuisine or dish
            </Text>
          </View>
        ) : null}

        {/* Restaurant results */}
        {!isLoading && results.restaurants.length > 0 ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              Restaurants ({results.restaurants.length})
            </Text>

            {results.restaurants.map((r) => (
              <Pressable
                key={r.id}
                style={({ pressed }) => [
                  styles.restaurantCard,
                  pressed ? styles.pressed : null,
                ]}
                onPress={() =>
                  navigation.navigate('RestaurantDetails', {
                    restaurantId: r.id,
                    restaurant: r,
                  })
                }
              >
                <Image
                  source={{ uri: getRestaurantImage(r) }}
                  style={styles.restaurantImage}
                />

                <View style={styles.restaurantInfo}>
                  <Text numberOfLines={1} style={styles.restaurantName}>
                    {r.name}
                  </Text>
                  {r.cuisine ? (
                    <Text style={styles.cuisine}>{r.cuisine}</Text>
                  ) : null}
                  {r.address ? (
                    <Text numberOfLines={1} style={styles.address}>
                      {r.address}
                    </Text>
                  ) : null}
                </View>

                <Text style={styles.chevron}>›</Text>
              </Pressable>
            ))}
          </View>
        ) : null}

        {/* Product results */}
        {!isLoading && results.products.length > 0 ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              Dishes ({results.products.length})
            </Text>

            {results.products.map((p) => (
              <View key={`${p.restaurantId || p.restaurant?.id}:${p.id}`} style={styles.productCard}>
                <ProductImage
                  product={p}
                  style={styles.productImage}
                />

                <View style={styles.productInfo}>
                  <Text numberOfLines={1} style={styles.productName}>
                    {p.name}
                  </Text>
                  <Text style={styles.productRestaurant}>
                    {p.restaurant?.name || ''}
                  </Text>
                  {p.description ? (
                    <Text numberOfLines={1} style={styles.productDescription}>
                      {p.description}
                    </Text>
                  ) : null}
                </View>

                <View style={styles.productRight}>
                  <Text style={styles.productPrice}>
                    {formatPrice(p.price)}
                  </Text>
                  <Pressable
                    style={({ pressed }) => [
                      styles.addButton,
                      pressed ? styles.pressed : null,
                    ]}
                    onPress={() => addItem(p, p.restaurant)}
                  >
                    <Text style={styles.addButtonText}>+ Add</Text>
                  </Pressable>
                </View>
              </View>
            ))}
          </View>
        ) : null}
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
    screenHeader: {
      alignItems: 'center',
      backgroundColor: colors.surface,
      borderBottomColor: colors.border,
      borderBottomWidth: 1,
      flexDirection: 'row',
      justifyContent: 'space-between',
      paddingHorizontal: 16,
      paddingTop: 10,
    },
    screenTitle: {
      color: colors.text,
      fontSize: 18,
      fontWeight: '800',
    },
    searchBar: {
      alignItems: 'center',
      backgroundColor: colors.surface,
      borderBottomColor: colors.border,
      borderBottomWidth: 1,
      flexDirection: 'row',
      gap: 8,
      paddingHorizontal: 16,
      paddingVertical: 10,
    },
    backButton: {
      alignItems: 'center',
      height: 36,
      justifyContent: 'center',
      width: 36,
    },
    backButtonText: {
      color: colors.primary,
      fontSize: 22,
      fontWeight: '700',
    },
    input: {
      backgroundColor: colors.background,
      borderColor: colors.border,
      borderRadius: 12,
      borderWidth: 1,
      color: colors.text,
      flex: 1,
      fontSize: 15,
      paddingHorizontal: 14,
      paddingVertical: 10,
    },
    clearButton: {
      alignItems: 'center',
      height: 36,
      justifyContent: 'center',
      width: 36,
    },
    clearButtonText: {
      color: colors.textMuted,
      fontSize: 16,
    },
    content: {
      flexGrow: 1,
      gap: 20,
      padding: 20,
      paddingBottom: 36,
    },
    stateBox: {
      alignItems: 'center',
      gap: 10,
      marginTop: 48,
      paddingHorizontal: 24,
    },
    stateEmoji: {
      fontSize: 48,
    },
    stateTitle: {
      color: colors.text,
      fontSize: 20,
      fontWeight: '800',
      textAlign: 'center',
    },
    stateMessage: {
      color: colors.textMuted,
      fontSize: 14,
      lineHeight: 20,
      textAlign: 'center',
    },
    retryButton: {
      backgroundColor: colors.primary,
      borderRadius: 12,
      marginTop: 8,
      paddingHorizontal: 20,
      paddingVertical: 11,
    },
    retryButtonText: {
      color: '#fff',
      fontSize: 14,
      fontWeight: '800',
    },
    section: {
      gap: 10,
    },
    sectionTitle: {
      color: colors.text,
      fontSize: 17,
      fontWeight: '800',
      marginBottom: 2,
    },
    restaurantCard: {
      alignItems: 'center',
      backgroundColor: colors.surface,
      borderColor: colors.border,
      borderRadius: 14,
      borderWidth: 1,
      flexDirection: 'row',
      gap: 12,
      padding: 12,
    },
    restaurantImage: {
      borderRadius: 10,
      height: 56,
      width: 56,
    },
    restaurantImagePlaceholder: {
      alignItems: 'center',
      backgroundColor: colors.primarySoft,
      borderRadius: 10,
      height: 56,
      justifyContent: 'center',
      width: 56,
    },
    restaurantInfo: {
      flex: 1,
      gap: 3,
    },
    restaurantName: {
      color: colors.text,
      fontSize: 15,
      fontWeight: '800',
    },
    cuisine: {
      color: colors.primary,
      fontSize: 12,
      fontWeight: '700',
    },
    address: {
      color: colors.textMuted,
      fontSize: 12,
    },
    chevron: {
      color: colors.textMuted,
      fontSize: 22,
    },
    productCard: {
      alignItems: 'center',
      backgroundColor: colors.surface,
      borderColor: colors.border,
      borderRadius: 14,
      borderWidth: 1,
      flexDirection: 'row',
      gap: 12,
      padding: 12,
    },
    productImage: {
      borderRadius: 10,
      height: 56,
      width: 56,
    },
    productImagePlaceholder: {
      alignItems: 'center',
      backgroundColor: colors.primarySoft,
      borderRadius: 10,
      height: 56,
      justifyContent: 'center',
      width: 56,
    },
    productInfo: {
      flex: 1,
      gap: 3,
    },
    productName: {
      color: colors.text,
      fontSize: 15,
      fontWeight: '800',
    },
    productRestaurant: {
      color: colors.primary,
      fontSize: 12,
      fontWeight: '700',
    },
    productDescription: {
      color: colors.textMuted,
      fontSize: 12,
    },
    productRight: {
      alignItems: 'flex-end',
      gap: 6,
    },
    productPrice: {
      color: colors.primary,
      fontSize: 14,
      fontWeight: '800',
    },
    addButton: {
      backgroundColor: colors.primary,
      borderRadius: 8,
      paddingHorizontal: 10,
      paddingVertical: 6,
    },
    addButtonText: {
      color: '#fff',
      fontSize: 12,
      fontWeight: '800',
    },
    initial: {
      color: colors.primary,
      fontSize: 22,
      fontWeight: '800',
    },
    pressed: {
      opacity: 0.72,
    },
  });
}
