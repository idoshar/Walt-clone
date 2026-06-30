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

import { getAdminRestaurants } from '../api/adminRestaurantModeration';
import { useAuth } from '../auth/AuthContext';
import AppCard from '../components/AppCard';
import { useAppTheme } from '../theme/ThemeContext';

function getOwnershipLabel(restaurant) {
  if (restaurant?.isModerationProtected === true || restaurant?.isDefault) {
    return 'System catalog';
  }

  return restaurant?.ownerId ? 'User-owned' : 'No assigned owner';
}

export default function AdminRestaurantModerationScreen({ navigation }) {
  const { token } = useAuth();
  const { theme } = useAppTheme();
  const styles = useMemo(() => createStyles(theme.colors), [theme.colors]);

  const [restaurants, setRestaurants] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState('');

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
            'Could not load restaurants for administrator moderation.'
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

  if (isLoading) {
    return (
      <SafeAreaView style={styles.center}>
        <ActivityIndicator color={theme.colors.primary} size="large" />
        <Text style={styles.stateText}>Loading restaurant moderation...</Text>
      </SafeAreaView>
    );
  }

  if (error && restaurants.length === 0) {
    return (
      <SafeAreaView style={styles.center}>
        <Text style={styles.errorTitle}>Could not load restaurants</Text>
        <Text style={styles.errorText}>{error}</Text>
        <Pressable
          onPress={() => loadRestaurants()}
          style={({ pressed }) => [
            styles.primaryButton,
            pressed ? styles.pressed : null,
          ]}
        >
          <Text style={styles.primaryButtonText}>Try again</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  const protectedCount = restaurants.filter(
    (restaurant) => restaurant?.isModerationProtected === true || restaurant?.isDefault
  ).length;

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
          <Text style={styles.title}>Restaurant moderation</Text>
          <Text style={styles.subtitle}>
            Open any platform restaurant to manage its details, menu,
            categories, statistics and team access.
          </Text>
        </View>

        {error ? (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        <View style={styles.summaryRow}>
          <AppCard style={styles.summaryCard}>
            <Text style={styles.summaryNumber}>{restaurants.length}</Text>
            <Text style={styles.summaryLabel}>Platform restaurants</Text>
          </AppCard>
          <AppCard style={styles.summaryCard}>
            <Text style={styles.summaryNumber}>{protectedCount}</Text>
            <Text style={styles.summaryLabel}>Deletion-protected entries</Text>
          </AppCard>
        </View>

        <View style={styles.list}>
          {restaurants.map((restaurant) => {
            const protectedRestaurant = Boolean(
              restaurant?.isModerationProtected === true || restaurant?.isDefault
            );

            return (
              <Pressable
                key={restaurant.id}
                onPress={() =>
                  navigation.navigate('AdminRestaurantManagement', {
                    restaurantId: restaurant.id,
                    restaurant,
                  })
                }
                style={({ pressed }) => [
                  styles.restaurantPressable,
                  pressed ? styles.pressed : null,
                ]}
              >
                <AppCard style={styles.restaurantCard}>
                  <View style={styles.restaurantText}>
                    <Text numberOfLines={1} style={styles.restaurantName}>
                      {restaurant.name}
                    </Text>
                    <Text numberOfLines={1} style={styles.restaurantDetails}>
                      {restaurant.cuisine || 'Cuisine not specified'} ·{' '}
                      {restaurant.address || 'Address not specified'}
                    </Text>
                    <Text style={styles.restaurantMeta}>
                      {Number(restaurant.productCount || 0)} menu item
                      {Number(restaurant.productCount || 0) === 1 ? '' : 's'} ·{' '}
                      {getOwnershipLabel(restaurant)}
                    </Text>
                    {protectedRestaurant ? (
                      <Text style={styles.protectedText}>Deletion protected</Text>
                    ) : null}
                  </View>

                  <View style={styles.manageButton}>
                    <Text style={styles.manageButtonText}>Manage</Text>
                  </View>
                </AppCard>
              </Pressable>
            );
          })}
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
    errorTitle: { color: colors.text, fontSize: 20, fontWeight: '800' },
    errorText: {
      color: colors.danger || '#ff8a80',
      fontSize: 14,
      lineHeight: 20,
      textAlign: 'center',
    },
    content: { gap: 16, padding: 20, paddingBottom: 42 },
    header: { gap: 7 },
    eyebrow: {
      color: colors.primary,
      fontSize: 12,
      fontWeight: '800',
      letterSpacing: 1.1,
    },
    title: { color: colors.text, fontSize: 29, fontWeight: '800' },
    subtitle: { color: colors.textMuted, fontSize: 15, lineHeight: 22 },
    errorBox: {
      backgroundColor: colors.dangerSoft || '#321b1b',
      borderColor: colors.danger || '#ff8a80',
      borderRadius: 12,
      borderWidth: 1,
      padding: 13,
    },
    summaryRow: { flexDirection: 'row', gap: 12 },
    summaryCard: { flex: 1, gap: 4, padding: 16 },
    summaryNumber: { color: colors.primary, fontSize: 28, fontWeight: '800' },
    summaryLabel: { color: colors.textMuted, fontSize: 12, fontWeight: '700' },
    list: { gap: 10 },
    restaurantPressable: { borderRadius: 14 },
    restaurantCard: {
      alignItems: 'center',
      flexDirection: 'row',
      gap: 12,
      padding: 15,
    },
    restaurantText: { flex: 1, gap: 4, minWidth: 0 },
    restaurantName: { color: colors.text, fontSize: 16, fontWeight: '800' },
    restaurantDetails: { color: colors.textMuted, fontSize: 12 },
    restaurantMeta: { color: colors.textMuted, fontSize: 12 },
    protectedText: { color: colors.primary, fontSize: 11, fontWeight: '800' },
    manageButton: {
      alignItems: 'center',
      backgroundColor: colors.primary,
      borderRadius: 10,
      justifyContent: 'center',
      minHeight: 38,
      paddingHorizontal: 12,
    },
    manageButtonText: { color: '#FFFFFF', fontSize: 13, fontWeight: '800' },
    primaryButton: {
      alignItems: 'center',
      backgroundColor: colors.primary,
      borderRadius: 12,
      justifyContent: 'center',
      paddingHorizontal: 16,
      paddingVertical: 12,
    },
    primaryButtonText: { color: '#FFFFFF', fontSize: 14, fontWeight: '800' },
    pressed: { opacity: 0.72 },
  });
}
