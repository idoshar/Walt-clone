import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import {
  deleteAdminUser,
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

  return source
    ? source
        .split(/\s+/)
        .slice(0, 2)
        .map((part) => part[0])
        .join('')
        .toUpperCase()
    : '?';
}

function formatRole(role) {
  if (role === 'admin') return 'Administrator';
  if (role === 'owner') return 'Restaurant owner';
  return 'Customer';
}

function formatDate(value) {
  const date = new Date(value);

  return Number.isNaN(date.getTime()) ? 'Unknown' : date.toLocaleDateString();
}

export default function AdminUserDetailsScreen({ navigation, route }) {
  const { token } = useAuth();
  const { theme } = useAppTheme();
  const styles = useMemo(() => createStyles(theme.colors), [theme.colors]);

  const [user, setUser] = useState(route.params?.user || null);
  const [pendingKey, setPendingKey] = useState('');
  const [temporaryPassword, setTemporaryPassword] = useState('');
  const [showPasswordEditor, setShowPasswordEditor] = useState(false);
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');

  const isBusy = Boolean(pendingKey);
  const isSelf = user?.protection?.isSelf === true;
  const isFinalActiveAdmin = user?.protection?.isFinalActiveAdmin === true;

  function runAction(actionKey, callback, successMessage) {
    setPendingKey(actionKey);
    setError('');
    setNotice('');

    return callback()
      .then((updatedUser) => {
        if (updatedUser && typeof updatedUser === 'object') {
          setUser(updatedUser);
        }

        setNotice(successMessage);
        return true;
      })
      .catch((requestError) => {
        setError(requestError.message || 'Could not complete this action.');
        return false;
      })
      .finally(() => {
        setPendingKey('');
      });
  }

  function confirmStatusChange() {
    if (!user) return;

    const nextStatus = user.isActive !== true;

    Alert.alert(
      nextStatus ? 'Reactivate account?' : 'Deactivate account?',
      nextStatus
        ? `${getDisplayName(user)} will be able to sign in again.`
        : `${getDisplayName(user)} will be signed out immediately and will not be able to sign in.`,
      [
        { style: 'cancel', text: 'Cancel' },
        {
          text: nextStatus ? 'Reactivate' : 'Deactivate',
          onPress: () => {
            void runAction(
              `status:${user.id}`,
              () => updateAdminUserStatus(user.id, nextStatus, token),
              `${getDisplayName(user)} was ${
                nextStatus ? 'reactivated' : 'deactivated'
              }.`
            );
          },
        },
      ]
    );
  }

  function confirmRoleChange() {
    if (!user) return;

    const nextRole = user.role === 'admin' ? 'customer' : 'admin';

    Alert.alert(
      nextRole === 'admin'
        ? 'Promote to administrator?'
        : 'Demote to customer?',
      `${getDisplayName(
        user
      )} will be signed out immediately because their access level is changing.`,
      [
        { style: 'cancel', text: 'Cancel' },
        {
          text: nextRole === 'admin' ? 'Promote' : 'Demote',
          onPress: () => {
            void runAction(
              `role:${user.id}`,
              () => updateAdminUserRole(user.id, nextRole, token),
              `${getDisplayName(user)} is now a ${formatRole(
                nextRole
              ).toLowerCase()}.`
            );
          },
        },
      ]
    );
  }

  function confirmDelete() {
    if (!user) return;

    if (user.role === 'admin') {
      setNotice('');
      setError('Administrator accounts cannot be deleted.');
      return;
    }

    Alert.alert(
      'Delete account permanently?',
      `${getDisplayName(
        user
      )} can only be deleted when they have no orders and own no restaurants.`,
      [
        { style: 'cancel', text: 'Cancel' },
        {
          style: 'destructive',
          text: 'Delete',
          onPress: () => {
            setPendingKey(`delete:${user.id}`);
            setError('');
            setNotice('');

            deleteAdminUser(user.id, token)
              .then(() => {
                navigation.goBack();
              })
              .catch((requestError) => {
                setError(
                  requestError.message || 'Could not delete this account.'
                );
              })
              .finally(() => {
                setPendingKey('');
              });
          },
        },
      ]
    );
  }

  function saveTemporaryPassword() {
    if (!user) return;

    if (!temporaryPassword.trim()) {
      setError('A temporary password is required.');
      return;
    }

    void runAction(
      `password:${user.id}`,
      () => resetAdminUserPassword(user.id, temporaryPassword, token),
      `Temporary password set for ${getDisplayName(
        user
      )}. They must change it after signing in.`
    ).then((didSave) => {
      if (didSave) {
        setTemporaryPassword('');
        setShowPasswordEditor(false);
      }
    });
  }

  if (!user) {
    return (
      <SafeAreaView style={styles.center}>
        <Text style={styles.errorTitle}>User details are unavailable</Text>
        <Pressable
          onPress={() => navigation.goBack()}
          style={({ pressed }) => [
            styles.primaryButton,
            pressed ? styles.pressed : null,
          ]}
        >
          <Text style={styles.primaryButtonText}>Back to users</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  const canChangeStatus =
    !isSelf && !(user.isActive === true && isFinalActiveAdmin);
  const canChangeRole =
    !isSelf &&
    user.role !== 'owner' &&
    !(user.role === 'admin' && user.isActive === true && isFinalActiveAdmin);
  const canResetPassword = !isSelf;

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Text style={styles.eyebrow}>ADMINISTRATION</Text>
          <Text style={styles.title}>User account</Text>
          <Text style={styles.subtitle}>
            Review account information and manage access from one dedicated
            workspace.
          </Text>
        </View>

        <AppCard style={styles.profileCard}>
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

          <View style={styles.profileText}>
            <Text style={styles.userName}>{getDisplayName(user)}</Text>
            <Text style={styles.username}>@{user.username}</Text>
            <View style={styles.badgesRow}>
              <View
                style={[
                  styles.statusBadge,
                  user.isActive ? styles.activeBadge : styles.inactiveBadge,
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
              <View style={styles.roleBadge}>
                <Text style={styles.roleBadgeText}>{formatRole(user.role)}</Text>
              </View>
            </View>
          </View>
        </AppCard>

        <AppCard style={styles.detailsCard}>
          <Text style={styles.sectionLabel}>ACCOUNT DETAILS</Text>
          <DetailRow label="Phone" value={user.phone || 'No phone saved'} styles={styles} />
          <DetailRow label="Address" value={user.address || 'No address saved'} styles={styles} />
          <DetailRow label="Joined" value={formatDate(user.createdAt)} styles={styles} />
          <DetailRow
            label="Password status"
            value={
              user.mustChangePassword
                ? 'Password change required at next login'
                : 'No password change required'
            }
            styles={styles}
          />
        </AppCard>

        {isSelf ? (
          <View style={styles.protectionBox}>
            <Text style={styles.protectionText}>
              Your own account is protected from administrator actions.
            </Text>
          </View>
        ) : null}

        {isFinalActiveAdmin ? (
          <View style={styles.protectionBox}>
            <Text style={styles.protectionText}>
              Final active administrator: deactivation and demotion are
              protected.
            </Text>
          </View>
        ) : null}

        {user.role === 'owner' ? (
          <View style={styles.protectionBox}>
            <Text style={styles.protectionText}>
              Owner roles are managed through restaurant ownership.
            </Text>
          </View>
        ) : null}

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

        <View style={styles.actionSection}>
          <Text style={styles.actionSectionTitle}>Administrator actions</Text>

          <Pressable
            disabled={!canChangeStatus || isBusy}
            onPress={confirmStatusChange}
            style={({ pressed }) => [
              styles.secondaryButton,
              !canChangeStatus || isBusy ? styles.disabled : null,
              pressed && canChangeStatus && !isBusy ? styles.pressed : null,
            ]}
          >
            <Text style={styles.secondaryButtonText}>
              {pendingKey === `status:${user.id}`
                ? 'Saving...'
                : user.isActive
                  ? 'Deactivate account'
                  : 'Reactivate account'}
            </Text>
          </Pressable>

          {user.role !== 'owner' ? (
            <Pressable
              disabled={!canChangeRole || isBusy}
              onPress={confirmRoleChange}
              style={({ pressed }) => [
                styles.secondaryButton,
                !canChangeRole || isBusy ? styles.disabled : null,
                pressed && canChangeRole && !isBusy ? styles.pressed : null,
              ]}
            >
              <Text style={styles.secondaryButtonText}>
                {pendingKey === `role:${user.id}`
                  ? 'Saving...'
                  : user.role === 'admin'
                    ? 'Demote to customer'
                    : 'Promote to administrator'}
              </Text>
            </Pressable>
          ) : null}

          <Pressable
            disabled={!canResetPassword || isBusy}
            onPress={() => {
              setError('');
              setNotice('');
              setShowPasswordEditor((visible) => !visible);
            }}
            style={({ pressed }) => [
              styles.secondaryButton,
              !canResetPassword || isBusy ? styles.disabled : null,
              pressed && canResetPassword && !isBusy ? styles.pressed : null,
            ]}
          >
            <Text style={styles.secondaryButtonText}>Reset password</Text>
          </Pressable>

          {showPasswordEditor ? (
            <AppCard style={styles.passwordCard}>
              <Text style={styles.fieldLabel}>Temporary password</Text>
              <TextInput
                autoCapitalize="none"
                autoCorrect={false}
                onChangeText={setTemporaryPassword}
                placeholder="At least 8 characters, letters and numbers"
                placeholderTextColor={theme.colors.textMuted}
                secureTextEntry
                style={styles.input}
                value={temporaryPassword}
              />
              <Pressable
                disabled={isBusy}
                onPress={saveTemporaryPassword}
                style={({ pressed }) => [
                  styles.primaryButton,
                  isBusy ? styles.disabled : null,
                  pressed && !isBusy ? styles.pressed : null,
                ]}
              >
                {pendingKey === `password:${user.id}` ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.primaryButtonText}>
                    Set temporary password
                  </Text>
                )}
              </Pressable>
            </AppCard>
          ) : null}

          <Pressable
            disabled={isBusy}
            onPress={confirmDelete}
            style={({ pressed }) => [
              styles.deleteButton,
              isBusy ? styles.disabled : null,
              pressed && !isBusy ? styles.pressed : null,
            ]}
          >
            <Text style={styles.deleteButtonText}>
              {pendingKey === `delete:${user.id}`
                ? 'Deleting...'
                : 'Delete account'}
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function DetailRow({ label, value, styles }) {
  return (
    <View style={styles.detailRow}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={styles.detailValue}>{value}</Text>
    </View>
  );
}

function createStyles(colors) {
  return StyleSheet.create({
    safeArea: { backgroundColor: colors.background, flex: 1 },
    center: {
      alignItems: 'center',
      backgroundColor: colors.background,
      flex: 1,
      gap: 12,
      justifyContent: 'center',
      padding: 24,
    },
    content: { gap: 16, padding: 20, paddingBottom: 42 },
    header: { gap: 7 },
    eyebrow: {
      color: colors.primary,
      fontSize: 11,
      fontWeight: '800',
      letterSpacing: 1,
    },
    title: { color: colors.text, fontSize: 28, fontWeight: '800' },
    subtitle: { color: colors.textMuted, fontSize: 15, lineHeight: 22 },
    profileCard: { alignItems: 'center', flexDirection: 'row', gap: 14, padding: 17 },
    avatarImage: { borderRadius: 999, height: 68, width: 68 },
    avatarFallback: {
      alignItems: 'center',
      backgroundColor: colors.primarySoft,
      borderRadius: 999,
      height: 68,
      justifyContent: 'center',
      width: 68,
    },
    avatarText: { color: colors.primary, fontSize: 23, fontWeight: '800' },
    profileText: { flex: 1, gap: 3, minWidth: 0 },
    userName: { color: colors.text, fontSize: 20, fontWeight: '800' },
    username: { color: colors.textMuted, fontSize: 13 },
    badgesRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 7, marginTop: 4 },
    statusBadge: { borderRadius: 999, paddingHorizontal: 8, paddingVertical: 4 },
    statusBadgeText: { fontSize: 10, fontWeight: '800' },
    activeBadge: { backgroundColor: colors.primarySoft },
    activeBadgeText: { color: colors.primary },
    inactiveBadge: { backgroundColor: colors.dangerSoft || '#321b1b' },
    inactiveBadgeText: { color: colors.danger || '#ff8a80' },
    roleBadge: {
      backgroundColor: colors.surface,
      borderColor: colors.border,
      borderRadius: 999,
      borderWidth: 1,
      paddingHorizontal: 8,
      paddingVertical: 4,
    },
    roleBadgeText: { color: colors.text, fontSize: 10, fontWeight: '800' },
    detailsCard: { gap: 12, padding: 17 },
    sectionLabel: {
      color: colors.primary,
      fontSize: 11,
      fontWeight: '800',
      letterSpacing: 0.8,
    },
    detailRow: { gap: 3 },
    detailLabel: { color: colors.textMuted, fontSize: 12, fontWeight: '700' },
    detailValue: { color: colors.text, fontSize: 14, lineHeight: 20 },
    protectionBox: {
      backgroundColor: colors.primarySoft,
      borderColor: colors.border,
      borderRadius: 12,
      borderWidth: 1,
      padding: 13,
    },
    protectionText: { color: colors.text, fontSize: 13, lineHeight: 19 },
    noticeBox: {
      backgroundColor: colors.primarySoft,
      borderColor: colors.border,
      borderRadius: 12,
      borderWidth: 1,
      padding: 13,
    },
    noticeText: { color: colors.text, fontSize: 13, lineHeight: 19 },
    errorBox: {
      backgroundColor: colors.danger || '#d33a32',
      borderColor: colors.danger || '#d33a32',
      borderRadius: 12,
      borderWidth: 1,
      padding: 13,
    },
    errorText: { color: '#FFFFFF', fontSize: 13, fontWeight: '800', lineHeight: 19 },
    actionSection: { gap: 10 },
    actionSectionTitle: { color: colors.text, fontSize: 19, fontWeight: '800' },
    secondaryButton: {
      alignItems: 'center',
      backgroundColor: colors.surface,
      borderColor: colors.border,
      borderRadius: 12,
      borderWidth: 1,
      justifyContent: 'center',
      minHeight: 48,
      paddingHorizontal: 16,
    },
    secondaryButtonText: { color: colors.text, fontSize: 14, fontWeight: '800' },
    primaryButton: {
      alignItems: 'center',
      backgroundColor: colors.primary,
      borderRadius: 12,
      justifyContent: 'center',
      minHeight: 48,
      paddingHorizontal: 16,
    },
    primaryButtonText: { color: '#FFFFFF', fontSize: 14, fontWeight: '800' },
    deleteButton: {
      alignItems: 'center',
      backgroundColor: colors.danger || '#d33a32',
      borderRadius: 12,
      justifyContent: 'center',
      minHeight: 48,
      paddingHorizontal: 16,
    },
    deleteButtonText: { color: '#FFFFFF', fontSize: 14, fontWeight: '800' },
    passwordCard: { gap: 10, padding: 15 },
    fieldLabel: { color: colors.text, fontSize: 13, fontWeight: '800' },
    input: {
      backgroundColor: colors.background,
      borderColor: colors.border,
      borderRadius: 10,
      borderWidth: 1,
      color: colors.text,
      fontSize: 15,
      paddingHorizontal: 12,
      paddingVertical: 11,
    },
    disabled: { opacity: 0.45 },
    pressed: { opacity: 0.72 },
  });
}
