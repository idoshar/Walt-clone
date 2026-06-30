import { StatusBar } from 'expo-status-bar';
import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { createOrder } from '../api/orders';
import { useAuth } from '../auth/AuthContext';
import { useCart } from '../cart/CartContext';
import ThemeToggle from '../components/ThemeToggle';
import { useCurrency } from '../currency/CurrencyContext';
import {
  LOCATION_STATUS,
  requestCurrentLocation,
} from '../location/locationService';
import { useAppTheme } from '../theme/ThemeContext';

function getUserText(user, field) {
  return typeof user?.[field] === 'string'
    ? user[field]
    : '';
}

function createInitialDeliveryDetails(user) {
  return {
    recipientName: getUserText(user, 'fullName'),
    phone: getUserText(user, 'phone'),
    address: getUserText(user, 'address'),
    dinerCount: '1',
    notes: '',
  };
}

function normalizeRequiredText(value, maximumLength) {
  const normalizedValue = String(value || '')
    .trim()
    .replace(/\s+/g, ' ');

  if (!normalizedValue || normalizedValue.length > maximumLength) {
    return '';
  }

  return normalizedValue;
}

function isValidCoordinatePair(latitude, longitude) {
  return (
    Number.isFinite(latitude) &&
    Number.isFinite(longitude) &&
    latitude >= -90 &&
    latitude <= 90 &&
    longitude >= -180 &&
    longitude <= 180
  );
}

function validateDeliveryDetails(deliveryDetails, sharedLocation) {
  const recipientName = normalizeRequiredText(
    deliveryDetails.recipientName,
    100
  );

  if (!recipientName) {
    return {
      error: 'Enter a recipient name of up to 100 characters.',
    };
  }

  const phone = normalizeRequiredText(deliveryDetails.phone, 40);

  if (!phone) {
    return {
      error: 'Enter a phone number of up to 40 characters.',
    };
  }

  const address = normalizeRequiredText(deliveryDetails.address, 240);

  const dinerCount = Number(deliveryDetails.dinerCount);

  if (
    !Number.isSafeInteger(dinerCount) ||
    dinerCount < 1 ||
    dinerCount > 99
  ) {
    return {
      error: 'Number of diners must be a whole number between 1 and 99.',
    };
  }

  const notes = String(deliveryDetails.notes || '').trim();

  if (notes.length > 500) {
    return {
      error: 'Delivery notes cannot exceed 500 characters.',
    };
  }

  let location = null;

  if (sharedLocation) {
    const latitude = Number(sharedLocation.latitude);
    const longitude = Number(sharedLocation.longitude);

    if (!isValidCoordinatePair(latitude, longitude)) {
      return {
        error: 'The selected location is invalid. Enter an address manually and try again.',
      };
    }

    location = {
      latitude,
      longitude,
    };
  }

  if (!address && !location) {
    return {
      error:
        'Enter a delivery address or use your current location.',
    };
  }

  return {
    value: {
      recipientName,
      phone,
      address: location ? '' : address,
      dinerCount,
      notes,
      location,
    },
  };
}

export default function CheckoutScreen({ navigation, route }) {
  const { formatPrice } = useCurrency();
  const restaurantId = String(route.params?.restaurantId || '').trim();

  const { token, user } = useAuth();
  const { items, clearRestaurantItems } = useCart();
  const { theme } = useAppTheme();

  const styles = useMemo(() => createStyles(theme.colors), [theme.colors]);

  const [submitState, setSubmitState] = useState('idle');
  const [message, setMessage] = useState('');
  const [createdOrder, setCreatedOrder] = useState(null);
  const [confirmedRestaurantName, setConfirmedRestaurantName] = useState('');

  const [deliveryDetails, setDeliveryDetails] = useState(() =>
    createInitialDeliveryDetails(user)
  );
  const [sharedLocation, setSharedLocation] = useState(null);
  const [isLocationLoading, setIsLocationLoading] = useState(false);
  const [locationNotice, setLocationNotice] = useState(null);

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

  function updateDeliveryField(field, value) {
    setDeliveryDetails((currentDetails) => ({
      ...currentDetails,
      [field]: value,
    }));

    setMessage('');
    setSubmitState('idle');
  }

  async function handleUseCurrentLocation() {
    if (isSubmitting || isLocationLoading) {
      return;
    }

    setIsLocationLoading(true);
    setLocationNotice(null);

    try {
      const result = await requestCurrentLocation();

      if (
        result.status !== LOCATION_STATUS.AVAILABLE ||
        !result.coordinates
      ) {
        setSharedLocation(null);
        setLocationNotice({
          tone: 'error',
          text:
            result.message ||
            'Location is unavailable. You can still place the order without it.',
        });
        return;
      }

      const latitude = Number(result.coordinates.latitude);
      const longitude = Number(result.coordinates.longitude);

      if (!isValidCoordinatePair(latitude, longitude)) {
        setSharedLocation(null);
        setLocationNotice({
          tone: 'error',
          text:
            'The device returned an invalid location. You can still place the order without it.',
        });
        return;
      }

      setSharedLocation({
        latitude,
        longitude,
      });

      setLocationNotice({
        tone: 'success',
        text:
          'Using your current location for delivery. Choose Enter address manually to use a typed address instead.',
      });
    } finally {
      setIsLocationLoading(false);
    }
  }

  function handleRemoveSharedLocation() {
    setSharedLocation(null);
    setLocationNotice({
      tone: 'neutral',
      text:
        'Enter a delivery address manually. Your previous address text is still available.',
    });
  }

  async function handlePlaceOrder() {
    if (isSubmitting || restaurantItems.length === 0) {
      return;
    }

    const validatedDeliveryDetails = validateDeliveryDetails(
      deliveryDetails,
      sharedLocation
    );

    if (validatedDeliveryDetails.error) {
      setMessage(validatedDeliveryDetails.error);
      setSubmitState('error');
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
        deliveryDetails: validatedDeliveryDetails.value,
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

            <View style={styles.deliveryCard}>
              <View style={styles.deliveryHeading}>
                <View style={styles.deliveryHeadingText}>
                  <Text style={styles.sectionTitle}>Delivery details</Text>
                  <Text style={styles.sectionSubtitle}>
                    These details will be saved with this order.
                  </Text>
                </View>

                <Text style={styles.requiredLabel}>Required *</Text>
              </View>

              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>Recipient name *</Text>
                <TextInput
                  autoCapitalize="words"
                  editable={!isSubmitting}
                  maxLength={100}
                  onChangeText={(value) =>
                    updateDeliveryField('recipientName', value)
                  }
                  placeholder="Who should receive this order?"
                  placeholderTextColor={theme.colors.textMuted}
                  style={styles.input}
                  value={deliveryDetails.recipientName}
                />
              </View>

              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>Phone number *</Text>
                <TextInput
                  editable={!isSubmitting}
                  keyboardType="phone-pad"
                  maxLength={40}
                  onChangeText={(value) =>
                    updateDeliveryField('phone', value)
                  }
                  placeholder="050-1234567"
                  placeholderTextColor={theme.colors.textMuted}
                  style={styles.input}
                  value={deliveryDetails.phone}
                />
              </View>

              {!sharedLocation ? (
                <View style={styles.fieldGroup}>
                  <Text style={styles.fieldLabel}>Delivery address *</Text>
                  <TextInput
                    autoCapitalize="sentences"
                    editable={!isSubmitting}
                    maxLength={240}
                    onChangeText={(value) =>
                      updateDeliveryField('address', value)
                    }
                    placeholder="Street, building, city"
                    placeholderTextColor={theme.colors.textMuted}
                    style={styles.input}
                    value={deliveryDetails.address}
                  />
                </View>
              ) : null}

              <View style={styles.locationSection}>
                <View style={styles.locationHeading}>
                  <View style={styles.locationHeadingText}>
                    <Text style={styles.locationTitle}>
                      {sharedLocation
                        ? 'Using your current location'
                        : 'Current location'}
                    </Text>
                    <Text style={styles.locationDescription}>
                      {sharedLocation
                        ? 'This order will use your device location instead of a typed address.'
                        : 'Choose it instead of entering a delivery address manually.'}
                    </Text>
                  </View>

                  {sharedLocation ? (
                    <Pressable
                      disabled={isSubmitting}
                      onPress={handleRemoveSharedLocation}
                      style={({ pressed }) => [
                        styles.removeLocationButton,
                        isSubmitting ? styles.disabledButton : null,
                        pressed && !isSubmitting
                          ? styles.pressedButton
                          : null,
                      ]}
                    >
                      <Text style={styles.removeLocationButtonText}>
                        Enter address manually
                      </Text>
                    </Pressable>
                  ) : (
                    <Pressable
                      disabled={isSubmitting || isLocationLoading}
                      onPress={handleUseCurrentLocation}
                      style={({ pressed }) => [
                        styles.locationButton,
                        isSubmitting || isLocationLoading
                          ? styles.disabledButton
                          : null,
                        pressed &&
                        !isSubmitting &&
                        !isLocationLoading
                          ? styles.pressedButton
                          : null,
                      ]}
                    >
                      <Text style={styles.locationButtonText}>
                        {isLocationLoading
                          ? 'Getting location...'
                          : 'Use my location'}
                      </Text>
                    </Pressable>
                  )}
                </View>

                {sharedLocation ? (
                  <Text style={styles.locationCoordinates}>
                    Your current location will be saved with this order.
                  </Text>
                ) : null}

                {locationNotice ? (
                  <View
                    style={[
                      styles.locationNotice,
                      locationNotice.tone === 'success'
                        ? styles.locationNoticeSuccess
                        : null,
                      locationNotice.tone === 'error'
                        ? styles.locationNoticeError
                        : null,
                      locationNotice.tone === 'neutral'
                        ? styles.locationNoticeNeutral
                        : null,
                    ]}
                  >
                    <Text style={styles.locationNoticeText}>
                      {locationNotice.text}
                    </Text>
                  </View>
                ) : null}
              </View>

              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>Number of diners *</Text>
                <TextInput
                  editable={!isSubmitting}
                  keyboardType="number-pad"
                  maxLength={2}
                  onChangeText={(value) =>
                    updateDeliveryField('dinerCount', value)
                  }
                  placeholder="1"
                  placeholderTextColor={theme.colors.textMuted}
                  style={styles.input}
                  value={deliveryDetails.dinerCount}
                />
              </View>

              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>Delivery notes</Text>
                <TextInput
                  autoCapitalize="sentences"
                  editable={!isSubmitting}
                  maxLength={500}
                  multiline
                  onChangeText={(value) =>
                    updateDeliveryField('notes', value)
                  }
                  placeholder="Entrance, floor, door code, or other helpful details"
                  placeholderTextColor={theme.colors.textMuted}
                  style={[styles.input, styles.notesInput]}
                  textAlignVertical="top"
                  value={deliveryDetails.notes}
                />
                <Text style={styles.characterCount}>
                  {deliveryDetails.notes.length}/500 characters
                </Text>
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
    deliveryCard: {
      backgroundColor: colors.surface,
      borderColor: colors.border,
      borderRadius: 16,
      borderWidth: 1,
      gap: 14,
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
    sectionSubtitle: {
      color: colors.textMuted,
      fontSize: 13,
      lineHeight: 19,
    },
    requiredLabel: {
      color: colors.primary,
      fontSize: 12,
      fontWeight: '800',
      paddingTop: 2,
    },
    fieldGroup: {
      gap: 6,
    },
    fieldLabel: {
      color: colors.text,
      fontSize: 14,
      fontWeight: '800',
    },
    input: {
      backgroundColor: colors.background,
      borderColor: colors.border,
      borderRadius: 12,
      borderWidth: 1,
      color: colors.text,
      fontSize: 15,
      minHeight: 48,
      paddingHorizontal: 13,
      paddingVertical: 11,
    },
    notesInput: {
      minHeight: 92,
    },
    characterCount: {
      color: colors.textMuted,
      fontSize: 12,
      textAlign: 'right',
    },
    locationSection: {
      backgroundColor: colors.primarySoft,
      borderColor: colors.border,
      borderRadius: 12,
      borderWidth: 1,
      gap: 10,
      padding: 13,
    },
    locationHeading: {
      alignItems: 'flex-start',
      flexDirection: 'row',
      gap: 12,
      justifyContent: 'space-between',
    },
    locationHeadingText: {
      flex: 1,
      gap: 3,
    },
    locationTitle: {
      color: colors.text,
      fontSize: 14,
      fontWeight: '800',
    },
    locationDescription: {
      color: colors.textMuted,
      fontSize: 12,
      lineHeight: 18,
    },
    locationButton: {
      alignItems: 'center',
      backgroundColor: colors.primary,
      borderRadius: 9,
      justifyContent: 'center',
      minHeight: 37,
      paddingHorizontal: 10,
    },
    locationButtonText: {
      color: colors.onPrimary || '#ffffff',
      fontSize: 12,
      fontWeight: '800',
    },
    removeLocationButton: {
      alignItems: 'center',
      borderColor: colors.primary,
      borderRadius: 9,
      borderWidth: 1,
      justifyContent: 'center',
      minHeight: 37,
      paddingHorizontal: 10,
    },
    removeLocationButtonText: {
      color: colors.primary,
      fontSize: 12,
      fontWeight: '800',
    },
    locationCoordinates: {
      color: colors.primary,
      fontSize: 12,
      fontWeight: '800',
    },
    locationNotice: {
      borderRadius: 9,
      padding: 10,
    },
    locationNoticeSuccess: {
      backgroundColor: colors.surface,
    },
    locationNoticeError: {
      backgroundColor: colors.dangerSoft || colors.surface,
    },
    locationNoticeNeutral: {
      backgroundColor: colors.surface,
    },
    locationNoticeText: {
      color: colors.textMuted,
      fontSize: 12,
      lineHeight: 18,
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
