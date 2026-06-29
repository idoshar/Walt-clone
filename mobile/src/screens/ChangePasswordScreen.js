import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { useAuth } from '../auth/AuthContext';
import AppButton from '../components/AppButton';
import AppCard from '../components/AppCard';
import ThemeToggle from '../components/ThemeToggle';
import { useAppTheme } from '../theme/ThemeContext';

function validatePassword(password) {
  if (!password) {
    return 'New password is required.';
  }

  if (password.length < 8) {
    return 'Password must be at least 8 characters long.';
  }

  if (!/[a-zA-Z]/.test(password) || !/[0-9]/.test(password)) {
    return 'Password must contain both letters and numbers.';
  }

  return '';
}

export default function ChangePasswordScreen() {
  const { changePassword, signOut, user } = useAuth();
  const { theme } = useAppTheme();
  const styles = createStyles(theme.colors);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  function clearFieldError(fieldName) {
    setFieldErrors((currentErrors) => ({
      ...currentErrors,
      [fieldName]: '',
    }));

    setMessage('');
  }

  function validateForm() {
    const errors = {};

    if (!currentPassword) {
      errors.currentPassword = 'Current password is required.';
    }

    const newPasswordError = validatePassword(newPassword);

    if (newPasswordError) {
      errors.newPassword = newPasswordError;
    }

    if (!confirmPassword) {
      errors.confirmPassword = 'Please confirm your new password.';
    } else if (newPassword !== confirmPassword) {
      errors.confirmPassword = 'Passwords do not match.';
    }

    if (
      currentPassword &&
      newPassword &&
      currentPassword === newPassword
    ) {
      errors.newPassword =
        'New password must be different from current password.';
    }

    return errors;
  }

  async function handleSubmit() {
    const errors = validateForm();
    setFieldErrors(errors);

    if (Object.keys(errors).length > 0) {
      setMessage('Please fix the highlighted fields before continuing.');
      return;
    }

    setIsSubmitting(true);
    setMessage('');

    try {
      await changePassword(currentPassword, newPassword);
    } catch (error) {
      setMessage(
        error.message ||
          'Password could not be updated. Please try again.'
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.keyboardContainer}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.content}>
            <View style={styles.topRow}>
              <View style={styles.brandBlock}>
                <Text style={styles.brandName}>Wolt Delivery</Text>
                <Text style={styles.brandTagline}>
                  Secure your account to continue.
                </Text>
              </View>

              <ThemeToggle compact />
            </View>

            <AppCard style={styles.card}>
              <Text style={styles.title}>Update your password</Text>

              <Text style={styles.subtitle}>
                {user?.fullName
                  ? `${user.fullName}, your account requires a password update before you can continue.`
                  : 'Your account requires a password update before you can continue.'}
              </Text>

              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>Current password</Text>

                <TextInput
                  autoCapitalize="none"
                  editable={!isSubmitting}
                  onChangeText={(value) => {
                    setCurrentPassword(value);
                    clearFieldError('currentPassword');
                  }}
                  placeholder="Enter current password"
                  placeholderTextColor={theme.colors.textMuted}
                  secureTextEntry
                  style={[
                    styles.input,
                    fieldErrors.currentPassword ? styles.inputError : null,
                  ]}
                  value={currentPassword}
                />

                <Text
                  style={
                    fieldErrors.currentPassword
                      ? styles.fieldError
                      : styles.fieldHelper
                  }
                >
                  {fieldErrors.currentPassword ||
                    'Enter the password used to sign in.'}
                </Text>
              </View>

              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>New password</Text>

                <TextInput
                  autoCapitalize="none"
                  editable={!isSubmitting}
                  onChangeText={(value) => {
                    setNewPassword(value);
                    clearFieldError('newPassword');
                    clearFieldError('confirmPassword');
                  }}
                  placeholder="Create a new password"
                  placeholderTextColor={theme.colors.textMuted}
                  secureTextEntry
                  style={[
                    styles.input,
                    fieldErrors.newPassword ? styles.inputError : null,
                  ]}
                  value={newPassword}
                />

                <Text
                  style={
                    fieldErrors.newPassword
                      ? styles.fieldError
                      : styles.fieldHelper
                  }
                >
                  {fieldErrors.newPassword ||
                    'Use at least 8 characters with letters and numbers.'}
                </Text>
              </View>

              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>Confirm new password</Text>

                <TextInput
                  autoCapitalize="none"
                  editable={!isSubmitting}
                  onChangeText={(value) => {
                    setConfirmPassword(value);
                    clearFieldError('confirmPassword');
                  }}
                  onSubmitEditing={handleSubmit}
                  placeholder="Repeat new password"
                  placeholderTextColor={theme.colors.textMuted}
                  returnKeyType="done"
                  secureTextEntry
                  style={[
                    styles.input,
                    fieldErrors.confirmPassword ? styles.inputError : null,
                  ]}
                  value={confirmPassword}
                />

                <Text
                  style={
                    fieldErrors.confirmPassword
                      ? styles.fieldError
                      : styles.fieldHelper
                  }
                >
                  {fieldErrors.confirmPassword ||
                    'Repeat the same new password.'}
                </Text>
              </View>

              {message ? (
                <View style={styles.messageBox}>
                  <Text style={styles.message}>{message}</Text>
                </View>
              ) : null}

              <AppButton
                disabled={isSubmitting}
                loading={isSubmitting}
                onPress={handleSubmit}
                title="Update password"
              />

              <AppButton
                disabled={isSubmitting}
                onPress={signOut}
                title="Sign out instead"
                variant="secondary"
              />
            </AppCard>
          </View>
        </ScrollView>
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
    scrollContent: {
      flexGrow: 1,
    },
    content: {
      flexGrow: 1,
      justifyContent: 'center',
      padding: 24,
    },
    topRow: {
      alignItems: 'flex-start',
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 24,
    },
    brandBlock: {
      flex: 1,
      paddingRight: 12,
    },
    brandName: {
      color: colors.primary,
      fontSize: 32,
      fontWeight: '800',
      letterSpacing: -0.8,
    },
    brandTagline: {
      color: colors.textMuted,
      fontSize: 15,
      marginTop: 4,
    },
    card: {
      gap: 18,
      padding: 24,
    },
    title: {
      color: colors.text,
      fontSize: 26,
      fontWeight: '800',
      letterSpacing: -0.3,
    },
    subtitle: {
      color: colors.textMuted,
      fontSize: 15,
      lineHeight: 22,
      marginTop: -8,
    },
    fieldGroup: {
      gap: 7,
    },
    fieldLabel: {
      color: colors.text,
      fontSize: 14,
      fontWeight: '700',
    },
    input: {
      backgroundColor: colors.surfaceRaised,
      borderColor: colors.border,
      borderRadius: 14,
      borderWidth: 1,
      color: colors.text,
      fontSize: 16,
      minHeight: 52,
      paddingHorizontal: 14,
      paddingVertical: 12,
    },
    inputError: {
      borderColor: colors.danger,
    },
    fieldHelper: {
      color: colors.textMuted,
      fontSize: 12,
      lineHeight: 18,
    },
    fieldError: {
      color: colors.danger,
      fontSize: 12,
      fontWeight: '700',
      lineHeight: 18,
    },
    messageBox: {
      backgroundColor: colors.dangerSoft,
      borderRadius: 12,
      padding: 12,
    },
    message: {
      color: colors.danger,
      fontSize: 14,
      fontWeight: '600',
      lineHeight: 20,
    },
  });
}
