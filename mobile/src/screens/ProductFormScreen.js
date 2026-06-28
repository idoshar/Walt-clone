import { useState } from 'react';
import { useAppTheme } from '../theme/ThemeContext';
import {
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
import { useAuth } from '../auth/AuthContext';

function validateProduct({ name, price }) {
  if (!String(name || '').trim()) return 'Product name is required.';
  if (!String(price || '').trim()) return 'Price is required.';

  const numericPrice = Number(price);
  if (!Number.isFinite(numericPrice) || numericPrice < 0) {
    return 'Price must be a non-negative number.';
  }

  return '';
}

export default function ProductFormScreen({ navigation, route }) {
  const { token } = useAuth();
  const { theme } = useAppTheme();
  const styles = createStyles(theme.colors);
  const { mode, restaurantId, restaurantName, product } = route.params || {};
  const isEdit = mode === 'edit';

  const [name, setName] = useState(product?.name || '');
  const [price, setPrice] = useState(
    product?.price !== undefined ? String(product.price) : ''
  );
  const [description, setDescription] = useState(product?.description || '');
  const [category, setCategory] = useState(product?.category || '');
  const [image, setImage] = useState(product?.image || '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function handleSave() {
    const validationError = validateProduct({
        name,
        price,
    });

    if (validationError) {
      setError(validationError);
      return;
    }

    const productData = {
      name: name.trim(),
      price: Number(price),
      description: description.trim(),
      category: category.trim(),
      image: image.trim(),
    };

    try {
      setSaving(true);
      setError('');

    if (isEdit) {
    const productId = product?.id || product?._id;

    if (!productId) {
        setError('Cannot update product because product id is missing.');
        setSaving(false);
        return;
    }

    console.log({
        restaurantId,
        product,
        productId: product?.id || product?.productId || product?._id,
        token,
    });

    await updateProduct(restaurantId, productId, token, productData);
    } else {
    await createProduct(restaurantId, token, productData);
    }      

      navigation.goBack();
    } catch (err) {
      setError(err.message || 'Could not save product');
    } finally {
      setSaving(false);
    }
  }

  function confirmCancel() {
    navigation.goBack();
    }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.screenTitle}>
        {isEdit ? 'Edit product' : 'Create product'}
      </Text>
      <Text style={styles.subtitle}>{restaurantName}</Text>

      <Text style={styles.label}>Name *</Text>
      <TextInput
        style={styles.input}
        value={name}
        onChangeText={setName}
        placeholder="Product name"
      />

      <Text style={styles.label}>Price *</Text>
      <TextInput
        style={styles.input}
        value={price}
        onChangeText={setPrice}
        placeholder="Price"
        keyboardType="numeric"
      />

      <Text style={styles.label}>Category</Text>
      <TextInput
        style={styles.input}
        value={category}
        onChangeText={setCategory}
        placeholder="Pizza, Burger, Dessert..."
      />

      <Text style={styles.label}>Image URL</Text>
      <TextInput
        style={styles.input}
        value={image}
        onChangeText={setImage}
        placeholder="https://..."
        autoCapitalize="none"
      />

      <Text style={styles.label}>Description</Text>
      <TextInput
        style={[styles.input, styles.textArea]}
        value={description}
        onChangeText={setDescription}
        placeholder="Product description"
        multiline
      />

      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      <View style={styles.actions}>
        <TouchableOpacity
          style={[styles.saveButton, saving ? styles.disabledButton : null]}
          onPress={handleSave}
          disabled={saving}
        >
          <Text style={styles.saveButtonText}>
            {saving ? 'Saving...' : isEdit ? 'Save changes' : 'Create product'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.cancelButton} onPress={confirmCancel}>
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

function createStyles(colors) {
  return StyleSheet.create({
    container: {
      flexGrow: 1,
      padding: 16,
      backgroundColor: colors.background,
    },
    screenTitle: {
      fontSize: 28,
      fontWeight: '800',
      color: colors.text,
    },
    subtitle: {
      marginTop: 4,
      marginBottom: 18,
      color: colors.textMuted,
    },
    label: {
      marginTop: 12,
      marginBottom: 6,
      fontWeight: '800',
      color: colors.text,
    },
    input: {
      backgroundColor: colors.surface,
      color: colors.text,
      borderColor: colors.border,
      borderWidth: 1,
      borderRadius: 12,
      paddingHorizontal: 14,
      paddingVertical: 12,
    },
    textArea: {
      minHeight: 90,
      textAlignVertical: 'top',
    },
    errorText: {
      color: colors.danger,
      textAlign: 'center',
      marginTop: 14,
    },
    actions: {
      marginTop: 20,
      gap: 10,
    },
    saveButton: {
      backgroundColor: colors.primary,
      borderRadius: 12,
      paddingVertical: 14,
      alignItems: 'center',
    },
    saveButtonText: {
      color: colors.onPrimary,
      fontWeight: '900',
    },
    cancelButton: {
      backgroundColor: colors.surface,
      borderColor: colors.border,
      borderWidth: 1,
      borderRadius: 12,
      paddingVertical: 14,
      alignItems: 'center',
    },
    cancelButtonText: {
      color: colors.text,
      fontWeight: '800',
    },
    disabledButton: {
      opacity: 0.6,
    },
  });
}