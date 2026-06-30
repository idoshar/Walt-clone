import { StatusBar } from 'expo-status-bar';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { getProductRecommendations } from '../api/products';
import { getRestaurantProducts } from '../api/restaurants';
import { useAuth } from '../auth/AuthContext';
import { useCart } from '../cart/CartContext';
import ProductImage from '../components/ProductImage';
import { useCurrency } from '../currency/CurrencyContext';
import { useAppTheme } from '../theme/ThemeContext';

function groupItemsByRestaurant(items) {
  const groups = new Map();

  items.forEach((item) => {
    const restaurantId = String(item.restaurantId || '').trim();
    const groupKey = restaurantId || item.restaurantName || 'unknown';

    if (!groups.has(groupKey)) {
      groups.set(groupKey, {
        restaurantId,
        restaurantName: item.restaurantName || 'Restaurant',
        items: [],
      });
    }

    groups.get(groupKey).items.push(item);
  });

  return Array.from(groups.values()).map((group) => ({
    ...group,
    itemCount: group.items.reduce((total, item) => total + item.quantity, 0),
    totalPrice: group.items.reduce(
      (total, item) => total + item.price * item.quantity,
      0
    ),
  }));
}

// Category-based fallback when ex2 has no data yet
function getCategoryFallback(allProducts, cartItems) {
  const cartProductIds = new Set(cartItems.map((i) => String(i.productId)));

  // Find the most common category in the cart
  const categoryCounts = {};
  cartItems.forEach((i) => {
    const cat = i.category?.trim();
    if (cat) categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
  });
  const topCategory = Object.entries(categoryCounts).sort(
    (a, b) => b[1] - a[1]
  )[0]?.[0];

  const candidates = allProducts.filter(
    (p) => !cartProductIds.has(String(p.id))
  );

  const sameCategory = candidates.filter(
    (p) => topCategory && p.category?.trim() === topCategory
  );
  const others = candidates.filter(
    (p) => !topCategory || p.category?.trim() !== topCategory
  );

  return [...sameCategory, ...others].slice(0, 5);
}

export default function CartScreen({ navigation }) {
  const { formatPrice } = useCurrency();
  const {
    items,
    itemCount,
    totalPrice,
    increaseQuantity,
    decreaseQuantity,
    removeItem,
    clearCart,
    addItem,
  } = useCart();

  const { token } = useAuth();
  const { theme } = useAppTheme();
  const styles = useMemo(() => createStyles(theme.colors), [theme.colors]);

  const [recommendations, setRecommendations] = useState([]);

  const restaurantGroups = useMemo(
    () => groupItemsByRestaurant(items),
    [items]
  );

  // Load recommendations whenever cart changes
  const loadRecommendations = useCallback(async () => {
    if (items.length === 0) {
      setRecommendations([]);
      return;
    }

    // Use the last added item as the source product
    const lastItem = items[items.length - 1];
    const restaurantId = lastItem?.restaurantId;
    const productId = lastItem?.productId;

    if (!restaurantId || !productId) return;

    try {
      // Try real ex2 recommendations first
      const recs = token
        ? await getProductRecommendations(restaurantId, productId, token)
        : [];

      if (recs.length > 0) {
        // Filter out products already in cart
        const cartProductIds = new Set(items.map((i) => String(i.productId)));
        setRecommendations(recs.filter((r) => !cartProductIds.has(String(r.id))));
      } else {
        // Fallback: load all products from the restaurant and filter by category
        const allProducts = await getRestaurantProducts(restaurantId);
        setRecommendations(getCategoryFallback(allProducts, items));
      }
    } catch {
      try {
        const allProducts = await getRestaurantProducts(restaurantId);
        setRecommendations(getCategoryFallback(allProducts, items));
      } catch {
        setRecommendations([]);
      }
    }
  }, [items, token]);

  useEffect(() => {
    loadRecommendations();
  }, [loadRecommendations]);

  function confirmClearCart() {
    if (items.length === 0) return;

    Alert.alert('Clear cart?', 'All items will be removed from your cart.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Clear cart', style: 'destructive', onPress: clearCart },
    ]);
  }

  // Add recommended product to cart — use last item's restaurant context
  function addRecommendation(product) {
    const lastItem = items[items.length - 1];
    addItem(product, {
      id: lastItem?.restaurantId,
      name: lastItem?.restaurantName,
    });
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style={theme.mode === 'dark' ? 'light' : 'dark'} />

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <View style={styles.headerText}>
            <Text style={styles.title}>Your cart</Text>
            <Text style={styles.subtitle}>
              {itemCount === 0
                ? 'Your cart is empty.'
                : `${itemCount} item${itemCount === 1 ? '' : 's'} in your cart.`}
            </Text>
          </View>

          <View style={styles.headerActions}>
            {items.length > 0 ? (
              <Pressable
                accessibilityRole="button"
                onPress={confirmClearCart}
                style={({ pressed }) => [
                  styles.clearButton,
                  pressed ? styles.pressedButton : null,
                ]}
              >
                <Text style={styles.clearButtonText}>Clear</Text>
              </Pressable>
            ) : null}
          </View>
        </View>

        {items.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyEmoji}>🛒</Text>
            <Text style={styles.emptyTitle}>Your cart is empty</Text>
            <Text style={styles.emptyMessage}>
              Open a restaurant and add products to start an order.
            </Text>
          </View>
        ) : (
          <>
            {restaurantGroups.map((group) => (
              <View
                key={group.restaurantId || group.restaurantName}
                style={styles.restaurantSection}
              >
                <View style={styles.restaurantHeader}>
                  <View style={styles.restaurantHeaderText}>
                    <Text numberOfLines={1} style={styles.restaurantTitle}>
                      {group.restaurantName}
                    </Text>
                    <Text style={styles.restaurantSubtitle}>
                      {group.itemCount} item{group.itemCount === 1 ? '' : 's'}{' '}
                      · {formatPrice(group.totalPrice)}
                    </Text>
                  </View>
                </View>

                {group.items.map((item) => (
                  <View key={item.key} style={styles.itemCard}>
                    <ProductImage
                      product={item}
                      style={styles.itemImage}
                    />

                    <View style={styles.itemContent}>
                      <Text numberOfLines={1} style={styles.itemName}>
                        {item.name}
                      </Text>

                      <Text style={styles.itemPrice}>
                        {formatPrice(item.price)} each
                      </Text>

                      <View style={styles.itemFooter}>
                        <View style={styles.quantityControl}>
                          <Pressable
                            accessibilityRole="button"
                            onPress={() => decreaseQuantity(item.key)}
                            style={({ pressed }) => [
                              styles.quantityButton,
                              pressed ? styles.pressedButton : null,
                            ]}
                          >
                            <Text style={styles.quantityButtonText}>-</Text>
                          </Pressable>

                          <Text style={styles.quantityText}>
                            {item.quantity}
                          </Text>

                          <Pressable
                            accessibilityRole="button"
                            onPress={() => increaseQuantity(item.key)}
                            style={({ pressed }) => [
                              styles.quantityButton,
                              pressed ? styles.pressedButton : null,
                            ]}
                          >
                            <Text style={styles.quantityButtonText}>+</Text>
                          </Pressable>
                        </View>

                        <Text style={styles.itemTotal}>
                          {formatPrice(item.price * item.quantity)}
                        </Text>
                      </View>

                      <Pressable
                        accessibilityRole="button"
                        onPress={() => removeItem(item.key)}
                        style={({ pressed }) => [
                          styles.removeButton,
                          pressed ? styles.pressedButton : null,
                        ]}
                      >
                        <Text style={styles.removeButtonText}>Remove</Text>
                      </Pressable>
                    </View>
                  </View>
                ))}

                <View style={styles.restaurantTotalRow}>
                  <Text style={styles.restaurantTotalLabel}>
                    {group.restaurantName} total
                  </Text>
                  <Text style={styles.restaurantTotalPrice}>
                    {formatPrice(group.totalPrice)}
                  </Text>
                </View>

                <Pressable
                  accessibilityRole="button"
                  disabled={!group.restaurantId}
                  onPress={() =>
                    navigation.navigate('Checkout', {
                      restaurantId: group.restaurantId,
                    })
                  }
                  style={({ pressed }) => [
                    styles.checkoutButton,
                    !group.restaurantId ? styles.disabledButton : null,
                    pressed && group.restaurantId ? styles.pressedButton : null,
                  ]}
                >
                  <Text style={styles.checkoutButtonText}>
                    Checkout · {formatPrice(group.totalPrice)}
                  </Text>
                </Pressable>
              </View>
            ))}

            {/* ── Recommendations ── */}
            {recommendations.length > 0 ? (
              <View style={styles.recommendationsSection}>
                <Text style={styles.recommendationsTitle}>
                  Add to your order
                </Text>
                <Text style={styles.recommendationsSubtitle}>
                  Others who ordered this also liked
                </Text>

                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.recommendationsList}
                >
                  {recommendations.map((rec) => (
                    <View key={rec.id} style={styles.recommendationCard}>
                      <ProductImage
                        product={rec}
                        style={styles.recommendationImage}
                      />

                      <Text numberOfLines={2} style={styles.recommendationName}>
                        {rec.name}
                      </Text>

                      {rec.category ? (
                        <Text style={styles.recommendationCategory}>
                          {rec.category}
                        </Text>
                      ) : null}

                      <View style={styles.recommendationFooter}>
                        <Text style={styles.recommendationPrice}>
                          {formatPrice(rec.price)}
                        </Text>

                        <Pressable
                          onPress={() => addRecommendation(rec)}
                          style={({ pressed }) => [
                            styles.addButton,
                            pressed ? styles.pressedButton : null,
                          ]}
                        >
                          <Text style={styles.addButtonText}>+ Add</Text>
                        </Pressable>
                      </View>
                    </View>
                  ))}
                </ScrollView>
              </View>
            ) : null}

            <View style={styles.summaryCard}>
              <Text style={styles.summaryLabel}>Cart total</Text>
              <Text style={styles.summaryPrice}>{formatPrice(totalPrice)}</Text>
            </View>

            <View style={styles.checkoutNotice}>
              <Text style={styles.checkoutTitle}>One order per restaurant</Text>
              <Text style={styles.checkoutMessage}>
                Checkout is processed separately for each restaurant.
              </Text>
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function createStyles(colors) {
  return StyleSheet.create({
    container: { backgroundColor: colors.background, flex: 1 },
    content: { flexGrow: 1, gap: 16, padding: 20, paddingBottom: 32 },
    header: {
      alignItems: 'flex-start',
      flexDirection: 'row',
      gap: 12,
      justifyContent: 'space-between',
    },
    headerText: { flex: 1 },
    headerActions: { alignItems: 'center', flexDirection: 'row', gap: 8 },
    title: { color: colors.text, fontSize: 28, fontWeight: '800' },
    subtitle: { color: colors.textMuted, fontSize: 14, marginTop: 4 },
    clearButton: {
      borderColor: colors.danger,
      borderRadius: 10,
      borderWidth: 1,
      paddingHorizontal: 12,
      paddingVertical: 9,
    },
    clearButtonText: { color: colors.danger, fontSize: 14, fontWeight: '800' },
    emptyCard: {
      alignItems: 'center',
      backgroundColor: colors.surface,
      borderColor: colors.border,
      borderRadius: 16,
      borderWidth: 1,
      gap: 10,
      padding: 24,
    },
    emptyEmoji: { fontSize: 48 },
    emptyTitle: { color: colors.text, fontSize: 19, fontWeight: '800' },
    emptyMessage: {
      color: colors.textMuted,
      fontSize: 14,
      lineHeight: 21,
      textAlign: 'center',
    },
    restaurantSection: {
      backgroundColor: colors.surface,
      borderColor: colors.border,
      borderRadius: 18,
      borderWidth: 1,
      gap: 12,
      overflow: 'hidden',
      padding: 14,
    },
    restaurantHeader: {
      borderBottomColor: colors.border,
      borderBottomWidth: 1,
      paddingBottom: 12,
    },
    restaurantHeaderText: { gap: 3 },
    restaurantTitle: { color: colors.text, fontSize: 19, fontWeight: '800' },
    restaurantSubtitle: {
      color: colors.textMuted,
      fontSize: 13,
      fontWeight: '700',
    },
    itemCard: {
      backgroundColor: colors.background,
      borderColor: colors.border,
      borderRadius: 14,
      borderWidth: 1,
      flexDirection: 'row',
      gap: 14,
      padding: 12,
    },
    itemImage: { borderRadius: 11, height: 70, width: 70 },
    itemImagePlaceholder: {
      alignItems: 'center',
      backgroundColor: colors.surface,
      borderColor: colors.border,
      borderRadius: 11,
      borderWidth: 1,
      height: 70,
      justifyContent: 'center',
      width: 70,
    },
    itemImageInitial: { color: colors.primary, fontSize: 28, fontWeight: '800' },
    itemContent: { flex: 1, gap: 4 },
    itemName: { color: colors.text, fontSize: 16, fontWeight: '800' },
    itemPrice: { color: colors.primary, fontSize: 13, fontWeight: '700' },
    itemFooter: {
      alignItems: 'center',
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginTop: 4,
    },
    quantityControl: { alignItems: 'center', flexDirection: 'row', gap: 8 },
    quantityButton: {
      alignItems: 'center',
      backgroundColor: colors.surface,
      borderColor: colors.border,
      borderRadius: 8,
      borderWidth: 1,
      height: 30,
      justifyContent: 'center',
      width: 30,
    },
    quantityButtonText: { color: colors.primary, fontSize: 18, fontWeight: '800' },
    quantityText: {
      color: colors.text,
      fontSize: 15,
      fontWeight: '800',
      minWidth: 16,
      textAlign: 'center',
    },
    itemTotal: { color: colors.primary, fontSize: 15, fontWeight: '800' },
    removeButton: { alignSelf: 'flex-start', paddingVertical: 3 },
    removeButtonText: { color: colors.danger, fontSize: 12, fontWeight: '800' },
    restaurantTotalRow: {
      alignItems: 'center',
      borderTopColor: colors.border,
      borderTopWidth: 1,
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginTop: 2,
      paddingTop: 12,
    },
    restaurantTotalLabel: { color: colors.text, fontSize: 15, fontWeight: '800' },
    restaurantTotalPrice: { color: colors.primary, fontSize: 17, fontWeight: '800' },
    checkoutButton: {
      alignItems: 'center',
      backgroundColor: colors.primary,
      borderRadius: 11,
      justifyContent: 'center',
      minHeight: 46,
      paddingHorizontal: 16,
      paddingVertical: 11,
    },
    checkoutButtonText: { color: '#ffffff', fontSize: 15, fontWeight: '800' },

    // Recommendations
    recommendationsSection: { gap: 10 },
    recommendationsTitle: {
      color: colors.text,
      fontSize: 20,
      fontWeight: '800',
    },
    recommendationsSubtitle: {
      color: colors.textMuted,
      fontSize: 13,
      marginTop: -4,
    },
    recommendationsList: { gap: 12, paddingBottom: 4, paddingTop: 4 },
    recommendationCard: {
      backgroundColor: colors.surface,
      borderColor: colors.border,
      borderRadius: 16,
      borderWidth: 1,
      gap: 8,
      padding: 12,
      width: 150,
    },
    recommendationImage: { borderRadius: 12, height: 90, width: '100%' },
    recommendationImagePlaceholder: {
      alignItems: 'center',
      backgroundColor: colors.primarySoft,
      borderRadius: 12,
      height: 90,
      justifyContent: 'center',
      width: '100%',
    },
    recommendationInitial: {
      color: colors.primary,
      fontSize: 32,
      fontWeight: '800',
    },
    recommendationName: {
      color: colors.text,
      fontSize: 13,
      fontWeight: '800',
      lineHeight: 18,
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
      color: colors.primary,
      fontSize: 13,
      fontWeight: '800',
    },
    addButton: {
      backgroundColor: colors.primary,
      borderRadius: 8,
      paddingHorizontal: 8,
      paddingVertical: 5,
    },
    addButtonText: { color: '#fff', fontSize: 11, fontWeight: '800' },

    summaryCard: {
      alignItems: 'center',
      backgroundColor: colors.surface,
      borderColor: colors.border,
      borderRadius: 16,
      borderWidth: 1,
      flexDirection: 'row',
      justifyContent: 'space-between',
      padding: 18,
    },
    summaryLabel: { color: colors.text, fontSize: 18, fontWeight: '800' },
    summaryPrice: { color: colors.primary, fontSize: 22, fontWeight: '800' },
    checkoutNotice: {
      backgroundColor: colors.surface,
      borderColor: colors.primary,
      borderRadius: 14,
      borderWidth: 1,
      gap: 5,
      padding: 16,
    },
    checkoutTitle: { color: colors.primary, fontSize: 15, fontWeight: '800' },
    checkoutMessage: { color: colors.textMuted, fontSize: 13, lineHeight: 19 },
    disabledButton: { opacity: 0.5 },
    pressedButton: { opacity: 0.72 },
  });
}
