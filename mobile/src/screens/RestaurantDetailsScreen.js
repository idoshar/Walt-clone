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

import {
  getRestaurantById,
  getRestaurantProducts,
} from '../api/restaurants';
import { getProductRecommendations } from '../api/products';
import { useAuth } from '../auth/AuthContext';
import { useCart } from '../cart/CartContext';
import ThemeToggle from '../components/ThemeToggle';
import CurrencySelector from '../components/CurrencySelector';
import { useCurrency } from '../currency/CurrencyContext';
import { useAppTheme } from '../theme/ThemeContext';
import { getRestaurantImage } from '../utils/restaurantImages';

const ALL_CATEGORIES = 'All';

function hasImage(item) {
  return typeof item?.image === 'string' && item.image.trim().length > 0;
}

function getInitial(item, fallback = 'R') {
  return item?.name?.trim()?.charAt(0)?.toUpperCase() || fallback;
}

// Fallback: picks products from the same restaurant in the same category
// Used when the ex2 engine has no data yet for the user
function getCategoryFallback(products, currentProductId) {
  if (!products.length) return [];

  // Find the category of the current product
  const current = products.find((p) => String(p.id) === String(currentProductId));
  const category = current?.category?.trim();

  // Same category, different product — up to 5
  const sameCategory = products.filter(
    (p) => String(p.id) !== String(currentProductId) &&
      category && p.category?.trim() === category
  );

  // If not enough, fill with other products
  const others = products.filter(
    (p) => String(p.id) !== String(currentProductId) &&
      (!category || p.category?.trim() !== category)
  );

  return [...sameCategory, ...others].slice(0, 5);
}

// Calls GET /restaurants/:id/products/:pId which records the view in ex2
async function reportProductView(restaurantId, productId, token) {
  if (!restaurantId || !productId || !token) return;
  try {
    const { apiRequest } = await import('../api/client');
    await apiRequest(
      `/restaurants/${encodeURIComponent(restaurantId)}/products/${encodeURIComponent(productId)}`,
      { token }
    );
  } catch {
    // Non-critical — ignore errors
  }
}

export default function RestaurantDetailsScreen({ navigation, route }) {
  const { formatPrice } = useCurrency();
  const { addItem, itemCount } = useCart();
  const { token } = useAuth();
  const { theme } = useAppTheme();
  const styles = useMemo(() => createStyles(theme.colors), [theme.colors]);

  const restaurantId = route.params?.restaurantId;
  const initialRestaurant = route.params?.restaurant || null;

  const [restaurant, setRestaurant] = useState(initialRestaurant);
  const [products, setProducts] = useState([]);
  const [screenState, setScreenState] = useState(
    restaurantId ? 'loading' : 'error'
  );
  const [message, setMessage] = useState(
    restaurantId
      ? 'Loading restaurant details...'
      : 'The selected restaurant could not be found.'
  );
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(ALL_CATEGORIES);
  const [recommendations, setRecommendations] = useState([]);

  const loadRestaurantContent = useCallback(
    async ({ refreshing = false } = {}) => {
      if (!restaurantId) {
        setScreenState('error');
        setMessage('The selected restaurant could not be found.');
        return;
      }

      if (refreshing) {
        setIsRefreshing(true);
      } else {
        setScreenState('loading');
        setMessage('Loading restaurant details...');
      }

      try {
        const [nextRestaurant, nextProducts] = await Promise.all([
          getRestaurantById(restaurantId),
          getRestaurantProducts(restaurantId),
        ]);

        setRestaurant(nextRestaurant);
        setProducts(nextProducts);
        setScreenState('success');
        setMessage(
          nextProducts.length === 0
            ? 'This restaurant has no products yet.'
            : `${nextProducts.length} menu item${nextProducts.length === 1 ? '' : 's'} available.`
        );

        // Load recommendations — real ex2 engine first, fallback by category
        if (nextProducts.length > 0 && token) {
          const firstProduct = nextProducts[0];
          reportProductView(restaurantId, firstProduct.id, token).then(() =>
            getProductRecommendations(restaurantId, firstProduct.id, token)
              .then((recs) => {
                if (recs.length > 0) {
                  setRecommendations(recs);
                } else {
                  // ex2 has no data yet — show category-based fallback
                  setRecommendations(getCategoryFallback(nextProducts, firstProduct.id));
                }
              })
              .catch(() => {
                setRecommendations(getCategoryFallback(nextProducts, firstProduct.id));
              })
          );
        } else if (nextProducts.length > 0) {
          // No token — just show category fallback
          setRecommendations(getCategoryFallback(nextProducts, nextProducts[0].id));
        }
      } catch (error) {
        setScreenState('error');
        setMessage(
          error.message || 'Could not load this restaurant. Please try again.'
        );
      } finally {
        setIsRefreshing(false);
      }
    },
    [restaurantId, token]
  );

  useEffect(() => {
    loadRestaurantContent();
  }, [loadRestaurantContent]);

  const categories = useMemo(() => {
    const productCategories = products
      .map((product) => product.category?.trim())
      .filter(Boolean);

    return [
      ALL_CATEGORIES,
      ...Array.from(new Set(productCategories)).sort((a, b) =>
        a.localeCompare(b)
      ),
    ];
  }, [products]);

  const visibleProducts = useMemo(() => {
    if (selectedCategory === ALL_CATEGORIES) return products;
    return products.filter((p) => p.category === selectedCategory);
  }, [products, selectedCategory]);

  const handleAddToCart = useCallback(
    async (product, rest) => {
      addItem(product, rest || restaurant);

      // Report the view to ex2 engine, then refresh recommendations
      if (product?.id && restaurantId && token) {
        reportProductView(restaurantId, product.id, token).then(() =>
          getProductRecommendations(restaurantId, product.id, token)
            .then((recs) => {
              if (recs.length > 0) {
                setRecommendations(recs);
              } else {
                // ex2 has no data yet — show category fallback
                setRecommendations(getCategoryFallback(products, product.id));
              }
            })
            .catch(() => {
              setRecommendations(getCategoryFallback(products, product.id));
            })
        );
      }
    },
    [addItem, restaurant, restaurantId, token, products]
  );

  const isLoading = screenState === 'loading';
  const isError = screenState === 'error';

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style={theme.mode === 'dark' ? 'light' : 'dark'} />

      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={() => loadRestaurantContent({ refreshing: true })}
            tintColor={theme.colors.primary}
          />
        }
      >
        <View style={styles.topBar}>
          <Text style={styles.topBarTitle}>Restaurant</Text>
          <ThemeToggle compact />
        </View>

        <View style={styles.currencySection}>
          <CurrencySelector />
        </View>

        {/* Loading state */}
        {isLoading && !restaurant ? (
          <View style={styles.stateCard}>
            <ActivityIndicator color={theme.colors.primary} size="large" />
            <Text style={styles.stateTitle}>Loading restaurant...</Text>
            <Text style={styles.stateMessage}>{message}</Text>
          </View>
        ) : null}

        {/* Error state */}
        {isError ? (
          <View style={styles.stateCard}>
            <Text style={styles.stateEmoji}>⚠️</Text>
            <Text style={styles.stateTitle}>Could not load restaurant</Text>
            <Text style={styles.stateMessage}>{message}</Text>
            <Pressable
              onPress={() => loadRestaurantContent()}
              style={({ pressed }) => [
                styles.primaryButton,
                pressed ? styles.pressedButton : null,
              ]}
            >
              <Text style={styles.primaryButtonText}>Try again</Text>
            </Pressable>
          </View>
        ) : null}

        {!isError && restaurant ? (
          <>
            {/* Hero card */}
            <View style={styles.heroCard}>
              <Image
                source={{ uri: getRestaurantImage(restaurant) }}
                style={styles.heroImage}
              />

              <View style={styles.heroContent}>
                <View style={styles.restaurantTitleRow}>
                  <Text numberOfLines={2} style={styles.restaurantName}>
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
                  <Text style={styles.restaurantDescription}>
                    {restaurant.description}
                  </Text>
                ) : null}

                <Text style={styles.restaurantAddress}>
                  {restaurant.address || 'Address unavailable'}
                </Text>

                {restaurant.phone ? (
                  <Text style={styles.restaurantPhone}>{restaurant.phone}</Text>
                ) : null}
              </View>
            </View>

            {/* Menu header */}
            <View style={styles.menuHeader}>
              <View style={styles.menuHeading}>
                <Text style={styles.menuTitle}>Menu</Text>
                <Text style={styles.menuSubtitle}>{message}</Text>
              </View>

              <View style={styles.menuActions}>
                <Pressable
                  onPress={() => navigation.navigate('Cart')}
                  style={({ pressed }) => [
                    styles.cartButton,
                    pressed ? styles.pressedButton : null,
                  ]}
                >
                  <Text style={styles.cartButtonText}>
                    Cart ({itemCount})
                  </Text>
                </Pressable>

                <Pressable
                  onPress={() => loadRestaurantContent()}
                  style={({ pressed }) => [
                    styles.refreshButton,
                    pressed ? styles.pressedButton : null,
                  ]}
                >
                  <Text style={styles.refreshButtonText}>Refresh</Text>
                </Pressable>
              </View>
            </View>

            {/* Category chips */}
            <View style={styles.categoryList}>
              {categories.map((category) => {
                const isSelected = category === selectedCategory;
                return (
                  <Pressable
                    key={category}
                    onPress={() => setSelectedCategory(category)}
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
                      {category}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            {/* Inline loading */}
            {isLoading ? (
              <View style={styles.inlineLoading}>
                <ActivityIndicator color={theme.colors.primary} size="small" />
                <Text style={styles.inlineLoadingText}>Updating menu...</Text>
              </View>
            ) : null}

            {/* Empty menu state */}
            {!isLoading && visibleProducts.length === 0 ? (
              <View style={styles.stateCard}>
                <Text style={styles.stateEmoji}>🍽️</Text>
                <Text style={styles.stateTitle}>No products found</Text>
                <Text style={styles.stateMessage}>
                  There are no products in this category right now.
                </Text>
              </View>
            ) : null}

            {/* Product list */}
            {!isLoading &&
              visibleProducts.map((product) => (
                <View key={product.id} style={styles.productCard}>
                  {hasImage(product) ? (
                    <Image
                      source={{ uri: product.image }}
                      style={styles.productImage}
                    />
                  ) : (
                    <View style={styles.productImagePlaceholder}>
                      <Text style={styles.productImageInitial}>
                        {getInitial(product, 'P')}
                      </Text>
                    </View>
                  )}

                  <View style={styles.productContent}>
                    <View style={styles.productTitleRow}>
                      <Text numberOfLines={1} style={styles.productName}>
                        {product.name}
                      </Text>
                      <Text style={styles.productPrice}>
                        {formatPrice(product.price)}
                      </Text>
                    </View>

                    {product.description ? (
                      <Text numberOfLines={2} style={styles.productDescription}>
                        {product.description}
                      </Text>
                    ) : null}

                    {product.category ? (
                      <Text style={styles.productCategory}>
                        {product.category}
                      </Text>
                    ) : null}

                    <Pressable
                      accessibilityLabel={`Add ${product.name} to cart`}
                      onPress={() => handleAddToCart(product, restaurant)}
                      style={({ pressed }) => [
                        styles.addToCartButton,
                        pressed ? styles.pressedButton : null,
                      ]}
                    >
                      <Text style={styles.addToCartButtonText}>
                        Add to cart
                      </Text>
                    </Pressable>
                  </View>
                </View>
              ))}

          </>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

function createStyles(colors) {
  return StyleSheet.create({
    container: { backgroundColor: colors.background, flex: 1 },
    content: { flexGrow: 1, gap: 16, padding: 20, paddingBottom: 32 },
    topBar: {
      alignItems: 'center',
      flexDirection: 'row',
      justifyContent: 'space-between',
    },
    topBarTitle: { color: colors.text, fontSize: 16, fontWeight: '800' },
    currencySection: {
      alignSelf: 'flex-start',
    },
    heroCard: {
      backgroundColor: colors.surface,
      borderColor: colors.border,
      borderRadius: 18,
      borderWidth: 1,
      gap: 16,
      padding: 16,
    },
    heroImage: { borderRadius: 14, height: 170, width: '100%' },
    heroImagePlaceholder: {
      alignItems: 'center',
      backgroundColor: colors.background,
      borderColor: colors.border,
      borderRadius: 14,
      borderWidth: 1,
      height: 170,
      justifyContent: 'center',
    },
    heroImageInitial: { color: colors.primary, fontSize: 64, fontWeight: '800' },
    heroContent: { gap: 8 },
    restaurantTitleRow: {
      alignItems: 'flex-start',
      flexDirection: 'row',
      gap: 10,
    },
    restaurantName: {
      color: colors.text,
      flex: 1,
      fontSize: 26,
      fontWeight: '800',
    },
    cuisineBadge: {
      borderColor: colors.primary,
      borderRadius: 999,
      borderWidth: 1,
      paddingHorizontal: 9,
      paddingVertical: 5,
    },
    cuisineBadgeText: { color: colors.primary, fontSize: 11, fontWeight: '800' },
    restaurantDescription: {
      color: colors.textMuted,
      fontSize: 15,
      lineHeight: 22,
    },
    restaurantAddress: { color: colors.text, fontSize: 13, fontWeight: '700' },
    restaurantPhone: { color: colors.textMuted, fontSize: 13 },
    menuHeader: {
      alignItems: 'flex-start',
      flexDirection: 'row',
      gap: 12,
      justifyContent: 'space-between',
      marginTop: 4,
    },
    menuHeading: { flex: 1 },
    menuTitle: { color: colors.text, fontSize: 23, fontWeight: '800' },
    menuSubtitle: { color: colors.textMuted, fontSize: 13, marginTop: 3 },
    menuActions: { alignItems: 'center', flexDirection: 'row', gap: 8 },
    cartButton: {
      backgroundColor: colors.primary,
      borderRadius: 10,
      paddingHorizontal: 12,
      paddingVertical: 9,
    },
    cartButtonText: { color: '#ffffff', fontSize: 13, fontWeight: '800' },
    refreshButton: {
      borderColor: colors.border,
      borderRadius: 10,
      borderWidth: 1,
      paddingHorizontal: 12,
      paddingVertical: 9,
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
    categoryChipSelected: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    categoryChipText: { color: colors.textMuted, fontSize: 14, fontWeight: '700' },
    categoryChipTextSelected: { color: '#ffffff' },
    productCard: {
      backgroundColor: colors.surface,
      borderColor: colors.border,
      borderRadius: 16,
      borderWidth: 1,
      flexDirection: 'row',
      gap: 14,
      padding: 14,
    },
    productImage: { borderRadius: 12, height: 74, width: 74 },
    productImagePlaceholder: {
      alignItems: 'center',
      backgroundColor: colors.background,
      borderColor: colors.border,
      borderRadius: 12,
      borderWidth: 1,
      height: 74,
      justifyContent: 'center',
      width: 74,
    },
    productImageInitial: { color: colors.primary, fontSize: 29, fontWeight: '800' },
    productContent: { flex: 1, gap: 5, justifyContent: 'center' },
    productTitleRow: { alignItems: 'center', flexDirection: 'row', gap: 8 },
    productName: { color: colors.text, flex: 1, fontSize: 16, fontWeight: '800' },
    productPrice: { color: colors.primary, fontSize: 15, fontWeight: '800' },
    productDescription: { color: colors.textMuted, fontSize: 13, lineHeight: 18 },
    productCategory: { color: colors.textMuted, fontSize: 12, fontWeight: '700' },
    addToCartButton: {
      alignItems: 'center',
      alignSelf: 'flex-start',
      backgroundColor: colors.primary,
      borderRadius: 9,
      marginTop: 4,
      paddingHorizontal: 11,
      paddingVertical: 8,
    },
    addToCartButtonText: { color: '#ffffff', fontSize: 12, fontWeight: '800' },
    stateCard: {
      alignItems: 'center',
      backgroundColor: colors.surface,
      borderColor: colors.border,
      borderRadius: 16,
      borderWidth: 1,
      gap: 12,
      padding: 24,
    },
    stateEmoji: { fontSize: 36 },
    stateTitle: {
      color: colors.text,
      fontSize: 18,
      fontWeight: '800',
      textAlign: 'center',
    },
    stateMessage: {
      color: colors.textMuted,
      fontSize: 14,
      lineHeight: 21,
      textAlign: 'center',
    },
    primaryButton: {
      backgroundColor: colors.primary,
      borderRadius: 10,
      paddingHorizontal: 18,
      paddingVertical: 11,
    },
    primaryButtonText: { color: '#ffffff', fontSize: 14, fontWeight: '800' },
    inlineLoading: {
      alignItems: 'center',
      flexDirection: 'row',
      gap: 8,
      justifyContent: 'center',
      paddingVertical: 8,
    },
    inlineLoadingText: { color: colors.textMuted, fontSize: 13 },
    pressedButton: { opacity: 0.72 },

    // Recommendations
    recommendationsSection: { gap: 10, marginTop: 8 },
    recommendationsTitle: {
      color: colors.text,
      fontSize: 20,
      fontWeight: '800',
    },
    recommendationsSubtitle: {
      color: colors.textMuted,
      fontSize: 13,
      marginTop: 2,
    },
    recommendationsList: { gap: 12, paddingBottom: 4, paddingTop: 4 },
    recommendationCard: {
      backgroundColor: colors.surface,
      borderColor: colors.border,
      borderRadius: 16,
      borderWidth: 1,
      gap: 8,
      padding: 12,
      width: 160,
    },
    recommendationImage: {
      borderRadius: 12,
      height: 100,
      width: '100%',
    },
    recommendationImagePlaceholder: {
      alignItems: 'center',
      backgroundColor: colors.primarySoft,
      borderRadius: 12,
      height: 100,
      justifyContent: 'center',
      width: '100%',
    },
    recommendationInitial: {
      color: colors.primary,
      fontSize: 36,
      fontWeight: '800',
    },
    recommendationName: {
      color: colors.text,
      fontSize: 14,
      fontWeight: '800',
      lineHeight: 19,
    },
    recommendationCategory: {
      color: colors.textMuted,
      fontSize: 11,
      fontWeight: '700',
    },
    recommendationFooter: {
      alignItems: 'center',
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginTop: 2,
    },
    recommendationPrice: {
      color: colors.text,
      fontSize: 13,
      fontWeight: '800',
    },
    recommendationAddButton: {
      backgroundColor: colors.primary,
      borderRadius: 8,
      paddingHorizontal: 8,
      paddingVertical: 5,
    },
    recommendationAddButtonText: {
      color: '#fff',
      fontSize: 11,
      fontWeight: '800',
    },
  });
}
