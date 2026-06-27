import { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { useAuth } from '../auth/AuthContext';

export default function LoginScreen({ navigation }) {
  const { signIn } = useAuth();

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
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.container}
    >
      <View style={styles.card}>
        <Text style={styles.title}>Wolt Delivery</Text>
        <Text style={styles.subtitle}>Sign in to continue</Text>

        <TextInput
          autoCapitalize="none"
          autoCorrect={false}
          editable={!isSubmitting}
          onChangeText={setUsername}
          placeholder="Username"
          style={styles.input}
          value={username}
        />

        <TextInput
          editable={!isSubmitting}
          onChangeText={setPassword}
          placeholder="Password"
          secureTextEntry
          style={styles.input}
          value={password}
        />

        {message ? <Text style={styles.message}>{message}</Text> : null}

        <Pressable
          disabled={isSubmitting}
          onPress={handleLogin}
          style={styles.primaryButton}
        >
          {isSubmitting ? (
            <ActivityIndicator />
          ) : (
            <Text style={styles.primaryButtonText}>Sign in</Text>
          )}
        </Pressable>

        <Pressable
          disabled={isSubmitting}
          onPress={() => navigation.navigate('Register')}
          style={styles.secondaryButton}
        >
          <Text style={styles.secondaryButtonText}>
            New here? Create an account
          </Text>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    backgroundColor: '#f7f7f7',
    flex: 1,
    justifyContent: 'center',
    padding: 24,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    gap: 14,
    padding: 24,
    width: '100%',
  },
  title: {
    fontSize: 30,
    fontWeight: '700',
  },
  subtitle: {
    fontSize: 16,
    marginBottom: 8,
  },
  input: {
    borderColor: '#d7d7d7',
    borderRadius: 10,
    borderWidth: 1,
    fontSize: 16,
    padding: 14,
  },
  message: {
    fontSize: 14,
    lineHeight: 20,
  },
  primaryButton: {
    alignItems: 'center',
    borderRadius: 10,
    paddingVertical: 14,
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '700',
  },
  secondaryButton: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  secondaryButtonText: {
    fontSize: 15,
    fontWeight: '600',
  },
});