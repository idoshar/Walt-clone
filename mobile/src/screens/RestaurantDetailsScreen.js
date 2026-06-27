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

const ALL_CATEGORIES = 'All';

function formatPrice(price) {
  const numericPrice = Number(price);

  if (!Number.isFinite(numericPrice)) {
    return 'Price unavailable';
  }

  return `₪${numericPrice.toFixed(2)}`;
}

function hasImage(item) {
  return typeof item?.image === 'string' && item.image.trim().length > 0;
}

function getInitial(item, fallback = 'R') {
  return item?.name?.trim()?.charAt(0)?.toUpperCase() || fallback;
}

export default function RestaurantDetailsScreen({ route }) {
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
      <StatusBar style="dark" />

      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={() => loadRestaurantContent({ refreshing: true })}
          />
        }
      >
        {isLoading && !restaurant ? (
          <View style={styles.stateCard}>
            <ActivityIndicator size="large" />
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
              style={styles.retryButton}
            >
              <Text style={styles.retryButtonText}>Try again</Text>
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
              <View>
                <Text style={styles.menuTitle}>Menu</Text>
                <Text style={styles.menuSubtitle}>{message}</Text>
              </View>

              <Pressable
                onPress={() => loadRestaurantContent()}
                style={styles.refreshButton}
              >
                <Text style={styles.refreshButtonText}>Refresh</Text>
              </Pressable>
            </View>

            <View style={styles.categoryList}>
              {categories.map((category) => {
                const isSelected = category === selectedCategory;

                return (
                  <Pressable
                    key={category}
                    onPress={() => setSelectedCategory(category)}
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
                      {category}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            {isLoading ? (
              <View style={styles.inlineLoading}>
                <ActivityIndicator size="small" />
                <Text style={styles.inlineLoadingText}>
                  Updating menu...
                </Text>
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
                  </View>
                </View>
              ))}
          </>
        ) : null}
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
  heroCard: {
    backgroundColor: '#ffffff',
    borderRadius: 18,
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
    backgroundColor: '#e7f7fb',
    borderRadius: 14,
    height: 170,
    justifyContent: 'center',
  },
  heroImageInitial: {
    color: '#009de0',
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
    flex: 1,
    fontSize: 26,
    fontWeight: '800',
  },
  cuisineBadge: {
    backgroundColor: '#e7f7fb',
    borderRadius: 999,
    paddingHorizontal: 9,
    paddingVertical: 5,
  },
  cuisineBadgeText: {
    color: '#007cb3',
    fontSize: 11,
    fontWeight: '800',
  },
  restaurantDescription: {
    color: '#4f5b63',
    fontSize: 15,
    lineHeight: 22,
  },
  restaurantAddress: {
    color: '#4f5b63',
    fontSize: 13,
    fontWeight: '700',
  },
  restaurantPhone: {
    color: '#4f5b63',
    fontSize: 13,
  },
  menuHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  menuTitle: {
    fontSize: 23,
    fontWeight: '800',
  },
  menuSubtitle: {
    color: '#4f5b63',
    fontSize: 13,
    marginTop: 3,
  },
  refreshButton: {
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  refreshButtonText: {
    color: '#007cb3',
    fontSize: 14,
    fontWeight: '800',
  },
  categoryList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  categoryChip: {
    borderColor: '#d7d7d7',
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 9,
  },
  categoryChipSelected: {
    backgroundColor: '#009de0',
    borderColor: '#009de0',
  },
  categoryChipText: {
    color: '#4f5b63',
    fontSize: 14,
    fontWeight: '700',
  },
  categoryChipTextSelected: {
    color: '#ffffff',
  },
  productCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
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
    backgroundColor: '#e7f7fb',
    borderRadius: 12,
    height: 74,
    justifyContent: 'center',
    width: 74,
  },
  productImageInitial: {
    color: '#009de0',
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
    flex: 1,
    fontSize: 16,
    fontWeight: '800',
  },
  productPrice: {
    color: '#007cb3',
    fontSize: 15,
    fontWeight: '800',
  },
  productDescription: {
    color: '#4f5b63',
    fontSize: 13,
    lineHeight: 18,
  },
  productCategory: {
    color: '#6b767d',
    fontSize: 12,
    fontWeight: '700',
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
    fontWeight: '800',
    textAlign: 'center',
  },
  stateMessage: {
    color: '#4f5b63',
    fontSize: 14,
    lineHeight: 21,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: '#009de0',
    borderRadius: 10,
    paddingHorizontal: 18,
    paddingVertical: 11,
  },
  retryButtonText: {
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
    color: '#4f5b63',
    fontSize: 13,
  },
});
