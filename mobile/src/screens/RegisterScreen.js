import { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { useAuth } from '../auth/AuthContext';

const INITIAL_FORM = {
  username: '',
  password: '',
  fullName: '',
  phone: '',
  address: '',
};

export default function RegisterScreen() {
  const { signUp } = useAuth();

  const [form, setForm] = useState(INITIAL_FORM);
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  function updateField(name, value) {
    setForm((currentForm) => ({
      ...currentForm,
      [name]: value,
    }));
  }

  async function handleRegister() {
    const hasEmptyField = Object.values(form).some(
      (value) => !value.trim()
    );

    if (hasEmptyField) {
      setMessage('Complete all fields before creating the account.');
      return;
    }

    setIsSubmitting(true);
    setMessage('');

    try {
      await signUp({
        username: form.username.trim(),
        password: form.password,
        fullName: form.fullName.trim(),
        phone: form.phone.trim(),
        address: form.address.trim(),
      });
    } catch (error) {
      setMessage(error.message || 'Could not create the account.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.container}
    >
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.card}>
          <Text style={styles.title}>Create account</Text>
          <Text style={styles.subtitle}>
            Register and continue directly to the app.
          </Text>

          <TextInput
            autoCapitalize="none"
            autoCorrect={false}
            editable={!isSubmitting}
            onChangeText={(value) => updateField('username', value)}
            placeholder="Username"
            style={styles.input}
            value={form.username}
          />

          <TextInput
            editable={!isSubmitting}
            onChangeText={(value) => updateField('password', value)}
            placeholder="Password"
            secureTextEntry
            style={styles.input}
            value={form.password}
          />

          <TextInput
            editable={!isSubmitting}
            onChangeText={(value) => updateField('fullName', value)}
            placeholder="Full name"
            style={styles.input}
            value={form.fullName}
          />

          <TextInput
            editable={!isSubmitting}
            keyboardType="phone-pad"
            onChangeText={(value) => updateField('phone', value)}
            placeholder="Phone"
            style={styles.input}
            value={form.phone}
          />

          <TextInput
            editable={!isSubmitting}
            onChangeText={(value) => updateField('address', value)}
            placeholder="Address"
            style={styles.input}
            value={form.address}
          />

          {message ? <Text style={styles.message}>{message}</Text> : null}

          <Pressable
            disabled={isSubmitting}
            onPress={handleRegister}
            style={styles.primaryButton}
          >
            {isSubmitting ? (
              <ActivityIndicator />
            ) : (
              <Text style={styles.primaryButtonText}>Create account</Text>
            )}
          </Pressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#f7f7f7',
    flex: 1,
  },
  content: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 24,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    gap: 14,
    padding: 24,
  },
  title: {
    fontSize: 28,
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
});