import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  Pressable,
  RefreshControl,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import {
  createMenuCategory,
  deleteMenuCategory,
  getMenuCategories,
  updateMenuCategory,
  updateMenuCategoryOrder,
} from '../api/menuCategories';
import { useAuth } from '../auth/AuthContext';
import AppCard from '../components/AppCard';
import { useAppTheme } from '../theme/ThemeContext';

const MENU_TYPES = [
  { value: 'main', label: 'Main dish' },
  { value: 'side', label: 'Side dish' },
  { value: 'dessert', label: 'Dessert' },
  { value: 'drink', label: 'Drink' },
  { value: 'other', label: 'Other' },
];

function getMenuTypeLabel(menuType) {
  return (
    MENU_TYPES.find((item) => item.value === menuType)?.label ||
    'Other'
  );
}

function normalizeCategories(value) {
  return Array.isArray(value) ? value : [];
}

export default function MenuCategoryManagementScreen({
  navigation,
  route,
}) {
  const { token } = useAuth();
  const { theme } = useAppTheme();
  const styles = useMemo(
    () => createStyles(theme.colors),
    [theme.colors]
  );

  const { restaurantId, restaurantName } = route.params || {};

  const [categories, setCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [pendingAction, setPendingAction] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const [isCreatorOpen, setIsCreatorOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [newMenuType, setNewMenuType] = useState('main');

  const [editingCategory, setEditingCategory] = useState(null);
  const [editingName, setEditingName] = useState('');
  const [editingMenuType, setEditingMenuType] = useState('main');

  const isBusy = Boolean(pendingAction);

  const loadCategories = useCallback(
    async ({ refreshing = false } = {}) => {
      if (!restaurantId) {
        setCategories([]);
        setError('Restaurant id is missing.');
        setIsLoading(false);
        return;
      }

      if (refreshing) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }

      setError('');

      try {
        const data = await getMenuCategories(restaurantId);
        setCategories(normalizeCategories(data));
      } catch (requestError) {
        setError(
          requestError.message || 'Could not load menu categories.'
        );
      } finally {
        if (refreshing) {
          setIsRefreshing(false);
        } else {
          setIsLoading(false);
        }
      }
    },
    [restaurantId]
  );

  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  function resetCreator() {
    setNewName('');
    setNewMenuType('main');
    setIsCreatorOpen(false);
  }

  function closeEditor() {
    if (isBusy) {
      return;
    }

    setEditingCategory(null);
    setEditingName('');
    setEditingMenuType('main');
  }

  async function handleCreate() {
    const normalizedName = newName.trim();

    if (!normalizedName) {
      setError('Category name is required.');
      return;
    }

    setPendingAction('create');
    setError('');
    setNotice('');

    try {
      await createMenuCategory(restaurantId, token, {
        name: normalizedName,
        menuType: newMenuType,
      });

      resetCreator();
      setNotice(`Created "${normalizedName}".`);
      await loadCategories({ refreshing: true });
    } catch (requestError) {
      setError(
        requestError.message || 'Could not create the menu category.'
      );
    } finally {
      setPendingAction('');
    }
  }

  function openEditor(category) {
    if (isBusy) {
      return;
    }

    setError('');
    setNotice('');
    setEditingCategory(category);
    setEditingName(category.name || '');
    setEditingMenuType(category.menuType || 'main');
  }

  async function handleUpdate() {
    if (!editingCategory) {
      return;
    }

    const normalizedName = editingName.trim();

    if (!normalizedName) {
      setError('Category name is required.');
      return;
    }

    setPendingAction(`update:${editingCategory.id}`);
    setError('');
    setNotice('');

    try {
      await updateMenuCategory(
        restaurantId,
        editingCategory.id,
        token,
        {
          name: normalizedName,
          menuType: editingMenuType,
        }
      );

      closeEditor();
      setNotice(`Updated "${normalizedName}".`);
      await loadCategories({ refreshing: true });
    } catch (requestError) {
      setError(
        requestError.message || 'Could not update the menu category.'
      );
    } finally {
      setPendingAction('');
    }
  }

  async function persistOrder(nextCategories, actionKey) {
    const previousCategories = categories;

    setCategories(nextCategories);
    setPendingAction(actionKey);
    setError('');
    setNotice('');

    try {
      const updatedCategories = await updateMenuCategoryOrder(
        restaurantId,
        token,
        nextCategories.map((category) => category.id)
      );

      setCategories(normalizeCategories(updatedCategories));
      setNotice('Category order updated.');
    } catch (requestError) {
      setCategories(previousCategories);
      setError(
        requestError.message || 'Could not update category order.'
      );
    } finally {
      setPendingAction('');
    }
  }

  function moveCategory(categoryId, direction) {
    if (isBusy) {
      return;
    }

    const currentIndex = categories.findIndex(
      (category) => String(category.id) === String(categoryId)
    );

    if (currentIndex < 0) {
      return;
    }

    const nextIndex = currentIndex + direction;

    if (nextIndex < 0 || nextIndex >= categories.length) {
      return;
    }

    const nextCategories = [...categories];
    const [movedCategory] = nextCategories.splice(currentIndex, 1);

    nextCategories.splice(nextIndex, 0, movedCategory);

    persistOrder(
      nextCategories,
      `order:${categoryId}:${direction}`
    );
  }

  function confirmDelete(category) {
    if (isBusy) {
      return;
    }

    Alert.alert(
      'Delete menu category',
      `Delete "${category.name}"? Categories that still contain menu items cannot be deleted.`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            void handleDelete(category);
          },
        },
      ]
    );
  }

  async function handleDelete(category) {
    setPendingAction(`delete:${category.id}`);
    setError('');
    setNotice('');

    try {
      await deleteMenuCategory(restaurantId, category.id, token);

      setCategories((currentCategories) =>
        currentCategories.filter(
          (currentCategory) =>
            String(currentCategory.id) !== String(category.id)
        )
      );

      setNotice(`Deleted "${category.name}".`);
    } catch (requestError) {
      setError(
        requestError.message ||
          'Could not delete the menu category. Move or delete its items first.'
      );
    } finally {
      setPendingAction('');
    }
  }

  function renderTypePicker(value, onChange) {
    return (
      <View style={styles.typePicker}>
        {MENU_TYPES.map((menuType) => {
          const isSelected = menuType.value === value;

          return (
            <Pressable
              key={menuType.value}
              disabled={isBusy}
              onPress={() => onChange(menuType.value)}
              style={({ pressed }) => [
                styles.typeChip,
                isSelected ? styles.typeChipSelected : null,
                pressed ? styles.pressed : null,
                isBusy ? styles.disabled : null,
              ]}
            >
              <Text
                style={[
                  styles.typeChipText,
                  isSelected ? styles.typeChipTextSelected : null,
                ]}
              >
                {menuType.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    );
  }

  function renderCategory({ item, index }) {
    const isFirst = index === 0;
    const isLast = index === categories.length - 1;

    return (
      <AppCard style={styles.categoryCard}>
        <View style={styles.categoryTopRow}>
          <View style={styles.positionBadge}>
            <Text style={styles.positionText}>{index + 1}</Text>
          </View>

          <View style={styles.categoryDetails}>
            <Text style={styles.categoryName}>{item.name}</Text>
            <Text style={styles.categoryType}>
              {getMenuTypeLabel(item.menuType)}
            </Text>
          </View>
        </View>

        <View style={styles.actions}>
          <Pressable
            accessibilityLabel={`Move ${item.name} up`}
            disabled={isBusy || isFirst}
            onPress={() => moveCategory(item.id, -1)}
            style={({ pressed }) => [
              styles.orderButton,
              isBusy || isFirst ? styles.disabled : null,
              pressed ? styles.pressed : null,
            ]}
          >
            <Text style={styles.orderButtonText}>↑ Up</Text>
          </Pressable>

          <Pressable
            accessibilityLabel={`Move ${item.name} down`}
            disabled={isBusy || isLast}
            onPress={() => moveCategory(item.id, 1)}
            style={({ pressed }) => [
              styles.orderButton,
              isBusy || isLast ? styles.disabled : null,
              pressed ? styles.pressed : null,
            ]}
          >
            <Text style={styles.orderButtonText}>↓ Down</Text>
          </Pressable>

          <Pressable
            disabled={isBusy}
            onPress={() => openEditor(item)}
            style={({ pressed }) => [
              styles.editButton,
              isBusy ? styles.disabled : null,
              pressed ? styles.pressed : null,
            ]}
          >
            <Text style={styles.editButtonText}>Edit</Text>
          </Pressable>

          <Pressable
            disabled={isBusy}
            onPress={() => confirmDelete(item)}
            style={({ pressed }) => [
              styles.deleteButton,
              isBusy ? styles.disabled : null,
              pressed ? styles.pressed : null,
            ]}
          >
            <Text style={styles.deleteButtonText}>
              {pendingAction === `delete:${item.id}`
                ? 'Deleting...'
                : 'Delete'}
            </Text>
          </Pressable>
        </View>
      </AppCard>
    );
  }

  if (isLoading) {
    return (
      <SafeAreaView style={styles.center}>
        <ActivityIndicator color={theme.colors.primary} size="large" />
        <Text style={styles.helperText}>Loading menu categories...</Text>
      </SafeAreaView>
    );
  }

  if (!restaurantId) {
    return (
      <SafeAreaView style={styles.center}>
        <Text style={styles.emptyTitle}>Restaurant id is missing.</Text>
        <Pressable
          onPress={() => navigation.goBack()}
          style={styles.primaryButton}
        >
          <Text style={styles.primaryButtonText}>Go back</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <FlatList
        contentContainerStyle={styles.content}
        data={categories}
        keyExtractor={(item) => String(item.id)}
        ListHeaderComponent={
          <View style={styles.headerContent}>
            <Text style={styles.screenTitle}>Menu categories</Text>
            <Text style={styles.subtitle}>
              {restaurantName ||
                'Organize the menu customers see for this restaurant.'}
            </Text>

            <Text style={styles.intro}>
              Create, edit, reorder, or safely delete categories. Changes are
              applied to the restaurant menu immediately.
            </Text>

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

            {isCreatorOpen ? (
              <AppCard style={styles.creatorCard}>
                <Text style={styles.formTitle}>Create category</Text>

                <Text style={styles.label}>Category name</Text>
                <TextInput
                  autoFocus
                  editable={!isBusy}
                  maxLength={60}
                  onChangeText={(value) => {
                    setNewName(value);
                    setError('');
                  }}
                  placeholder="Mains, Sides, Specials..."
                  placeholderTextColor={theme.colors.textMuted}
                  style={styles.input}
                  value={newName}
                />

                <Text style={styles.label}>Category type</Text>
                {renderTypePicker(newMenuType, setNewMenuType)}

                <View style={styles.formActions}>
                  <Pressable
                    disabled={isBusy}
                    onPress={resetCreator}
                    style={({ pressed }) => [
                      styles.secondaryButton,
                      isBusy ? styles.disabled : null,
                      pressed ? styles.pressed : null,
                    ]}
                  >
                    <Text style={styles.secondaryButtonText}>Cancel</Text>
                  </Pressable>

                  <Pressable
                    disabled={isBusy}
                    onPress={handleCreate}
                    style={({ pressed }) => [
                      styles.primaryButton,
                      isBusy ? styles.disabled : null,
                      pressed ? styles.pressed : null,
                    ]}
                  >
                    <Text style={styles.primaryButtonText}>
                      {pendingAction === 'create'
                        ? 'Creating...'
                        : 'Create category'}
                    </Text>
                  </Pressable>
                </View>
              </AppCard>
            ) : (
              <Pressable
                disabled={isBusy}
                onPress={() => {
                  setError('');
                  setNotice('');
                  setIsCreatorOpen(true);
                }}
                style={({ pressed }) => [
                  styles.primaryButton,
                  isBusy ? styles.disabled : null,
                  pressed ? styles.pressed : null,
                ]}
              >
                <Text style={styles.primaryButtonText}>
                  + Create category
                </Text>
              </Pressable>
            )}

            <Text style={styles.listHeading}>
              {categories.length === 0
                ? 'No categories yet'
                : `${categories.length} category${
                    categories.length === 1 ? '' : 'ies'
                  }`}
            </Text>
          </View>
        }
        ListEmptyComponent={
          <AppCard style={styles.emptyCard}>
            <Text style={styles.emptyTitle}>
              No menu categories created yet.
            </Text>
            <Text style={styles.helperText}>
              Create the first category before assigning products to it.
            </Text>
          </AppCard>
        }
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={() => loadCategories({ refreshing: true })}
            tintColor={theme.colors.primary}
          />
        }
        renderItem={renderCategory}
      />

      <Modal
        animationType="slide"
        transparent
        visible={Boolean(editingCategory)}
        onRequestClose={closeEditor}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalEyebrow}>EDIT CATEGORY</Text>
            <Text style={styles.modalTitle}>
              {editingCategory?.name || 'Menu category'}
            </Text>

            <Text style={styles.label}>Category name</Text>
            <TextInput
              autoFocus
              editable={!isBusy}
              maxLength={60}
              onChangeText={(value) => {
                setEditingName(value);
                setError('');
              }}
              placeholder="Category name"
              placeholderTextColor={theme.colors.textMuted}
              style={styles.input}
              value={editingName}
            />

            <Text style={styles.label}>Category type</Text>
            {renderTypePicker(editingMenuType, setEditingMenuType)}

            <View style={styles.formActions}>
              <Pressable
                disabled={isBusy}
                onPress={closeEditor}
                style={({ pressed }) => [
                  styles.secondaryButton,
                  isBusy ? styles.disabled : null,
                  pressed ? styles.pressed : null,
                ]}
              >
                <Text style={styles.secondaryButtonText}>Cancel</Text>
              </Pressable>

              <Pressable
                disabled={isBusy}
                onPress={handleUpdate}
                style={({ pressed }) => [
                  styles.primaryButton,
                  isBusy ? styles.disabled : null,
                  pressed ? styles.pressed : null,
                ]}
              >
                <Text style={styles.primaryButtonText}>
                  {editingCategory &&
                  pendingAction === `update:${editingCategory.id}`
                    ? 'Saving...'
                    : 'Save changes'}
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
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
      gap: 12,
      padding: 16,
      paddingBottom: 36,
    },
    headerContent: {
      gap: 12,
      marginBottom: 4,
    },
    screenTitle: {
      color: colors.text,
      fontSize: 28,
      fontWeight: '800',
    },
    subtitle: {
      color: colors.textMuted,
      fontSize: 15,
      marginTop: -8,
    },
    intro: {
      color: colors.textMuted,
      fontSize: 14,
      lineHeight: 20,
    },
    errorBox: {
      backgroundColor: colors.dangerSoft,
      borderRadius: 12,
      padding: 12,
    },
    errorText: {
      color: colors.danger,
      fontSize: 14,
      fontWeight: '700',
      lineHeight: 20,
    },
    noticeBox: {
      backgroundColor: colors.primarySoft,
      borderRadius: 12,
      padding: 12,
    },
    noticeText: {
      color: colors.text,
      fontSize: 14,
      fontWeight: '700',
      lineHeight: 20,
    },
    creatorCard: {
      gap: 10,
      padding: 16,
    },
    formTitle: {
      color: colors.text,
      fontSize: 19,
      fontWeight: '800',
    },
    label: {
      color: colors.text,
      fontSize: 14,
      fontWeight: '800',
      marginTop: 2,
    },
    input: {
      backgroundColor: colors.surfaceRaised,
      borderColor: colors.border,
      borderRadius: 12,
      borderWidth: 1,
      color: colors.text,
      fontSize: 16,
      minHeight: 50,
      paddingHorizontal: 14,
    },
    typePicker: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
    },
    typeChip: {
      borderColor: colors.border,
      borderRadius: 999,
      borderWidth: 1,
      paddingHorizontal: 11,
      paddingVertical: 8,
    },
    typeChipSelected: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    typeChipText: {
      color: colors.text,
      fontSize: 13,
      fontWeight: '700',
    },
    typeChipTextSelected: {
      color: colors.onPrimary,
    },
    formActions: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 10,
      marginTop: 6,
    },
    primaryButton: {
      alignItems: 'center',
      backgroundColor: colors.primary,
      borderRadius: 12,
      justifyContent: 'center',
      minHeight: 46,
      paddingHorizontal: 16,
    },
    primaryButtonText: {
      color: colors.onPrimary,
      fontSize: 14,
      fontWeight: '800',
    },
    secondaryButton: {
      alignItems: 'center',
      borderColor: colors.border,
      borderRadius: 12,
      borderWidth: 1,
      justifyContent: 'center',
      minHeight: 46,
      paddingHorizontal: 16,
    },
    secondaryButtonText: {
      color: colors.text,
      fontSize: 14,
      fontWeight: '800',
    },
    listHeading: {
      color: colors.text,
      fontSize: 17,
      fontWeight: '800',
      marginTop: 4,
    },
    emptyCard: {
      gap: 8,
      padding: 18,
    },
    emptyTitle: {
      color: colors.text,
      fontSize: 17,
      fontWeight: '800',
      textAlign: 'center',
    },
    helperText: {
      color: colors.textMuted,
      fontSize: 14,
      lineHeight: 20,
      textAlign: 'center',
    },
    categoryCard: {
      gap: 14,
      padding: 16,
    },
    categoryTopRow: {
      alignItems: 'center',
      flexDirection: 'row',
      gap: 12,
    },
    positionBadge: {
      alignItems: 'center',
      backgroundColor: colors.primarySoft,
      borderRadius: 999,
      height: 34,
      justifyContent: 'center',
      width: 34,
    },
    positionText: {
      color: colors.primary,
      fontSize: 14,
      fontWeight: '900',
    },
    categoryDetails: {
      flex: 1,
      gap: 3,
    },
    categoryName: {
      color: colors.text,
      fontSize: 18,
      fontWeight: '800',
    },
    categoryType: {
      color: colors.textMuted,
      fontSize: 14,
    },
    actions: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
    },
    orderButton: {
      alignItems: 'center',
      borderColor: colors.border,
      borderRadius: 10,
      borderWidth: 1,
      justifyContent: 'center',
      minHeight: 40,
      paddingHorizontal: 11,
    },
    orderButtonText: {
      color: colors.text,
      fontSize: 13,
      fontWeight: '800',
    },
    editButton: {
      alignItems: 'center',
      borderColor: colors.primary,
      borderRadius: 10,
      borderWidth: 1,
      justifyContent: 'center',
      minHeight: 40,
      paddingHorizontal: 11,
    },
    editButtonText: {
      color: colors.primary,
      fontSize: 13,
      fontWeight: '800',
    },
    deleteButton: {
      alignItems: 'center',
      borderColor: colors.danger,
      borderRadius: 10,
      borderWidth: 1,
      justifyContent: 'center',
      minHeight: 40,
      paddingHorizontal: 11,
    },
    deleteButtonText: {
      color: colors.danger,
      fontSize: 13,
      fontWeight: '800',
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
      gap: 12,
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
    },
    disabled: {
      opacity: 0.45,
    },
    pressed: {
      opacity: 0.72,
    },
  });
}