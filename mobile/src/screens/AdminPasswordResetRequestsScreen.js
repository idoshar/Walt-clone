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
  approveAdminPasswordResetRequest,
  getAdminPasswordResetRequests,
  rejectAdminPasswordResetRequest,
} from '../api/adminUserManagement';
import { useAuth } from '../auth/AuthContext';
import AppCard from '../components/AppCard';
import { useAppTheme } from '../theme/ThemeContext';

function getDisplayName(user) {
  return user?.fullName || user?.username || 'Unknown user';
}

function formatDate(value) {
  if (!value) {
    return 'Unknown';
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return 'Unknown';
  }

  return date.toLocaleString();
}

export default function AdminPasswordResetRequestsScreen() {
  const { token, user: currentUser } = useAuth();
  const { theme } = useAppTheme();
  const styles = useMemo(
    () => createStyles(theme.colors),
    [theme.colors]
  );

  const [requests, setRequests] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [pendingKey, setPendingKey] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [approvalRequest, setApprovalRequest] = useState(null);
  const [temporaryPassword, setTemporaryPassword] = useState('');

  const isBusy = Boolean(pendingKey);

  const loadRequests = useCallback(
    async ({ refreshing = false } = {}) => {
      if (refreshing) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }

      setError('');

      try {
        const data = await getAdminPasswordResetRequests(
          token,
          'pending'
        );

        setRequests(Array.isArray(data) ? data : []);
      } catch (requestError) {
        setError(
          requestError.message ||
            'Could not load pending password-reset requests.'
        );
      } finally {
        if (refreshing) {
          setIsRefreshing(false);
        } else {
          setIsLoading(false);
        }
      }
    },
    [token]
  );

  useEffect(() => {
    loadRequests();
  }, [loadRequests]);

  function closeApproval() {
    if (isBusy) {
      return;
    }

    setTemporaryPassword('');
    setApprovalRequest(null);
  }

  async function handleApprove() {
    if (!approvalRequest) {
      return;
    }

    if (!temporaryPassword.trim()) {
      setError('A temporary password is required.');
      return;
    }

    const actionKey = `approve:${approvalRequest.id}`;
    const targetName = getDisplayName(approvalRequest.user);

    setPendingKey(actionKey);
    setError('');
    setNotice('');

    try {
      await approveAdminPasswordResetRequest(
        approvalRequest.id,
        temporaryPassword,
        token
      );

      setApprovalRequest(null);
      setTemporaryPassword('');
      setNotice(
        `Password reset approved for ${targetName}. The user must change the temporary password after signing in.`
      );

      await loadRequests({ refreshing: true });
    } catch (requestError) {
      setError(
        requestError.message ||
          'Could not approve the password-reset request.'
      );
    } finally {
      setPendingKey('');
    }
  }

  function confirmReject(request) {
    const targetName = getDisplayName(request.user);

    Alert.alert(
      'Reject password reset',
      `Reject the password-reset request for ${targetName}?`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Reject',
          style: 'destructive',
          onPress: () => {
            void handleReject(request);
          },
        },
      ]
    );
  }

  async function handleReject(request) {
    const actionKey = `reject:${request.id}`;
    const targetName = getDisplayName(request.user);

    setPendingKey(actionKey);
    setError('');
    setNotice('');

    try {
      await rejectAdminPasswordResetRequest(request.id, token);

      setNotice(`Password-reset request rejected for ${targetName}.`);

      await loadRequests({ refreshing: true });
    } catch (requestError) {
      setError(
        requestError.message ||
          'Could not reject the password-reset request.'
      );
    } finally {
      setPendingKey('');
    }
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.keyboardContainer}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={() => loadRequests({ refreshing: true })}
              tintColor={theme.colors.primary}
            />
          }
        >
          <View style={styles.header}>
            <Text style={styles.eyebrow}>ACCOUNT RECOVERY</Text>

            <Text style={styles.title}>Password-reset requests</Text>

            <Text style={styles.subtitle}>
              Approving a request signs the user out, assigns a temporary
              password, and requires a password change at the next sign-in.
            </Text>
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

          {isLoading ? (
            <View style={styles.loadingState}>
              <ActivityIndicator
                color={theme.colors.primary}
                size="large"
              />

              <Text style={styles.loadingText}>
                Loading pending requests...
              </Text>
            </View>
          ) : requests.length === 0 ? (
            <AppCard style={styles.emptyCard}>
              <Text style={styles.emptyTitle}>
                No pending password-reset requests
              </Text>

              <Text style={styles.emptyText}>
                Pull down to refresh. New matching requests will appear here
                for review.
              </Text>
            </AppCard>
          ) : (
            <View style={styles.requestList}>
              {requests.map((request) => {
                const isSelf =
                  String(request.user?.id || '') ===
                  String(currentUser?.id || '');

                return (
                  <AppCard key={request.id} style={styles.requestCard}>
                    <View style={styles.requestBody}>
                      <Text style={styles.cardEyebrow}>
                        PENDING REQUEST
                      </Text>

                      <Text style={styles.requestName}>
                        {getDisplayName(request.user)}
                      </Text>

                      <Text style={styles.requestMeta}>
                        @{request.user?.username || 'unknown'}
                      </Text>

                      <Text style={styles.requestMeta}>
                        Submitted {formatDate(request.createdAt)}
                      </Text>

                      {isSelf ? (
                        <Text style={styles.selfMessage}>
                          Your own request must be reviewed by a different
                          administrator.
                        </Text>
                      ) : null}
                    </View>

                    {!isSelf ? (
                      <View style={styles.actionRow}>
                        <Pressable
                          disabled={isBusy}
                          onPress={() => {
                            setError('');
                            setNotice('');
                            setTemporaryPassword('');
                            setApprovalRequest(request);
                          }}
                          style={({ pressed }) => [
                            styles.approveButton,
                            isBusy ? styles.disabled : null,
                            pressed ? styles.pressed : null,
                          ]}
                        >
                          <Text style={styles.approveButtonText}>
                            Approve
                          </Text>
                        </Pressable>

                        <Pressable
                          disabled={isBusy}
                          onPress={() => confirmReject(request)}
                          style={({ pressed }) => [
                            styles.rejectButton,
                            isBusy ? styles.disabled : null,
                            pressed ? styles.pressed : null,
                          ]}
                        >
                          <Text style={styles.rejectButtonText}>
                            {pendingKey === `reject:${request.id}`
                              ? 'Rejecting...'
                              : 'Reject'}
                          </Text>
                        </Pressable>
                      </View>
                    ) : null}
                  </AppCard>
                );
              })}
            </View>
          )}
        </ScrollView>

        <Modal
          animationType="slide"
          transparent
          visible={Boolean(approvalRequest)}
          onRequestClose={closeApproval}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalCard}>
              <Text style={styles.cardEyebrow}>APPROVE REQUEST</Text>

              <Text style={styles.modalTitle}>
                {getDisplayName(approvalRequest?.user)}
              </Text>

              <Text style={styles.modalDescription}>
                Set a temporary password. The user must change it before they
                can access the application.
              </Text>

              <Text style={styles.fieldLabel}>Temporary password</Text>

              <TextInput
                autoCapitalize="none"
                editable={!isBusy}
                onChangeText={(value) => {
                  setTemporaryPassword(value);
                  setError('');
                }}
                placeholder="Create temporary password"
                placeholderTextColor={theme.colors.textMuted}
                secureTextEntry
                style={styles.input}
                value={temporaryPassword}
              />

              <Text style={styles.fieldHelper}>
                Use at least 8 characters containing letters and numbers.
              </Text>

              <View style={styles.modalActions}>
                <Pressable
                  disabled={isBusy}
                  onPress={handleApprove}
                  style={({ pressed }) => [
                    styles.approveButton,
                    isBusy ? styles.disabled : null,
                    pressed ? styles.pressed : null,
                  ]}
                >
                  <Text style={styles.approveButtonText}>
                    {approvalRequest &&
                    pendingKey === `approve:${approvalRequest.id}`
                      ? 'Approving...'
                      : 'Approve and reset password'}
                  </Text>
                </Pressable>

                <Pressable
                  disabled={isBusy}
                  onPress={closeApproval}
                  style={({ pressed }) => [
                    styles.cancelButton,
                    isBusy ? styles.disabled : null,
                    pressed ? styles.pressed : null,
                  ]}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </Pressable>
              </View>
            </View>
          </View>
        </Modal>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function createStyles(colors) {
  return StyleSheet.create({
    safeArea: {
      backgroundColor: colors.background,
      flex: 1,
    },
    keyboardContainer: {
      flex: 1,
    },
    content: {
      gap: 16,
      padding: 20,
      paddingBottom: 40,
    },
    header: {
      gap: 7,
    },
    eyebrow: {
      color: colors.primary,
      fontSize: 12,
      fontWeight: '800',
      letterSpacing: 1.1,
    },
    title: {
      color: colors.text,
      fontSize: 27,
      fontWeight: '800',
      letterSpacing: -0.5,
    },
    subtitle: {
      color: colors.textMuted,
      fontSize: 15,
      lineHeight: 22,
    },
    requestList: {
      gap: 12,
    },
    requestCard: {
      gap: 16,
      padding: 18,
    },
    requestBody: {
      gap: 4,
    },
    cardEyebrow: {
      color: colors.primary,
      fontSize: 11,
      fontWeight: '800',
      letterSpacing: 0.9,
    },
    requestName: {
      color: colors.text,
      fontSize: 18,
      fontWeight: '800',
      marginTop: 4,
    },
    requestMeta: {
      color: colors.textMuted,
      fontSize: 14,
      lineHeight: 20,
    },
    selfMessage: {
      color: colors.textMuted,
      fontSize: 13,
      fontWeight: '700',
      lineHeight: 19,
      marginTop: 7,
    },
    actionRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 10,
    },
    approveButton: {
      alignItems: 'center',
      backgroundColor: colors.primary,
      borderRadius: 10,
      justifyContent: 'center',
      minHeight: 44,
      paddingHorizontal: 14,
    },
    approveButtonText: {
      color: colors.onPrimary,
      fontSize: 14,
      fontWeight: '800',
    },
    rejectButton: {
      alignItems: 'center',
      borderColor: colors.danger,
      borderRadius: 10,
      borderWidth: 1,
      justifyContent: 'center',
      minHeight: 44,
      paddingHorizontal: 14,
    },
    rejectButtonText: {
      color: colors.danger,
      fontSize: 14,
      fontWeight: '800',
    },
    cancelButton: {
      alignItems: 'center',
      borderColor: colors.border,
      borderRadius: 10,
      borderWidth: 1,
      justifyContent: 'center',
      minHeight: 44,
      paddingHorizontal: 14,
    },
    cancelButtonText: {
      color: colors.text,
      fontSize: 14,
      fontWeight: '800',
    },
    errorBox: {
      backgroundColor: colors.dangerSoft,
      borderRadius: 12,
      padding: 13,
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
      padding: 13,
    },
    noticeText: {
      color: colors.text,
      fontSize: 14,
      fontWeight: '700',
      lineHeight: 20,
    },
    loadingState: {
      alignItems: 'center',
      gap: 12,
      justifyContent: 'center',
      minHeight: 180,
    },
    loadingText: {
      color: colors.textMuted,
      fontSize: 14,
    },
    emptyCard: {
      gap: 8,
      padding: 20,
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
      maxWidth: 520,
      padding: 22,
      width: '100%',
    },
    modalTitle: {
      color: colors.text,
      fontSize: 22,
      fontWeight: '800',
    },
    modalDescription: {
      color: colors.textMuted,
      fontSize: 14,
      lineHeight: 20,
    },
    fieldLabel: {
      color: colors.text,
      fontSize: 14,
      fontWeight: '800',
      marginTop: 4,
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
    fieldHelper: {
      color: colors.textMuted,
      fontSize: 12,
      lineHeight: 18,
    },
    modalActions: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 10,
      marginTop: 4,
    },
    disabled: {
      opacity: 0.5,
    },
    pressed: {
      opacity: 0.75,
    },
  });
}