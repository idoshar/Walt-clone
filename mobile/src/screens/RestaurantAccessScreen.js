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
  addRestaurantEditor,
  getRestaurantAccess,
  removeRestaurantEditor,
  transferRestaurantOwnership,
} from '../api/restaurants';
import { lookupUserByUsername } from '../api/users';
import { useAuth } from '../auth/AuthContext';
import { useAppTheme } from '../theme/ThemeContext';

function getUserDisplayName(user) {
  return user?.fullName?.trim() || user?.username || 'Unknown user';
}

export default function RestaurantAccessScreen({
  navigation,
  route,
}) {
  const { token } = useAuth();
  const { theme } = useAppTheme();
  const styles = useMemo(
    () => createStyles(theme.colors),
    [theme.colors]
  );

  const restaurant = route.params?.restaurant || null;
  const restaurantId = restaurant?.id;

  const [access, setAccess] = useState(null);
  const [username, setUsername] = useState('');
  const [candidate, setCandidate] = useState(null);
  const [loadState, setLoadState] = useState('loading');
  const [error, setError] = useState('');
  const [feedback, setFeedback] = useState('');
  const [isLookingUp, setIsLookingUp] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const loadAccess = useCallback(async () => {
    if (!restaurantId) {
      setLoadState('error');
      setError('Restaurant information is missing.');
      return;
    }

    setLoadState('loading');
    setError('');

    try {
      const data = await getRestaurantAccess(restaurantId, token);
      setAccess(data);
      setLoadState('success');
    } catch (requestError) {
      setLoadState('error');
      setError(
        requestError.message ||
          'Could not load restaurant access information.'
      );
    }
  }, [restaurantId, token]);

  useEffect(() => {
    navigation.setOptions({
      title: 'Team access',
    });
  }, [navigation]);

  useEffect(() => {
    loadAccess();
  }, [loadAccess]);

  async function handleLookup() {
    const normalizedUsername = username.trim();

    if (!normalizedUsername) {
      setError('Enter the username of an existing user.');
      return;
    }

    setIsLookingUp(true);
    setError('');
    setFeedback('');
    setCandidate(null);

    try {
      const user = await lookupUserByUsername(token, normalizedUsername);
      setCandidate(user);
    } catch (requestError) {
      setError(requestError.message || 'Could not find that user.');
    } finally {
      setIsLookingUp(false);
    }
  }

  async function handleAddEditor() {
    if (!candidate || !restaurantId) {
      return;
    }

    setIsSaving(true);
    setError('');
    setFeedback('');

    try {
      const updatedAccess = await addRestaurantEditor(
        restaurantId,
        candidate.id,
        token
      );

      setAccess(updatedAccess);
      setFeedback(
        `${getUserDisplayName(candidate)} now has editor access.`
      );
      setCandidate(null);
      setUsername('');
    } catch (requestError) {
      setError(
        requestError.message || 'Could not grant editor access.'
      );
    } finally {
      setIsSaving(false);
    }
  }

  function confirmRemoveEditor(editor) {
    Alert.alert(
      'Remove editor',
      `Remove editor access from ${getUserDisplayName(editor)}?`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => {
            void handleRemoveEditor(editor);
          },
        },
      ]
    );
  }

  async function handleRemoveEditor(editor) {
    if (!restaurantId) {
      return;
    }

    setIsSaving(true);
    setError('');
    setFeedback('');

    try {
      await removeRestaurantEditor(
        restaurantId,
        editor.id,
        token
      );

      await loadAccess();

      setFeedback(
        `${getUserDisplayName(editor)} no longer has editor access.`
      );
    } catch (requestError) {
      setError(
        requestError.message || 'Could not remove editor access.'
      );
    } finally {
      setIsSaving(false);
    }
  }

  function confirmTransferOwnership() {
    if (!candidate) {
      return;
    }

    Alert.alert(
      'Transfer ownership',
      `Transfer ownership of "${restaurant?.name}" to ${getUserDisplayName(
        candidate
      )}? You will immediately lose management access.`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Transfer',
          style: 'destructive',
          onPress: () => {
            void handleTransferOwnership();
          },
        },
      ]
    );
  }

  async function handleTransferOwnership() {
    if (!candidate || !restaurantId) {
      return;
    }

    setIsSaving(true);
    setError('');
    setFeedback('');

    try {
      await transferRestaurantOwnership(
        restaurantId,
        candidate.id,
        token
      );

      Alert.alert(
        'Ownership transferred',
        'You no longer have management access to this restaurant.',
        [
          {
            text: 'OK',
            onPress: () => navigation.goBack(),
          },
        ]
      );
    } catch (requestError) {
      setError(
        requestError.message ||
          'Could not transfer restaurant ownership.'
      );
    } finally {
      setIsSaving(false);
    }
  }

  const editors = Array.isArray(access?.editors)
    ? access.editors
    : [];

  const candidateIsOwner =
    candidate &&
    String(candidate.id) === String(access?.owner?.id);

  const candidateIsEditor =
    candidate &&
    editors.some(
      (editor) => String(editor.id) === String(candidate.id)
    );

  if (loadState === 'loading') {
    return (
      <SafeAreaView style={styles.center}>
        <ActivityIndicator
          color={theme.colors.primary}
          size="large"
        />
        <Text style={styles.helperText}>
          Loading team access...
        </Text>
      </SafeAreaView>
    );
  }

  if (loadState === 'error') {
    return (
      <SafeAreaView style={styles.center}>
        <Text style={styles.errorTitle}>
          Could not load team access
        </Text>
        <Text style={styles.errorText}>{error}</Text>

        <Pressable
          style={({ pressed }) => [
            styles.primaryButton,
            pressed ? styles.pressed : null,
          ]}
          onPress={loadAccess}
        >
          <Text style={styles.primaryButtonText}>Try again</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

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
          <Text style={styles.title}>Manage team access</Text>

          <Text style={styles.subtitle}>
            Editors can manage restaurant details and products, but
            cannot manage access, transfer ownership, or delete the
            restaurant.
          </Text>

          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Owner</Text>

            <View style={styles.ownerCard}>
              <Text style={styles.personName}>
                {access?.owner
                  ? getUserDisplayName(access.owner)
                  : 'No owner assigned'}
              </Text>

              {access?.owner?.username ? (
                <Text style={styles.personUsername}>
                  @{access.owner.username}
                </Text>
              ) : null}
            </View>
          </View>

          <View style={styles.section}>
            <View style={styles.sectionHeading}>
              <View>
                <Text style={styles.sectionLabel}>Editors</Text>
                <Text style={styles.sectionTitle}>
                  Team members with access
                </Text>
              </View>

              <View style={styles.countBadge}>
                <Text style={styles.countBadgeText}>
                  {editors.length}
                </Text>
              </View>
            </View>

            {editors.length === 0 ? (
              <View style={styles.emptyCard}>
                <Text style={styles.helperText}>
                  No editors have access yet.
                </Text>
              </View>
            ) : (
              editors.map((editor) => (
                <View key={editor.id} style={styles.editorRow}>
                  <View style={styles.personInfo}>
                    <Text style={styles.personName}>
                      {getUserDisplayName(editor)}
                    </Text>
                    <Text style={styles.personUsername}>
                      @{editor.username}
                    </Text>
                  </View>

                  <Pressable
                    disabled={isSaving}
                    onPress={() => confirmRemoveEditor(editor)}
                    style={({ pressed }) => [
                      styles.removeButton,
                      isSaving ? styles.disabled : null,
                      pressed ? styles.pressed : null,
                    ]}
                  >
                    <Text style={styles.removeButtonText}>Remove</Text>
                  </Pressable>
                </View>
              ))
            )}
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionLabel}>
              Find an existing user
            </Text>

            <View style={styles.lookupRow}>
              <TextInput
                autoCapitalize="none"
                autoCorrect={false}
                editable={!isLookingUp && !isSaving}
                onChangeText={setUsername}
                onSubmitEditing={handleLookup}
                placeholder="Enter exact username"
                placeholderTextColor={theme.colors.textMuted}
                returnKeyType="search"
                style={styles.input}
                value={username}
              />

              <Pressable
                disabled={isLookingUp || isSaving}
                onPress={handleLookup}
                style={({ pressed }) => [
                  styles.lookupButton,
                  isLookingUp || isSaving ? styles.disabled : null,
                  pressed ? styles.pressed : null,
                ]}
              >
                {isLookingUp ? (
                  <ActivityIndicator color={theme.colors.primary} />
                ) : (
                  <Text style={styles.lookupButtonText}>Find</Text>
                )}
              </Pressable>
            </View>

            {candidate ? (
              <View style={styles.candidateCard}>
                <View style={styles.personInfo}>
                  <Text style={styles.personName}>
                    {getUserDisplayName(candidate)}
                  </Text>
                  <Text style={styles.personUsername}>
                    @{candidate.username}
                  </Text>
                </View>

                <View style={styles.candidateActions}>
                  <Pressable
                    disabled={
                      isSaving ||
                      candidateIsOwner ||
                      candidateIsEditor
                    }
                    onPress={handleAddEditor}
                    style={({ pressed }) => [
                      styles.primaryButton,
                      styles.candidateButton,
                      isSaving ||
                      candidateIsOwner ||
                      candidateIsEditor
                        ? styles.disabled
                        : null,
                      pressed ? styles.pressed : null,
                    ]}
                  >
                    <Text style={styles.primaryButtonText}>
                      {candidateIsOwner
                        ? 'Already owner'
                        : candidateIsEditor
                          ? 'Already editor'
                          : 'Grant editor access'}
                    </Text>
                  </Pressable>

                  <Pressable
                    disabled={isSaving || candidateIsOwner}
                    onPress={confirmTransferOwnership}
                    style={({ pressed }) => [
                      styles.transferButton,
                      isSaving || candidateIsOwner
                        ? styles.disabled
                        : null,
                      pressed ? styles.pressed : null,
                    ]}
                  >
                    <Text style={styles.transferButtonText}>
                      Transfer ownership
                    </Text>
                  </Pressable>
                </View>
              </View>
            ) : null}
          </View>

          {feedback ? (
            <View style={styles.feedbackBox}>
              <Text style={styles.feedbackText}>{feedback}</Text>
            </View>
          ) : null}

          {error ? (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function createStyles(colors) {
  return StyleSheet.create({
    container: {
      backgroundColor: colors.background,
      flex: 1,
    },
    keyboardView: {
      flex: 1,
    },
    content: {
      gap: 16,
      padding: 20,
      paddingBottom: 40,
    },
    center: {
      alignItems: 'center',
      backgroundColor: colors.background,
      flex: 1,
      gap: 12,
      justifyContent: 'center',
      padding: 24,
    },
    title: {
      color: colors.text,
      fontSize: 26,
      fontWeight: '800',
    },
    subtitle: {
      color: colors.textMuted,
      fontSize: 14,
      lineHeight: 20,
    },
    section: {
      gap: 10,
    },
    sectionHeading: {
      alignItems: 'center',
      flexDirection: 'row',
      justifyContent: 'space-between',
    },
    sectionLabel: {
      color: colors.primary,
      fontSize: 12,
      fontWeight: '800',
      letterSpacing: 0.5,
      textTransform: 'uppercase',
    },
    sectionTitle: {
      color: colors.text,
      fontSize: 17,
      fontWeight: '800',
      marginTop: 3,
    },
    ownerCard: {
      backgroundColor: colors.surface,
      borderColor: colors.border,
      borderRadius: 14,
      borderWidth: 1,
      padding: 16,
    },
    emptyCard: {
      alignItems: 'center',
      backgroundColor: colors.surface,
      borderColor: colors.border,
      borderRadius: 14,
      borderWidth: 1,
      padding: 18,
    },
    editorRow: {
      alignItems: 'center',
      backgroundColor: colors.surface,
      borderColor: colors.border,
      borderRadius: 14,
      borderWidth: 1,
      flexDirection: 'row',
      gap: 12,
      justifyContent: 'space-between',
      padding: 14,
    },
    personInfo: {
      flex: 1,
      minWidth: 0,
    },
    personName: {
      color: colors.text,
      fontSize: 16,
      fontWeight: '800',
    },
    personUsername: {
      color: colors.textMuted,
      fontSize: 13,
      marginTop: 2,
    },
    countBadge: {
      alignItems: 'center',
      backgroundColor: colors.primarySoft,
      borderRadius: 999,
      justifyContent: 'center',
      minHeight: 30,
      minWidth: 30,
      paddingHorizontal: 10,
    },
    countBadgeText: {
      color: colors.primary,
      fontSize: 13,
      fontWeight: '800',
    },
    lookupRow: {
      flexDirection: 'row',
      gap: 10,
    },
    input: {
      backgroundColor: colors.surface,
      borderColor: colors.border,
      borderRadius: 12,
      borderWidth: 1,
      color: colors.text,
      flex: 1,
      fontSize: 15,
      minHeight: 48,
      paddingHorizontal: 14,
    },
    lookupButton: {
      alignItems: 'center',
      backgroundColor: colors.primarySoft,
      borderColor: colors.primary,
      borderRadius: 12,
      borderWidth: 1,
      justifyContent: 'center',
      minWidth: 72,
      paddingHorizontal: 14,
    },
    lookupButtonText: {
      color: colors.primary,
      fontSize: 14,
      fontWeight: '800',
    },
    candidateCard: {
      backgroundColor: colors.surface,
      borderColor: colors.primary,
      borderRadius: 14,
      borderWidth: 1,
      gap: 14,
      marginTop: 4,
      padding: 16,
    },
    candidateActions: {
      gap: 10,
    },
    candidateButton: {
      width: '100%',
    },
    primaryButton: {
      alignItems: 'center',
      backgroundColor: colors.primary,
      borderRadius: 12,
      justifyContent: 'center',
      minHeight: 48,
      paddingHorizontal: 16,
    },
    primaryButtonText: {
      color: colors.onPrimary,
      fontSize: 14,
      fontWeight: '800',
    },
    removeButton: {
      alignItems: 'center',
      borderColor: colors.danger,
      borderRadius: 10,
      borderWidth: 1,
      justifyContent: 'center',
      minHeight: 38,
      paddingHorizontal: 12,
    },
    removeButtonText: {
      color: colors.danger,
      fontSize: 13,
      fontWeight: '800',
    },
    transferButton: {
      alignItems: 'center',
      backgroundColor: colors.dangerSoft,
      borderColor: colors.danger,
      borderRadius: 12,
      borderWidth: 1,
      justifyContent: 'center',
      minHeight: 48,
      paddingHorizontal: 16,
    },
    transferButtonText: {
      color: colors.danger,
      fontSize: 14,
      fontWeight: '800',
    },
    feedbackBox: {
      backgroundColor: colors.primarySoft,
      borderRadius: 12,
      padding: 14,
    },
    feedbackText: {
      color: colors.text,
      fontSize: 14,
      lineHeight: 20,
    },
    errorBox: {
      backgroundColor: colors.dangerSoft,
      borderColor: colors.danger,
      borderRadius: 12,
      borderWidth: 1,
      padding: 14,
    },
    errorText: {
      color: colors.danger,
      fontSize: 14,
      lineHeight: 20,
      textAlign: 'center',
    },
    errorTitle: {
      color: colors.text,
      fontSize: 20,
      fontWeight: '800',
      textAlign: 'center',
    },
    helperText: {
      color: colors.textMuted,
      fontSize: 14,
      lineHeight: 20,
      textAlign: 'center',
    },
    disabled: {
      opacity: 0.5,
    },
    pressed: {
      opacity: 0.75,
    },
  });
}