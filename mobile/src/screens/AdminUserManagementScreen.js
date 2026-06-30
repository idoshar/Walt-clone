import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Pressable,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { getAdminUsers } from '../api/adminUserManagement';
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

export default function AdminUserManagementScreen({ navigation }) {
  const { token } = useAuth();
  const { theme } = useAppTheme();
  const styles = useMemo(() => createStyles(theme.colors), [theme.colors]);

  const [users, setUsers] = useState([]);
  const [searchInput, setSearchInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState('');

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
        setUsers(Array.isArray(data) ? data : []);
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

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      loadUsers({ refreshing: true });
    });

    return unsubscribe;
  }, [loadUsers, navigation]);

  function handleSearch() {
    const nextQuery = searchInput.trim();
    setSearchQuery(nextQuery);
    void loadUsers({ query: nextQuery });
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
          onPress={() => loadUsers()}
          style={({ pressed }) => [
            styles.primaryButton,
            pressed ? styles.pressed : null,
          ]}
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
            onRefresh={() => loadUsers({ refreshing: true })}
            tintColor={theme.colors.primary}
          />
        }
      >
        <View style={styles.header}>
          <Text style={styles.eyebrow}>ADMINISTRATION</Text>
          <Text style={styles.title}>User account management</Text>
          <Text style={styles.subtitle}>
            Select a user to view account details and manage access, roles,
            temporary passwords and eligible account deletion.
          </Text>
        </View>

        <AppCard style={styles.searchCard}>
          <Text style={styles.fieldLabel}>Search users</Text>
          <View style={styles.searchRow}>
            <TextInput
              autoCapitalize="none"
              autoCorrect={false}
              onChangeText={setSearchInput}
              onSubmitEditing={handleSearch}
              placeholder="Name, username, phone, address or role"
              placeholderTextColor={theme.colors.textMuted}
              returnKeyType="search"
              style={styles.searchInput}
              value={searchInput}
            />
            <Pressable
              onPress={handleSearch}
              style={({ pressed }) => [
                styles.primaryButton,
                styles.searchButton,
                pressed ? styles.pressed : null,
              ]}
            >
              <Text style={styles.primaryButtonText}>Search</Text>
            </Pressable>
          </View>
        </AppCard>

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
            {users.map((user) => (
              <Pressable
                key={user.id}
                accessibilityLabel={`Open account management for ${getDisplayName(
                  user
                )}`}
                onPress={() =>
                  navigation.navigate('AdminUserDetails', {
                    user,
                  })
                }
                style={({ pressed }) => [
                  styles.userPressable,
                  pressed ? styles.pressed : null,
                ]}
              >
                <AppCard style={styles.userCard}>
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
                        <Text numberOfLines={1} style={styles.userName}>
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
                      <Text numberOfLines={1} style={styles.meta}>
                        {user.phone || 'No phone'} · Joined {formatDate(user.createdAt)}
                      </Text>
                    </View>

                    <Text style={styles.openArrow}>›</Text>
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
                </AppCard>
              </Pressable>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
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
    content: { gap: 16, padding: 20, paddingBottom: 40 },
    stateText: { color: colors.textMuted, fontSize: 16 },
    errorTitle: { color: colors.text, fontSize: 20, fontWeight: '800' },
    errorText: {
      color: colors.danger || '#ff8a80',
      fontSize: 14,
      lineHeight: 20,
      textAlign: 'center',
    },
    header: { gap: 7 },
    eyebrow: {
      color: colors.primary,
      fontSize: 11,
      fontWeight: '800',
      letterSpacing: 1,
    },
    title: { color: colors.text, fontSize: 28, fontWeight: '800' },
    subtitle: { color: colors.textMuted, fontSize: 15, lineHeight: 22 },
    searchCard: { gap: 10, padding: 16 },
    fieldLabel: { color: colors.text, fontSize: 13, fontWeight: '800' },
    searchRow: { alignItems: 'stretch', flexDirection: 'row', gap: 8 },
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
    searchButton: { justifyContent: 'center', paddingHorizontal: 14 },
    primaryButton: {
      alignItems: 'center',
      backgroundColor: colors.primary,
      borderRadius: 10,
      justifyContent: 'center',
      paddingHorizontal: 16,
      paddingVertical: 11,
    },
    primaryButtonText: { color: '#FFFFFF', fontSize: 13, fontWeight: '800' },
    errorBox: {
      backgroundColor: colors.dangerSoft || '#321b1b',
      borderColor: colors.danger || '#ff8a80',
      borderRadius: 12,
      borderWidth: 1,
      padding: 13,
    },
    emptyCard: { gap: 5, padding: 16 },
    emptyTitle: { color: colors.text, fontSize: 16, fontWeight: '800' },
    emptyText: { color: colors.textMuted, fontSize: 13, lineHeight: 19 },
    userList: { gap: 12 },
    userPressable: { borderRadius: 16 },
    userCard: { gap: 10, padding: 15 },
    userTopRow: {
      alignItems: 'center',
      flexDirection: 'row',
      gap: 11,
    },
    avatarImage: { borderRadius: 999, height: 48, width: 48 },
    avatarFallback: {
      alignItems: 'center',
      backgroundColor: colors.primarySoft,
      borderRadius: 999,
      height: 48,
      justifyContent: 'center',
      width: 48,
    },
    avatarText: { color: colors.primary, fontSize: 16, fontWeight: '800' },
    userIdentity: { flex: 1, gap: 2, minWidth: 0 },
    nameRow: { alignItems: 'center', flexDirection: 'row', gap: 7 },
    userName: { color: colors.text, flex: 1, fontSize: 16, fontWeight: '800' },
    username: { color: colors.textMuted, fontSize: 12 },
    meta: { color: colors.textMuted, fontSize: 12 },
    openArrow: { color: colors.primary, fontSize: 27, lineHeight: 27 },
    badgesRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 7 },
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
    passwordBadge: {
      backgroundColor: colors.primarySoft,
      borderRadius: 999,
      paddingHorizontal: 8,
      paddingVertical: 4,
    },
    passwordBadgeText: { color: colors.primary, fontSize: 10, fontWeight: '800' },
    pressed: { opacity: 0.72 },
  });
}
