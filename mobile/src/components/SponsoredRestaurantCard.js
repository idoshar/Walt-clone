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

const ROTATION_INTERVAL_MS = 7000;

function getRestaurantInitial(restaurant) {
  return restaurant?.name?.trim()?.charAt(0)?.toUpperCase() || 'R';
}

function hasRestaurantImage(restaurant) {
  return (
    typeof restaurant?.image === 'string' &&
    restaurant.image.trim().length > 0
  );
}

function getRestaurantCuisine(restaurant) {
  return restaurant?.category || restaurant?.cuisine || 'Restaurant';
}

function getNextIndex(currentIndex, offset, count) {
  return (currentIndex + offset + count) % count;
}

export default function SponsoredRestaurantCard({
  navigation,
  restaurants = [],
}) {
  const { theme } = useAppTheme();
  const styles = useMemo(() => createStyles(theme.colors), [theme.colors]);

  const [activeIndex, setActiveIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    if (restaurants.length === 0) {
      setActiveIndex(0);
      return;
    }

    setActiveIndex((currentIndex) => currentIndex % restaurants.length);
  }, [restaurants.length]);

  useEffect(() => {
    if (restaurants.length < 2 || isPaused) {
      return undefined;
    }

    const intervalId = setInterval(() => {
      setActiveIndex((currentIndex) =>
        getNextIndex(currentIndex, 1, restaurants.length)
      );
    }, ROTATION_INTERVAL_MS);

    return () => clearInterval(intervalId);
  }, [isPaused, restaurants.length]);

  if (restaurants.length === 0) {
    return null;
  }

  const restaurant = restaurants[activeIndex];
  const cuisine = getRestaurantCuisine(restaurant);

  function openRestaurant() {
    navigation.navigate('RestaurantDetails', {
      restaurantId: restaurant.id,
      restaurant,
    });
  }

  function showPreviousRestaurant() {
    setIsPaused(true);
    setActiveIndex((currentIndex) =>
      getNextIndex(currentIndex, -1, restaurants.length)
    );
  }

  function showNextRestaurant() {
    setIsPaused(true);
    setActiveIndex((currentIndex) =>
      getNextIndex(currentIndex, 1, restaurants.length)
    );
  }

  function selectRestaurant(index) {
    setIsPaused(true);
    setActiveIndex(index);
  }

  return (
    <AppCard style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.headerLabel}>SPONSORED</Text>

        <View style={styles.demoBadge}>
          <Text style={styles.demoBadgeText}>DEMO</Text>
        </View>
      </View>

      <Pressable
        accessibilityLabel={`Open sponsored restaurant ${restaurant.name}`}
        accessibilityRole="button"
        onPress={openRestaurant}
        style={({ pressed }) => [
          styles.restaurantArea,
          pressed ? styles.pressed : null,
        ]}
      >
        {hasRestaurantImage(restaurant) ? (
          <Image source={{ uri: restaurant.image }} style={styles.image} />
        ) : (
          <View style={styles.imagePlaceholder}>
            <Text style={styles.imageInitial}>
              {getRestaurantInitial(restaurant)}
            </Text>
          </View>
        )}

        <View style={styles.content}>
          <Text style={styles.sponsorLabel}>Sponsored · Demo</Text>

          <Text numberOfLines={1} style={styles.name}>
            {restaurant.name}
          </Text>

          <Text numberOfLines={1} style={styles.meta}>
            {cuisine}
            {restaurant.address ? ` · ${restaurant.address}` : ''}
          </Text>

          <Text numberOfLines={2} style={styles.description}>
            {restaurant.description ||
              'Explore this restaurant and its menu.'}
          </Text>

          <View style={styles.ctaRow}>
            <Text style={styles.ctaText}>View restaurant</Text>
            <Text style={styles.ctaArrow}>→</Text>
          </View>
        </View>
      </Pressable>

      <View style={styles.controls}>
        <Pressable
          accessibilityLabel="Show previous sponsored restaurant"
          accessibilityRole="button"
          disabled={restaurants.length < 2}
          onPress={showPreviousRestaurant}
          style={({ pressed }) => [
            styles.arrowButton,
            restaurants.length < 2 ? styles.disabled : null,
            pressed ? styles.pressed : null,
          ]}
        >
          <Text style={styles.arrowText}>←</Text>
        </Pressable>

        <View style={styles.indicators}>
          {restaurants.map((item, index) => (
            <Pressable
              accessibilityLabel={`Show sponsored restaurant ${index + 1}: ${item.name}`}
              accessibilityRole="button"
              key={item.id}
              onPress={() => selectRestaurant(index)}
              style={[
                styles.indicator,
                index === activeIndex ? styles.indicatorActive : null,
              ]}
            />
          ))}
        </View>

        <Pressable
          accessibilityLabel="Show next sponsored restaurant"
          accessibilityRole="button"
          disabled={restaurants.length < 2}
          onPress={showNextRestaurant}
          style={({ pressed }) => [
            styles.arrowButton,
            restaurants.length < 2 ? styles.disabled : null,
            pressed ? styles.pressed : null,
          ]}
        >
          <Text style={styles.arrowText}>→</Text>
        </Pressable>

        <Pressable
          accessibilityLabel={
            isPaused
              ? 'Resume sponsored restaurant rotation'
              : 'Pause sponsored restaurant rotation'
          }
          accessibilityRole="button"
          disabled={restaurants.length < 2}
          onPress={() => setIsPaused((currentValue) => !currentValue)}
          style={({ pressed }) => [
            styles.pauseButton,
            restaurants.length < 2 ? styles.disabled : null,
            pressed ? styles.pressed : null,
          ]}
        >
          <Text style={styles.pauseText}>
            {isPaused ? 'Resume' : 'Pause'}
          </Text>
        </Pressable>
      </View>
    </AppCard>
  );
}

function createStyles(colors) {
  return StyleSheet.create({
    card: {
      overflow: 'hidden',
    },
    header: {
      alignItems: 'center',
      flexDirection: 'row',
      justifyContent: 'space-between',
      paddingHorizontal: 14,
      paddingTop: 12,
    },
    headerLabel: {
      color: colors.textMuted,
      fontSize: 11,
      fontWeight: '800',
      letterSpacing: 0.8,
    },
    demoBadge: {
      backgroundColor: colors.primarySoft,
      borderRadius: 999,
      paddingHorizontal: 9,
      paddingVertical: 4,
    },
    demoBadgeText: {
      color: colors.primary,
      fontSize: 10,
      fontWeight: '800',
      letterSpacing: 0.6,
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
    imagePlaceholder: {
      alignItems: 'center',
      backgroundColor: colors.primarySoft,
      borderRadius: 14,
      height: 92,
      justifyContent: 'center',
      width: 92,
    },
    imageInitial: {
      color: colors.primary,
      fontSize: 38,
      fontWeight: '800',
    },
    content: {
      flex: 1,
      gap: 4,
      justifyContent: 'center',
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
    controls: {
      alignItems: 'center',
      borderTopColor: colors.border,
      borderTopWidth: 1,
      flexDirection: 'row',
      gap: 9,
      paddingHorizontal: 14,
      paddingVertical: 10,
    },
    arrowButton: {
      alignItems: 'center',
      borderColor: colors.border,
      borderRadius: 999,
      borderWidth: 1,
      height: 30,
      justifyContent: 'center',
      width: 30,
    },
    arrowText: {
      color: colors.text,
      fontSize: 16,
      fontWeight: '800',
    },
    indicators: {
      flex: 1,
      flexDirection: 'row',
      gap: 6,
      justifyContent: 'center',
    },
    indicator: {
      backgroundColor: colors.border,
      borderRadius: 999,
      height: 7,
      width: 7,
    },
    indicatorActive: {
      backgroundColor: colors.primary,
      width: 21,
    },
    pauseButton: {
      borderColor: colors.border,
      borderRadius: 999,
      borderWidth: 1,
      paddingHorizontal: 10,
      paddingVertical: 6,
    },
    pauseText: {
      color: colors.text,
      fontSize: 11,
      fontWeight: '800',
    },
    disabled: {
      opacity: 0.45,
    },
    pressed: {
      opacity: 0.72,
    },
  });
}
