import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import {
  deleteAdminRestaurant,
  getAdminRestaurant,
} from '../api/adminRestaurantModeration';
import { useAuth } from '../auth/AuthContext';
import AppCard from '../components/AppCard';
import { useAppTheme } from '../theme/ThemeContext';

function isProtectedRestaurant(restaurant) {
  return Boolean(
    restaurant?.isDefault || restaurant?.isModerationProtected === true
  );
}

export default function AdminRestaurantManagementScreen({
  navigation,
  route,
}) {
  const { token } = useAuth();
  const { theme } = useAppTheme();
  const styles = useMemo(() => createStyles(theme.colors), [theme.colors]);

  const restaurantId = route.params?.restaurantId;
  const initialRestaurant = route.params?.restaurant || null;

  const [restaurant, setRestaurant] = useState(initialRestaurant);
  const [loadState, setLoadState] = useState(
    initialRestaurant ? 'success' : 'loading'
  );
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState('');

  const loadRestaurant = useCallback(
    async ({ refreshing = false } = {}) => {
      if (!restaurantId) {
        setLoadState('error');
        setError('Restaurant information is missing.');
        return;
      }

      if (refreshing) {
        setIsRefreshing(true);
      } else {
        setLoadState('loading');
      }

      setError('');

      try {
        const data = await getAdminRestaurant(restaurantId, token);
        setRestaurant(data || null);
        setLoadState('success');
      } catch (loadError) {
        setLoadState('error');
        setError(loadError.message || 'Could not load this restaurant.');
      } finally {
        setIsRefreshing(false);
      }
    },
    [restaurantId, token]
  );

  useEffect(() => {
    loadRestaurant();
  }, [loadRestaurant]);

  useEffect(() => {
    navigation.setOptions({
      title: restaurant?.name || 'Restaurant management',
    });
  }, [navigation, restaurant?.name]);

  function openRoute(name, params) {
    navigation.navigate(name, params);
  }

  function confirmDelete() {
    if (!restaurant || isProtectedRestaurant(restaurant)) {
      return;
    }

    Alert.alert(
      'Delete restaurant?',
      `"${restaurant.name}" and all of its menu categories and products will be deleted. Existing order snapshots will remain.`,
      [
        { style: 'cancel', text: 'Cancel' },
        {
          style: 'destructive',
          text: 'Delete',
          onPress: () => {
            void deleteRestaurant();
          },
        },
      ]
    );
  }

  async function deleteRestaurant() {
    if (!restaurant) {
      return;
    }

    setIsDeleting(true);
    setError('');

    try {
      await deleteAdminRestaurant(restaurant.id, token);
      navigation.goBack();
    } catch (deleteError) {
      setError(deleteError.message || 'Could not delete the restaurant.');
      setIsDeleting(false);
    }
  }

  if (loadState === 'loading') {
    return (
      <SafeAreaView style={styles.center}>
        <ActivityIndicator color={theme.colors.primary} size="large" />
        <Text style={styles.stateText}>Loading restaurant management...</Text>
      </SafeAreaView>
    );
  }

  if (loadState === 'error' || !restaurant) {
    return (
      <SafeAreaView style={styles.center}>
        <Text style={styles.errorTitle}>Could not load restaurant</Text>
        <Text style={styles.errorText}>{error || 'Restaurant not found.'}</Text>
        <Pressable
          onPress={() => loadRestaurant()}
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

  const protectedRestaurant = isProtectedRestaurant(restaurant);

  const actions = [
    {
      title: 'Edit restaurant details',
      description: 'Update the restaurant name, address, contact details and image.',
      onPress: () =>
        openRoute('RestaurantForm', {
          adminMode: true,
          restaurant: {
            ...restaurant,
            accessRole: 'admin',
          },
        }),
    },
    {
      title: 'Manage menu items',
      description: 'Add, edit and remove dishes from this restaurant menu.',
      onPress: () =>
        openRoute('RestaurantProducts', {
          restaurantId: restaurant.id,
          restaurantName: restaurant.name,
        }),
    },
    {
      title: 'Manage menu categories',
      description: 'Create, reorder and maintain menu categories.',
      onPress: () =>
        openRoute('MenuCategoryManagement', {
          restaurantId: restaurant.id,
          restaurantName: restaurant.name,
        }),
    },
    {
      title: 'View sales statistics',
      description: 'Review orders, revenue and top-selling menu items.',
      onPress: () =>
        openRoute('RestaurantSalesStatistics', {
          restaurantId: restaurant.id,
          restaurantName: restaurant.name,
        }),
    },
    {
      title: 'Manage team access',
      description:
        'Add or remove editors. Ownership transfer remains restricted to the restaurant owner.',
      onPress: () =>
        openRoute('RestaurantAccess', {
          adminMode: true,
          restaurant: {
            ...restaurant,
            accessRole: 'admin',
          },
        }),
    },
  ];

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={() => loadRestaurant({ refreshing: true })}
            tintColor={theme.colors.primary}
          />
        }
      >
        <View style={styles.header}>
          <Text style={styles.eyebrow}>ADMINISTRATION</Text>
          <Text style={styles.title}>{restaurant.name}</Text>
          <Text style={styles.subtitle}>
            Manage this restaurant on behalf of the platform. This does not add
            it to your personal restaurant-management list.
          </Text>
        </View>

        {protectedRestaurant ? (
          <View style={styles.protectedBox}>
            <Text style={styles.protectedTitle}>Deletion protected</Text>
            <Text style={styles.protectedText}>
              This system catalog restaurant can be managed, but it cannot be
              deleted.
            </Text>
          </View>
        ) : null}

        {error ? (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        <AppCard style={styles.restaurantCard}>
          <Text style={styles.restaurantName}>{restaurant.name}</Text>
          <Text style={styles.restaurantMeta}>
            {restaurant.cuisine || 'Cuisine not specified'}
            {restaurant.address ? ` · ${restaurant.address}` : ''}
          </Text>
          <Text style={styles.restaurantDescription}>
            {restaurant.description || 'No restaurant description was provided.'}
          </Text>
        </AppCard>

        <View style={styles.actions}>
          {actions.map((action) => (
            <Pressable
              key={action.title}
              onPress={action.onPress}
              style={({ pressed }) => [
                styles.actionCard,
                pressed ? styles.pressed : null,
              ]}
            >
              <View style={styles.actionText}>
                <Text style={styles.actionTitle}>{action.title}</Text>
                <Text style={styles.actionDescription}>
                  {action.description}
                </Text>
              </View>
              <Text style={styles.actionArrow}>›</Text>
            </Pressable>
          ))}
        </View>

        {!protectedRestaurant ? (
          <Pressable
            disabled={isDeleting}
            onPress={confirmDelete}
            style={({ pressed }) => [
              styles.deleteButton,
              isDeleting ? styles.disabled : null,
              pressed && !isDeleting ? styles.pressed : null,
            ]}
          >
            <Text style={styles.deleteButtonText}>
              {isDeleting ? 'Deleting restaurant...' : 'Delete restaurant'}
            </Text>
          </Pressable>
        ) : null}
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
    content: { gap: 16, padding: 20, paddingBottom: 42 },
    stateText: { color: colors.textMuted, fontSize: 15 },
    header: { gap: 7 },
    eyebrow: {
      color: colors.primary,
      fontSize: 12,
      fontWeight: '800',
      letterSpacing: 1.1,
    },
    title: { color: colors.text, fontSize: 28, fontWeight: '800' },
    subtitle: { color: colors.textMuted, fontSize: 15, lineHeight: 22 },
    restaurantCard: { gap: 6, padding: 17 },
    restaurantName: { color: colors.text, fontSize: 18, fontWeight: '800' },
    restaurantMeta: { color: colors.primary, fontSize: 13, fontWeight: '700' },
    restaurantDescription: { color: colors.textMuted, fontSize: 13, lineHeight: 19 },
    protectedBox: {
      backgroundColor: colors.primarySoft,
      borderColor: colors.border,
      borderRadius: 14,
      borderWidth: 1,
      gap: 4,
      padding: 14,
    },
    protectedTitle: { color: colors.primary, fontSize: 14, fontWeight: '800' },
    protectedText: { color: colors.text, fontSize: 13, lineHeight: 19 },
    errorBox: {
      backgroundColor: colors.dangerSoft || '#321b1b',
      borderColor: colors.danger || '#ff8a80',
      borderRadius: 12,
      borderWidth: 1,
      padding: 13,
    },
    errorTitle: { color: colors.text, fontSize: 20, fontWeight: '800' },
    errorText: {
      color: colors.danger || '#ff8a80',
      fontSize: 14,
      lineHeight: 20,
      textAlign: 'center',
    },
    actions: { gap: 10 },
    actionCard: {
      alignItems: 'center',
      backgroundColor: colors.surface,
      borderColor: colors.border,
      borderRadius: 14,
      borderWidth: 1,
      flexDirection: 'row',
      gap: 12,
      padding: 15,
    },
    actionText: { flex: 1, gap: 4, minWidth: 0 },
    actionTitle: { color: colors.text, fontSize: 16, fontWeight: '800' },
    actionDescription: { color: colors.textMuted, fontSize: 13, lineHeight: 18 },
    actionArrow: { color: colors.primary, fontSize: 28, lineHeight: 28 },
    primaryButton: {
      alignItems: 'center',
      backgroundColor: colors.primary,
      borderRadius: 12,
      justifyContent: 'center',
      paddingHorizontal: 16,
      paddingVertical: 12,
    },
    primaryButtonText: { color: '#FFFFFF', fontSize: 14, fontWeight: '800' },
    deleteButton: {
      alignItems: 'center',
      backgroundColor: colors.danger || '#d33a32',
      borderRadius: 12,
      justifyContent: 'center',
      minHeight: 48,
      paddingHorizontal: 16,
    },
    deleteButtonText: { color: '#FFFFFF', fontSize: 14, fontWeight: '800' },
    disabled: { opacity: 0.5 },
    pressed: { opacity: 0.72 },
  });
}
