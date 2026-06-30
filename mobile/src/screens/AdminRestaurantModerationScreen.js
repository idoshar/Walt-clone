import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import {
  deleteAdminRestaurant,
  getAdminRestaurants,
  updateAdminRestaurant,
} from '../api/adminRestaurantModeration';
import { useAuth } from '../auth/AuthContext';
import AppCard from '../components/AppCard';
import { useAppTheme } from '../theme/ThemeContext';

function buildDraft(restaurant) {
  return {
    name: restaurant?.name ?? '',
    address: restaurant?.address ?? '',
    phone: restaurant?.phone ?? '',
    cuisine: restaurant?.cuisine ?? '',
    description: restaurant?.description ?? '',
    image: restaurant?.image ?? '',
    latitude:
      restaurant?.latitude === null || restaurant?.latitude === undefined
        ? ''
        : String(restaurant.latitude),
    longitude:
      restaurant?.longitude === null || restaurant?.longitude === undefined
        ? ''
        : String(restaurant.longitude),
  };
}

function getOwnershipLabel(ownershipStatus) {
  if (ownershipStatus === 'user-owned') {
    return 'User-owned';
  }

  if (ownershipStatus === 'unassigned') {
    return 'No assigned owner';
  }

  return 'System catalog';
}

function getRestaurantMeta(restaurant) {
  const productCount = Number(restaurant?.productCount || 0);

  return `${productCount} ${
    productCount === 1 ? 'menu item' : 'menu items'
  } · ${getOwnershipLabel(restaurant?.ownershipStatus)}`;
}

export default function AdminRestaurantModerationScreen() {
  const { token } = useAuth();
  const { theme } = useAppTheme();
  const styles = useMemo(() => createStyles(theme.colors), [theme.colors]);

  const [restaurants, setRestaurants] = useState([]);
  const [selectedRestaurantId, setSelectedRestaurantId] = useState('');
  const [draft, setDraft] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isProtectedExpanded, setIsProtectedExpanded] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const manageableRestaurants = useMemo(
    () =>
      restaurants.filter(
        (restaurant) => restaurant?.isModerationProtected !== true
      ),
    [restaurants]
  );

  const protectedRestaurants = useMemo(
    () =>
      restaurants.filter(
        (restaurant) => restaurant?.isModerationProtected === true
      ),
    [restaurants]
  );

  const selectedRestaurant = useMemo(
    () =>
      manageableRestaurants.find(
        (restaurant) =>
          String(restaurant.id) === String(selectedRestaurantId)
      ) || null,
    [manageableRestaurants, selectedRestaurantId]
  );

  const loadRestaurants = useCallback(
    async ({ refreshing = false, preferredRestaurantId = '' } = {}) => {
      if (refreshing) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }

      setError('');

      try {
        const data = await getAdminRestaurants(token);
        const nextRestaurants = Array.isArray(data) ? data : [];

        setRestaurants(nextRestaurants);

        const nextSelectedRestaurant = preferredRestaurantId
          ? nextRestaurants.find(
              (restaurant) =>
                restaurant?.isModerationProtected !== true &&
                String(restaurant.id) === String(preferredRestaurantId)
            ) || null
          : null;

        setSelectedRestaurantId(nextSelectedRestaurant?.id || '');
        setDraft(
          nextSelectedRestaurant ? buildDraft(nextSelectedRestaurant) : null
        );
      } catch (loadError) {
        setError(
          loadError.message ||
            'Could not load restaurants for administrator moderation.'
        );
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [token]
  );

  useEffect(() => {
    loadRestaurants();
  }, [loadRestaurants]);

  function selectRestaurant(restaurant) {
    setSelectedRestaurantId(restaurant.id);
    setDraft(buildDraft(restaurant));
    setError('');
    setNotice('');
  }

  function closeEditor() {
    setSelectedRestaurantId('');
    setDraft(null);
    setError('');
  }

  function updateDraftField(field, value) {
    setDraft((currentDraft) => ({
      ...currentDraft,
      [field]: value,
    }));
  }

  async function handleSave() {
    if (!selectedRestaurant || !draft) {
      return;
    }

    const latitudeText = String(draft.latitude || '').trim();
    const longitudeText = String(draft.longitude || '').trim();

    if ((latitudeText && !longitudeText) || (!latitudeText && longitudeText)) {
      setError('Latitude and longitude must be provided together.');
      return;
    }

    const updates = {
      name: String(draft.name || '').trim(),
      address: String(draft.address || '').trim(),
      phone: String(draft.phone || '').trim(),
      cuisine: String(draft.cuisine || '').trim(),
      description: String(draft.description || '').trim(),
      image: String(draft.image || '').trim(),
    };

    if (!updates.name) {
      setError('Restaurant name is required.');
      return;
    }

    if (!latitudeText && !longitudeText) {
      updates.latitude = null;
      updates.longitude = null;
    } else {
      const latitude = Number(latitudeText);
      const longitude = Number(longitudeText);

      if (
        !Number.isFinite(latitude) ||
        latitude < -90 ||
        latitude > 90
      ) {
        setError('Latitude must be a number between -90 and 90.');
        return;
      }

      if (
        !Number.isFinite(longitude) ||
        longitude < -180 ||
        longitude > 180
      ) {
        setError('Longitude must be a number between -180 and 180.');
        return;
      }

      updates.latitude = latitude;
      updates.longitude = longitude;
    }

    setIsSaving(true);
    setError('');
    setNotice('');

    try {
      const updatedRestaurant = await updateAdminRestaurant(
        selectedRestaurant.id,
        updates,
        token
      );

      await loadRestaurants({ refreshing: true });
      setNotice(`Saved changes for ${updatedRestaurant.name}.`);
    } catch (saveError) {
      setError(
        saveError.message || 'Could not save the restaurant changes.'
      );
    } finally {
      setIsSaving(false);
    }
  }

  function handleDelete() {
    if (!selectedRestaurant) {
      return;
    }

    Alert.alert(
      'Delete restaurant?',
      `"${selectedRestaurant.name}" and all of its menu categories and products will be deleted. Existing order snapshots will remain.`,
      [
        {
          style: 'cancel',
          text: 'Cancel',
        },
        {
          style: 'destructive',
          text: 'Delete',
          onPress: () => {
            void confirmDelete();
          },
        },
      ]
    );
  }

  async function confirmDelete() {
    if (!selectedRestaurant) {
      return;
    }

    const deletedName = selectedRestaurant.name;

    setIsSaving(true);
    setError('');
    setNotice('');

    try {
      await deleteAdminRestaurant(selectedRestaurant.id, token);
      await loadRestaurants({ refreshing: true });
      setNotice(`Deleted ${deletedName}.`);
    } catch (deleteError) {
      setError(
        deleteError.message || 'Could not delete the restaurant.'
      );
    } finally {
      setIsSaving(false);
    }
  }

  if (isLoading) {
    return (
      <SafeAreaView style={styles.center}>
        <ActivityIndicator color={theme.colors.primary} size="large" />
        <Text style={styles.stateText}>Loading moderation data...</Text>
      </SafeAreaView>
    );
  }

  if (error && restaurants.length === 0) {
    return (
      <SafeAreaView style={styles.center}>
        <Text style={styles.errorTitle}>Could not load moderation data</Text>
        <Text style={styles.errorText}>{error}</Text>

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

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={() => loadRestaurants({ refreshing: true })}
            tintColor={theme.colors.primary}
          />
        }
      >
        <View style={styles.headerRow}>
          <View style={styles.headerText}>
            <Text style={styles.eyebrow}>ADMINISTRATION</Text>
            <Text style={styles.title}>Restaurant moderation</Text>
            <Text style={styles.subtitle}>
              Review platform restaurants. Catalog entries stay visible but are
              protected from edits and deletion.
            </Text>
          </View>

          <Pressable
            style={({ pressed }) => [
              styles.refreshButton,
              pressed ? styles.pressed : null,
            ]}
            disabled={isSaving}
            onPress={() => loadRestaurants({ refreshing: true })}
          >
            <Text style={styles.refreshButtonText}>Refresh</Text>
          </Pressable>
        </View>

        {error ? (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        {notice ? (
          <View style={styles.noticeBox}>
            <Text style={styles.noticeText}>{notice}</Text>
          </View>
        ) : null}

        <View style={styles.summaryRow}>
          <AppCard style={styles.summaryCard}>
            <Text style={styles.summaryNumber}>
              {manageableRestaurants.length}
            </Text>
            <Text style={styles.summaryLabel}>Manageable restaurants</Text>
          </AppCard>

          <AppCard style={styles.summaryCard}>
            <Text style={styles.summaryNumber}>
              {protectedRestaurants.length}
            </Text>
            <Text style={styles.summaryLabel}>Protected catalog entries</Text>
          </AppCard>
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Manageable restaurants</Text>
          <Text style={styles.sectionDescription}>
            Select a non-system restaurant to review or edit it.
          </Text>
        </View>

        {manageableRestaurants.length === 0 ? (
          <AppCard style={styles.emptyCard}>
            <Text style={styles.emptyTitle}>No manageable restaurants yet</Text>
            <Text style={styles.emptyText}>
              Restaurants created outside the system catalog will appear here.
            </Text>
          </AppCard>
        ) : (
          <View style={styles.list}>
            {manageableRestaurants.map((restaurant) => {
              const isSelected =
                String(restaurant.id) === String(selectedRestaurantId);

              return (
                <AppCard
                  key={restaurant.id}
                  style={[
                    styles.restaurantCard,
                    isSelected ? styles.selectedRestaurantCard : null,
                  ]}
                >
                  <View style={styles.restaurantText}>
                    <Text numberOfLines={1} style={styles.restaurantName}>
                      {restaurant.name}
                    </Text>

                    <Text style={styles.restaurantDetails}>
                      {restaurant.cuisine || 'Cuisine not specified'} ·{' '}
                      {restaurant.address || 'Address not specified'}
                    </Text>

                    <Text style={styles.restaurantMeta}>
                      {getRestaurantMeta(restaurant)}
                    </Text>
                  </View>

                  <Pressable
                    style={({ pressed }) => [
                      styles.primaryButton,
                      pressed ? styles.pressed : null,
                    ]}
                    onPress={() => selectRestaurant(restaurant)}
                  >
                    <Text style={styles.primaryButtonText}>
                      {isSelected ? 'Editing' : 'Edit'}
                    </Text>
                  </Pressable>
                </AppCard>
              );
            })}
          </View>
        )}

        <Pressable
          style={({ pressed }) => [
            styles.protectedToggle,
            pressed ? styles.pressed : null,
          ]}
          onPress={() => setIsProtectedExpanded((current) => !current)}
        >
          <Text style={styles.protectedToggleText}>
            {isProtectedExpanded ? 'Hide' : 'View'} protected system catalog (
            {protectedRestaurants.length})
          </Text>
        </Pressable>

        {isProtectedExpanded ? (
          <View style={styles.list}>
            <Text style={styles.protectedExplanation}>
              These starter restaurants are restored from the catalog when the
              server starts, so they cannot be edited or removed here.
            </Text>

            {protectedRestaurants.map((restaurant) => (
              <AppCard key={restaurant.id} style={styles.protectedCard}>
                <View style={styles.restaurantText}>
                  <Text numberOfLines={1} style={styles.restaurantName}>
                    {restaurant.name}
                  </Text>

                  <Text style={styles.restaurantDetails}>
                    {restaurant.cuisine || 'Cuisine not specified'} ·{' '}
                    {restaurant.address || 'Address not specified'}
                  </Text>

                  <Text style={styles.restaurantMeta}>
                    {getRestaurantMeta(restaurant)}
                  </Text>
                </View>

                <View style={styles.protectedBadge}>
                  <Text style={styles.protectedBadgeText}>Protected</Text>
                </View>
              </AppCard>
            ))}
          </View>
        ) : null}

      {selectedRestaurant && draft ? (
        <Modal
          animationType="slide"
          onRequestClose={closeEditor}
          transparent
          visible
        >
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            style={styles.modalBackdrop}
          >
            <Pressable
              onPress={closeEditor}
              style={styles.modalDismissArea}
            />

            <View style={styles.modalSheet}>
              <ScrollView
                contentContainerStyle={styles.modalContent}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
              >
                <View style={styles.modalHeader}>
                  <View style={styles.modalHeaderText}>
                    <Text style={styles.modalEyebrow}>ADMINISTRATION</Text>
                    <Text style={styles.modalTitle}>Edit restaurant</Text>
                  </View>

                  <Pressable
                    accessibilityLabel="Close restaurant editor"
                    style={({ pressed }) => [
                      styles.modalCloseButton,
                      pressed ? styles.pressed : null,
                    ]}
                    disabled={isSaving}
                    onPress={closeEditor}
                  >
                    <Text style={styles.modalCloseButtonText}>Close</Text>
                  </Pressable>
                </View>

                <Text style={styles.editorDescription}>
                  Ownership, sponsorship and catalog-protection fields cannot be
                  changed here.
                </Text>

                {error ? (
                  <View style={styles.modalErrorBox}>
                    <Text style={styles.modalErrorText}>{error}</Text>
                  </View>
                ) : null}

                <Field
                  label="Name"
                  value={draft.name}
                  onChangeText={(value) => updateDraftField('name', value)}
                  styles={styles}
                />

                <Field
                  label="Cuisine"
                  value={draft.cuisine}
                  onChangeText={(value) => updateDraftField('cuisine', value)}
                  styles={styles}
                />

                <Field
                  label="Address"
                  value={draft.address}
                  onChangeText={(value) => updateDraftField('address', value)}
                  styles={styles}
                />

                <Field
                  label="Phone"
                  value={draft.phone}
                  onChangeText={(value) => updateDraftField('phone', value)}
                  styles={styles}
                />

                <Field
                  label="Image URL"
                  value={draft.image}
                  onChangeText={(value) => updateDraftField('image', value)}
                  styles={styles}
                  autoCapitalize="none"
                  autoCorrect={false}
                />

                <View style={styles.coordinateRow}>
                  <View style={styles.coordinateField}>
                    <Field
                      label="Latitude"
                      value={draft.latitude}
                      onChangeText={(value) =>
                        updateDraftField('latitude', value)
                      }
                      styles={styles}
                      keyboardType="decimal-pad"
                    />
                  </View>

                  <View style={styles.coordinateField}>
                    <Field
                      label="Longitude"
                      value={draft.longitude}
                      onChangeText={(value) =>
                        updateDraftField('longitude', value)
                      }
                      styles={styles}
                      keyboardType="decimal-pad"
                    />
                  </View>
                </View>

                <Text style={styles.fieldLabel}>Description</Text>
                <TextInput
                  multiline
                  numberOfLines={4}
                  style={[styles.input, styles.descriptionInput]}
                  value={draft.description}
                  onChangeText={(value) => updateDraftField('description', value)}
                  placeholder="Restaurant description"
                  placeholderTextColor={theme.colors.textMuted}
                  textAlignVertical="top"
                />

                <View style={styles.editorActions}>
                  <Pressable
                    style={({ pressed }) => [
                      styles.secondaryButton,
                      pressed ? styles.pressed : null,
                    ]}
                    disabled={isSaving}
                    onPress={closeEditor}
                  >
                    <Text style={styles.secondaryButtonText}>Cancel</Text>
                  </Pressable>

                  <Pressable
                    style={({ pressed }) => [
                      styles.primaryButton,
                      pressed ? styles.pressed : null,
                      isSaving ? styles.disabledButton : null,
                    ]}
                    disabled={isSaving}
                    onPress={handleSave}
                  >
                    <Text style={styles.primaryButtonText}>
                      {isSaving ? 'Saving...' : 'Save changes'}
                    </Text>
                  </Pressable>

                  <Pressable
                    style={({ pressed }) => [
                      styles.dangerButton,
                      pressed ? styles.pressed : null,
                      isSaving ? styles.disabledButton : null,
                    ]}
                    disabled={isSaving}
                    onPress={handleDelete}
                  >
                    <Text style={styles.dangerButtonText}>Delete</Text>
                  </Pressable>
                </View>
              </ScrollView>
            </View>
          </KeyboardAvoidingView>
        </Modal>
      ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

function Field({
  label,
  value,
  onChangeText,
  styles,
  keyboardType = 'default',
  autoCapitalize = 'sentences',
  autoCorrect = true,
}) {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        autoCapitalize={autoCapitalize}
        autoCorrect={autoCorrect}
        keyboardType={keyboardType}
        style={styles.input}
        value={value}
        onChangeText={onChangeText}
      />
    </View>
  );
}

function createStyles(colors) {
  return StyleSheet.create({
    safeArea: {
      backgroundColor: colors.background,
      flex: 1,
    },
    center: {
      alignItems: 'center',
      backgroundColor: colors.background,
      flex: 1,
      gap: 12,
      justifyContent: 'center',
      padding: 24,
    },
    content: {
      gap: 16,
      padding: 20,
      paddingBottom: 44,
    },
    headerRow: {
      alignItems: 'flex-start',
      flexDirection: 'row',
      gap: 14,
      justifyContent: 'space-between',
    },
    headerText: {
      flex: 1,
    },
    eyebrow: {
      color: colors.primary,
      fontSize: 12,
      fontWeight: '800',
      letterSpacing: 1.1,
      marginBottom: 6,
    },
    title: {
      color: colors.text,
      fontSize: 29,
      fontWeight: '800',
      letterSpacing: -0.5,
    },
    subtitle: {
      color: colors.textMuted,
      fontSize: 15,
      lineHeight: 22,
      marginTop: 8,
    },
    refreshButton: {
      borderColor: colors.border,
      borderRadius: 10,
      borderWidth: 1,
      paddingHorizontal: 11,
      paddingVertical: 9,
    },
    refreshButtonText: {
      color: colors.text,
      fontSize: 13,
      fontWeight: '800',
    },
    errorBox: {
      backgroundColor: colors.dangerSoft || '#fff0f0',
      borderColor: colors.danger || '#b00020',
      borderRadius: 12,
      borderWidth: 1,
      padding: 13,
    },
    errorTitle: {
      color: colors.text,
      fontSize: 20,
      fontWeight: '800',
      textAlign: 'center',
    },
    errorText: {
      color: colors.danger || '#b00020',
      fontSize: 14,
      lineHeight: 20,
      textAlign: 'center',
    },
    noticeBox: {
      backgroundColor: colors.primarySoft,
      borderColor: colors.border,
      borderRadius: 12,
      borderWidth: 1,
      padding: 13,
    },
    noticeText: {
      color: colors.text,
      fontSize: 14,
      fontWeight: '700',
    },
    stateText: {
      color: colors.textMuted,
      fontSize: 15,
    },
    summaryRow: {
      flexDirection: 'row',
      gap: 12,
    },
    summaryCard: {
      flex: 1,
      gap: 5,
      padding: 16,
    },
    summaryNumber: {
      color: colors.primary,
      fontSize: 28,
      fontWeight: '800',
    },
    summaryLabel: {
      color: colors.textMuted,
      fontSize: 12,
      fontWeight: '700',
      lineHeight: 17,
    },
    sectionHeader: {
      gap: 5,
      marginTop: 8,
    },
    sectionTitle: {
      color: colors.text,
      fontSize: 21,
      fontWeight: '800',
    },
    sectionDescription: {
      color: colors.textMuted,
      fontSize: 14,
      lineHeight: 20,
    },
    list: {
      gap: 10,
    },
    restaurantCard: {
      alignItems: 'center',
      flexDirection: 'row',
      gap: 12,
      justifyContent: 'space-between',
      padding: 15,
    },
    selectedRestaurantCard: {
      borderColor: colors.primary,
      borderWidth: 2,
    },
    protectedCard: {
      alignItems: 'center',
      flexDirection: 'row',
      gap: 12,
      justifyContent: 'space-between',
      opacity: 0.88,
      padding: 15,
    },
    restaurantText: {
      flex: 1,
      gap: 4,
    },
    restaurantName: {
      color: colors.text,
      fontSize: 17,
      fontWeight: '800',
    },
    restaurantDetails: {
      color: colors.textMuted,
      fontSize: 13,
      lineHeight: 18,
    },
    restaurantMeta: {
      color: colors.textMuted,
      fontSize: 12,
    },
    emptyCard: {
      gap: 7,
      padding: 18,
    },
    emptyTitle: {
      color: colors.text,
      fontSize: 16,
      fontWeight: '800',
    },
    emptyText: {
      color: colors.textMuted,
      fontSize: 14,
      lineHeight: 20,
    },
    protectedToggle: {
      alignSelf: 'flex-start',
      marginTop: 10,
      paddingVertical: 8,
    },
    protectedToggleText: {
      color: colors.primary,
      fontSize: 14,
      fontWeight: '800',
    },
    protectedExplanation: {
      color: colors.textMuted,
      fontSize: 13,
      lineHeight: 19,
      marginBottom: 4,
    },
    protectedBadge: {
      backgroundColor: colors.primarySoft,
      borderRadius: 999,
      paddingHorizontal: 9,
      paddingVertical: 6,
    },
    protectedBadgeText: {
      color: colors.primary,
      fontSize: 11,
      fontWeight: '800',
    },
    modalBackdrop: {
      alignItems: 'center',
      backgroundColor: 'rgba(0, 0, 0, 0.56)',
      flex: 1,
      justifyContent: 'center',
      padding: 16,
    },
    modalDismissArea: {
      ...StyleSheet.absoluteFillObject,
    },
    modalSheet: {
      backgroundColor: colors.surface,
      borderColor: colors.border,
      borderRadius: 18,
      borderWidth: 1,
      maxHeight: '90%',
      maxWidth: 640,
      width: '100%',
    },
    modalContent: {
      gap: 12,
      padding: 20,
      paddingBottom: 24,
    },
    modalHeader: {
      alignItems: 'flex-start',
      flexDirection: 'row',
      gap: 12,
      justifyContent: 'space-between',
    },
    modalHeaderText: {
      flex: 1,
    },
    modalEyebrow: {
      color: colors.primary,
      fontSize: 11,
      fontWeight: '800',
      letterSpacing: 1,
    },
    modalTitle: {
      color: colors.text,
      fontSize: 24,
      fontWeight: '800',
      marginTop: 4,
    },
    modalCloseButton: {
      borderColor: colors.border,
      borderRadius: 10,
      borderWidth: 1,
      paddingHorizontal: 11,
      paddingVertical: 8,
    },
    modalCloseButtonText: {
      color: colors.text,
      fontSize: 13,
      fontWeight: '800',
    },
    modalErrorBox: {
      backgroundColor: colors.dangerSoft || '#fff0f0',
      borderColor: colors.danger || '#b00020',
      borderRadius: 12,
      borderWidth: 1,
      padding: 12,
    },
    modalErrorText: {
      color: colors.danger || '#b00020',
      fontSize: 14,
      lineHeight: 20,
    },
    editorDescription: {
      color: colors.textMuted,
      fontSize: 13,
      lineHeight: 19,
      marginBottom: 4,
    },
    field: {
      gap: 6,
    },
    fieldLabel: {
      color: colors.text,
      fontSize: 13,
      fontWeight: '800',
    },
    input: {
      backgroundColor: colors.background,
      borderColor: colors.border,
      borderRadius: 10,
      borderWidth: 1,
      color: colors.text,
      fontSize: 15,
      paddingHorizontal: 12,
      paddingVertical: 10,
    },
    descriptionInput: {
      minHeight: 100,
    },
    coordinateRow: {
      flexDirection: 'row',
      gap: 10,
    },
    coordinateField: {
      flex: 1,
    },
    editorActions: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 9,
      marginTop: 6,
    },
    primaryButton: {
      alignItems: 'center',
      backgroundColor: colors.primary,
      borderRadius: 10,
      justifyContent: 'center',
      paddingHorizontal: 13,
      paddingVertical: 10,
    },
    primaryButtonText: {
      color: '#fff',
      fontSize: 13,
      fontWeight: '800',
    },
    secondaryButton: {
      alignItems: 'center',
      borderColor: colors.border,
      borderRadius: 10,
      borderWidth: 1,
      justifyContent: 'center',
      paddingHorizontal: 13,
      paddingVertical: 10,
    },
    secondaryButtonText: {
      color: colors.text,
      fontSize: 13,
      fontWeight: '800',
    },
    dangerButton: {
      alignItems: 'center',
      borderColor: colors.danger || '#b00020',
      borderRadius: 10,
      borderWidth: 1,
      justifyContent: 'center',
      paddingHorizontal: 13,
      paddingVertical: 10,
    },
    dangerButtonText: {
      color: colors.danger || '#b00020',
      fontSize: 13,
      fontWeight: '800',
    },
    pressed: {
      opacity: 0.78,
    },
    disabledButton: {
      opacity: 0.55,
    },
  });
}
