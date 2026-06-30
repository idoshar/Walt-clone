import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  Platform,
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
import { useCurrency } from '../currency/CurrencyContext';
import { useAppTheme } from '../theme/ThemeContext';

function getProductId(product) {
  return product?.id || product?.productId || product?._id;
}

export default function RestaurantProductsScreen({ navigation, route }) {
  const { token } = useAuth();
  const { formatPrice } = useCurrency();
  const { theme } = useAppTheme();
  const styles = createStyles(theme.colors);
  const { restaurantId, restaurantName } = route.params || {};

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [deletingProductId, setDeletingProductId] = useState('');

  const loadProducts = useCallback(
    async ({ refreshing = false } = {}) => {
      if (refreshing) {
        setIsRefreshing(true);
      } else {
        setLoading(true);
      }
      setError('');

      try {
        const data = await getProductsByRestaurant(restaurantId);
        setProducts(Array.isArray(data) ? data : []);
      } catch (err) {
        setError(err.message || 'Failed to load products');
      } finally {
        setLoading(false);
        setIsRefreshing(false);
      }
    },
    [restaurantId]
  );

  // Refresh whenever the screen regains focus (after create/edit)
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () =>
      loadProducts({ refreshing: true })
    );
    return unsubscribe;
  }, [navigation, loadProducts]);

  // Initial load
  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  async function deleteSelectedProduct(product) {
    const productId = getProductId(product);

    if (!productId) {
      Alert.alert('Delete failed', 'Product id is missing.');
      return;
    }

    setDeletingProductId(String(productId));

    try {
      await deleteProduct(restaurantId, productId, token);

      setProducts((currentProducts) =>
        currentProducts.filter(
          (currentProduct) =>
            String(getProductId(currentProduct)) !== String(productId)
        )
      );
    } catch (err) {
      Alert.alert(
        'Could not delete product',
        err.status === 403
          ? 'You are not authorized to manage this restaurant. Only the owner can delete products.'
          : err.message || 'Something went wrong. Please try again.'
      );
    } finally {
      setDeletingProductId('');
    }
  }

  function confirmDelete(product) {
    const productId = getProductId(product);

    if (!productId) {
      Alert.alert('Delete failed', 'Product id is missing.');
      return;
    }

    if (deletingProductId) {
      return;
    }

    const message = `Delete "${product.name}"? This cannot be undone.`;
    const confirmDeleteAction = () => {
      void deleteSelectedProduct(product);
    };

    if (
      Platform.OS === 'web' &&
      typeof window !== 'undefined' &&
      typeof window.confirm === 'function'
    ) {
      if (window.confirm(message)) {
        confirmDeleteAction();
      }

      return;
    }

    Alert.alert(
      'Delete product',
      message,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: confirmDeleteAction,
        },
      ]
    );
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={styles.helperText}>Loading products...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.center}>
        <Text style={styles.title}>Could not load products</Text>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity
          style={styles.primaryButton}
          onPress={() => loadProducts()}
        >
          <Text style={styles.primaryButtonText}>Try again</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <View style={styles.headerText}>
          <Text style={styles.screenTitle}>Menu items</Text>
          <Text style={styles.subtitle}>{restaurantName}</Text>
          <Text style={styles.countText}>
            {products.length} item{products.length === 1 ? '' : 's'}
          </Text>
        </View>

        <View style={styles.headerActions}>
          <TouchableOpacity
            style={styles.categoriesButton}
            onPress={() =>
              navigation.navigate('MenuCategoryManagement', {
                restaurantId,
                restaurantName,
              })
            }
          >
            <Text style={styles.categoriesButtonText}>Categories</Text>
          </TouchableOpacity>

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
      </View>

      {products.length === 0 ? (
        <View style={styles.center}>
          <Text style={styles.emptyEmoji}>🍽️</Text>
          <Text style={styles.title}>No products yet</Text>
          <Text style={styles.helperText}>Add the first menu item.</Text>
        </View>
      ) : (
        <FlatList
          data={products}
          keyExtractor={(item) => String(getProductId(item))}
          onRefresh={() => loadProducts({ refreshing: true })}
          refreshing={isRefreshing}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => {
            const productId = getProductId(item);
            const isDeleting =
              String(deletingProductId) === String(productId);

            return (
              <View style={styles.card}>
                {item.image ? (
                  <Image source={{ uri: item.image }} style={styles.image} />
                ) : (
                  <View style={styles.placeholder}>
                    <Text style={styles.placeholderText}>No image</Text>
                  </View>
                )}

                <View style={styles.content}>
                  <View style={styles.nameRow}>
                    <Text numberOfLines={1} style={styles.name}>
                      {item.name}
                    </Text>

                    {/* Publication status badge */}
                    <View
                      style={[
                        styles.publishBadge,
                        item.isPublished === false
                          ? styles.draftBadge
                          : styles.liveBadge,
                      ]}
                    >
                      <Text
                        style={[
                          styles.publishBadgeText,
                          item.isPublished === false
                            ? styles.draftBadgeText
                            : styles.liveBadgeText,
                        ]}
                      >
                        {item.isPublished === false ? 'Draft' : 'Published'}
                      </Text>
                    </View>
                  </View>

                  <Text style={styles.meta}>
                    {item.category || 'No category'}
                  </Text>
                  <Text numberOfLines={2} style={styles.description}>
                    {item.description || 'No description'}
                  </Text>
                  <Text style={styles.price}>{formatPrice(item.price)}</Text>

                  <View style={styles.actions}>
                    <TouchableOpacity
                      style={styles.editButton}
                      disabled={isDeleting}
                      onPress={() =>
                        navigation.navigate('ProductForm', {
                          mode: 'edit',
                          restaurantId,
                          restaurantName,
                          product: { ...item, id: productId },
                        })
                      }
                    >
                      <Text style={styles.editButtonText}>Edit</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[
                        styles.deleteButton,
                        isDeleting ? styles.disabledButton : null,
                      ]}
                      disabled={isDeleting}
                      onPress={() => confirmDelete(item)}
                    >
                      <Text style={styles.deleteButtonText}>
                        {isDeleting ? 'Deleting...' : 'Delete'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            );
          }}
        />
      )}
    </View>
  );
}

function createStyles(colors) {
  return StyleSheet.create({
    container: { flex: 1, padding: 16, backgroundColor: colors.background },
    center: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      padding: 24,
      backgroundColor: colors.background,
      gap: 8,
    },
    emptyEmoji: { fontSize: 44 },
    headerRow: {
      marginBottom: 16,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    headerText: { flex: 1 },
    screenTitle: { fontSize: 28, fontWeight: '800', color: colors.text },
    subtitle: { color: colors.textMuted, marginTop: 4 },
    countText: { color: colors.textMuted, fontSize: 13, marginTop: 2 },
    title: {
      fontSize: 22,
      fontWeight: '800',
      textAlign: 'center',
      color: colors.text,
    },
    helperText: { color: colors.textMuted, textAlign: 'center' },
    errorText: { color: colors.danger, marginVertical: 12, textAlign: 'center' },
    primaryButton: {
      marginTop: 18,
      backgroundColor: colors.primary,
      borderRadius: 12,
      paddingHorizontal: 18,
      paddingVertical: 12,
    },
    primaryButtonText: { color: colors.onPrimary, fontWeight: '800' },
    headerActions: {
      flexDirection: 'row',
      gap: 8,
    },
    categoriesButton: {
      borderColor: colors.border,
      borderRadius: 12,
      borderWidth: 1,
      paddingHorizontal: 12,
      paddingVertical: 10,
    },
    categoriesButtonText: {
      color: colors.text,
      fontWeight: '800',
    },
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
      borderColor: colors.border,
      borderWidth: 1,
    },
    image: { width: 110, height: 150 },
    placeholder: {
      width: 110,
      height: 150,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.surfaceVariant || colors.primarySoft,
    },
    placeholderText: { color: colors.textMuted, fontWeight: '700' },
    content: { flex: 1, padding: 14 },
    nameRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      justifyContent: 'space-between',
    },
    name: { flex: 1, fontSize: 18, fontWeight: '800', color: colors.text },
    publishBadge: {
      borderRadius: 999,
      paddingHorizontal: 8,
      paddingVertical: 3,
    },
    liveBadge: { backgroundColor: colors.primarySoft },
    draftBadge: { backgroundColor: colors.border },
    publishBadgeText: { fontSize: 10, fontWeight: '800' },
    liveBadgeText: { color: colors.primary },
    draftBadgeText: { color: colors.textMuted },
    meta: { color: colors.textMuted, marginTop: 3 },
    description: { color: colors.textMuted, marginTop: 5 },
    price: { color: colors.primary, fontWeight: '900', marginTop: 8 },
    actions: { flexDirection: 'row', gap: 8, marginTop: 12 },
    editButton: {
      backgroundColor: colors.primarySoft,
      borderRadius: 10,
      paddingHorizontal: 14,
      paddingVertical: 8,
    },
    editButtonText: { color: colors.primary, fontWeight: '800' },
    deleteButton: {
      backgroundColor: colors.errorContainer || '#fdecea',
      borderRadius: 10,
      paddingHorizontal: 14,
      paddingVertical: 8,
    },
    deleteButtonText: { color: colors.danger, fontWeight: '800' },
    disabledButton: { opacity: 0.5 },
  });
}