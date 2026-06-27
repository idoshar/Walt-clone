import { StatusBar } from 'expo-status-bar';
import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { createOrder } from '../api/orders';
import { useAuth } from '../auth/AuthContext';
import { useCart } from '../cart/CartContext';
import ThemeToggle from '../components/ThemeToggle';
import { useAppTheme } from '../theme/ThemeContext';

function formatPrice(price) {
  return `\u20AA${Number(price || 0).toFixed(2)}`;
}

export default function CheckoutScreen({ navigation, route }) {
  const restaurantId = String(route.params?.restaurantId || '').trim();

  const { token } = useAuth();
  const { items, clearRestaurantItems } = useCart();
  const { theme } = useAppTheme();

  const styles = useMemo(() => createStyles(theme.colors), [theme.colors]);

  const [submitState, setSubmitState] = useState('idle');
  const [message, setMessage] = useState('');
  const [createdOrder, setCreatedOrder] = useState(null);
  const [confirmedRestaurantName, setConfirmedRestaurantName] = useState('');

  const restaurantItems = useMemo(
    () =>
      items.filter(
        (item) => String(item.restaurantId) === restaurantId
      ),
    [items, restaurantId]
  );

  const restaurantName =
    restaurantItems[0]?.restaurantName || 'Selected restaurant';

  const totalPrice = useMemo(
    () =>
      restaurantItems.reduce(
        (total, item) => total + item.price * item.quantity,
        0
      ),
    [restaurantItems]
  );

  const itemCount = useMemo(
    () =>
      restaurantItems.reduce(
        (total, item) => total + item.quantity,
        0
      ),
    [restaurantItems]
  );

  const isSubmitting = submitState === 'loading';
  const isSuccess = submitState === 'success';
  const isError = submitState === 'error';

  async function handlePlaceOrder() {
    if (isSubmitting || restaurantItems.length === 0) {
      return;
    }

    setSubmitState('loading');
    setMessage('');

    try {
      const response = await createOrder({
        token,
        restaurantId,
        items: restaurantItems.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
          price: item.price,
        })),
      });

      setConfirmedRestaurantName(restaurantName);
      setCreatedOrder(response);
      clearRestaurantItems(restaurantId);
      setSubmitState('success');
    } catch (error) {
      setMessage(
        error.message ||
          'Could not place your order. Please review it and try again.'
      );
      setSubmitState('error');
    }
  }

  if (isSuccess) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar style={theme.mode === 'dark' ? 'light' : 'dark'} />

        <View style={styles.successContainer}>
          <ThemeToggle compact />

          <View style={styles.successCard}>
            <Text style={styles.successIcon}>✓</Text>
            <Text style={styles.successTitle}>Order placed</Text>
            <Text style={styles.successMessage}>
              Your order from {confirmedRestaurantName || restaurantName} was created successfully.
            </Text>

            {createdOrder?.id ? (
              <Text style={styles.orderId}>Order #{createdOrder.id}</Text>
            ) : null}

            <View style={styles.successActions}>
              <Pressable
                accessibilityRole="button"
                onPress={() =>
                  navigation.reset({
                    index: 1,
                    routes: [{ name: 'Home' }, { name: 'Cart' }],
                  })
                }
                style={({ pressed }) => [
                  styles.primaryButton,
                  styles.successButton,
                  pressed ? styles.pressedButton : null,
                ]}
              >
                <Text style={styles.primaryButtonText}>Back to cart</Text>
              </Pressable>

              <Pressable
                accessibilityRole="button"
                onPress={() =>
                  navigation.reset({
                    index: 0,
                    routes: [{ name: 'Home' }],
                  })
                }
                style={({ pressed }) => [
                  styles.secondaryButton,
                  pressed ? styles.pressedButton : null,
                ]}
              >
                <Text style={styles.secondaryButtonText}>Back to home</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style={theme.mode === 'dark' ? 'light' : 'dark'} />

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <View style={styles.headerText}>
            <Text style={styles.title}>Checkout</Text>
            <Text style={styles.subtitle}>
              Review your order before placing it.
            </Text>
          </View>

          <ThemeToggle compact />
        </View>

        {restaurantItems.length === 0 ? (
          <View style={styles.stateCard}>
            <Text style={styles.stateTitle}>No items to checkout</Text>
            <Text style={styles.stateMessage}>
              This restaurant no longer has products in your cart.
            </Text>

            <View style={styles.successActions}>
              <Pressable
                accessibilityRole="button"
                onPress={() =>
                  navigation.reset({
                    index: 1,
                    routes: [{ name: 'Home' }, { name: 'Cart' }],
                  })
                }
                style={({ pressed }) => [
                  styles.primaryButton,
                  styles.successButton,
                  pressed ? styles.pressedButton : null,
                ]}
              >
                <Text style={styles.primaryButtonText}>Back to cart</Text>
              </Pressable>

              <Pressable
                accessibilityRole="button"
                onPress={() =>
                  navigation.reset({
                    index: 0,
                    routes: [{ name: 'Home' }],
                  })
                }
                style={({ pressed }) => [
                  styles.secondaryButton,
                  pressed ? styles.pressedButton : null,
                ]}
              >
                <Text style={styles.secondaryButtonText}>Back to home</Text>
              </Pressable>
            </View>
          </View>
        ) : (
          <>
            <View style={styles.restaurantCard}>
              <Text style={styles.restaurantLabel}>Ordering from</Text>
              <Text style={styles.restaurantName}>{restaurantName}</Text>
              <Text style={styles.restaurantMeta}>
                {itemCount} item{itemCount === 1 ? '' : 's'}
              </Text>
            </View>

            <View style={styles.itemsCard}>
              <Text style={styles.sectionTitle}>Order summary</Text>

              {restaurantItems.map((item) => (
                <View key={item.key} style={styles.itemRow}>
                  <View style={styles.itemText}>
                    <Text numberOfLines={1} style={styles.itemName}>
                      {item.name}
                    </Text>
                    <Text style={styles.itemMeta}>
                      {item.quantity} × {formatPrice(item.price)}
                    </Text>
                  </View>

                  <Text style={styles.itemPrice}>
                    {formatPrice(item.price * item.quantity)}
                  </Text>
                </View>
              ))}

              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Total</Text>
                <Text style={styles.totalPrice}>{formatPrice(totalPrice)}</Text>
              </View>
            </View>

            {isError ? (
              <View style={styles.errorCard}>
                <Text style={styles.errorTitle}>Order was not placed</Text>
                <Text style={styles.errorMessage}>{message}</Text>
              </View>
            ) : null}

            <Pressable
              disabled={isSubmitting}
              onPress={handlePlaceOrder}
              style={({ pressed }) => [
                styles.primaryButton,
                isSubmitting ? styles.disabledButton : null,
                pressed && !isSubmitting ? styles.pressedButton : null,
              ]}
            >
              {isSubmitting ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <Text style={styles.primaryButtonText}>
                  Place order · {formatPrice(totalPrice)}
                </Text>
              )}
            </Pressable>

            <Text style={styles.note}>
              Orders are placed separately for each restaurant.
            </Text>
          </>
        )}
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
    header: {
      alignItems: 'flex-start',
      flexDirection: 'row',
      gap: 16,
      justifyContent: 'space-between',
    },
    headerText: {
      flex: 1,
    },
    title: {
      color: colors.text,
      fontSize: 28,
      fontWeight: '800',
    },
    subtitle: {
      color: colors.textMuted,
      fontSize: 14,
      marginTop: 4,
    },
    restaurantCard: {
      backgroundColor: colors.surface,
      borderColor: colors.border,
      borderRadius: 16,
      borderWidth: 1,
      gap: 5,
      padding: 18,
    },
    restaurantLabel: {
      color: colors.textMuted,
      fontSize: 13,
      fontWeight: '700',
    },
    restaurantName: {
      color: colors.text,
      fontSize: 20,
      fontWeight: '800',
    },
    restaurantMeta: {
      color: colors.primary,
      fontSize: 13,
      fontWeight: '800',
    },
    itemsCard: {
      backgroundColor: colors.surface,
      borderColor: colors.border,
      borderRadius: 16,
      borderWidth: 1,
      gap: 14,
      padding: 18,
    },
    sectionTitle: {
      color: colors.text,
      fontSize: 18,
      fontWeight: '800',
    },
    itemRow: {
      alignItems: 'center',
      flexDirection: 'row',
      gap: 12,
      justifyContent: 'space-between',
    },
    itemText: {
      flex: 1,
      gap: 3,
    },
    itemName: {
      color: colors.text,
      fontSize: 15,
      fontWeight: '800',
    },
    itemMeta: {
      color: colors.textMuted,
      fontSize: 13,
    },
    itemPrice: {
      color: colors.primary,
      fontSize: 15,
      fontWeight: '800',
    },
    totalRow: {
      alignItems: 'center',
      borderTopColor: colors.border,
      borderTopWidth: 1,
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginTop: 4,
      paddingTop: 14,
    },
    totalLabel: {
      color: colors.text,
      fontSize: 19,
      fontWeight: '800',
    },
    totalPrice: {
      color: colors.primary,
      fontSize: 23,
      fontWeight: '800',
    },
    primaryButton: {
      alignItems: 'center',
      backgroundColor: colors.primary,
      borderRadius: 12,
      justifyContent: 'center',
      minHeight: 50,
      paddingHorizontal: 18,
      paddingVertical: 13,
    },
    primaryButtonText: {
      color: '#ffffff',
      fontSize: 16,
      fontWeight: '800',
    },
    disabledButton: {
      opacity: 0.56,
    },
    pressedButton: {
      opacity: 0.74,
    },
    errorCard: {
      backgroundColor: colors.surface,
      borderColor: colors.danger,
      borderRadius: 14,
      borderWidth: 1,
      gap: 5,
      padding: 15,
    },
    errorTitle: {
      color: colors.danger,
      fontSize: 15,
      fontWeight: '800',
    },
    errorMessage: {
      color: colors.textMuted,
      fontSize: 13,
      lineHeight: 19,
    },
    note: {
      color: colors.textMuted,
      fontSize: 12,
      lineHeight: 18,
      textAlign: 'center',
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
      fontSize: 19,
      fontWeight: '800',
      textAlign: 'center',
    },
    stateMessage: {
      color: colors.textMuted,
      fontSize: 14,
      lineHeight: 21,
      textAlign: 'center',
    },
    successContainer: {
      alignItems: 'center',
      flex: 1,
      gap: 20,
      justifyContent: 'center',
      padding: 20,
    },
    successCard: {
      alignItems: 'center',
      backgroundColor: colors.surface,
      borderColor: colors.border,
      borderRadius: 18,
      borderWidth: 1,
      gap: 14,
      padding: 24,
      width: '100%',
    },
    successActions: {
      gap: 10,
      width: '100%',
    },
    successButton: {
      width: '100%',
    },
    secondaryButton: {
      alignItems: 'center',
      borderColor: colors.primary,
      borderRadius: 12,
      borderWidth: 1,
      justifyContent: 'center',
      minHeight: 50,
      paddingHorizontal: 18,
      paddingVertical: 13,
      width: '100%',
    },
    secondaryButtonText: {
      color: colors.primary,
      fontSize: 16,
      fontWeight: '800',
    },
    successIcon: {
      color: colors.primary,
      fontSize: 48,
      fontWeight: '800',
    },
    successTitle: {
      color: colors.text,
      fontSize: 24,
      fontWeight: '800',
    },
    successMessage: {
      color: colors.textMuted,
      fontSize: 14,
      lineHeight: 21,
      textAlign: 'center',
    },
    orderId: {
      color: colors.primary,
      fontSize: 13,
      fontWeight: '800',
    },
  });
}
