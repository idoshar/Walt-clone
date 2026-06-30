import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import {
  getAdminRestaurants,
  replaceAdminSponsorshipOrder,
  updateAdminRestaurantSponsorship,
} from '../api/adminRestaurantModeration';
import { useAuth } from '../auth/AuthContext';
import AppCard from '../components/AppCard';
import { useAppTheme } from '../theme/ThemeContext';

function sortSponsoredRestaurants(restaurants) {
  return [...restaurants].sort((left, right) => {
    const leftRank = Number(left?.sponsoredRank);
    const rightRank = Number(right?.sponsoredRank);

    const normalizedLeftRank =
      Number.isInteger(leftRank) && leftRank > 0
        ? leftRank
        : Number.MAX_SAFE_INTEGER;

    const normalizedRightRank =
      Number.isInteger(rightRank) && rightRank > 0
        ? rightRank
        : Number.MAX_SAFE_INTEGER;

    if (normalizedLeftRank !== normalizedRightRank) {
      return normalizedLeftRank - normalizedRightRank;
    }

    return String(left?.name || '').localeCompare(String(right?.name || ''));
  });
}

function getRestaurantDescription(restaurant) {
  const details = [restaurant?.cuisine, restaurant?.address]
    .filter(Boolean)
    .join(' · ');

  return details || 'Restaurant details unavailable';
}

export default function AdminSponsoredPromotionsScreen() {
  const { token } = useAuth();
  const { theme } = useAppTheme();
  const styles = useMemo(() => createStyles(theme.colors), [theme.colors]);

  const [restaurants, setRestaurants] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [pendingKey, setPendingKey] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const isBusy = Boolean(pendingKey);

  const sponsoredRestaurants = useMemo(
    () =>
      sortSponsoredRestaurants(
        restaurants.filter((restaurant) => restaurant?.isSponsored === true)
      ),
    [restaurants]
  );

  const availableRestaurants = useMemo(
    () =>
      [...restaurants]
        .filter((restaurant) => restaurant?.isSponsored !== true)
        .sort((left, right) =>
          String(left?.name || '').localeCompare(String(right?.name || ''))
        ),
    [restaurants]
  );

  const loadRestaurants = useCallback(
    async ({ refreshing = false } = {}) => {
      if (refreshing) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }

      setError('');

      try {
        const data = await getAdminRestaurants(token);
        setRestaurants(Array.isArray(data) ? data : []);
      } catch (loadError) {
        setError(
          loadError.message ||
            'Could not load restaurants for sponsored promotion management.'
        );
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [token]
  );

  useEffect(() => {
    loadRestaurants();
  }, [loadRestaurants]);

  async function runAction(actionKey, callback, successMessage) {
    setPendingKey(actionKey);
    setError('');
    setNotice('');

    try {
      await callback();
      await loadRestaurants({ refreshing: true });
      setNotice(successMessage);
    } catch (actionError) {
      setError(actionError.message || 'Could not save sponsored placements.');
    } finally {
      setPendingKey('');
    }
  }

  function addSponsoredRestaurant(restaurant) {
    const rank = sponsoredRestaurants.length + 1;

    void runAction(
      `add:${restaurant.id}`,
      () =>
        updateAdminRestaurantSponsorship(
          restaurant.id,
          {
            isSponsored: true,
            sponsoredRank: rank,
          },
          token
        ),
      `${restaurant.name} was added to sponsored placements.`
    );
  }

  function removeSponsoredRestaurant(restaurant) {
    void runAction(
      `remove:${restaurant.id}`,
      () =>
        updateAdminRestaurantSponsorship(
          restaurant.id,
          {
            isSponsored: false,
          },
          token
        ),
      `${restaurant.name} was removed from sponsored placements.`
    );
  }

  function moveSponsoredRestaurant(index, direction) {
    const targetIndex = index + direction;

    if (
      targetIndex < 0 ||
      targetIndex >= sponsoredRestaurants.length ||
      isBusy
    ) {
      return;
    }

    const nextOrder = [...sponsoredRestaurants];
    const [restaurant] = nextOrder.splice(index, 1);
    nextOrder.splice(targetIndex, 0, restaurant);

    void runAction(
      `order:${restaurant.id}`,
      () =>
        replaceAdminSponsorshipOrder(
          nextOrder.map((item) => item.id),
          token
        ),
      'Sponsored placement order was updated.'
    );
  }

  if (isLoading) {
    return (
      <SafeAreaView style={styles.center}>
        <ActivityIndicator color={theme.colors.primary} size="large" />
        <Text style={styles.stateText}>Loading sponsored promotions...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={() => loadRestaurants({ refreshing: true })}
            tintColor={theme.colors.primary}
          />
        }
      >
        <View style={styles.header}>
          <Text style={styles.eyebrow}>ADMINISTRATION</Text>
          <Text style={styles.title}>Sponsored promotions</Text>
          <Text style={styles.subtitle}>
            Choose which restaurants appear in sponsored placements and control
            their automatic rotation order.
          </Text>
        </View>

        {notice ? (
          <View style={styles.noticeBox}>
            <Text style={styles.noticeText}>{notice}</Text>
          </View>
        ) : null}

        {error ? (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        <View style={styles.summaryRow}>
          <AppCard style={styles.summaryCard}>
            <Text style={styles.summaryNumber}>{sponsoredRestaurants.length}</Text>
            <Text style={styles.summaryLabel}>Sponsored restaurants</Text>
          </AppCard>

          <AppCard style={styles.summaryCard}>
            <Text style={styles.summaryNumber}>{availableRestaurants.length}</Text>
            <Text style={styles.summaryLabel}>Available to promote</Text>
          </AppCard>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Live sponsored order</Text>
          <Text style={styles.sectionDescription}>
            The homepage rotates through this list automatically, from top to
            bottom.
          </Text>

          {sponsoredRestaurants.length === 0 ? (
            <AppCard style={styles.emptyCard}>
              <Text style={styles.emptyTitle}>No sponsored restaurants yet</Text>
              <Text style={styles.emptyText}>
                Add a restaurant below to start a sponsored placement campaign.
              </Text>
            </AppCard>
          ) : (
            <View style={styles.list}>
              {sponsoredRestaurants.map((restaurant, index) => (
                <AppCard key={restaurant.id} style={styles.restaurantCard}>
                  <View style={styles.rankBadge}>
                    <Text style={styles.rankBadgeText}>{index + 1}</Text>
                  </View>

                  <View style={styles.restaurantText}>
                    <Text numberOfLines={1} style={styles.restaurantName}>
                      {restaurant.name}
                    </Text>
                    <Text
                      numberOfLines={1}
                      style={styles.restaurantDescription}
                    >
                      {getRestaurantDescription(restaurant)}
                    </Text>
                  </View>

                  <View style={styles.cardActions}>
                    <Pressable
                      accessibilityLabel={`Move ${restaurant.name} up`}
                      disabled={isBusy || index === 0}
                      onPress={() => moveSponsoredRestaurant(index, -1)}
                      style={({ pressed }) => [
                        styles.orderButton,
                        isBusy || index === 0 ? styles.disabled : null,
                        pressed && !isBusy && index > 0 ? styles.pressed : null,
                      ]}
                    >
                      <Text style={styles.orderButtonText}>↑</Text>
                    </Pressable>

                    <Pressable
                      accessibilityLabel={`Move ${restaurant.name} down`}
                      disabled={
                        isBusy || index === sponsoredRestaurants.length - 1
                      }
                      onPress={() => moveSponsoredRestaurant(index, 1)}
                      style={({ pressed }) => [
                        styles.orderButton,
                        isBusy || index === sponsoredRestaurants.length - 1
                          ? styles.disabled
                          : null,
                        pressed &&
                        !isBusy &&
                        index < sponsoredRestaurants.length - 1
                          ? styles.pressed
                          : null,
                      ]}
                    >
                      <Text style={styles.orderButtonText}>↓</Text>
                    </Pressable>

                    <Pressable
                      disabled={isBusy}
                      onPress={() => removeSponsoredRestaurant(restaurant)}
                      style={({ pressed }) => [
                        styles.removeButton,
                        isBusy ? styles.disabled : null,
                        pressed && !isBusy ? styles.pressed : null,
                      ]}
                    >
                      <Text style={styles.removeButtonText}>
                        {pendingKey === `remove:${restaurant.id}`
                          ? 'Removing...'
                          : 'Remove'}
                      </Text>
                    </Pressable>
                  </View>
                </AppCard>
              ))}
            </View>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Available restaurants</Text>
          <Text style={styles.sectionDescription}>
            Add a restaurant to place it at the end of the live sponsored order.
          </Text>

          {availableRestaurants.length === 0 ? (
            <AppCard style={styles.emptyCard}>
              <Text style={styles.emptyTitle}>Every restaurant is sponsored</Text>
              <Text style={styles.emptyText}>
                Remove an existing placement to make a restaurant available here.
              </Text>
            </AppCard>
          ) : (
            <View style={styles.list}>
              {availableRestaurants.map((restaurant) => (
                <AppCard key={restaurant.id} style={styles.restaurantCard}>
                  <View style={styles.restaurantText}>
                    <Text numberOfLines={1} style={styles.restaurantName}>
                      {restaurant.name}
                    </Text>
                    <Text
                      numberOfLines={1}
                      style={styles.restaurantDescription}
                    >
                      {getRestaurantDescription(restaurant)}
                    </Text>
                  </View>

                  <Pressable
                    disabled={isBusy}
                    onPress={() => addSponsoredRestaurant(restaurant)}
                    style={({ pressed }) => [
                      styles.addButton,
                      isBusy ? styles.disabled : null,
                      pressed && !isBusy ? styles.pressed : null,
                    ]}
                  >
                    <Text style={styles.addButtonText}>
                      {pendingKey === `add:${restaurant.id}` ? 'Adding...' : 'Add'}
                    </Text>
                  </Pressable>
                </AppCard>
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function createStyles(colors) {
  return StyleSheet.create({
    safeArea: { backgroundColor: colors.background, flex: 1 },
    center: {
      alignItems: 'center',
      backgroundColor: colors.background,
      flex: 1,
      gap: 12,
      justifyContent: 'center',
      padding: 24,
    },
    stateText: { color: colors.textMuted, fontSize: 15 },
    content: { gap: 18, padding: 20, paddingBottom: 42 },
    header: { gap: 7 },
    eyebrow: {
      color: colors.primary,
      fontSize: 12,
      fontWeight: '800',
      letterSpacing: 1.1,
    },
    title: { color: colors.text, fontSize: 28, fontWeight: '800' },
    subtitle: { color: colors.textMuted, fontSize: 15, lineHeight: 22 },
    summaryRow: { flexDirection: 'row', gap: 12 },
    summaryCard: { flex: 1, gap: 4, padding: 16 },
    summaryNumber: { color: colors.primary, fontSize: 28, fontWeight: '800' },
    summaryLabel: { color: colors.textMuted, fontSize: 12, fontWeight: '700' },
    noticeBox: {
      backgroundColor: colors.primarySoft,
      borderColor: colors.border,
      borderRadius: 12,
      borderWidth: 1,
      padding: 13,
    },
    noticeText: { color: colors.text, fontSize: 14, fontWeight: '700' },
    errorBox: {
      backgroundColor: colors.dangerSoft || '#321b1b',
      borderColor: colors.danger || '#ff8a80',
      borderRadius: 12,
      borderWidth: 1,
      padding: 13,
    },
    errorText: { color: colors.danger || '#ff8a80', fontSize: 14, fontWeight: '700' },
    section: { gap: 8 },
    sectionTitle: { color: colors.text, fontSize: 21, fontWeight: '800' },
    sectionDescription: { color: colors.textMuted, fontSize: 14, lineHeight: 20 },
    list: { gap: 10 },
    restaurantCard: {
      alignItems: 'center',
      flexDirection: 'row',
      gap: 10,
      padding: 14,
    },
    restaurantText: { flex: 1, gap: 4, minWidth: 0 },
    restaurantName: { color: colors.text, fontSize: 16, fontWeight: '800' },
    restaurantDescription: { color: colors.textMuted, fontSize: 12 },
    rankBadge: {
      alignItems: 'center',
      backgroundColor: colors.primarySoft,
      borderRadius: 999,
      height: 30,
      justifyContent: 'center',
      width: 30,
    },
    rankBadgeText: { color: colors.primary, fontSize: 13, fontWeight: '800' },
    cardActions: { alignItems: 'center', flexDirection: 'row', gap: 6 },
    orderButton: {
      alignItems: 'center',
      borderColor: colors.border,
      borderRadius: 9,
      borderWidth: 1,
      height: 34,
      justifyContent: 'center',
      width: 34,
    },
    orderButtonText: { color: colors.text, fontSize: 18, fontWeight: '800' },
    addButton: {
      alignItems: 'center',
      backgroundColor: colors.primary,
      borderRadius: 10,
      justifyContent: 'center',
      minHeight: 38,
      paddingHorizontal: 14,
    },
    addButtonText: { color: '#FFFFFF', fontSize: 13, fontWeight: '800' },
    removeButton: {
      alignItems: 'center',
      borderColor: colors.danger || '#ff8a80',
      borderRadius: 10,
      borderWidth: 1,
      justifyContent: 'center',
      minHeight: 38,
      paddingHorizontal: 12,
    },
    removeButtonText: {
      color: colors.danger || '#ff8a80',
      fontSize: 13,
      fontWeight: '800',
    },
    emptyCard: { gap: 5, padding: 16 },
    emptyTitle: { color: colors.text, fontSize: 16, fontWeight: '800' },
    emptyText: { color: colors.textMuted, fontSize: 13, lineHeight: 19 },
    disabled: { opacity: 0.45 },
    pressed: { opacity: 0.72 },
  });
}
