import { StatusBar } from 'expo-status-bar';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  FlatList,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { getUserOrders } from '../api/orders';
import { useAuth } from '../auth/AuthContext';
import AppState from '../components/AppState';
import { useCurrency } from '../currency/CurrencyContext';
import { useAppTheme } from '../theme/ThemeContext';

function formatDate(value) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return 'Date unavailable';
  }

  return new Intl.DateTimeFormat('en-IL', {
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    month: 'short',
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

function getItemCount(order) {
  if (!Array.isArray(order?.items)) {
    return 0;
  }

  return order.items.reduce(
    (total, item) => total + Number(item?.quantity || 0),
    0
  );
}

export default function OrdersScreen({ navigation }) {
  const { formatPrice } = useCurrency();
  const { token } = useAuth();
  const { theme } = useAppTheme();
  const styles = useMemo(() => createStyles(theme.colors), [theme.colors]);

  const [orders, setOrders] = useState([]);
  const [requestState, setRequestState] = useState('loading');
  const [message, setMessage] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);

  const loadOrders = useCallback(
    async ({ refreshing = false } = {}) => {
      if (refreshing) {
        setIsRefreshing(true);
      } else {
        setRequestState('loading');
      }

      setMessage('');

      try {
        const response = await getUserOrders(token);

        const sortedOrders = [...response].sort((first, second) => {
          const firstDate = new Date(first?.createdAt || 0).getTime();
          const secondDate = new Date(second?.createdAt || 0).getTime();

          return secondDate - firstDate;
        });

        setOrders(sortedOrders);
        setRequestState('success');
      } catch (error) {
        setMessage(
          error.message ||
            'Could not load your orders. Please check your connection and try again.'
        );
        setRequestState('error');
      } finally {
        setIsRefreshing(false);
      }
    },
    [token]
  );

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  function renderOrder({ item: order }) {
    const itemCount = getItemCount(order);

    return (
      <Pressable
        accessibilityRole="button"
        onPress={() =>
          navigation.navigate('OrderDetails', {
            orderId: order.id,
          })
        }
        style={({ pressed }) => [
          styles.orderCard,
          pressed ? styles.pressedCard : null,
        ]}
      >
        <View style={styles.cardHeader}>
          <View style={styles.restaurantContainer}>
            <Text numberOfLines={1} style={styles.restaurantName}>
              {order.restaurantName || 'Restaurant'}
            </Text>

            <Text style={styles.orderDate}>{formatDate(order.createdAt)}</Text>
          </View>

          <View style={styles.statusBadge}>
            <Text style={styles.statusText}>{formatStatus(order.status)}</Text>
          </View>
        </View>

        <View style={styles.cardFooter}>
          <Text style={styles.itemCount}>
            {itemCount} item{itemCount === 1 ? '' : 's'}
          </Text>

          <Text style={styles.totalPrice}>{formatPrice(order.totalPrice)}</Text>
        </View>

        <Text numberOfLines={1} style={styles.orderId}>
          Order #{order.id}
        </Text>
      </Pressable>
    );
  }

  const listEmptyComponent =
    requestState === 'loading' ? (
      <AppState
        message="Loading your previous orders."
        title="Loading orders"
        type="loading"
      />
    ) : requestState === 'error' ? (
      <AppState
        actionLabel="Try again"
        message={message}
        onAction={loadOrders}
        title="Could not load orders"
        type="error"
      />
    ) : (
      <AppState
        message="Orders you place from Checkout will appear here."
        title="No orders yet"
        type="empty"
      />
    );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style={theme.mode === 'dark' ? 'light' : 'dark'} />

      <View style={styles.header}>
        <View style={styles.headerText}>
          <Text style={styles.title}>My orders</Text>
          <Text style={styles.subtitle}>
            Review your previous orders and their current status.
          </Text>
        </View>

      </View>

      <FlatList
        contentContainerStyle={[
          styles.listContent,
          orders.length === 0 ? styles.emptyListContent : null,
        ]}
        data={requestState === 'success' ? orders : []}
        keyExtractor={(order) => String(order.id)}
        ListEmptyComponent={listEmptyComponent}
        onRefresh={() => loadOrders({ refreshing: true })}
        refreshing={isRefreshing}
        renderItem={renderOrder}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}

function createStyles(colors) {
  return StyleSheet.create({
    container: {
      backgroundColor: colors.background,
      flex: 1,
    },
    header: {
      alignItems: 'flex-start',
      flexDirection: 'row',
      gap: 16,
      justifyContent: 'space-between',
      paddingHorizontal: 20,
      paddingTop: 20,
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
    listContent: {
      gap: 12,
      padding: 20,
      paddingBottom: 32,
    },
    emptyListContent: {
      flexGrow: 1,
      justifyContent: 'center',
    },
    orderCard: {
      backgroundColor: colors.surface,
      borderColor: colors.border,
      borderRadius: 18,
      borderWidth: 1,
      gap: 14,
      padding: 16,
    },
    pressedCard: {
      opacity: 0.74,
    },
    cardHeader: {
      alignItems: 'flex-start',
      flexDirection: 'row',
      gap: 12,
      justifyContent: 'space-between',
    },
    restaurantContainer: {
      flex: 1,
      gap: 4,
    },
    restaurantName: {
      color: colors.text,
      fontSize: 18,
      fontWeight: '800',
    },
    orderDate: {
      color: colors.textMuted,
      fontSize: 13,
    },
    statusBadge: {
      backgroundColor: colors.primarySoft,
      borderRadius: 999,
      paddingHorizontal: 10,
      paddingVertical: 6,
    },
    statusText: {
      color: colors.primary,
      fontSize: 12,
      fontWeight: '800',
    },
    cardFooter: {
      alignItems: 'center',
      flexDirection: 'row',
      justifyContent: 'space-between',
    },
    itemCount: {
      color: colors.textMuted,
      fontSize: 14,
      fontWeight: '700',
    },
    totalPrice: {
      color: colors.primary,
      fontSize: 19,
      fontWeight: '800',
    },
    orderId: {
      color: colors.textMuted,
      fontSize: 12,
    },
  });
}
