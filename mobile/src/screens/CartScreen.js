import { StatusBar } from 'expo-status-bar';
import { useMemo } from 'react';
import {
  Alert,
  Image,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { useCart } from '../cart/CartContext';
import ThemeToggle from '../components/ThemeToggle';
import { useAppTheme } from '../theme/ThemeContext';

function formatPrice(price) {
  return `\u20AA${Number(price || 0).toFixed(2)}`;
}

function hasImage(item) {
  return typeof item?.image === 'string' && item.image.trim().length > 0;
}

function getInitial(item) {
  return item?.name?.trim()?.charAt(0)?.toUpperCase() || 'P';
}

export default function CartScreen() {
  const {
    items,
    itemCount,
    totalPrice,
    increaseQuantity,
    decreaseQuantity,
    removeItem,
    clearCart,
  } = useCart();

  const { theme } = useAppTheme();
  const styles = useMemo(() => createStyles(theme.colors), [theme.colors]);

  function confirmClearCart() {
    if (items.length === 0) {
      return;
    }

    Alert.alert(
      'Clear cart?',
      'All items will be removed from your cart.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear cart',
          style: 'destructive',
          onPress: clearCart,
        },
      ]
    );
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
            <ThemeToggle compact />

            {items.length > 0 ? (
              <Pressable
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
            <Text style={styles.emptyTitle}>Your cart is empty</Text>
            <Text style={styles.emptyMessage}>
              Open a restaurant and add products to start an order.
            </Text>
          </View>
        ) : (
          <>
            {items.map((item) => (
              <View key={item.key} style={styles.itemCard}>
                {hasImage(item) ? (
                  <Image
                    source={{ uri: item.image }}
                    style={styles.itemImage}
                  />
                ) : (
                  <View style={styles.itemImagePlaceholder}>
                    <Text style={styles.itemImageInitial}>
                      {getInitial(item)}
                    </Text>
                  </View>
                )}

                <View style={styles.itemContent}>
                  <Text numberOfLines={1} style={styles.itemName}>
                    {item.name}
                  </Text>

                  <Text numberOfLines={1} style={styles.restaurantName}>
                    {item.restaurantName}
                  </Text>

                  <Text style={styles.itemPrice}>
                    {formatPrice(item.price)} each
                  </Text>

                  <View style={styles.itemFooter}>
                    <View style={styles.quantityControl}>
                      <Pressable
                        accessibilityLabel={`Decrease ${item.name} quantity`}
                        onPress={() => decreaseQuantity(item.key)}
                        style={({ pressed }) => [
                          styles.quantityButton,
                          pressed ? styles.pressedButton : null,
                        ]}
                      >
                        <Text style={styles.quantityButtonText}>−</Text>
                      </Pressable>

                      <Text style={styles.quantityText}>{item.quantity}</Text>

                      <Pressable
                        accessibilityLabel={`Increase ${item.name} quantity`}
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

            <View style={styles.summaryCard}>
              <Text style={styles.summaryLabel}>Total</Text>
              <Text style={styles.summaryPrice}>{formatPrice(totalPrice)}</Text>
            </View>

            <View style={styles.checkoutNotice}>
              <Text style={styles.checkoutTitle}>Checkout comes next</Text>
              <Text style={styles.checkoutMessage}>
                Order checkout will be added in SCRUM-392.
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
      gap: 12,
      justifyContent: 'space-between',
    },
    headerText: {
      flex: 1,
    },
    headerActions: {
      alignItems: 'center',
      flexDirection: 'row',
      gap: 8,
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
    clearButton: {
      borderColor: colors.danger,
      borderRadius: 10,
      borderWidth: 1,
      paddingHorizontal: 12,
      paddingVertical: 9,
    },
    clearButtonText: {
      color: colors.danger,
      fontSize: 14,
      fontWeight: '800',
    },
    emptyCard: {
      alignItems: 'center',
      backgroundColor: colors.surface,
      borderColor: colors.border,
      borderRadius: 16,
      borderWidth: 1,
      gap: 10,
      padding: 24,
    },
    emptyTitle: {
      color: colors.text,
      fontSize: 19,
      fontWeight: '800',
    },
    emptyMessage: {
      color: colors.textMuted,
      fontSize: 14,
      lineHeight: 21,
      textAlign: 'center',
    },
    itemCard: {
      backgroundColor: colors.surface,
      borderColor: colors.border,
      borderRadius: 16,
      borderWidth: 1,
      flexDirection: 'row',
      gap: 14,
      padding: 14,
    },
    itemImage: {
      borderRadius: 12,
      height: 76,
      width: 76,
    },
    itemImagePlaceholder: {
      alignItems: 'center',
      backgroundColor: colors.background,
      borderColor: colors.border,
      borderRadius: 12,
      borderWidth: 1,
      height: 76,
      justifyContent: 'center',
      width: 76,
    },
    itemImageInitial: {
      color: colors.primary,
      fontSize: 30,
      fontWeight: '800',
    },
    itemContent: {
      flex: 1,
      gap: 4,
    },
    itemName: {
      color: colors.text,
      fontSize: 16,
      fontWeight: '800',
    },
    restaurantName: {
      color: colors.textMuted,
      fontSize: 12,
      fontWeight: '700',
    },
    itemPrice: {
      color: colors.primary,
      fontSize: 13,
      fontWeight: '700',
    },
    itemFooter: {
      alignItems: 'center',
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginTop: 4,
    },
    quantityControl: {
      alignItems: 'center',
      flexDirection: 'row',
      gap: 8,
    },
    quantityButton: {
      alignItems: 'center',
      backgroundColor: colors.background,
      borderColor: colors.border,
      borderRadius: 8,
      borderWidth: 1,
      height: 30,
      justifyContent: 'center',
      width: 30,
    },
    quantityButtonText: {
      color: colors.primary,
      fontSize: 18,
      fontWeight: '800',
    },
    quantityText: {
      color: colors.text,
      fontSize: 15,
      fontWeight: '800',
      minWidth: 16,
      textAlign: 'center',
    },
    itemTotal: {
      color: colors.primary,
      fontSize: 15,
      fontWeight: '800',
    },
    removeButton: {
      alignSelf: 'flex-start',
      paddingVertical: 3,
    },
    removeButtonText: {
      color: colors.danger,
      fontSize: 12,
      fontWeight: '800',
    },
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
    summaryLabel: {
      color: colors.text,
      fontSize: 18,
      fontWeight: '800',
    },
    summaryPrice: {
      color: colors.primary,
      fontSize: 22,
      fontWeight: '800',
    },
    checkoutNotice: {
      backgroundColor: colors.surface,
      borderColor: colors.primary,
      borderRadius: 14,
      borderWidth: 1,
      gap: 5,
      padding: 16,
    },
    checkoutTitle: {
      color: colors.primary,
      fontSize: 15,
      fontWeight: '800',
    },
    checkoutMessage: {
      color: colors.textMuted,
      fontSize: 13,
      lineHeight: 19,
    },
    pressedButton: {
      opacity: 0.72,
    },
  });
}
