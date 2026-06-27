import { StatusBar } from 'expo-status-bar';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Pressable,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { getOrderById } from '../api/orders';
import { useAuth } from '../auth/AuthContext';
import AppState from '../components/AppState';
import ThemeToggle from '../components/ThemeToggle';
import { useAppTheme } from '../theme/ThemeContext';

function formatPrice(price) {
  return `\u20AA${Number(price || 0).toFixed(2)}`;
}

function formatDate(value) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return 'Date unavailable';
  }

  return new Intl.DateTimeFormat('en-IL', {
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    month: 'long',
    year: 'numeric',
  }).format(date);
}

function formatStatus(status) {
  const normalizedStatus = String(status || 'created').trim();

  if (!normalizedStatus) {
    return 'Created';
  }

  return normalizedStatus.charAt(0).toUpperCase() + normalizedStatus.slice(1);
}

export default function OrderDetailsScreen({ route }) {
  const orderId = String(route.params?.orderId || '').trim();

  const { token } = useAuth();
  const { theme } = useAppTheme();
  const styles = useMemo(() => createStyles(theme.colors), [theme.colors]);

  const [order, setOrder] = useState(null);
  const [requestState, setRequestState] = useState('loading');
  const [message, setMessage] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);

  const loadOrder = useCallback(
    async ({ refreshing = false } = {}) => {
      if (!orderId) {
        setOrder(null);
        setMessage('This order is missing its identifier.');
        setRequestState('error');
        return;
      }

      if (refreshing) {
        setIsRefreshing(true);
      } else {
        setRequestState('loading');
      }

      setMessage('');

      try {
        const response = await getOrderById(orderId, token);

        setOrder(response);
        setRequestState('success');
      } catch (error) {
        setMessage(
          error.message ||
            'Could not load order details. Please check your connection and try again.'
        );
        setRequestState('error');
      } finally {
        setIsRefreshing(false);
      }
    },
    [orderId, token]
  );

  useEffect(() => {
    loadOrder();
  }, [loadOrder]);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style={theme.mode === 'dark' ? 'light' : 'dark'} />

      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            colors={[theme.colors.primary]}
            onRefresh={() => loadOrder({ refreshing: true })}
            refreshing={isRefreshing}
            tintColor={theme.colors.primary}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <View style={styles.headerText}>
            <Text style={styles.title}>Order details</Text>
            <Text style={styles.subtitle}>
              See the saved details for this order.
            </Text>
          </View>

          <ThemeToggle compact />
        </View>

        {requestState === 'loading' ? (
          <AppState
            message="Loading the selected order."
            title="Loading order"
            type="loading"
          />
        ) : null}

        {requestState === 'error' ? (
          <AppState
            actionLabel="Try again"
            message={message}
            onAction={loadOrder}
            title="Could not load order"
            type="error"
          />
        ) : null}

        {requestState === 'success' && order ? (
          <>
            <View style={styles.restaurantCard}>
              <Text style={styles.restaurantLabel}>Ordered from</Text>
              <Text style={styles.restaurantName}>
                {order.restaurantName || 'Restaurant'}
              </Text>

              <View style={styles.statusBadge}>
                <Text style={styles.statusText}>{formatStatus(order.status)}</Text>
              </View>
            </View>

            <View style={styles.metadataCard}>
              <View style={styles.metadataRow}>
                <Text style={styles.metadataLabel}>Order date</Text>
                <Text style={styles.metadataValue}>{formatDate(order.createdAt)}</Text>
              </View>

              <View style={styles.metadataRow}>
                <Text style={styles.metadataLabel}>Order id</Text>
                <Text numberOfLines={1} style={styles.metadataValue}>
                  {order.id}
                </Text>
              </View>
            </View>

            <View style={styles.itemsCard}>
              <Text style={styles.sectionTitle}>Items</Text>

              {Array.isArray(order.items) && order.items.length > 0 ? (
                order.items.map((item, index) => (
                  <View
                    key={`${item.productId || 'item'}-${index}`}
                    style={styles.itemRow}
                  >
                    <View style={styles.itemText}>
                      <Text numberOfLines={1} style={styles.itemName}>
                        {item.productName || 'Menu item'}
                      </Text>
                      <Text style={styles.itemMeta}>
                        {Number(item.quantity || 0)} x {formatPrice(item.price)}
                      </Text>
                    </View>

                    <Text style={styles.itemPrice}>
                      {formatPrice(Number(item.price || 0) * Number(item.quantity || 0))}
                    </Text>
                  </View>
                ))
              ) : (
                <Text style={styles.emptyItemsText}>No saved items found.</Text>
              )}

              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Total</Text>
                <Text style={styles.totalPrice}>{formatPrice(order.totalPrice)}</Text>
              </View>
            </View>

            <Pressable
              onPress={() => loadOrder({ refreshing: true })}
              style={({ pressed }) => [
                styles.refreshButton,
                pressed ? styles.pressedButton : null,
              ]}
            >
              <Text style={styles.refreshButtonText}>Refresh order status</Text>
            </Pressable>
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
      lineHeight: 20,
      marginTop: 4,
    },
    restaurantCard: {
      backgroundColor: colors.surface,
      borderColor: colors.border,
      borderRadius: 18,
      borderWidth: 1,
      gap: 8,
      padding: 18,
    },
    restaurantLabel: {
      color: colors.textMuted,
      fontSize: 13,
      fontWeight: '700',
    },
    restaurantName: {
      color: colors.text,
      fontSize: 22,
      fontWeight: '800',
    },
    statusBadge: {
      alignSelf: 'flex-start',
      backgroundColor: colors.primarySoft,
      borderRadius: 999,
      marginTop: 4,
      paddingHorizontal: 11,
      paddingVertical: 6,
    },
    statusText: {
      color: colors.primary,
      fontSize: 13,
      fontWeight: '800',
    },
    metadataCard: {
      backgroundColor: colors.surface,
      borderColor: colors.border,
      borderRadius: 18,
      borderWidth: 1,
      gap: 12,
      padding: 16,
    },
    metadataRow: {
      gap: 5,
    },
    metadataLabel: {
      color: colors.textMuted,
      fontSize: 12,
      fontWeight: '800',
      textTransform: 'uppercase',
    },
    metadataValue: {
      color: colors.text,
      fontSize: 14,
      fontWeight: '700',
    },
    itemsCard: {
      backgroundColor: colors.surface,
      borderColor: colors.border,
      borderRadius: 18,
      borderWidth: 1,
      gap: 14,
      padding: 18,
    },
    sectionTitle: {
      color: colors.text,
      fontSize: 19,
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
    emptyItemsText: {
      color: colors.textMuted,
      fontSize: 14,
    },
    totalRow: {
      alignItems: 'center',
      borderTopColor: colors.border,
      borderTopWidth: 1,
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginTop: 2,
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
    refreshButton: {
      alignItems: 'center',
      borderColor: colors.primary,
      borderRadius: 12,
      borderWidth: 1,
      justifyContent: 'center',
      minHeight: 48,
      paddingHorizontal: 18,
      paddingVertical: 12,
    },
    refreshButtonText: {
      color: colors.primary,
      fontSize: 15,
      fontWeight: '800',
    },
    pressedButton: {
      opacity: 0.74,
    },
  });
}
