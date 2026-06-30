import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
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

export default function LoginScreen({ navigation }) {
  const { signIn } = useAuth();
  const { theme } = useAppTheme();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleLogin() {
    if (!username.trim() || !password) {
      setMessage('Enter both username and password.');
      return;
    }

    setIsSubmitting(true);
    setMessage('');

    try {
      await signIn(username.trim(), password);
    } catch (error) {
      setMessage(error.message || 'Could not sign in.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <SafeAreaView
      style={[styles.safeArea, { backgroundColor: theme.colors.background }]}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.keyboardContainer}
      >
        <View style={styles.content}>
          <View style={styles.topRow}>
            <View style={styles.brandBlock}>
              <Text style={[styles.brandName, { color: theme.colors.primary }]}>
                Wolt Delivery
              </Text>
              <Text style={[styles.brandTagline, { color: theme.colors.textMuted }]}>
                Your next meal, delivered.
              </Text>
            </View>

            <ThemeToggle compact />
          </View>

          <AppCard style={styles.card}>
            <Text style={[styles.title, { color: theme.colors.text }]}>
              Welcome back
            </Text>

            <Text style={[styles.subtitle, { color: theme.colors.textMuted }]}>
              Sign in to browse restaurants and manage your orders.
            </Text>

            <View style={styles.fieldGroup}>
              <Text style={[styles.fieldLabel, { color: theme.colors.text }]}>
                Username
              </Text>

              <TextInput
                autoCapitalize="none"
                autoCorrect={false}
                editable={!isSubmitting}
                onChangeText={(value) => {
                  setUsername(value);
                  setMessage('');
                }}
                placeholder="Enter your username"
                placeholderTextColor={theme.colors.textMuted}
                style={[
                  styles.input,
                  {
                    backgroundColor: theme.colors.surfaceRaised,
                    borderColor: theme.colors.border,
                    color: theme.colors.text,
                  },
                ]}
                value={username}
              />
            </View>

            <View style={styles.fieldGroup}>
              <Text style={[styles.fieldLabel, { color: theme.colors.text }]}>
                Password
              </Text>

              <TextInput
                autoCapitalize="none"
                editable={!isSubmitting}
                onChangeText={(value) => {
                  setPassword(value);
                  setMessage('');
                }}
                placeholder="Enter your password"
                placeholderTextColor={theme.colors.textMuted}
                secureTextEntry
                style={[
                  styles.input,
                  {
                    backgroundColor: theme.colors.surfaceRaised,
                    borderColor: theme.colors.border,
                    color: theme.colors.text,
                  },
                ]}
                value={password}
                onSubmitEditing={handleLogin}
                returnKeyType="done"
              />
            </View>

            {message ? (
              <View
                style={[
                  styles.messageBox,
                  { backgroundColor: theme.colors.dangerSoft },
                ]}
              >
                <Text style={[styles.message, { color: theme.colors.danger }]}>
                  {message}
                </Text>
              </View>
            ) : null}

            <AppButton
              disabled={isSubmitting}
              loading={isSubmitting}
              onPress={handleLogin}
              title="Sign in"
            />

            <Text
              accessibilityRole="link"
              onPress={() => navigation.navigate('ForgotPassword')}
              style={[
                styles.forgotPasswordLink,
                {
                  color: isSubmitting
                    ? theme.colors.textMuted
                    : theme.colors.primary,
                },
              ]}
            >
              Forgot your password?
            </Text>

            <AppButton
              disabled={isSubmitting}
              onPress={() => navigation.navigate('Register')}
              title="Create a new account"
              variant="secondary"
            />
          </AppCard>

          <Text style={[styles.footer, { color: theme.colors.textMuted }]}>
            Food delivery, restaurants and orders in one place.
          </Text>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
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
    fontSize: 32,
    fontWeight: '800',
    letterSpacing: -0.8,
  },
  brandTagline: {
    fontSize: 15,
    marginTop: 4,
  },
  card: {
    gap: 18,
    padding: 24,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 15,
    lineHeight: 22,
    marginTop: -8,
  },
  fieldGroup: {
    gap: 7,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: '700',
  },
  input: {
    borderRadius: 14,
    borderWidth: 1,
    fontSize: 16,
    minHeight: 52,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  messageBox: {
    borderRadius: 12,
    padding: 12,
  },
  message: {
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 20,
  },
  forgotPasswordLink: {
    alignSelf: 'center',
    fontSize: 14,
    fontWeight: '800',
    marginTop: -4,
    paddingVertical: 4,
  },
  footer: {
    fontSize: 12,
    lineHeight: 18,
    marginTop: 18,
    textAlign: 'center',
  },
});
