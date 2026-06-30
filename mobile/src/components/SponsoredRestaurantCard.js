import { useEffect, useMemo, useState } from 'react';
import {
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import AppCard from './AppCard';
import { useAppTheme } from '../theme/ThemeContext';
import { getRestaurantImage } from '../utils/restaurantImages';

const ROTATION_INTERVAL_MS = 7000;

function getRestaurantCuisine(restaurant) {
  return restaurant?.category || restaurant?.cuisine || 'Restaurant';
}

function getNextIndex(currentIndex, count) {
  return (currentIndex + 1) % count;
}

export default function SponsoredRestaurantCard({
  navigation,
  restaurants = [],
}) {
  const { theme } = useAppTheme();
  const styles = useMemo(() => createStyles(theme.colors), [theme.colors]);
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    setActiveIndex((currentIndex) =>
      restaurants.length > 0 ? currentIndex % restaurants.length : 0
    );
  }, [restaurants.length]);

  useEffect(() => {
    if (restaurants.length < 2) {
      return undefined;
    }

    const intervalId = setInterval(() => {
      setActiveIndex((currentIndex) =>
        getNextIndex(currentIndex, restaurants.length)
      );
    }, ROTATION_INTERVAL_MS);

    return () => clearInterval(intervalId);
  }, [restaurants.length]);

  if (restaurants.length === 0) {
    return (
      <AppCard style={[styles.card, styles.emptyCard]}>
        <View style={styles.emptyVisual} accessibilityElementsHidden>
          <Text style={styles.emptyVisualText}>W</Text>
        </View>

        <View style={styles.emptyContent}>
          <Text style={styles.sponsorLabel}>Sponsored placement</Text>
          <Text style={styles.emptyTitle}>Your restaurant here</Text>
          <Text style={styles.emptyDescription}>
            Want to promote your restaurant? Contact the site administration to
            learn about sponsored placements.
          </Text>
        </View>
      </AppCard>
    );
  }

  const restaurant = restaurants[activeIndex];
  const cuisine = getRestaurantCuisine(restaurant);
  const description =
    restaurant.description ||
    restaurant.address ||
    'Explore this restaurant and its menu.';

  return (
    <AppCard style={styles.card}>
      <Pressable
        accessibilityLabel={`Open sponsored restaurant ${restaurant.name}`}
        accessibilityRole="button"
        onPress={() =>
          navigation.navigate('RestaurantDetails', {
            restaurantId: restaurant.id,
            restaurant,
          })
        }
        style={({ pressed }) => [
          styles.restaurantArea,
          pressed ? styles.pressed : null,
        ]}
      >
        <Image
          source={{ uri: getRestaurantImage(restaurant) }}
          style={styles.image}
        />

        <View style={styles.content}>
          <Text style={styles.sponsorLabel}>Sponsored</Text>

          <Text numberOfLines={1} style={styles.name}>
            {restaurant.name}
          </Text>

          <Text numberOfLines={1} style={styles.meta}>
            {cuisine}
            {restaurant.address ? ` · ${restaurant.address}` : ''}
          </Text>

          <Text numberOfLines={2} style={styles.description}>
            {description}
          </Text>

          <View style={styles.ctaRow}>
            <Text style={styles.ctaText}>View restaurant</Text>
            <Text style={styles.ctaArrow}>→</Text>
          </View>
        </View>
      </Pressable>
    </AppCard>
  );
}

function createStyles(colors) {
  return StyleSheet.create({
    card: {
      overflow: 'hidden',
    },
    restaurantArea: {
      flexDirection: 'row',
      gap: 12,
      padding: 14,
    },
    image: {
      borderRadius: 14,
      height: 92,
      width: 92,
    },
    content: {
      flex: 1,
      gap: 4,
      justifyContent: 'center',
      minWidth: 0,
    },
    sponsorLabel: {
      color: colors.primary,
      fontSize: 10,
      fontWeight: '800',
      letterSpacing: 0.5,
    },
    name: {
      color: colors.text,
      fontSize: 18,
      fontWeight: '800',
    },
    meta: {
      color: colors.primary,
      fontSize: 12,
      fontWeight: '700',
    },
    description: {
      color: colors.textMuted,
      fontSize: 12,
      lineHeight: 17,
      marginTop: 2,
    },
    ctaRow: {
      alignItems: 'center',
      flexDirection: 'row',
      gap: 6,
      marginTop: 5,
    },
    ctaText: {
      color: colors.primary,
      fontSize: 12,
      fontWeight: '800',
    },
    ctaArrow: {
      color: colors.primary,
      fontSize: 16,
      fontWeight: '800',
    },
    emptyCard: {
      alignItems: 'center',
      flexDirection: 'row',
      gap: 14,
      padding: 16,
    },
    emptyVisual: {
      alignItems: 'center',
      backgroundColor: colors.primary,
      borderRadius: 16,
      height: 84,
      justifyContent: 'center',
      width: 84,
    },
    emptyVisualText: {
      color: '#FFFFFF',
      fontSize: 42,
      fontWeight: '900',
    },
    emptyContent: {
      flex: 1,
      gap: 5,
      minWidth: 0,
    },
    emptyTitle: {
      color: colors.text,
      fontSize: 18,
      fontWeight: '800',
    },
    emptyDescription: {
      color: colors.textMuted,
      fontSize: 12,
      lineHeight: 18,
    },
    pressed: {
      opacity: 0.72,
    },
  });
}
