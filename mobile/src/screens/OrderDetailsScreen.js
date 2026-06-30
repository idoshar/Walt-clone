import { StatusBar } from 'expo-status-bar';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Pressable,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { cancelOrder, deleteOrder, getOrderById } from '../api/orders';
import { getProductsByRestaurant } from '../api/products';
import { useAuth } from '../auth/AuthContext';
import { useCart } from '../cart/CartContext';
import AppState from '../components/AppState';
import { useCurrency } from '../currency/CurrencyContext';
import { useAppTheme } from '../theme/ThemeContext';

function formatDate(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Date unavailable';
  return new Intl.DateTimeFormat('en-IL', {
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    month: 'long',
    year: 'numeric',
  }).format(date);
}

function formatStatus(status) {
  const s = String(status || 'created').trim();
  return s.charAt(0).toUpperCase() + s.slice(1);
}

// Orders that can still be cancelled or deleted by the customer
const CANCELLABLE_STATUSES = ['created'];
const DELETABLE_STATUSES = ['created', 'cancelled'];

function getStatusColor(status, colors) {
  switch (String(status).toLowerCase()) {
    case 'cancelled': return colors.danger || '#b00020';
    case 'delivered': return colors.success || '#22c55e';
    case 'confirmed':
    case 'preparing': return colors.warning || '#f59e0b';
    default: return colors.primary;
  }
}

function normalizeDisplayText(value) {
  return typeof value === 'string' ? value.trim() : '';
}

function hasValidSavedLocation(location) {
  const latitude = Number(location?.latitude);
  const longitude = Number(location?.longitude);

  return (
    Number.isFinite(latitude) &&
    Number.isFinite(longitude) &&
    latitude >= -90 &&
    latitude <= 90 &&
    longitude >= -180 &&
    longitude <= 180
  );
}

function getDeliverySnapshot(order) {
  const details = order?.deliveryDetails;

  if (!details || typeof details !== 'object') {
    return null;
  }

  const address = normalizeDisplayText(details.address);
  const hasLocation = hasValidSavedLocation(details.location);

  return {
    recipientName:
      normalizeDisplayText(details.recipientName) || 'Not available',
    phone: normalizeDisplayText(details.phone) || 'Not available',
    address,
    dinerCount: Number.isSafeInteger(Number(details.dinerCount))
      ? Number(details.dinerCount)
      : null,
    notes: normalizeDisplayText(details.notes),
    usesCurrentLocation: hasLocation && !address,
  };
}

function getReorderQuantity(value) {
  const quantity = Number(value);

  return Number.isSafeInteger(quantity) && quantity > 0
    ? quantity
    : null;
}

function getOrderItemName(item) {
  return normalizeDisplayText(item?.productName) || 'Menu item';
}

export default function OrderDetailsScreen({ navigation, route }) {
  const { formatPrice } = useCurrency();
  const orderId = String(route.params?.orderId || '').trim();

  const { token } = useAuth();
  const { replaceRestaurantItems } = useCart();
  const { theme } = useAppTheme();
  const styles = useMemo(() => createStyles(theme.colors), [theme.colors]);

  const [order, setOrder] = useState(null);
  const [requestState, setRequestState] = useState('loading');
  const [message, setMessage] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [cancelState, setCancelState] = useState('idle');
  const [deleteState, setDeleteState] = useState('idle');
  const [reorderState, setReorderState] = useState('idle');

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

  const handleReorder = useCallback(async () => {
    if (
      !order ||
      reorderState === 'loading' ||
      cancelState === 'loading' ||
      deleteState === 'loading'
    ) {
      return;
    }

    const restaurantId = String(order.restaurantId || '').trim();
    const previousItems = Array.isArray(order.items) ? order.items : [];

    if (!restaurantId || previousItems.length === 0) {
      Alert.alert(
        'Cannot reorder',
        'This order does not contain enough information to prepare a reorder.'
      );
      return;
    }

    setReorderState('loading');

    try {
      const currentProducts = await getProductsByRestaurant(restaurantId);

      const productsById = new Map(
        currentProducts
          .filter(
            (product) =>
              product?.id !== undefined &&
              product?.id !== null
          )
          .map((product) => [String(product.id), product])
      );

      const unavailableItems = previousItems.filter((item) => {
        const quantity = getReorderQuantity(item?.quantity);

        return (
          !quantity ||
          !productsById.has(String(item?.productId || ''))
        );
      });

      if (unavailableItems.length > 0) {
        const unavailableNames = unavailableItems
          .map(getOrderItemName)
          .join(', ');

        throw new Error(
          `These items are no longer available: ${unavailableNames}.`
        );
      }

      const restaurant = {
        id: restaurantId,
        name: order.restaurantName || 'Restaurant',
      };

      const productQuantities = previousItems.map((item) => ({
        product: productsById.get(String(item.productId)),
        quantity: getReorderQuantity(item.quantity),
      }));

      replaceRestaurantItems(restaurant, productQuantities);

      navigation.navigate('Cart');
    } catch (error) {
      Alert.alert(
        'Could not prepare reorder',
        error.message ||
          'We could not load current products and prices for this order.'
      );
    } finally {
      setReorderState('idle');
    }
  }, [
    cancelState,
    deleteState,
    navigation,
    order,
    reorderState,
    replaceRestaurantItems,
  ]);

  const handleCancel = useCallback(() => {
    if (!order) return;

    if (!CANCELLABLE_STATUSES.includes(order.status)) {
      Alert.alert(
        'Cannot cancel order',
        `This order is already "${formatStatus(order.status)}" and can no longer be cancelled.`
      );
      return;
    }

    Alert.alert(
      'Cancel order',
      'Are you sure you want to cancel this order?',
      [
        { text: 'Keep order', style: 'cancel' },
        {
          text: 'Cancel order',
          style: 'destructive',
          onPress: async () => {
            setCancelState('loading');
            try {
              await cancelOrder(orderId, token);
              // Reload to get updated status
              await loadOrder({ refreshing: true });
              setCancelState('idle');
            } catch (err) {
              setCancelState('idle');
              Alert.alert(
                'Could not cancel order',
                err.status === 403
                  ? 'You are not authorized to cancel this order.'
                  : err.message || 'Something went wrong. Please try again.'
              );
            }
          },
        },
      ]
    );
  }, [order, orderId, token, loadOrder]);

  const handleDelete = useCallback(() => {
    if (!order) return;

    if (!DELETABLE_STATUSES.includes(order.status)) {
      Alert.alert(
        'Cannot delete order',
        `Only orders with status "created" or "cancelled" can be deleted. This order is "${formatStatus(order.status)}".`
      );
      return;
    }

    Alert.alert(
      'Delete order',
      'This will permanently remove the order from your history. Continue?',
      [
        { text: 'Keep order', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setDeleteState('loading');
            try {
              await deleteOrder(orderId, token);
              // Go back to orders list after deletion
              navigation.goBack();
            } catch (err) {
              setDeleteState('idle');
              Alert.alert(
                'Could not delete order',
                err.status === 403
                  ? 'You are not authorized to delete this order.'
                  : err.message || 'Something went wrong. Please try again.'
              );
            }
          },
        },
      ]
    );
  }, [order, orderId, token, navigation]);

  const isCancelling = cancelState === 'loading';
  const isDeleting = deleteState === 'loading';
  const isReordering = reorderState === 'loading';
  const isBusy = isCancelling || isDeleting || isReordering;

  const canCancel = order && CANCELLABLE_STATUSES.includes(order.status);
  const canDelete = order && DELETABLE_STATUSES.includes(order.status);

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
            {/* Restaurant + status */}
            <View style={styles.restaurantCard}>
              <Text style={styles.restaurantLabel}>Ordered from</Text>
              <Text style={styles.restaurantName}>
                {order.restaurantName || 'Restaurant'}
              </Text>

              <View
                style={[
                  styles.statusBadge,
                  {
                    backgroundColor:
                      getStatusColor(order.status, theme.colors) + '22',
                  },
                ]}
              >
                <Text
                  style={[
                    styles.statusText,
                    { color: getStatusColor(order.status, theme.colors) },
                  ]}
                >
                  {formatStatus(order.status)}
                </Text>
              </View>
            </View>

            {/* Metadata */}
            <View style={styles.metadataCard}>
              <View style={styles.metadataRow}>
                <Text style={styles.metadataLabel}>Order date</Text>
                <Text style={styles.metadataValue}>
                  {formatDate(order.createdAt)}
                </Text>
              </View>
              <View style={styles.metadataRow}>
                <Text style={styles.metadataLabel}>Order id</Text>
                <Text numberOfLines={1} style={styles.metadataValue}>
                  {order.id}
                </Text>
              </View>
            </View>

            {/* Delivery snapshot */}
            <View style={styles.deliveryCard}>
              <View style={styles.deliveryHeading}>
                <View style={styles.deliveryHeadingText}>
                  <Text style={styles.sectionTitle}>Delivery details</Text>
                  <Text style={styles.deliverySubtitle}>
                    Saved when this order was placed.
                  </Text>
                </View>

                <View
                  style={[
                    styles.deliveryMethodBadge,
                    getDeliverySnapshot(order)?.usesCurrentLocation
                      ? styles.deliveryMethodBadgeLocation
                      : styles.deliveryMethodBadgeAddress,
                  ]}
                >
                  <Text
                    style={[
                      styles.deliveryMethodBadgeText,
                      getDeliverySnapshot(order)?.usesCurrentLocation
                        ? styles.deliveryMethodBadgeTextLocation
                        : styles.deliveryMethodBadgeTextAddress,
                    ]}
                  >
                    {getDeliverySnapshot(order)?.usesCurrentLocation
                      ? 'Current location'
                      : getDeliverySnapshot(order)
                        ? 'Manual address'
                        : 'Unavailable'}
                  </Text>
                </View>
              </View>

              {getDeliverySnapshot(order) ? (
                <>
                  <View style={styles.deliveryRow}>
                    <Text style={styles.deliveryLabel}>Recipient</Text>
                    <Text style={styles.deliveryValue}>
                      {getDeliverySnapshot(order).recipientName}
                    </Text>
                  </View>

                  <View style={styles.deliveryRow}>
                    <Text style={styles.deliveryLabel}>Phone</Text>
                    <Text style={styles.deliveryValue}>
                      {getDeliverySnapshot(order).phone}
                    </Text>
                  </View>

                  {getDeliverySnapshot(order).usesCurrentLocation ? (
                    <View style={styles.deliveryLocationNotice}>
                      <Text style={styles.deliveryLocationNoticeTitle}>
                        Current device location
                      </Text>
                      <Text style={styles.deliveryLocationNoticeText}>
                        The device location was saved with this order instead of a typed address.
                      </Text>
                    </View>
                  ) : (
                    <View style={styles.deliveryRow}>
                      <Text style={styles.deliveryLabel}>Address</Text>
                      <Text style={styles.deliveryValue}>
                        {getDeliverySnapshot(order).address || 'Not available'}
                      </Text>
                    </View>
                  )}

                  <View style={styles.deliveryRow}>
                    <Text style={styles.deliveryLabel}>Diners</Text>
                    <Text style={styles.deliveryValue}>
                      {getDeliverySnapshot(order).dinerCount || 'Not available'}
                    </Text>
                  </View>

                  {getDeliverySnapshot(order).notes ? (
                    <View style={styles.deliveryNotes}>
                      <Text style={styles.deliveryLabel}>Delivery notes</Text>
                      <Text style={styles.deliveryNotesValue}>
                        {getDeliverySnapshot(order).notes}
                      </Text>
                    </View>
                  ) : null}
                </>
              ) : (
                <Text style={styles.deliveryUnavailableText}>
                  Delivery details were not saved for this older order.
                </Text>
              )}
            </View>

            {/* Items */}
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
                        {Number(item.quantity || 0)} ×{' '}
                        {formatPrice(item.price)}
                      </Text>
                    </View>
                    <Text style={styles.itemPrice}>
                      {formatPrice(
                        Number(item.price || 0) * Number(item.quantity || 0)
                      )}
                    </Text>
                  </View>
                ))
              ) : (
                <Text style={styles.emptyItemsText}>No saved items found.</Text>
              )}

              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Total</Text>
                <Text style={styles.totalPrice}>
                  {formatPrice(order.totalPrice)}
                </Text>
              </View>
            </View>

            {/* Actions */}
            <View style={styles.actionsCard}>
              <Text style={styles.actionsTitle}>Order actions</Text>

              {/* Authorization note for non-cancellable orders */}
              {!canCancel && !canDelete ? (
                <View style={styles.authNote}>
                  <Text style={styles.authNoteText}>
                    ℹ️ This order cannot be modified. Only orders with status
                    "created" can be cancelled or deleted.
                  </Text>
                </View>
              ) : null}

              {/* Reorder */}
              <Pressable
                disabled={isBusy}
                onPress={handleReorder}
                style={({ pressed }) => [
                  styles.reorderButton,
                  isBusy ? styles.disabledButton : null,
                  pressed && !isBusy ? styles.pressedButton : null,
                ]}
              >
                <Text
                  style={[
                    styles.reorderButtonText,
                    isBusy ? styles.disabledText : null,
                  ]}
                >
                  {isReordering
                    ? 'Preparing reorder...'
                    : 'Reorder with current prices'}
                </Text>
              </Pressable>

              {/* Cancel */}
              <Pressable
                disabled={isBusy || !canCancel}
                onPress={handleCancel}
                style={({ pressed }) => [
                  styles.cancelButton,
                  !canCancel ? styles.disabledButton : null,
                  pressed && canCancel ? styles.pressedButton : null,
                ]}
              >
                <Text
                  style={[
                    styles.cancelButtonText,
                    !canCancel ? styles.disabledText : null,
                  ]}
                >
                  {isCancelling ? 'Cancelling...' : 'Cancel order'}
                </Text>
              </Pressable>

              {/* Delete */}
              <Pressable
                disabled={isBusy || !canDelete}
                onPress={handleDelete}
                style={({ pressed }) => [
                  styles.deleteButton,
                  !canDelete ? styles.disabledButton : null,
                  pressed && canDelete ? styles.pressedButton : null,
                ]}
              >
                <Text
                  style={[
                    styles.deleteButtonText,
                    !canDelete ? styles.disabledText : null,
                  ]}
                >
                  {isDeleting ? 'Deleting...' : 'Delete order'}
                </Text>
              </Pressable>
            </View>

            {/* Refresh */}
            <Pressable
              onPress={() => loadOrder({ refreshing: true })}
              style={({ pressed }) => [
                styles.refreshButton,
                pressed ? styles.pressedButton : null,
              ]}
            >
              <Text style={styles.refreshButtonText}>
                Refresh order status
              </Text>
            </Pressable>
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
    header: {
      alignItems: 'flex-start',
      flexDirection: 'row',
      gap: 16,
      justifyContent: 'space-between',
    },
    headerText: { flex: 1 },
    title: { color: colors.text, fontSize: 28, fontWeight: '800' },
    subtitle: { color: colors.textMuted, fontSize: 14, lineHeight: 20, marginTop: 4 },
    restaurantCard: {
      backgroundColor: colors.surface,
      borderColor: colors.border,
      borderRadius: 18,
      borderWidth: 1,
      gap: 8,
      padding: 18,
    },
    restaurantLabel: { color: colors.textMuted, fontSize: 13, fontWeight: '700' },
    restaurantName: { color: colors.text, fontSize: 22, fontWeight: '800' },
    statusBadge: {
      alignSelf: 'flex-start',
      borderRadius: 999,
      marginTop: 4,
      paddingHorizontal: 11,
      paddingVertical: 6,
    },
    statusText: { fontSize: 13, fontWeight: '800' },
    metadataCard: {
      backgroundColor: colors.surface,
      borderColor: colors.border,
      borderRadius: 18,
      borderWidth: 1,
      gap: 12,
      padding: 16,
    },
    metadataRow: { gap: 5 },
    metadataLabel: {
      color: colors.textMuted,
      fontSize: 12,
      fontWeight: '800',
      textTransform: 'uppercase',
    },
    metadataValue: { color: colors.text, fontSize: 14, fontWeight: '700' },
    deliveryCard: {
      backgroundColor: colors.surface,
      borderColor: colors.border,
      borderRadius: 18,
      borderWidth: 1,
      gap: 13,
      padding: 18,
    },
    deliveryHeading: {
      alignItems: 'flex-start',
      flexDirection: 'row',
      gap: 12,
      justifyContent: 'space-between',
    },
    deliveryHeadingText: {
      flex: 1,
      gap: 4,
    },
    deliverySubtitle: {
      color: colors.textMuted,
      fontSize: 13,
      lineHeight: 19,
    },
    deliveryMethodBadge: {
      borderRadius: 999,
      paddingHorizontal: 10,
      paddingVertical: 6,
    },
    deliveryMethodBadgeAddress: {
      backgroundColor: colors.primarySoft,
    },
    deliveryMethodBadgeLocation: {
      backgroundColor: colors.successSoft || colors.primarySoft,
    },
    deliveryMethodBadgeText: {
      fontSize: 12,
      fontWeight: '800',
    },
    deliveryMethodBadgeTextAddress: {
      color: colors.primary,
    },
    deliveryMethodBadgeTextLocation: {
      color: colors.success || colors.primary,
    },
    deliveryRow: {
      gap: 4,
    },
    deliveryLabel: {
      color: colors.textMuted,
      fontSize: 12,
      fontWeight: '800',
      textTransform: 'uppercase',
    },
    deliveryValue: {
      color: colors.text,
      fontSize: 15,
      fontWeight: '700',
      lineHeight: 21,
    },
    deliveryLocationNotice: {
      backgroundColor: colors.primarySoft,
      borderRadius: 12,
      gap: 4,
      padding: 13,
    },
    deliveryLocationNoticeTitle: {
      color: colors.primary,
      fontSize: 14,
      fontWeight: '800',
    },
    deliveryLocationNoticeText: {
      color: colors.textMuted,
      fontSize: 13,
      lineHeight: 19,
    },
    deliveryNotes: {
      borderTopColor: colors.border,
      borderTopWidth: 1,
      gap: 5,
      marginTop: 2,
      paddingTop: 13,
    },
    deliveryNotesValue: {
      color: colors.text,
      fontSize: 14,
      lineHeight: 21,
    },
    deliveryUnavailableText: {
      color: colors.textMuted,
      fontSize: 14,
      lineHeight: 20,
    },
    itemsCard: {
      backgroundColor: colors.surface,
      borderColor: colors.border,
      borderRadius: 18,
      borderWidth: 1,
      gap: 14,
      padding: 18,
    },
    sectionTitle: { color: colors.text, fontSize: 19, fontWeight: '800' },
    itemRow: {
      alignItems: 'center',
      flexDirection: 'row',
      gap: 12,
      justifyContent: 'space-between',
    },
    itemText: { flex: 1, gap: 3 },
    itemName: { color: colors.text, fontSize: 15, fontWeight: '800' },
    itemMeta: { color: colors.textMuted, fontSize: 13 },
    itemPrice: { color: colors.primary, fontSize: 15, fontWeight: '800' },
    emptyItemsText: { color: colors.textMuted, fontSize: 14 },
    totalRow: {
      alignItems: 'center',
      borderTopColor: colors.border,
      borderTopWidth: 1,
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginTop: 2,
      paddingTop: 14,
    },
    totalLabel: { color: colors.text, fontSize: 19, fontWeight: '800' },
    totalPrice: { color: colors.primary, fontSize: 23, fontWeight: '800' },
    actionsCard: {
      backgroundColor: colors.surface,
      borderColor: colors.border,
      borderRadius: 18,
      borderWidth: 1,
      gap: 12,
      padding: 18,
    },
    actionsTitle: { color: colors.text, fontSize: 17, fontWeight: '800' },
    authNote: {
      backgroundColor: colors.primarySoft,
      borderRadius: 10,
      padding: 12,
    },
    authNoteText: {
      color: colors.textMuted,
      fontSize: 13,
      lineHeight: 19,
    },
    reorderButton: {
      alignItems: 'center',
      backgroundColor: colors.primary,
      borderRadius: 12,
      justifyContent: 'center',
      minHeight: 48,
      paddingHorizontal: 18,
      paddingVertical: 12,
    },
    reorderButtonText: {
      color: '#ffffff',
      fontSize: 15,
      fontWeight: '800',
    },
    cancelButton: {
      alignItems: 'center',
      borderColor: colors.danger || '#b00020',
      borderRadius: 12,
      borderWidth: 1,
      justifyContent: 'center',
      minHeight: 48,
      paddingHorizontal: 18,
      paddingVertical: 12,
    },
    cancelButtonText: {
      color: colors.danger || '#b00020',
      fontSize: 15,
      fontWeight: '800',
    },
    deleteButton: {
      alignItems: 'center',
      backgroundColor: colors.danger || '#b00020',
      borderRadius: 12,
      justifyContent: 'center',
      minHeight: 48,
      paddingHorizontal: 18,
      paddingVertical: 12,
    },
    deleteButtonText: { color: '#fff', fontSize: 15, fontWeight: '800' },
    disabledButton: { opacity: 0.35 },
    disabledText: { opacity: 0.5 },
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
    refreshButtonText: { color: colors.primary, fontSize: 15, fontWeight: '800' },
    pressedButton: { opacity: 0.72 },
  });
}
