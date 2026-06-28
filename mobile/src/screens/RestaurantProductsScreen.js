import { useCallback, useEffect, useState } from 'react';
import { useAppTheme } from '../theme/ThemeContext';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import {
  deleteProduct,
  getProductsByRestaurant,
} from '../api/products';
import { useAuth } from '../auth/AuthContext';

function getProductId(product) {
  return product?.id || product?.productId || product?._id;
}

export default function RestaurantProductsScreen({ navigation, route }) {
  const { token } = useAuth();
  const { theme } = useAppTheme();
  const styles = createStyles(theme.colors); 
  const { restaurantId, restaurantName } = route.params || {};

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadProducts = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const data = await getProductsByRestaurant(restaurantId);
      setProducts(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message || 'Failed to load products');
    } finally {
      setLoading(false);
    }
  }, [restaurantId]);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', loadProducts);
    return unsubscribe;
  }, [navigation, loadProducts]);

    async function confirmDelete(product) {
        const productId = getProductId(product);

        if (!productId) {
            Alert.alert('Delete failed', 'Product id is missing.');
            return;
        }

        const confirmed =
            typeof window !== 'undefined'
            ? window.confirm(`Delete ${product.name}?`)
            : true;

        if (!confirmed) return;

        try {
            await deleteProduct(restaurantId, productId, token);
            await loadProducts();
        } catch (err) {
            Alert.alert('Delete failed', err.message || 'Could not delete product');
        }
    }
  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
        <Text style={styles.helperText}>Loading products...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.center}>
        <Text style={styles.title}>Could not load products</Text>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.primaryButton} onPress={loadProducts}>
          <Text style={styles.primaryButtonText}>Try again</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.screenTitle}>Menu items</Text>
          <Text style={styles.subtitle}>{restaurantName}</Text>
        </View>

        <TouchableOpacity
          style={styles.addButton}
          onPress={() =>
            navigation.navigate('ProductForm', {
              mode: 'create',
              restaurantId,
              restaurantName,
            })
          }
        >
          <Text style={styles.addButtonText}>+ Add</Text>
        </TouchableOpacity>
      </View>

      {products.length === 0 ? (
        <View style={styles.center}>
          <Text style={styles.title}>No products yet</Text>
          <Text style={styles.helperText}>Add the first menu item.</Text>
        </View>
      ) : (
        <FlatList
          data={products}
          keyExtractor={(item) => String(item.id)}
          onRefresh={loadProducts}
          refreshing={loading}
          renderItem={({ item }) => (
            <View style={styles.card}>
              {item.image ? (
                <Image source={{ uri: item.image }} style={styles.image} />
              ) : (
                <View style={styles.placeholder}>
                  <Text style={styles.placeholderText}>No image</Text>
                </View>
              )}

              <View style={styles.content}>
                <Text style={styles.name}>{item.name}</Text>
                <Text style={styles.meta}>{item.category || 'No category'}</Text>
                <Text style={styles.description} numberOfLines={2}>
                  {item.description || 'No description'}
                </Text>
                <Text style={styles.price}>₪{Number(item.price).toFixed(0)}</Text>

                <View style={styles.actions}>
                  <TouchableOpacity
                    style={styles.editButton}
                    onPress={() =>
                      navigation.navigate('ProductForm', {
                        mode: 'edit',
                        restaurantId,
                        restaurantName,
                        product: {
                        ...item,
                        id: getProductId(item),
                        },
                      })
                    }
                  >
                    <Text style={styles.editButtonText}>Edit</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.deleteButton}
                    onPress={() => confirmDelete(item)}
                  >
                    <Text style={styles.deleteButtonText}>Delete</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          )}
        />
      )}
    </View>
  );
}

function createStyles(colors) {
  return StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: colors.background},
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    backgroundColor: colors.background,
  },
  headerRow: {
    marginBottom: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  screenTitle: { fontSize: 28, fontWeight: '800', color: colors.text },
  subtitle: { color: colors.textMuted, marginTop: 4 },
  title: { fontSize: 22, fontWeight: '800', textAlign: 'center' },
  helperText: { marginTop: 8, color: colors.textMuted, textAlign: 'center' },
  errorText: { color: colors.danger, marginVertical: 12, textAlign: 'center' },
  primaryButton: {
    marginTop: 18,
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingHorizontal: 18,
    paddingVertical: 12,
  },
  primaryButtonText: { color: colors.onPrimary, fontWeight: '800' },
  addButton: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  addButtonText: { color: colors.onPrimary, fontWeight: '800' },
  card: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: 18,
    marginBottom: 14,
    overflow: 'hidden',
  },
  image: { width: 110, height: 130 },
  placeholder: {
    width: 110,
    height: 130,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceVariant,
  },
  placeholderText: { color: colors.textMuted, fontWeight: '700' },
  content: { flex: 1, padding: 14 },
  name: { fontSize: 18, fontWeight: '800', color: colors.text },
  meta: { color: colors.textMuted, marginTop: 3 },
  description: { color: colors.textMuted, marginTop: 5 },
  price: { color: colors.primary, fontWeight: '900', marginTop: 8 },
  actions: { flexDirection: 'row', gap: 8, marginTop: 12 },
  editButton: {
    backgroundColor: '#e6f6fd',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  editButtonText: { color: colors.primary, fontWeight: '800' },
  deleteButton: {
    backgroundColor: colors.errorContainer,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  deleteButtonText: {color: colors.danger, fontWeight: '800' },
  });
}