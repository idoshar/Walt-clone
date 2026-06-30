import { useCallback, useMemo, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import {
  ActivityIndicator,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import {
  createProduct,
  updateProduct,
} from '../api/products';
import { getMenuCategories } from '../api/menuCategories';
import { useAuth } from '../auth/AuthContext';
import { useAppTheme } from '../theme/ThemeContext';

const MENU_TYPE_LABELS = {
  main: 'Main dish',
  side: 'Side dish',
  dessert: 'Dessert',
  drink: 'Drink',
  other: 'Other',
};

function normalizeText(value) {
  return String(value || '').trim().toLowerCase();
}

function normalizeCategories(value) {
  return Array.isArray(value) ? value : [];
}

function getMenuTypeLabel(menuType) {
  return MENU_TYPE_LABELS[menuType] || 'Other';
}

function validateProduct({ name, price, categoryId }) {
  if (!String(name || '').trim()) {
    return 'Product name is required.';
  }

  if (!String(price || '').trim()) {
    return 'Price is required.';
  }

  const numericPrice = Number(price);

  if (!Number.isFinite(numericPrice) || numericPrice < 0) {
    return 'Price must be a non-negative number.';
  }

  if (!String(categoryId || '').trim()) {
    return 'Select a menu category before saving this product.';
  }

  return '';
}

export default function ProductFormScreen({ navigation, route }) {
  const { token } = useAuth();
  const { theme } = useAppTheme();
  const styles = useMemo(
    () => createStyles(theme.colors),
    [theme.colors]
  );

  const { mode, restaurantId, restaurantName, product } = route.params || {};
  const isEdit = mode === 'edit';

  const [name, setName] = useState(product?.name || '');
  const [price, setPrice] = useState(
    product?.price !== undefined ? String(product.price) : ''
  );
  const [description, setDescription] = useState(
    product?.description || ''
  );
  const [categoryId, setCategoryId] = useState(
    String(product?.categoryId || '').trim()
  );
  const [image, setImage] = useState(product?.image || '');

  const [categories, setCategories] = useState([]);
  const [isLoadingCategories, setIsLoadingCategories] = useState(true);
  const [categoryLoadError, setCategoryLoadError] = useState('');
  const [isCategoryPickerOpen, setIsCategoryPickerOpen] = useState(false);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const selectedCategory = categories.find(
    (category) => String(category.id) === String(categoryId)
  );

  const loadCategories = useCallback(async () => {
    if (!restaurantId) {
      setCategories([]);
      setCategoryLoadError('Restaurant id is missing.');
      setIsLoadingCategories(false);
      return;
    }

    setIsLoadingCategories(true);
    setCategoryLoadError('');

    try {
      const loadedCategories = normalizeCategories(
        await getMenuCategories(restaurantId)
      );

      setCategories(loadedCategories);

      setCategoryId((currentCategoryId) => {
        if (currentCategoryId) {
          return currentCategoryId;
        }

        const legacyCategoryName = normalizeText(product?.category);

        if (!legacyCategoryName) {
          return '';
        }

        return (
          loadedCategories.find(
            (category) =>
              normalizeText(category.name) === legacyCategoryName
          )?.id || ''
        );
      });
    } catch (requestError) {
      setCategories([]);
      setCategoryLoadError(
        requestError.message || 'Could not load menu categories.'
      );
    } finally {
      setIsLoadingCategories(false);
    }
  }, [product?.category, restaurantId]);

  useFocusEffect(
    useCallback(() => {
      void loadCategories();
    }, [loadCategories])
  );

  function openCategoryManagement() {
    navigation.navigate('MenuCategoryManagement', {
      restaurantId,
      restaurantName,
    });
  }

  function selectCategory(category) {
    setCategoryId(category.id);
    setError('');
    setIsCategoryPickerOpen(false);
  }

  async function handleSave() {
    if (isLoadingCategories) {
      setError('Wait for menu categories to finish loading.');
      return;
    }

    if (categoryLoadError) {
      setError('Menu categories are unavailable. Try refreshing them first.');
      return;
    }

    const validationError = validateProduct({
      name,
      price,
      categoryId,
    });

    if (validationError) {
      setError(validationError);
      return;
    }

    const productData = {
      name: name.trim(),
      price: Number(price),
      description: description.trim(),
      categoryId: String(categoryId).trim(),
      image: image.trim(),
    };

    try {
      setSaving(true);
      setError('');

      if (isEdit) {
        const productId = product?.id || product?._id;

        if (!productId) {
          setError(
            'Cannot update product because product id is missing.'
          );
          return;
        }

        await updateProduct(
          restaurantId,
          productId,
          token,
          productData
        );
      } else {
        await createProduct(restaurantId, token, productData);
      }

      navigation.goBack();
    } catch (requestError) {
      setError(requestError.message || 'Could not save product.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <ScrollView
      contentContainerStyle={styles.container}
      keyboardShouldPersistTaps="handled"
    >
      <Text style={styles.screenTitle}>
        {isEdit ? 'Edit product' : 'Create product'}
      </Text>

      <Text style={styles.subtitle}>{restaurantName}</Text>

      <Text style={styles.label}>Name *</Text>
      <TextInput
        autoCapitalize="sentences"
        editable={!saving}
        onChangeText={setName}
        placeholder="Product name"
        placeholderTextColor={theme.colors.textMuted}
        style={styles.input}
        value={name}
      />

      <Text style={styles.label}>Price *</Text>
      <TextInput
        editable={!saving}
        keyboardType="numeric"
        onChangeText={setPrice}
        placeholder="Price"
        placeholderTextColor={theme.colors.textMuted}
        style={styles.input}
        value={price}
      />

      <View style={styles.categoryHeading}>
        <Text style={styles.label}>Menu category *</Text>

        <TouchableOpacity
          disabled={saving}
          onPress={openCategoryManagement}
          style={styles.manageCategoriesButton}
        >
          <Text style={styles.manageCategoriesButtonText}>
            Manage categories
          </Text>
        </TouchableOpacity>
      </View>

      {isLoadingCategories ? (
        <View style={styles.categoryLoading}>
          <ActivityIndicator
            color={theme.colors.primary}
            size="small"
          />
          <Text style={styles.categoryLoadingText}>
            Loading categories...
          </Text>
        </View>
      ) : categoryLoadError ? (
        <View style={styles.categoryErrorBox}>
          <Text style={styles.categoryErrorText}>
            {categoryLoadError}
          </Text>

          <TouchableOpacity
            disabled={saving}
            onPress={() => void loadCategories()}
            style={styles.retryButton}
          >
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : categories.length === 0 ? (
        <View style={styles.emptyCategoryBox}>
          <Text style={styles.emptyCategoryTitle}>
            No menu categories yet.
          </Text>

          <Text style={styles.emptyCategoryText}>
            Create a category before adding a menu item.
          </Text>

          <TouchableOpacity
            disabled={saving}
            onPress={openCategoryManagement}
            style={styles.createCategoryButton}
          >
            <Text style={styles.createCategoryButtonText}>
              Create category
            </Text>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          <TouchableOpacity
            disabled={saving}
            onPress={() => setIsCategoryPickerOpen(true)}
            style={[
              styles.categorySelector,
              error.includes('category')
                ? styles.categorySelectorError
                : null,
              saving ? styles.disabledButton : null,
            ]}
          >
            <View style={styles.categorySelectorText}>
              <Text
                style={
                  selectedCategory
                    ? styles.categorySelectorValue
                    : styles.categorySelectorPlaceholder
                }
              >
                {selectedCategory
                  ? selectedCategory.name
                  : 'Select a category'}
              </Text>

              {selectedCategory ? (
                <Text style={styles.categorySelectorMeta}>
                  {getMenuTypeLabel(selectedCategory.menuType)}
                </Text>
              ) : null}
            </View>

            <Text style={styles.categorySelectorArrow}>⌄</Text>
          </TouchableOpacity>

          {product?.category && !categoryId ? (
            <Text style={styles.legacyCategoryHint}>
              Previous category: {product.category}. Select a current menu
              category before saving.
            </Text>
          ) : null}
        </>
      )}

      <Text style={styles.label}>Image URL</Text>
      <TextInput
        autoCapitalize="none"
        editable={!saving}
        onChangeText={setImage}
        placeholder="https://..."
        placeholderTextColor={theme.colors.textMuted}
        style={styles.input}
        value={image}
      />

      <Text style={styles.label}>Description</Text>
      <TextInput
        editable={!saving}
        multiline
        onChangeText={setDescription}
        placeholder="Product description"
        placeholderTextColor={theme.colors.textMuted}
        style={[styles.input, styles.textArea]}
        value={description}
      />

      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      <View style={styles.actions}>
        <TouchableOpacity
          disabled={
            saving ||
            isLoadingCategories ||
            Boolean(categoryLoadError) ||
            categories.length === 0
          }
          onPress={handleSave}
          style={[
            styles.saveButton,
            saving ||
            isLoadingCategories ||
            Boolean(categoryLoadError) ||
            categories.length === 0
              ? styles.disabledButton
              : null,
          ]}
        >
          <Text style={styles.saveButtonText}>
            {saving
              ? 'Saving...'
              : isEdit
                ? 'Save changes'
                : 'Create product'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          disabled={saving}
          onPress={() => navigation.goBack()}
          style={[
            styles.cancelButton,
            saving ? styles.disabledButton : null,
          ]}
        >
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </TouchableOpacity>
      </View>

      <Modal
        animationType="slide"
        transparent
        visible={isCategoryPickerOpen}
        onRequestClose={() => setIsCategoryPickerOpen(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalEyebrow}>MENU CATEGORY</Text>
            <Text style={styles.modalTitle}>Choose a category</Text>

            <ScrollView
              contentContainerStyle={styles.categoryOptions}
              style={styles.categoryOptionsScroll}
            >
              {categories.map((category) => {
                const isSelected =
                  String(category.id) === String(categoryId);

                return (
                  <TouchableOpacity
                    key={category.id}
                    onPress={() => selectCategory(category)}
                    style={[
                      styles.categoryOption,
                      isSelected
                        ? styles.categoryOptionSelected
                        : null,
                    ]}
                  >
                    <View>
                      <Text
                        style={[
                          styles.categoryOptionName,
                          isSelected
                            ? styles.categoryOptionNameSelected
                            : null,
                        ]}
                      >
                        {category.name}
                      </Text>

                      <Text
                        style={[
                          styles.categoryOptionType,
                          isSelected
                            ? styles.categoryOptionTypeSelected
                            : null,
                        ]}
                      >
                        {getMenuTypeLabel(category.menuType)}
                      </Text>
                    </View>

                    {isSelected ? (
                      <Text style={styles.selectedMark}>✓</Text>
                    ) : null}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            <TouchableOpacity
              onPress={() => setIsCategoryPickerOpen(false)}
              style={styles.modalCancelButton}
            >
              <Text style={styles.modalCancelButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

function createStyles(colors) {
  return StyleSheet.create({
    container: {
      backgroundColor: colors.background,
      flexGrow: 1,
      padding: 16,
    },
    screenTitle: {
      color: colors.text,
      fontSize: 28,
      fontWeight: '800',
    },
    subtitle: {
      color: colors.textMuted,
      marginBottom: 18,
      marginTop: 4,
    },
    label: {
      color: colors.text,
      fontWeight: '800',
      marginBottom: 6,
      marginTop: 12,
    },
    input: {
      backgroundColor: colors.surface,
      borderColor: colors.border,
      borderRadius: 12,
      borderWidth: 1,
      color: colors.text,
      paddingHorizontal: 14,
      paddingVertical: 12,
    },
    textArea: {
      minHeight: 90,
      textAlignVertical: 'top',
    },
    categoryHeading: {
      alignItems: 'center',
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginTop: 12,
    },
    manageCategoriesButton: {
      paddingHorizontal: 4,
      paddingVertical: 6,
    },
    manageCategoriesButtonText: {
      color: colors.primary,
      fontSize: 13,
      fontWeight: '800',
    },
    categoryLoading: {
      alignItems: 'center',
      flexDirection: 'row',
      gap: 8,
      minHeight: 50,
    },
    categoryLoadingText: {
      color: colors.textMuted,
      fontSize: 14,
    },
    categoryErrorBox: {
      backgroundColor: colors.dangerSoft,
      borderRadius: 12,
      gap: 10,
      padding: 12,
    },
    categoryErrorText: {
      color: colors.danger,
      fontSize: 14,
      fontWeight: '700',
      lineHeight: 20,
    },
    retryButton: {
      alignSelf: 'flex-start',
      borderColor: colors.danger,
      borderRadius: 9,
      borderWidth: 1,
      paddingHorizontal: 11,
      paddingVertical: 7,
    },
    retryButtonText: {
      color: colors.danger,
      fontSize: 13,
      fontWeight: '800',
    },
    emptyCategoryBox: {
      backgroundColor: colors.surface,
      borderColor: colors.border,
      borderRadius: 12,
      borderStyle: 'dashed',
      borderWidth: 1,
      gap: 7,
      padding: 14,
    },
    emptyCategoryTitle: {
      color: colors.text,
      fontSize: 16,
      fontWeight: '800',
    },
    emptyCategoryText: {
      color: colors.textMuted,
      fontSize: 14,
      lineHeight: 20,
    },
    createCategoryButton: {
      alignSelf: 'flex-start',
      backgroundColor: colors.primary,
      borderRadius: 10,
      marginTop: 3,
      paddingHorizontal: 12,
      paddingVertical: 9,
    },
    createCategoryButtonText: {
      color: colors.onPrimary,
      fontSize: 13,
      fontWeight: '800',
    },
    categorySelector: {
      alignItems: 'center',
      backgroundColor: colors.surface,
      borderColor: colors.border,
      borderRadius: 12,
      borderWidth: 1,
      flexDirection: 'row',
      justifyContent: 'space-between',
      minHeight: 54,
      paddingHorizontal: 14,
    },
    categorySelectorError: {
      borderColor: colors.danger,
    },
    categorySelectorText: {
      flex: 1,
      gap: 2,
    },
    categorySelectorValue: {
      color: colors.text,
      fontSize: 16,
      fontWeight: '700',
    },
    categorySelectorPlaceholder: {
      color: colors.textMuted,
      fontSize: 16,
    },
    categorySelectorMeta: {
      color: colors.textMuted,
      fontSize: 13,
    },
    categorySelectorArrow: {
      color: colors.primary,
      fontSize: 22,
      fontWeight: '900',
      marginLeft: 12,
    },
    legacyCategoryHint: {
      color: colors.textMuted,
      fontSize: 12,
      lineHeight: 18,
      marginTop: 6,
    },
    errorText: {
      color: colors.danger,
      marginTop: 14,
      textAlign: 'center',
    },
    actions: {
      gap: 10,
      marginTop: 20,
    },
    saveButton: {
      alignItems: 'center',
      backgroundColor: colors.primary,
      borderRadius: 12,
      paddingVertical: 14,
    },
    saveButtonText: {
      color: colors.onPrimary,
      fontWeight: '900',
    },
    cancelButton: {
      alignItems: 'center',
      backgroundColor: colors.surface,
      borderColor: colors.border,
      borderRadius: 12,
      borderWidth: 1,
      paddingVertical: 14,
    },
    cancelButtonText: {
      color: colors.text,
      fontWeight: '800',
    },
    disabledButton: {
      opacity: 0.55,
    },
    modalOverlay: {
      alignItems: 'center',
      backgroundColor: 'rgba(0, 0, 0, 0.55)',
      flex: 1,
      justifyContent: 'center',
      padding: 20,
    },
    modalCard: {
      backgroundColor: colors.surface,
      borderColor: colors.border,
      borderRadius: 18,
      borderWidth: 1,
      maxHeight: '80%',
      maxWidth: 560,
      padding: 20,
      width: '100%',
    },
    modalEyebrow: {
      color: colors.primary,
      fontSize: 11,
      fontWeight: '800',
      letterSpacing: 1,
    },
    modalTitle: {
      color: colors.text,
      fontSize: 22,
      fontWeight: '800',
      marginBottom: 14,
      marginTop: 4,
    },
    categoryOptionsScroll: {
      maxHeight: 360,
    },
    categoryOptions: {
      gap: 8,
    },
    categoryOption: {
      alignItems: 'center',
      borderColor: colors.border,
      borderRadius: 12,
      borderWidth: 1,
      flexDirection: 'row',
      justifyContent: 'space-between',
      padding: 13,
    },
    categoryOptionSelected: {
      backgroundColor: colors.primarySoft,
      borderColor: colors.primary,
    },
    categoryOptionName: {
      color: colors.text,
      fontSize: 16,
      fontWeight: '800',
    },
    categoryOptionNameSelected: {
      color: colors.primary,
    },
    categoryOptionType: {
      color: colors.textMuted,
      fontSize: 13,
      marginTop: 2,
    },
    categoryOptionTypeSelected: {
      color: colors.text,
    },
    selectedMark: {
      color: colors.primary,
      fontSize: 20,
      fontWeight: '900',
      marginLeft: 12,
    },
    modalCancelButton: {
      alignItems: 'center',
      borderColor: colors.border,
      borderRadius: 12,
      borderWidth: 1,
      marginTop: 14,
      paddingVertical: 12,
    },
    modalCancelButtonText: {
      color: colors.text,
      fontWeight: '800',
    },
  });
}