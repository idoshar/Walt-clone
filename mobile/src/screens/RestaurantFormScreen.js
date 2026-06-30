import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import {
  createRestaurant,
  deleteRestaurant,
  updateRestaurant,
} from '../api/restaurants';
import {
  deleteAdminRestaurant,
  updateAdminRestaurant,
} from '../api/adminRestaurantModeration';
import { useAuth } from '../auth/AuthContext';
import { useAppTheme } from '../theme/ThemeContext';

// ─── Validation ──────────────────────────────────────────────────────────────

function validateFields(fields) {
  const errors = {};

  if (!fields.name.trim()) {
    errors.name = 'Restaurant name is required.';
  } else if (fields.name.trim().length < 2) {
    errors.name = 'Name must be at least 2 characters.';
  }

  if (fields.phone.trim() && !/^[\d\s\-+()]{7,15}$/.test(fields.phone.trim())) {
    errors.phone = 'Enter a valid phone number (7–15 digits).';
  }

  if (fields.latitude.trim()) {
    const lat = Number(fields.latitude);
    if (!Number.isFinite(lat) || lat < -90 || lat > 90) {
      errors.latitude = 'Latitude must be between -90 and 90.';
    }
  }

  if (fields.longitude.trim()) {
    const lng = Number(fields.longitude);
    if (!Number.isFinite(lng) || lng < -180 || lng > 180) {
      errors.longitude = 'Longitude must be between -180 and 180.';
    }
  }

  if (
    (fields.latitude.trim() && !fields.longitude.trim()) ||
    (!fields.latitude.trim() && fields.longitude.trim())
  ) {
    errors.latitude = 'Both latitude and longitude must be provided together.';
    errors.longitude = 'Both latitude and longitude must be provided together.';
  }

  return errors;
}

// ─── Field component ─────────────────────────────────────────────────────────

function Field({ label, error, required, children }) {
  return (
    <View style={fieldStyles.wrapper}>
      <Text style={fieldStyles.label}>
        {label}
        {required ? <Text style={fieldStyles.required}> *</Text> : null}
      </Text>
      {children}
      {error ? <Text style={fieldStyles.error}>{error}</Text> : null}
    </View>
  );
}

const fieldStyles = StyleSheet.create({
  wrapper: { gap: 4 },
  label: { fontSize: 13, fontWeight: '700', color: '#374151' },
  required: { color: '#e53e3e' },
  error: { fontSize: 12, color: '#b00020', marginTop: 2 },
});

// ─── Main screen ─────────────────────────────────────────────────────────────

export default function RestaurantFormScreen({ navigation, route }) {
  const { token } = useAuth();
  const { theme } = useAppTheme();
  const styles = useMemo(() => createStyles(theme.colors), [theme.colors]);

  // If `restaurant` param is passed → edit mode; otherwise → create mode
  const existing = route.params?.restaurant || null;
  const isEditing = Boolean(existing);
  const adminMode = route.params?.adminMode === true;
  const canDelete = Boolean(
    existing &&
      !existing.isDefault &&
      (existing.accessRole === 'owner' || adminMode)
  );

  const [fields, setFields] = useState({
    name: existing?.name || '',
    address: existing?.address || '',
    phone: existing?.phone || '',
    cuisine: existing?.cuisine || '',
    description: existing?.description || '',
    image: existing?.image || '',
    latitude: existing?.latitude != null ? String(existing.latitude) : '',
    longitude: existing?.longitude != null ? String(existing.longitude) : '',
  });

  const [errors, setErrors] = useState({});
  const [submitState, setSubmitState] = useState('idle'); // idle | loading | error
  const [submitError, setSubmitError] = useState('');
  const [deleteState, setDeleteState] = useState('idle');

  useEffect(() => {
    navigation.setOptions({
      title: isEditing ? 'Edit Restaurant' : 'New Restaurant',
    });
  }, [isEditing, navigation]);

  const set = useCallback((key, value) => {
    setFields((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: undefined }));
  }, []);

  const handleSubmit = useCallback(async () => {
    const validationErrors = validateFields(fields);

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setSubmitState('loading');
    setSubmitError('');

    const body = {
      name: fields.name.trim(),
      address: fields.address.trim(),
      phone: fields.phone.trim(),
      cuisine: fields.cuisine.trim(),
      description: fields.description.trim(),
      image: fields.image.trim(),
    };

    if (fields.latitude.trim() && fields.longitude.trim()) {
      body.latitude = Number(fields.latitude);
      body.longitude = Number(fields.longitude);
    }

    try {
      if (isEditing) {
        if (adminMode) {
          await updateAdminRestaurant(existing.id, body, token);
        } else {
          await updateRestaurant(existing.id, body, token);
        }
      } else {
        await createRestaurant(body, token);
      }

      navigation.goBack();
    } catch (err) {
      setSubmitState('error');
      setSubmitError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setSubmitState((s) => (s === 'loading' ? 'idle' : s));
    }
  }, [adminMode, fields, isEditing, existing, token, navigation]);

  const handleDelete = useCallback(() => {
    Alert.alert(
      'Delete Restaurant',
      `Are you sure you want to delete "${existing?.name}"? This will also remove all its products.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setDeleteState('loading');
            try {
              if (adminMode) {
                await deleteAdminRestaurant(existing.id, token);
              } else {
                await deleteRestaurant(existing.id, token);
              }
              navigation.goBack();
            } catch (err) {
              setDeleteState('idle');
              Alert.alert(
                'Could not delete',
                err.message || 'Something went wrong. Please try again.'
              );
            }
          },
        },
      ]
    );
  }, [adminMode, existing, token, navigation]);

  const isSubmitting = submitState === 'loading';
  const isDeleting = deleteState === 'loading';

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={styles.screenTitle}>
            {isEditing ? 'Edit Restaurant' : 'Create Restaurant'}
          </Text>
          <Text style={styles.screenSubtitle}>
            {isEditing
              ? 'Update your restaurant details below.'
              : 'Fill in your restaurant details. Name is required.'}
          </Text>

          {/* ── Fields ── */}
          <View style={styles.form}>
            <Field label="Restaurant name" error={errors.name} required>
              <TextInput
                style={[styles.input, errors.name ? styles.inputError : null]}
                placeholder="e.g. Pizza Roma"
                placeholderTextColor={theme.colors.textMuted}
                value={fields.name}
                onChangeText={(v) => set('name', v)}
                returnKeyType="next"
                autoCapitalize="words"
              />
            </Field>

            <Field label="Cuisine type" error={errors.cuisine}>
              <TextInput
                style={[styles.input, errors.cuisine ? styles.inputError : null]}
                placeholder="e.g. Italian, Japanese, American"
                placeholderTextColor={theme.colors.textMuted}
                value={fields.cuisine}
                onChangeText={(v) => set('cuisine', v)}
                returnKeyType="next"
                autoCapitalize="words"
              />
            </Field>

            <Field label="Address" error={errors.address}>
              <TextInput
                style={[styles.input, errors.address ? styles.inputError : null]}
                placeholder="e.g. Herzl 10, Tel Aviv"
                placeholderTextColor={theme.colors.textMuted}
                value={fields.address}
                onChangeText={(v) => set('address', v)}
                returnKeyType="next"
              />
            </Field>

            <Field label="Phone" error={errors.phone}>
              <TextInput
                style={[styles.input, errors.phone ? styles.inputError : null]}
                placeholder="e.g. 03-1234567"
                placeholderTextColor={theme.colors.textMuted}
                value={fields.phone}
                onChangeText={(v) => set('phone', v)}
                keyboardType="phone-pad"
                returnKeyType="next"
              />
            </Field>

            <Field label="Description" error={errors.description}>
              <TextInput
                style={[
                  styles.input,
                  styles.textArea,
                  errors.description ? styles.inputError : null,
                ]}
                placeholder="Describe your restaurant..."
                placeholderTextColor={theme.colors.textMuted}
                value={fields.description}
                onChangeText={(v) => set('description', v)}
                multiline
                numberOfLines={3}
              />
            </Field>

            <Field label="Image URL" error={errors.image}>
              <TextInput
                style={[styles.input, errors.image ? styles.inputError : null]}
                placeholder="https://example.com/image.jpg"
                placeholderTextColor={theme.colors.textMuted}
                value={fields.image}
                onChangeText={(v) => set('image', v)}
                keyboardType="url"
                autoCapitalize="none"
                returnKeyType="next"
              />
            </Field>

            <View style={styles.row}>
              <View style={styles.rowField}>
                <Field label="Latitude" error={errors.latitude}>
                  <TextInput
                    style={[
                      styles.input,
                      errors.latitude ? styles.inputError : null,
                    ]}
                    placeholder="32.0853"
                    placeholderTextColor={theme.colors.textMuted}
                    value={fields.latitude}
                    onChangeText={(v) => set('latitude', v)}
                    keyboardType="decimal-pad"
                    returnKeyType="next"
                  />
                </Field>
              </View>

              <View style={styles.rowField}>
                <Field label="Longitude" error={errors.longitude}>
                  <TextInput
                    style={[
                      styles.input,
                      errors.longitude ? styles.inputError : null,
                    ]}
                    placeholder="34.7818"
                    placeholderTextColor={theme.colors.textMuted}
                    value={fields.longitude}
                    onChangeText={(v) => set('longitude', v)}
                    keyboardType="decimal-pad"
                    returnKeyType="done"
                  />
                </Field>
              </View>
            </View>
          </View>

          {/* ── API error ── */}
          {submitState === 'error' ? (
            <View style={styles.apiError}>
              <Text style={styles.apiErrorText}>⚠️ {submitError}</Text>
            </View>
          ) : null}

          {/* ── Submit ── */}
          <Pressable
            disabled={isSubmitting || isDeleting}
            onPress={handleSubmit}
            style={({ pressed }) => [
              styles.submitButton,
              (isSubmitting || isDeleting) ? styles.disabledButton : null,
              pressed ? styles.pressedButton : null,
            ]}
          >
            {isSubmitting ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.submitButtonText}>
                {isEditing ? 'Save changes' : 'Create restaurant'}
              </Text>
            )}
          </Pressable>

          {/* ── Delete (owner only) ── */}
          {canDelete ? (
            <Pressable
              disabled={isSubmitting || isDeleting}
              onPress={handleDelete}
              style={({ pressed }) => [
                styles.deleteButton,
                (isSubmitting || isDeleting) ? styles.disabledButton : null,
                pressed ? styles.pressedButton : null,
              ]}
            >
              {isDeleting ? (
                <ActivityIndicator color="#b00020" />
              ) : (
                <Text style={styles.deleteButtonText}>Delete restaurant</Text>
              )}
            </Pressable>
          ) : null}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function createStyles(colors) {
  return StyleSheet.create({
    container: { backgroundColor: colors.background, flex: 1 },
    keyboardView: { flex: 1 },
    content: { gap: 16, padding: 20, paddingBottom: 40 },
    screenTitle: {
      color: colors.text,
      fontSize: 26,
      fontWeight: '800',
      letterSpacing: -0.5,
    },
    screenSubtitle: {
      color: colors.textMuted,
      fontSize: 14,
      lineHeight: 20,
      marginTop: 2,
    },
    form: { gap: 14 },
    input: {
      backgroundColor: colors.surface,
      borderColor: colors.border,
      borderRadius: 12,
      borderWidth: 1,
      color: colors.text,
      fontSize: 15,
      paddingHorizontal: 14,
      paddingVertical: 12,
    },
    inputError: { borderColor: '#b00020' },
    textArea: { minHeight: 80, textAlignVertical: 'top' },
    row: { flexDirection: 'row', gap: 12 },
    rowField: { flex: 1 },
    apiError: {
      backgroundColor: '#fef2f2',
      borderColor: '#fca5a5',
      borderRadius: 12,
      borderWidth: 1,
      padding: 14,
    },
    apiErrorText: { color: '#b00020', fontSize: 14, lineHeight: 20 },
    submitButton: {
      alignItems: 'center',
      backgroundColor: colors.primary,
      borderRadius: 14,
      justifyContent: 'center',
      minHeight: 50,
      marginTop: 4,
    },
    submitButtonText: { color: '#fff', fontSize: 16, fontWeight: '800' },
    deleteButton: {
      alignItems: 'center',
      backgroundColor: 'transparent',
      borderColor: '#b00020',
      borderRadius: 14,
      borderWidth: 1,
      justifyContent: 'center',
      minHeight: 50,
    },
    deleteButtonText: { color: '#b00020', fontSize: 16, fontWeight: '800' },
    disabledButton: { opacity: 0.55 },
    pressedButton: { opacity: 0.72 },
  });
}