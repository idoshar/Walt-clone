import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import { getMyRestaurants } from '../api/restaurants';
import { useAuth } from '../auth/AuthContext';
import ThemeToggle from '../components/ThemeToggle'; 
import { useAppTheme } from '../theme/ThemeContext';

export default function MyRestaurantsScreen({ navigation }) {
  const { token } = useAuth();
  
  // שליפת ה-Theme עם הגנה מפני ערכי undefined
  const themeContext = useAppTheme();
  const theme = themeContext?.theme || { colors: {}, mode: 'light' };
  
  // בדיקה בטרמינל שהתמה אכן מתחלפת
  useEffect(() => {
    console.log('MyRestaurants Theme Mode:', theme.mode);
  }, [theme.mode]);

  const styles = createStyles(theme.colors, theme.mode);

  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  async function loadRestaurants() {
    try {
      setLoading(true);
      setError('');

      const data = await getMyRestaurants(token);
      setRestaurants(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message || 'Failed to load restaurants');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadRestaurants();
  }, []);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={theme.colors?.primary || '#009de0'} />
        <Text style={styles.helperText}>Loading your restaurants...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.center}>
        <Text style={styles.title}>Could not load restaurants</Text>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.primaryButton} onPress={loadRestaurants}>
          <Text style={styles.primaryButtonText}>Try again</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (restaurants.length === 0) {
    return (
      <View style={styles.center}>
        <Text style={styles.title}>No restaurants yet</Text>
        <Text style={styles.helperText}>
          Restaurants you create will appear here.
        </Text>
        <TouchableOpacity
          style={styles.primaryButton}
          onPress={() => navigation.navigate('CreateRestaurant')}
        >
          <Text style={styles.primaryButtonText}>Create restaurant</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.screenTitle}>My Restaurants</Text>

        <View style={styles.headerActions}>
          <ThemeToggle compact /> 
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => navigation.navigate('CreateRestaurant')}
          >
            <Text style={styles.addButtonText}>+ Add</Text>
          </TouchableOpacity>
        </View>
      </View>

      <FlatList
        data={restaurants}
        keyExtractor={(item) => String(item.id)}
        refreshing={loading}
        onRefresh={loadRestaurants}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.card}
            activeOpacity={0.85}
            onPress={() =>
              navigation.navigate('RestaurantProducts', {
                restaurantId: item.id,
                restaurantName: item.name,
              })
            }
          >
            {item.image ? (
              <Image
                source={{ uri: item.image }}
                style={styles.restaurantImage}
                resizeMode="cover"
              />
            ) : (
              <View style={styles.imagePlaceholder}>
                <Text style={styles.imagePlaceholderText}>No image</Text>
              </View>
            )}

            <View style={styles.cardContent}>
              <View style={styles.cardTopRow}>
                <Text style={styles.restaurantName} numberOfLines={1}>
                  {item.name}
                </Text>

                <View style={styles.countBadge}>
                  <Text style={styles.countBadgeText}>
                    {item.productCount || 0} items
                  </Text>
                </View>
              </View>

              <Text style={styles.metaText} numberOfLines={1}>
                {item.cuisine || 'No cuisine'}
              </Text>

              <Text style={styles.addressText} numberOfLines={1}>
                {item.address || 'No address'}
              </Text>
            </View>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

// פונקציית עיצוב דינמית וחסינת קריסות (Fallback)
function createStyles(colors = {}, mode) {
  const isDark = mode === 'dark';

  // צבעי מגן למקרה שההקשר לא החזיר ערכים
  const bgColor = colors.background || (isDark ? '#121212' : '#f7f8fa');
  const cardColor = colors.surface || (isDark ? '#1e1e1e' : '#ffffff');
  const textColor = colors.text || (isDark ? '#ffffff' : '#111827');
  const textMutedColor = colors.textMuted || (isDark ? '#9ca3af' : '#5f6b7a');
  const primaryColor = colors.primary || '#009de0';
  const onPrimaryColor = colors.onPrimary || '#ffffff';
  const primarySoftColor = colors.primarySoft || (isDark ? '#153243' : '#e6f6fd');
  const borderColor = colors.border || (isDark ? '#374151' : '#e5e7eb');

  return StyleSheet.create({
    container: {
      flex: 1,
      paddingHorizontal: 16,
      paddingTop: 16,
      backgroundColor: bgColor,
    },
    listContent: {
      paddingBottom: 24,
    },
    center: {
      flex: 1,
      padding: 24,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: bgColor,
    },
    headerRow: {
      marginBottom: 18,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    headerActions: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    screenTitle: {
      fontSize: 28,
      fontWeight: '800',
      color: textColor,
    },
    title: {
      fontSize: 24,
      fontWeight: '800',
      marginBottom: 8,
      textAlign: 'center',
      color: textColor,
    },
    helperText: {
      marginTop: 8,
      color: textMutedColor,
      textAlign: 'center',
    },
    errorText: {
      color: colors.danger || '#b00020',
      textAlign: 'center',
      marginVertical: 12,
    },
    primaryButton: {
      marginTop: 18,
      paddingVertical: 12,
      paddingHorizontal: 20,
      borderRadius: 12,
      backgroundColor: primaryColor,
    },
    primaryButtonText: {
      color: onPrimaryColor,
      fontWeight: '700',
    },
    addButton: {
      paddingVertical: 9,
      paddingHorizontal: 15,
      borderRadius: 14,
      backgroundColor: primaryColor,
    },
    addButtonText: {
      color: onPrimaryColor,
      fontWeight: '800',
    },
    card: {
      marginBottom: 16,
      borderRadius: 20,
      backgroundColor: cardColor,
      overflow: 'hidden',
      elevation: 3,
      shadowColor: '#000',
      shadowOpacity: isDark ? 0.3 : 0.08,
      shadowRadius: 12,
      shadowOffset: { width: 0, height: 4 },
      borderColor: borderColor,
      borderWidth: isDark ? 1 : 0,
    },
    restaurantImage: {
      width: '100%',
      height: 190,
      backgroundColor: borderColor,
    },
    imagePlaceholder: {
      width: '100%',
      height: 190,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: primarySoftColor,
    },
    imagePlaceholderText: {
      color: primaryColor,
      fontWeight: '700',
    },
    cardContent: {
      padding: 16,
    },
    cardTopRow: {
      marginBottom: 6,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    restaurantName: {
      flex: 1,
      fontSize: 20,
      fontWeight: '800',
      color: textColor,
      marginRight: 10,
    },
    countBadge: {
      paddingVertical: 5,
      paddingHorizontal: 10,
      borderRadius: 999,
      backgroundColor: primarySoftColor,
    },
    countBadgeText: {
      color: primaryColor,
      fontSize: 13,
      fontWeight: '800',
    },
    metaText: {
      color: textMutedColor,
      marginBottom: 5,
      fontSize: 15,
    },
    addressText: {
      color: textMutedColor,
      fontSize: 14,
    },
  });
}