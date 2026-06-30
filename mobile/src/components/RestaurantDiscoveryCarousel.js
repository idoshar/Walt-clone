import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { useAppTheme } from '../theme/ThemeContext';
import { getRestaurantImage } from '../utils/restaurantImages';

function hasRestaurantImage(restaurant) {
  return (
    typeof restaurant?.image === 'string' &&
    restaurant.image.trim().length > 0
  );
}

function getRestaurantInitial(restaurant) {
  return restaurant?.name?.trim()?.charAt(0)?.toUpperCase() || 'R';
}

function formatDistance(distanceKm) {
  if (typeof distanceKm !== 'number' || !Number.isFinite(distanceKm)) {
    return null;
  }

  if (distanceKm < 1) {
    return `${Math.round(distanceKm * 1000)} m away`;
  }

  return `${distanceKm.toFixed(1)} km away`;
}

export default function RestaurantDiscoveryCarousel({
  eyebrow,
  emptyMessage,
  onPressRestaurant,
  restaurants = [],
  showDistance = false,
  title,
}) {
  const { theme } = useAppTheme();
  const styles = createStyles(theme.colors);

  return (
    <View style={styles.section}>
      <View style={styles.heading}>
        {eyebrow ? <Text style={styles.eyebrow}>{eyebrow}</Text> : null}
        <Text style={styles.title}>{title}</Text>
      </View>

      {restaurants.length === 0 ? (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyText}>{emptyMessage}</Text>
        </View>
      ) : (
        <ScrollView
          horizontal
          contentContainerStyle={styles.carouselContent}
          showsHorizontalScrollIndicator={false}
        >
          {restaurants.map((restaurant) => {
            const distance = showDistance
              ? formatDistance(restaurant.distanceKm)
              : null;

            return (
              <Pressable
                key={String(restaurant.id)}
                accessibilityLabel={`Open ${restaurant.name} menu`}
                accessibilityRole="button"
                onPress={() => onPressRestaurant(restaurant)}
                style={({ pressed }) => [
                  styles.card,
                  pressed ? styles.cardPressed : null,
                ]}
              >
                <Image
                  source={{ uri: getRestaurantImage(restaurant) }}
                  style={styles.image}
                />

                <View style={styles.cardContent}>
                  <Text numberOfLines={1} style={styles.restaurantName}>
                    {restaurant.name}
                  </Text>

                  {restaurant.cuisine ? (
                    <Text numberOfLines={1} style={styles.cuisine}>
                      {restaurant.cuisine}
                    </Text>
                  ) : null}

                  {distance ? (
                    <Text style={styles.distance}>{distance}</Text>
                  ) : null}
                </View>
              </Pressable>
            );
          })}
        </ScrollView>
      )}
    </View>
  );
}

function createStyles(colors) {
  return StyleSheet.create({
    section: {
      gap: 10,
    },
    heading: {
      gap: 3,
    },
    eyebrow: {
      color: colors.primary,
      fontSize: 11,
      fontWeight: '800',
      letterSpacing: 1,
    },
    title: {
      color: colors.text,
      fontSize: 22,
      fontWeight: '800',
      letterSpacing: -0.3,
    },
    carouselContent: {
      gap: 12,
      paddingRight: 20,
    },
    card: {
      backgroundColor: colors.surface,
      borderColor: colors.border,
      borderRadius: 18,
      borderWidth: 1,
      overflow: 'hidden',
      width: 190,
    },
    cardPressed: {
      opacity: 0.72,
    },
    image: {
      height: 124,
      width: '100%',
    },
    imagePlaceholder: {
      alignItems: 'center',
      backgroundColor: colors.primarySoft,
      height: 124,
      justifyContent: 'center',
      width: '100%',
    },
    imageInitial: {
      color: colors.primary,
      fontSize: 42,
      fontWeight: '800',
    },
    cardContent: {
      gap: 4,
      padding: 13,
    },
    restaurantName: {
      color: colors.text,
      fontSize: 16,
      fontWeight: '800',
    },
    cuisine: {
      color: colors.textMuted,
      fontSize: 13,
      fontWeight: '700',
    },
    distance: {
      color: colors.success,
      fontSize: 12,
      fontWeight: '800',
      marginTop: 2,
    },
    emptyCard: {
      backgroundColor: colors.surface,
      borderColor: colors.border,
      borderRadius: 16,
      borderWidth: 1,
      padding: 16,
    },
    emptyText: {
      color: colors.textMuted,
      fontSize: 14,
      lineHeight: 20,
    },
  });
}
