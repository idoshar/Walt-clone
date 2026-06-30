import { useMemo, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { submitPasswordResetRequest } from '../api/passwordResetRequests';
import AppButton from '../components/AppButton';
import AppCard from '../components/AppCard';
import { useAppTheme } from '../theme/ThemeContext';

export default function ForgotPasswordScreen({ navigation }) {
  const { theme } = useAppTheme();
  const styles = useMemo(
    () => createStyles(theme.colors),
    [theme.colors]
  );

  const [username, setUsername] = useState('');
  const [message, setMessage] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit() {
    const normalizedUsername = username.trim();

    if (!normalizedUsername) {
      setIsSuccess(false);
      setMessage('Enter your username.');
      return;
    }

    setIsSubmitting(true);
    setIsSuccess(false);
    setMessage('');

    try {
      const response = await submitPasswordResetRequest(normalizedUsername);

      setIsSuccess(true);
      setMessage(
        response?.message ||
          'If an active account matches the supplied username, an administrator can review the request.'
      );
    } catch (error) {
      setIsSuccess(false);
      setMessage(
        error.message ||
          'Could not submit the password-reset request. Please try again.'
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
        <View style={styles.content}>
          <View style={styles.topRow}>
            <View style={styles.brandBlock}>
              <Text style={styles.brandName}>Wolt Delivery</Text>
              <Text style={styles.brandTagline}>
                Recover access to your account.
              </Text>
            </View>

          </View>

          <AppCard style={styles.card}>
            <Text style={styles.title}>Request password reset</Text>

            <Text style={styles.subtitle}>
              Enter your username and an administrator can review the request.
              For security, the same response is shown whether or not an active
              account matches the username.
            </Text>

            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Username</Text>

              <TextInput
                autoCapitalize="none"
                autoCorrect={false}
                editable={!isSubmitting}
                onChangeText={(value) => {
                  setUsername(value);
                  setMessage('');
                }}
                onSubmitEditing={handleSubmit}
                placeholder="Enter your username"
                placeholderTextColor={theme.colors.textMuted}
                returnKeyType="send"
                style={styles.input}
                value={username}
              />

              <Text style={styles.fieldHelper}>
                An administrator can review a matching active account request.
              </Text>
            </View>

            {message ? (
              <View
                style={[
                  styles.messageBox,
                  isSuccess ? styles.successBox : styles.errorBox,
                ]}
              >
                <Text
                  style={[
                    styles.message,
                    isSuccess ? styles.successText : styles.errorText,
                  ]}
                >
                  {message}
                </Text>
              </View>
            ) : null}

            <AppButton
              disabled={isSubmitting}
              loading={isSubmitting}
              onPress={handleSubmit}
              title="Request password reset"
            />

            <AppButton
              disabled={isSubmitting}
              onPress={() => navigation.navigate('Login')}
              title="Back to sign in"
              variant="secondary"
            />

            <AppButton
              disabled={isSubmitting}
              onPress={() => navigation.navigate('Register')}
              title="Create a new account"
              variant="secondary"
            />
          </AppCard>
        </View>
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
      flex: 1,
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
    fieldHelper: {
      color: colors.textMuted,
      fontSize: 13,
      lineHeight: 18,
    },
    messageBox: {
      borderRadius: 12,
      padding: 12,
    },
    successBox: {
      backgroundColor: colors.primarySoft,
    },
    errorBox: {
      backgroundColor: colors.dangerSoft,
    },
    message: {
      fontSize: 14,
      fontWeight: '600',
      lineHeight: 20,
    },
    successText: {
      color: colors.text,
    },
    errorText: {
      color: colors.danger,
    },
  });
}