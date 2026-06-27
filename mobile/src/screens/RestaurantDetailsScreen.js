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
import { useCart } from '../cart/CartContext';
import ThemeToggle from '../components/ThemeToggle';
import { useAppTheme } from '../theme/ThemeContext';

const ALL_CATEGORIES = 'All';

function formatPrice(price) {
  const numericPrice = Number(price);

  if (!Number.isFinite(numericPrice)) {
    return 'Price unavailable';
  }

  return `\u20AA${numericPrice.toFixed(2)}`;
}

function hasImage(item) {
  return typeof item?.image === 'string' && item.image.trim().length > 0;
}

function getInitial(item, fallback = 'R') {
  return item?.name?.trim()?.charAt(0)?.toUpperCase() || fallback;
}

export default function RestaurantDetailsScreen({ navigation, route }) {
  const { addItem, itemCount } = useCart();
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
      } catch (error) {
        setScreenState('error');
        setMessage(
          error.message ||
            'Could not load this restaurant. Please try again.'
        );
      } finally {
        setIsRefreshing(false);
      }
    },
    [restaurantId]
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
      ...Array.from(new Set(productCategories)).sort((first, second) =>
        first.localeCompare(second)
      ),
    ];
  }, [products]);

  const visibleProducts = useMemo(() => {
    if (selectedCategory === ALL_CATEGORIES) {
      return products;
    }

    return products.filter(
      (product) => product.category === selectedCategory
    );
  }, [products, selectedCategory]);

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

        {isLoading && !restaurant ? (
          <View style={styles.stateCard}>
            <ActivityIndicator color={theme.colors.primary} size="large" />
            <Text style={styles.stateTitle}>Loading restaurant...</Text>
            <Text style={styles.stateMessage}>{message}</Text>
          </View>
        ) : null}

        {isError ? (
          <View style={styles.stateCard}>
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
            <View style={styles.heroCard}>
              {hasImage(restaurant) ? (
                <Image
                  source={{ uri: restaurant.image }}
                  style={styles.heroImage}
                />
              ) : (
                <View style={styles.heroImagePlaceholder}>
                  <Text style={styles.heroImageInitial}>
                    {getInitial(restaurant)}
                  </Text>
                </View>
              )}

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
                  <Text style={styles.restaurantPhone}>
                    {restaurant.phone}
                  </Text>
                ) : null}
              </View>
            </View>

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
                  <Text style={styles.cartButtonText}>Cart ({itemCount})</Text>
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

            {isLoading ? (
              <View style={styles.inlineLoading}>
                <ActivityIndicator color={theme.colors.primary} size="small" />
                <Text style={styles.inlineLoadingText}>Updating menu...</Text>
              </View>
            ) : null}

            {!isLoading && visibleProducts.length === 0 ? (
              <View style={styles.stateCard}>
                <Text style={styles.stateTitle}>No products found</Text>
                <Text style={styles.stateMessage}>
                  There are no products in this category right now.
                </Text>
              </View>
            ) : null}

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
                      <Text
                        numberOfLines={2}
                        style={styles.productDescription}
                      >
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
                      onPress={() => addItem(product, restaurant)}
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
    container: {
      backgroundColor: colors.background,
      flex: 1,
    },
    content: {
      flexGrow: 1,
      gap: 16,
      padding: 20,
      paddingBottom: 32,
    },
    topBar: {
      alignItems: 'center',
      flexDirection: 'row',
      justifyContent: 'space-between',
    },
    topBarTitle: {
      color: colors.text,
      fontSize: 16,
      fontWeight: '800',
    },
    heroCard: {
      backgroundColor: colors.surface,
      borderColor: colors.border,
      borderRadius: 18,
      borderWidth: 1,
      gap: 16,
      padding: 16,
    },
    heroImage: {
      borderRadius: 14,
      height: 170,
      width: '100%',
    },
    heroImagePlaceholder: {
      alignItems: 'center',
      backgroundColor: colors.background,
      borderColor: colors.border,
      borderRadius: 14,
      borderWidth: 1,
      height: 170,
      justifyContent: 'center',
    },
    heroImageInitial: {
      color: colors.primary,
      fontSize: 64,
      fontWeight: '800',
    },
    heroContent: {
      gap: 8,
    },
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
    cuisineBadgeText: {
      color: colors.primary,
      fontSize: 11,
      fontWeight: '800',
    },
    restaurantDescription: {
      color: colors.textMuted,
      fontSize: 15,
      lineHeight: 22,
    },
    restaurantAddress: {
      color: colors.text,
      fontSize: 13,
      fontWeight: '700',
    },
    restaurantPhone: {
      color: colors.textMuted,
      fontSize: 13,
    },
    menuHeader: {
      alignItems: 'flex-start',
      flexDirection: 'row',
      gap: 12,
      justifyContent: 'space-between',
      marginTop: 4,
    },
    menuHeading: {
      flex: 1,
    },
    menuTitle: {
      color: colors.text,
      fontSize: 23,
      fontWeight: '800',
    },
    menuSubtitle: {
      color: colors.textMuted,
      fontSize: 13,
      marginTop: 3,
    },
    menuActions: {
      alignItems: 'center',
      flexDirection: 'row',
      gap: 8,
    },
    cartButton: {
      backgroundColor: colors.primary,
      borderRadius: 10,
      paddingHorizontal: 12,
      paddingVertical: 9,
    },
    cartButtonText: {
      color: '#ffffff',
      fontSize: 13,
      fontWeight: '800',
    },
    refreshButton: {
      borderColor: colors.border,
      borderRadius: 10,
      borderWidth: 1,
      paddingHorizontal: 12,
      paddingVertical: 9,
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
      color: '#ffffff',
    },
    productCard: {
      backgroundColor: colors.surface,
      borderColor: colors.border,
      borderRadius: 16,
      borderWidth: 1,
      flexDirection: 'row',
      gap: 14,
      padding: 14,
    },
    productImage: {
      borderRadius: 12,
      height: 74,
      width: 74,
    },
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
    productImageInitial: {
      color: colors.primary,
      fontSize: 29,
      fontWeight: '800',
    },
    productContent: {
      flex: 1,
      gap: 5,
      justifyContent: 'center',
    },
    productTitleRow: {
      alignItems: 'center',
      flexDirection: 'row',
      gap: 8,
    },
    productName: {
      color: colors.text,
      flex: 1,
      fontSize: 16,
      fontWeight: '800',
    },
    productPrice: {
      color: colors.primary,
      fontSize: 15,
      fontWeight: '800',
    },
    productDescription: {
      color: colors.textMuted,
      fontSize: 13,
      lineHeight: 18,
    },
    productCategory: {
      color: colors.textMuted,
      fontSize: 12,
      fontWeight: '700',
    },
    addToCartButton: {
      alignItems: 'center',
      alignSelf: 'flex-start',
      backgroundColor: colors.primary,
      borderRadius: 9,
      marginTop: 4,
      paddingHorizontal: 11,
      paddingVertical: 8,
    },
    addToCartButtonText: {
      color: '#ffffff',
      fontSize: 12,
      fontWeight: '800',
    },
    stateCard: {
      alignItems: 'center',
      backgroundColor: colors.surface,
      borderColor: colors.border,
      borderRadius: 16,
      borderWidth: 1,
      gap: 12,
      padding: 24,
    },
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
    primaryButtonText: {
      color: '#ffffff',
      fontSize: 14,
      fontWeight: '800',
    },
    inlineLoading: {
      alignItems: 'center',
      flexDirection: 'row',
      gap: 8,
      justifyContent: 'center',
      paddingVertical: 8,
    },
    inlineLoadingText: {
      color: colors.textMuted,
      fontSize: 13,
    },
    pressedButton: {
      opacity: 0.72,
    },
  });
}
