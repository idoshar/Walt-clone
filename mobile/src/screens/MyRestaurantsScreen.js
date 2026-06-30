import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { getMyRestaurants } from '../api/restaurants';
import { getRestaurantImage } from '../utils/restaurantImages';
import { useAuth } from '../auth/AuthContext';
import { useAppTheme } from '../theme/ThemeContext';

export default function MyRestaurantsScreen({ navigation }) {
  const { token } = useAuth();
  const { theme } = useAppTheme();
  const styles = useMemo(() => createStyles(theme.colors), [theme.colors]);

  const [restaurants, setRestaurants] = useState([]);
  const [loadState, setLoadState] = useState('loading');
  const [loadError, setLoadError] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);

  const loadRestaurants = useCallback(
    async ({ refreshing = false } = {}) => {
      if (refreshing) {
        setIsRefreshing(true);
      } else {
        setLoadState('loading');
        setLoadError('');
      }

      try {
        const data = await getMyRestaurants(token);
        setRestaurants(Array.isArray(data) ? data : []);
        setLoadState('success');
      } catch (err) {
        setLoadState('error');
        setLoadError(err.message || 'Failed to load your restaurants.');
      } finally {
        setIsRefreshing(false);
      }
    },
    [token]
  );

  useEffect(() => {
    loadRestaurants();
  }, [loadRestaurants]);

  // Refresh the list whenever we come back from the form screen
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      loadRestaurants({ refreshing: true });
    });
    return unsubscribe;
  }, [navigation, loadRestaurants]);

  const isLoading = loadState === 'loading';
  const isError = loadState === 'error';
  const isEmpty = loadState === 'success' && restaurants.length === 0;

  // ── Loading ──
  if (isLoading) {
    return (
      <SafeAreaView style={styles.center}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={styles.helperText}>Loading your restaurants...</Text>
      </SafeAreaView>
    );
  }

  // ── Error ──
  if (isError) {
    return (
      <SafeAreaView style={styles.center}>
        <Text style={styles.stateEmoji}>⚠️</Text>
        <Text style={styles.stateTitle}>Could not load restaurants</Text>
        <Text style={styles.errorText}>{loadError}</Text>
        <Pressable
          style={({ pressed }) => [
            styles.primaryButton,
            pressed ? styles.pressed : null,
          ]}
          onPress={() => loadRestaurants()}
        >
          <Text style={styles.primaryButtonText}>Try again</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  // ── Empty ──
  if (isEmpty) {
    return (
      <SafeAreaView style={styles.center}>
        <Text style={styles.stateEmoji}>🍽️</Text>
        <Text style={styles.stateTitle}>No restaurants yet</Text>
        <Text style={styles.helperText}>
          Create your first restaurant to get started.
        </Text>
        <Pressable
          style={({ pressed }) => [
            styles.primaryButton,
            pressed ? styles.pressed : null,
          ]}
          onPress={() => navigation.navigate('RestaurantForm')}
        >
          <Text style={styles.primaryButtonText}>+ Create restaurant</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  // ── List ──
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.screenTitle}>My Restaurants</Text>
          <Text style={styles.screenSubtitle}>
            {restaurants.length} restaurant{restaurants.length === 1 ? '' : 's'}
          </Text>
        </View>

        <Pressable
          style={({ pressed }) => [
            styles.addButton,
            pressed ? styles.pressed : null,
          ]}
          onPress={() => navigation.navigate('RestaurantForm')}
        >
          <Text style={styles.addButtonText}>+ Add</Text>
        </Pressable>
      </View>

      <FlatList
        data={restaurants}
        keyExtractor={(item) => String(item.id)}
        refreshing={isRefreshing}
        onRefresh={() => loadRestaurants({ refreshing: true })}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => (
          <View style={styles.card}>
            {/* Image */}
            <Image
              source={{ uri: getRestaurantImage(item) }}
              style={styles.restaurantImage}
              resizeMode="cover"
            />

            {/* Content */}
            <View style={styles.cardContent}>
              <View style={styles.cardTopRow}>
                <Text numberOfLines={1} style={styles.restaurantName}>
                  {item.name}
                </Text>

                <View style={styles.countBadge}>
                  <Text style={styles.countBadgeText}>
                    {item.productCount || 0} items
                  </Text>
                </View>
              </View>

              {item.cuisine ? (
                <Text style={styles.metaText}>{item.cuisine}</Text>
              ) : null}

              {item.address ? (
                <Text numberOfLines={1} style={styles.addressText}>
                  {item.address}
                </Text>
              ) : null}

              <View
                style={[
                  styles.roleBadge,
                  item.accessRole === 'editor'
                    ? styles.editorBadge
                    : styles.ownerBadge,
                ]}
              >
                <Text
                  style={[
                    styles.roleBadgeText,
                    item.accessRole === 'editor'
                      ? styles.editorBadgeText
                      : styles.ownerBadgeText,
                  ]}
                >
                  {item.accessRole === 'editor'
                    ? '✎ Editor access'
                    : '👤 You own this'}
                </Text>
              </View>

              <View style={styles.cardActions}>
                <Pressable
                  style={({ pressed }) => [
                    styles.editButton,
                    pressed ? styles.pressed : null,
                  ]}
                  onPress={() =>
                    navigation.navigate('RestaurantForm', {
                      restaurant: item,
                    })
                  }
                >
                  <Text style={styles.editButtonText}>Edit</Text>
                </Pressable>

                <Pressable
                  style={({ pressed }) => [
                    styles.productsButton,
                    pressed ? styles.pressed : null,
                  ]}
                  onPress={() =>
                    navigation.navigate('RestaurantProducts', {
                      restaurantId: item.id,
                      restaurantName: item.name,
                    })
                  }
                >
                  <Text style={styles.productsButtonText}>
                    Manage products
                  </Text>
                </Pressable>

                <Pressable
                  style={({ pressed }) => [
                    styles.analyticsButton,
                    pressed ? styles.pressed : null,
                  ]}
                  onPress={() =>
                    navigation.navigate('RestaurantSalesStatistics', {
                      restaurantId: item.id,
                      restaurantName: item.name,
                    })
                  }
                >
                  <Text style={styles.analyticsButtonText}>
                    Sales insights
                  </Text>
                </Pressable>

                {item.accessRole === 'owner' ? (
                  <Pressable
                    style={({ pressed }) => [
                      styles.teamButton,
                      pressed ? styles.pressed : null,
                    ]}
                    onPress={() =>
                      navigation.navigate('RestaurantAccess', {
                        restaurant: item,
                      })
                    }
                  >
                    <Text style={styles.teamButtonText}>Manage team</Text>
                  </Pressable>
                ) : null}
              </View>
            </View>
          </View>
        )}
      />
    </SafeAreaView>
  );
}

function createStyles(colors) {
  return StyleSheet.create({
    container: { backgroundColor: colors.background, flex: 1 },
    center: {
      alignItems: 'center',
      backgroundColor: colors.background,
      flex: 1,
      gap: 12,
      justifyContent: 'center',
      padding: 24,
    },
    stateEmoji: { fontSize: 48 },
    stateTitle: {
      color: colors.text,
      fontSize: 22,
      fontWeight: '800',
      textAlign: 'center',
    },
    helperText: {
      color: colors.textMuted,
      fontSize: 14,
      lineHeight: 20,
      textAlign: 'center',
    },
    errorText: {
      color: colors.danger || '#b00020',
      fontSize: 14,
      textAlign: 'center',
    },
    primaryButton: {
      alignItems: 'center',
      backgroundColor: colors.primary,
      borderRadius: 14,
      marginTop: 8,
      paddingHorizontal: 24,
      paddingVertical: 13,
    },
    primaryButtonText: { color: '#fff', fontSize: 15, fontWeight: '800' },
    headerRow: {
      alignItems: 'center',
      flexDirection: 'row',
      justifyContent: 'space-between',
      paddingHorizontal: 16,
      paddingTop: 16,
      paddingBottom: 8,
    },
    screenTitle: { color: colors.text, fontSize: 26, fontWeight: '800' },
    screenSubtitle: { color: colors.textMuted, fontSize: 13, marginTop: 2 },
    addButton: {
      alignItems: 'center',
      backgroundColor: colors.primary,
      borderRadius: 14,
      paddingHorizontal: 16,
      paddingVertical: 10,
    },
    addButtonText: { color: '#fff', fontSize: 14, fontWeight: '800' },
    listContent: { gap: 16, padding: 16 },
    card: {
      backgroundColor: colors.surface,
      borderColor: colors.border,
      borderRadius: 20,
      borderWidth: 1,
      overflow: 'hidden',
    },
    restaurantImage: { height: 160, width: '100%' },
    imagePlaceholder: {
      alignItems: 'center',
      backgroundColor: colors.primarySoft,
      height: 160,
      justifyContent: 'center',
      width: '100%',
    },
    imagePlaceholderInitial: {
      color: colors.primary,
      fontSize: 56,
      fontWeight: '800',
    },
    cardContent: { gap: 6, padding: 16 },
    cardTopRow: {
      alignItems: 'center',
      flexDirection: 'row',
      justifyContent: 'space-between',
    },
    restaurantName: {
      color: colors.text,
      flex: 1,
      fontSize: 20,
      fontWeight: '800',
      marginRight: 10,
    },
    countBadge: {
      backgroundColor: colors.primarySoft,
      borderRadius: 999,
      paddingHorizontal: 10,
      paddingVertical: 5,
    },
    countBadgeText: { color: colors.primary, fontSize: 12, fontWeight: '800' },
    metaText: { color: colors.textMuted, fontSize: 14 },
    addressText: { color: colors.textMuted, fontSize: 13 },
    roleBadge: {
      alignSelf: 'flex-start',
      borderRadius: 8,
      marginTop: 4,
      paddingHorizontal: 8,
      paddingVertical: 4,
    },
    ownerBadge: {
      backgroundColor: colors.primarySoft,
    },
    editorBadge: {
      backgroundColor: colors.surface,
      borderColor: colors.border,
      borderWidth: 1,
    },
    roleBadgeText: {
      fontSize: 11,
      fontWeight: '700',
    },
    ownerBadgeText: {
      color: colors.primary,
    },
    editorBadgeText: {
      color: colors.text,
    },
    cardActions: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 10,
      marginTop: 8,
    },
    editButton: {
      alignItems: 'center',
      borderColor: colors.primary,
      borderRadius: 10,
      borderWidth: 1,
      flex: 1,
      paddingVertical: 10,
    },
    editButtonText: { color: colors.primary, fontSize: 14, fontWeight: '800' },
    productsButton: {
      alignItems: 'center',
      backgroundColor: colors.primary,
      borderRadius: 10,
      flex: 2,
      paddingVertical: 10,
    },
    productsButtonText: { color: '#fff', fontSize: 14, fontWeight: '800' },
    analyticsButton: {
      alignItems: 'center',
      backgroundColor: colors.primarySoft,
      borderColor: colors.primary,
      borderRadius: 10,
      borderWidth: 1,
      flexBasis: '100%',
      paddingVertical: 10,
    },
    analyticsButtonText: {
      color: colors.primary,
      fontSize: 14,
      fontWeight: '800',
    },
    teamButton: {
      alignItems: 'center',
      borderColor: colors.border,
      borderRadius: 10,
      borderWidth: 1,
      flexBasis: '100%',
      paddingVertical: 10,
    },
    teamButtonText: {
      color: colors.text,
      fontSize: 14,
      fontWeight: '800',
    },
    pressed: { opacity: 0.72 },
  });
}