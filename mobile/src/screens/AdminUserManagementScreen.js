import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
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
  deleteAdminUser,
  getAdminUsers,
  resetAdminUserPassword,
  updateAdminUserRole,
  updateAdminUserStatus,
} from '../api/adminUserManagement';
import { useAuth } from '../auth/AuthContext';
import AppCard from '../components/AppCard';
import { useAppTheme } from '../theme/ThemeContext';

function getDisplayName(user) {
  return user?.fullName || user?.username || 'Unknown user';
}

function getInitials(user) {
  const source = getDisplayName(user).trim();

  if (!source) {
    return '?';
  }

  return source
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase();
}

function formatRole(role) {
  if (role === 'admin') {
    return 'Administrator';
  }

  if (role === 'owner') {
    return 'Restaurant owner';
  }

  return 'Customer';
}

function formatDate(value) {
  if (!value) {
    return 'Unknown';
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return 'Unknown';
  }

  return date.toLocaleDateString();
}

export default function AdminUserManagementScreen() {
  const { token } = useAuth();
  const { theme } = useAppTheme();
  const styles = useMemo(() => createStyles(theme.colors), [theme.colors]);

  const [users, setUsers] = useState([]);
  const [searchInput, setSearchInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [pendingKey, setPendingKey] = useState('');
  const [error, setError] = useState('');
  const [actionError, setActionError] = useState({
    userId: '',
    message: '',
  });
  const [notice, setNotice] = useState('');
  const [resetUser, setResetUser] = useState(null);
  const [temporaryPassword, setTemporaryPassword] = useState('');

  const isBusy = Boolean(pendingKey);

  const loadUsers = useCallback(
    async ({ refreshing = false, query = searchQuery } = {}) => {
      if (refreshing) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }

      setError('');

      try {
        const data = await getAdminUsers(token, query);
        setUsers(data);
      } catch (loadError) {
        setError(
          loadError.message ||
            'Could not load users for administrator management.'
        );
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [searchQuery, token]
  );

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  async function runAction(actionKey, callback, successMessage, userId) {
    setPendingKey(actionKey);
    setError('');
    setActionError({
      userId: '',
      message: '',
    });
    setNotice('');

    try {
      await callback();

      await loadUsers({
        refreshing: true,
        query: searchQuery,
      });

      setNotice(successMessage);
      return true;
    } catch (requestError) {
      setActionError({
        userId,
        message: requestError.message || 'Could not complete this action.',
      });

      return false;
    } finally {
      setPendingKey('');
    }
  }

  async function handleSearch() {
    const nextQuery = searchInput.trim();

    setSearchQuery(nextQuery);
    setActionError({
      userId: '',
      message: '',
    });
    setNotice('');

    await loadUsers({
      query: nextQuery,
    });
  }

  function confirmStatusChange(user) {
    const nextStatus = user.isActive !== true;
    const title = nextStatus ? 'Reactivate account?' : 'Deactivate account?';
    const message = nextStatus
      ? `${getDisplayName(user)} will be able to sign in again.`
      : `${getDisplayName(
          user
        )} will be signed out immediately and will not be able to sign in.`;

    Alert.alert(title, message, [
      {
        style: 'cancel',
        text: 'Cancel',
      },
      {
        text: nextStatus ? 'Reactivate' : 'Deactivate',
        onPress: () => {
          void runAction(
            `status:${user.id}`,
            () => updateAdminUserStatus(user.id, nextStatus, token),
            `${getDisplayName(user)} was ${
              nextStatus ? 'reactivated' : 'deactivated'
            }.`,
            user.id
          );
        },
      },
    ]);
  }

  function confirmRoleChange(user) {
    const nextRole = user.role === 'admin' ? 'customer' : 'admin';
    const title =
      nextRole === 'admin'
        ? 'Promote to administrator?'
        : 'Demote to customer?';

    Alert.alert(
      title,
      `${getDisplayName(
        user
      )} will be signed out immediately because their access level is changing.`,
      [
        {
          style: 'cancel',
          text: 'Cancel',
        },
        {
          text: nextRole === 'admin' ? 'Promote' : 'Demote',
          onPress: () => {
            void runAction(
              `role:${user.id}`,
              () => updateAdminUserRole(user.id, nextRole, token),
              `${getDisplayName(user)} is now a ${formatRole(
                nextRole
              ).toLowerCase()}.`,
              user.id
            );
          },
        },
      ]
    );
  }

  function confirmDelete(user) {
    Alert.alert(
      'Delete account permanently?',
      `${getDisplayName(
        user
      )} can only be deleted when they have no orders and own no restaurants.`,
      [
        {
          style: 'cancel',
          text: 'Cancel',
        },
        {
          style: 'destructive',
          text: 'Delete',
          onPress: () => {
            void runAction(
              `delete:${user.id}`,
              () => deleteAdminUser(user.id, token),
              `${getDisplayName(user)} was deleted permanently.`,
              user.id
            );
          },
        },
      ]
    );
  }

  function openPasswordReset(user) {
    setActionError({
      userId: '',
      message: '',
    });
    setNotice('');
    setTemporaryPassword('');
    setResetUser(user);
  }

  function closePasswordReset() {
    if (isBusy) {
      return;
    }

    setActionError({
      userId: '',
      message: '',
    });
    setTemporaryPassword('');
    setResetUser(null);
  }

  async function handlePasswordReset() {
    if (!resetUser) {
      return;
    }

    if (!temporaryPassword.trim()) {
      setActionError({
        userId: resetUser.id,
        message: 'A temporary password is required.',
      });
      return;
    }

    const didReset = await runAction(
      `password:${resetUser.id}`,
      () =>
        resetAdminUserPassword(
          resetUser.id,
          temporaryPassword,
          token
        ),
      `Temporary password set for ${getDisplayName(
        resetUser
      )}. They must change it after signing in.`,
      resetUser.id
    );

    if (didReset) {
      setTemporaryPassword('');
      setResetUser(null);
    }
  }

  if (isLoading) {
    return (
      <SafeAreaView style={styles.center}>
        <ActivityIndicator color={theme.colors.primary} size="large" />
        <Text style={styles.stateText}>Loading user accounts...</Text>
      </SafeAreaView>
    );
  }

  if (error && users.length === 0) {
    return (
      <SafeAreaView style={styles.center}>
        <Text style={styles.errorTitle}>Could not load user accounts</Text>
        <Text style={styles.errorText}>{error}</Text>

        <Pressable
          style={({ pressed }) => [
            styles.primaryButton,
            pressed ? styles.pressed : null,
          ]}
          onPress={() => loadUsers()}
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
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={() =>
              loadUsers({
                refreshing: true,
                query: searchQuery,
              })
            }
            tintColor={theme.colors.primary}
          />
        }
      >
        <View style={styles.headerRow}>
          <View style={styles.headerText}>
            <Text style={styles.eyebrow}>ADMINISTRATION</Text>
            <Text style={styles.title}>User account management</Text>
            <Text style={styles.subtitle}>
              Search accounts and manage access, administrator roles, temporary
              passwords and eligible account deletion.
            </Text>
          </View>

          <Pressable
            style={({ pressed }) => [
              styles.refreshButton,
              isBusy ? styles.disabled : null,
              pressed && !isBusy ? styles.pressed : null,
            ]}
            disabled={isBusy}
            onPress={() =>
              loadUsers({
                refreshing: true,
                query: searchQuery,
              })
            }
          >
            <Text style={styles.refreshButtonText}>Refresh</Text>
          </Pressable>
        </View>

        <AppCard style={styles.searchCard}>
          <Text style={styles.fieldLabel}>Search users</Text>

          <View style={styles.searchRow}>
            <TextInput
              autoCapitalize="none"
              onChangeText={setSearchInput}
              onSubmitEditing={() => {
                void handleSearch();
              }}
              placeholder="Name, username, phone, address or role"
              placeholderTextColor={theme.colors.textMuted}
              returnKeyType="search"
              style={styles.searchInput}
              value={searchInput}
            />

            <Pressable
              style={({ pressed }) => [
                styles.primaryButton,
                styles.searchButton,
                isBusy ? styles.disabled : null,
                pressed && !isBusy ? styles.pressed : null,
              ]}
              disabled={isBusy}
              onPress={() => {
                void handleSearch();
              }}
            >
              <Text style={styles.primaryButtonText}>Search</Text>
            </Pressable>
          </View>
        </AppCard>

        {notice ? (
          <View style={styles.noticeBox}>
            <Text style={styles.noticeText}>{notice}</Text>
          </View>
        ) : null}

        {error ? (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        {users.length === 0 ? (
          <AppCard style={styles.emptyCard}>
            <Text style={styles.emptyTitle}>No matching users</Text>
            <Text style={styles.emptyText}>
              Try another name, username, phone number, address or role.
            </Text>
          </AppCard>
        ) : (
          <View style={styles.userList}>
            {users.map((user) => {
              const isSelf = user.protection?.isSelf === true;
              const isFinalActiveAdmin =
                user.protection?.isFinalActiveAdmin === true;
              const canChangeStatus =
                !isSelf && !(user.isActive === true && isFinalActiveAdmin);
              const canChangeRole =
                !isSelf &&
                user.role !== 'owner' &&
                !(
                  user.role === 'admin' &&
                  user.isActive === true &&
                  isFinalActiveAdmin
                );
              const canResetPassword = !isSelf;
              const canDelete = !isSelf && user.role !== 'admin';
              const isUserPending = pendingKey.includes(`:${user.id}`);

              return (
                <AppCard key={user.id} style={styles.userCard}>
                  <View style={styles.userTopRow}>
                    {user.image ? (
                      <Image
                        accessibilityLabel={`${getDisplayName(user)} profile`}
                        source={{ uri: user.image }}
                        style={styles.avatarImage}
                      />
                    ) : (
                      <View style={styles.avatarFallback}>
                        <Text style={styles.avatarText}>{getInitials(user)}</Text>
                      </View>
                    )}

                    <View style={styles.userIdentity}>
                      <View style={styles.nameRow}>
                        <Text style={styles.userName}>
                          {getDisplayName(user)}
                        </Text>

                        <View
                          style={[
                            styles.statusBadge,
                            user.isActive
                              ? styles.activeBadge
                              : styles.inactiveBadge,
                          ]}
                        >
                          <Text
                            style={[
                              styles.statusBadgeText,
                              user.isActive
                                ? styles.activeBadgeText
                                : styles.inactiveBadgeText,
                            ]}
                          >
                            {user.isActive ? 'Active' : 'Deactivated'}
                          </Text>
                        </View>
                      </View>

                      <Text style={styles.username}>@{user.username}</Text>
                      <Text style={styles.meta}>
                        {user.phone || 'No phone'} · Joined{' '}
                        {formatDate(user.createdAt)}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.badgesRow}>
                    <View style={styles.roleBadge}>
                      <Text style={styles.roleBadgeText}>
                        {formatRole(user.role)}
                      </Text>
                    </View>

                    {user.mustChangePassword ? (
                      <View style={styles.passwordBadge}>
                        <Text style={styles.passwordBadgeText}>
                          Password change required
                        </Text>
                      </View>
                    ) : null}
                  </View>

                  {isSelf ? (
                    <Text style={styles.protectionNote}>
                      Your own account is protected from administrator actions.
                    </Text>
                  ) : null}

                  {isFinalActiveAdmin ? (
                    <Text style={styles.protectionNote}>
                      Final active administrator: deactivation and demotion are
                      protected.
                    </Text>
                  ) : null}

                  {user.role === 'owner' ? (
                    <Text style={styles.protectionNote}>
                      Owner roles are managed through restaurant ownership.
                    </Text>
                  ) : null}

                  {actionError.userId === user.id ? (
                    <View style={styles.inlineErrorBox}>
                      <Text style={styles.inlineErrorText}>
                        {actionError.message}
                      </Text>
                    </View>
                  ) : null}

                  <View style={styles.actionGrid}>
                    <Pressable
                      style={({ pressed }) => [
                        styles.secondaryButton,
                        !canChangeStatus || isBusy ? styles.disabled : null,
                        pressed && canChangeStatus && !isBusy
                          ? styles.pressed
                          : null,
                      ]}
                      disabled={!canChangeStatus || isBusy}
                      onPress={() => confirmStatusChange(user)}
                    >
                      <Text style={styles.secondaryButtonText}>
                        {isUserPending && pendingKey === `status:${user.id}`
                          ? 'Saving...'
                          : user.isActive
                            ? 'Deactivate'
                            : 'Reactivate'}
                      </Text>
                    </Pressable>

                    {user.role !== 'owner' ? (
                      <Pressable
                        style={({ pressed }) => [
                          styles.secondaryButton,
                          !canChangeRole || isBusy ? styles.disabled : null,
                          pressed && canChangeRole && !isBusy
                            ? styles.pressed
                            : null,
                        ]}
                        disabled={!canChangeRole || isBusy}
                        onPress={() => confirmRoleChange(user)}
                      >
                        <Text style={styles.secondaryButtonText}>
                          {isUserPending && pendingKey === `role:${user.id}`
                            ? 'Saving...'
                            : user.role === 'admin'
                              ? 'Demote to customer'
                              : 'Promote to admin'}
                        </Text>
                      </Pressable>
                    ) : null}

                    <Pressable
                      style={({ pressed }) => [
                        styles.secondaryButton,
                        !canResetPassword || isBusy ? styles.disabled : null,
                        pressed && canResetPassword && !isBusy
                          ? styles.pressed
                          : null,
                      ]}
                      disabled={!canResetPassword || isBusy}
                      onPress={() => openPasswordReset(user)}
                    >
                      <Text style={styles.secondaryButtonText}>
                        Reset password
                      </Text>
                    </Pressable>

                    <Pressable
                      style={({ pressed }) => [
                        styles.dangerButton,
                        !canDelete || isBusy ? styles.disabled : null,
                        pressed && canDelete && !isBusy
                          ? styles.pressed
                          : null,
                      ]}
                      disabled={!canDelete || isBusy}
                      onPress={() => confirmDelete(user)}
                    >
                      <Text style={styles.dangerButtonText}>
                        {isUserPending && pendingKey === `delete:${user.id}`
                          ? 'Deleting...'
                          : 'Delete account'}
                      </Text>
                    </Pressable>
                  </View>
                </AppCard>
              );
            })}
          </View>
        )}
      </ScrollView>

      <Modal
        animationType="fade"
        onRequestClose={closePasswordReset}
        transparent
        visible={Boolean(resetUser)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.modalBackdrop}
        >
          <Pressable
            onPress={closePasswordReset}
            style={styles.modalDismissArea}
          />

          <View style={styles.modalSheet}>
            <Text style={styles.eyebrow}>SECURE ACCESS RECOVERY</Text>
            <Text style={styles.modalTitle}>Set temporary password</Text>
            <Text style={styles.modalSubtitle}>
              Set a temporary password for{' '}
              {resetUser ? getDisplayName(resetUser) : 'this user'}. They will
              be signed out and must choose a new password after their next
              login.
            </Text>

            {resetUser && actionError.userId === resetUser.id ? (
              <View style={styles.inlineErrorBox}>
                <Text style={styles.inlineErrorText}>
                  {actionError.message}
                </Text>
              </View>
            ) : null}

            <Text style={styles.fieldLabel}>Temporary password</Text>

            <TextInput
              autoCapitalize="none"
              autoFocus
              onChangeText={setTemporaryPassword}
              placeholder="At least 8 characters, letters and numbers"
              placeholderTextColor={theme.colors.textMuted}
              secureTextEntry
              style={styles.modalInput}
              value={temporaryPassword}
            />

            <View style={styles.modalActions}>
              <Pressable
                style={({ pressed }) => [
                  styles.primaryButton,
                  isBusy ? styles.disabled : null,
                  pressed && !isBusy ? styles.pressed : null,
                ]}
                disabled={isBusy}
                onPress={() => {
                  void handlePasswordReset();
                }}
              >
                <Text style={styles.primaryButtonText}>
                  {resetUser && pendingKey === `password:${resetUser.id}`
                    ? 'Saving...'
                    : 'Set password'}
                </Text>
              </Pressable>

              <Pressable
                style={({ pressed }) => [
                  styles.secondaryButton,
                  isBusy ? styles.disabled : null,
                  pressed && !isBusy ? styles.pressed : null,
                ]}
                disabled={isBusy}
                onPress={closePasswordReset}
              >
                <Text style={styles.secondaryButtonText}>Cancel</Text>
              </Pressable>
            </View>
          </View>
        </KeyboardAvoidingView>
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
    stateText: {
      color: colors.textMuted,
      fontSize: 16,
    },
    errorTitle: {
      color: colors.error,
      fontSize: 20,
      fontWeight: '800',
      textAlign: 'center',
    },
    errorText: {
      color: colors.error,
      fontSize: 14,
      lineHeight: 20,
      textAlign: 'center',
    },
    content: {
      gap: 16,
      padding: 20,
      paddingBottom: 40,
    },
    headerRow: {
      alignItems: 'flex-start',
      flexDirection: 'row',
      gap: 12,
      justifyContent: 'space-between',
    },
    headerText: {
      flex: 1,
    },
    eyebrow: {
      color: colors.primary,
      fontSize: 11,
      fontWeight: '800',
      letterSpacing: 1,
      marginBottom: 6,
    },
    title: {
      color: colors.text,
      fontSize: 28,
      fontWeight: '800',
      letterSpacing: -0.4,
    },
    subtitle: {
      color: colors.textMuted,
      fontSize: 15,
      lineHeight: 22,
      marginTop: 8,
    },
    refreshButton: {
      backgroundColor: colors.primarySoft,
      borderRadius: 10,
      paddingHorizontal: 12,
      paddingVertical: 10,
    },
    refreshButtonText: {
      color: colors.primary,
      fontSize: 13,
      fontWeight: '800',
    },
    searchCard: {
      gap: 10,
      padding: 16,
    },
    fieldLabel: {
      color: colors.text,
      fontSize: 13,
      fontWeight: '800',
    },
    searchRow: {
      alignItems: 'stretch',
      flexDirection: 'row',
      gap: 8,
    },
    searchInput: {
      backgroundColor: colors.background,
      borderColor: colors.border,
      borderRadius: 10,
      borderWidth: 1,
      color: colors.text,
      flex: 1,
      fontSize: 15,
      minWidth: 0,
      paddingHorizontal: 12,
      paddingVertical: 11,
    },
    searchButton: {
      justifyContent: 'center',
      paddingHorizontal: 14,
    },
    noticeBox: {
      backgroundColor: colors.primarySoft,
      borderRadius: 12,
      padding: 13,
    },
    noticeText: {
      color: colors.primary,
      fontSize: 14,
      fontWeight: '700',
      lineHeight: 20,
    },
    errorBox: {
      backgroundColor: colors.errorSoft,
      borderRadius: 12,
      padding: 13,
    },
    userList: {
      gap: 12,
    },
    userCard: {
      gap: 12,
      padding: 16,
    },
    userTopRow: {
      alignItems: 'flex-start',
      flexDirection: 'row',
      gap: 12,
    },
    avatarImage: {
      borderRadius: 24,
      height: 48,
      width: 48,
    },
    avatarFallback: {
      alignItems: 'center',
      backgroundColor: colors.primarySoft,
      borderRadius: 24,
      height: 48,
      justifyContent: 'center',
      width: 48,
    },
    avatarText: {
      color: colors.primary,
      fontSize: 15,
      fontWeight: '800',
    },
    userIdentity: {
      flex: 1,
      minWidth: 0,
    },
    nameRow: {
      alignItems: 'center',
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 6,
    },
    userName: {
      color: colors.text,
      flexShrink: 1,
      fontSize: 17,
      fontWeight: '800',
    },
    username: {
      color: colors.textMuted,
      fontSize: 14,
      marginTop: 3,
    },
    meta: {
      color: colors.textMuted,
      fontSize: 12,
      lineHeight: 18,
      marginTop: 6,
    },
    badgesRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 7,
    },
    statusBadge: {
      borderRadius: 999,
      paddingHorizontal: 8,
      paddingVertical: 4,
    },
    activeBadge: {
      backgroundColor: colors.successSoft,
    },
    inactiveBadge: {
      backgroundColor: colors.errorSoft,
    },
    statusBadgeText: {
      fontSize: 11,
      fontWeight: '800',
    },
    activeBadgeText: {
      color: colors.success,
    },
    inactiveBadgeText: {
      color: colors.error,
    },
    roleBadge: {
      backgroundColor: colors.primarySoft,
      borderRadius: 999,
      paddingHorizontal: 8,
      paddingVertical: 5,
    },
    roleBadgeText: {
      color: colors.primary,
      fontSize: 11,
      fontWeight: '800',
    },
    passwordBadge: {
      backgroundColor: colors.primarySoft,
      borderRadius: 999,
      paddingHorizontal: 8,
      paddingVertical: 5,
    },
    passwordBadgeText: {
      color: colors.primary,
      fontSize: 11,
      fontWeight: '800',
    },
    protectionNote: {
      color: colors.textMuted,
      fontSize: 12,
      lineHeight: 18,
    },
    inlineErrorBox: {
      backgroundColor: colors.errorSoft,
      borderRadius: 10,
      padding: 11,
    },
    inlineErrorText: {
      color: colors.error,
      fontSize: 13,
      fontWeight: '700',
      lineHeight: 19,
    },
    actionGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
    },
    primaryButton: {
      alignItems: 'center',
      backgroundColor: colors.primary,
      borderRadius: 10,
      justifyContent: 'center',
      paddingHorizontal: 13,
      paddingVertical: 11,
    },
    primaryButtonText: {
      color: '#ffffff',
      fontSize: 13,
      fontWeight: '800',
    },
    secondaryButton: {
      alignItems: 'center',
      backgroundColor: colors.surface,
      borderColor: colors.border,
      borderRadius: 10,
      borderWidth: 1,
      justifyContent: 'center',
      paddingHorizontal: 12,
      paddingVertical: 10,
    },
    secondaryButtonText: {
      color: colors.text,
      fontSize: 13,
      fontWeight: '700',
    },
    dangerButton: {
      alignItems: 'center',
      backgroundColor: colors.errorSoft,
      borderColor: colors.error,
      borderRadius: 10,
      borderWidth: 1,
      justifyContent: 'center',
      paddingHorizontal: 12,
      paddingVertical: 10,
    },
    dangerButtonText: {
      color: colors.error,
      fontSize: 13,
      fontWeight: '800',
    },
    disabled: {
      opacity: 0.45,
    },
    pressed: {
      opacity: 0.78,
    },
    emptyCard: {
      alignItems: 'center',
      gap: 6,
      padding: 24,
    },
    emptyTitle: {
      color: colors.text,
      fontSize: 17,
      fontWeight: '800',
    },
    emptyText: {
      color: colors.textMuted,
      fontSize: 14,
      lineHeight: 20,
      textAlign: 'center',
    },
    modalBackdrop: {
      alignItems: 'center',
      backgroundColor: 'rgba(0, 0, 0, 0.58)',
      flex: 1,
      justifyContent: 'center',
      padding: 20,
    },
    modalDismissArea: {
      bottom: 0,
      left: 0,
      position: 'absolute',
      right: 0,
      top: 0,
    },
    modalSheet: {
      backgroundColor: colors.surface,
      borderColor: colors.border,
      borderRadius: 18,
      borderWidth: 1,
      gap: 12,
      maxWidth: 560,
      padding: 20,
      width: '100%',
    },
    modalTitle: {
      color: colors.text,
      fontSize: 22,
      fontWeight: '800',
    },
    modalSubtitle: {
      color: colors.textMuted,
      fontSize: 14,
      lineHeight: 21,
      marginBottom: 4,
    },
    modalInput: {
      backgroundColor: colors.background,
      borderColor: colors.border,
      borderRadius: 10,
      borderWidth: 1,
      color: colors.text,
      fontSize: 15,
      paddingHorizontal: 12,
      paddingVertical: 12,
    },
    modalActions: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 10,
      marginTop: 2,
    },
  });
}
