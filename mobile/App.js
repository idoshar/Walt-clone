import { StatusBar } from 'expo-status-bar';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { checkBackendHealth } from './src/api/health';

export default function App() {
  const [connectionState, setConnectionState] = useState('loading');
  const [message, setMessage] = useState('Checking backend connection...');

  const checkConnection = useCallback(async () => {
    setConnectionState('loading');
    setMessage('Checking backend connection...');

    try {
      const healthData = await checkBackendHealth();

      setConnectionState('success');
      setMessage(
        `Connected successfully. Service: ${healthData.service || 'backend'}`
      );
    } catch (error) {
      setConnectionState('error');
      setMessage(error.message || 'Could not connect to the backend.');
    }
  }, []);

  useEffect(() => {
    checkConnection();
  }, [checkConnection]);

  const isLoading = connectionState === 'loading';
  const isSuccess = connectionState === 'success';

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />

      <View style={styles.content}>
        <Text style={styles.title}>Wolt Delivery</Text>
        <Text style={styles.subtitle}>Mobile app setup</Text>

        <View style={styles.statusCard}>
          <Text style={styles.statusLabel}>Backend connection</Text>

          {isLoading && <ActivityIndicator size="large" />}

          <Text style={styles.statusText}>
            {isLoading ? 'Loading...' : isSuccess ? 'Connected' : 'Connection failed'}
          </Text>

          <Text style={styles.message}>{message}</Text>

          {!isLoading && (
            <Pressable style={styles.button} onPress={checkConnection}>
              <Text style={styles.buttonText}>Retry connection</Text>
            </Pressable>
          )}
        </View>

        <Text style={styles.apiText}>
          API: {process.env.EXPO_PUBLIC_API_BASE_URL || 'Not configured'}
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f7f7f7',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    padding: 24,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    marginBottom: 32,
  },
  statusCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 24,
    gap: 16,
  },
  statusLabel: {
    fontSize: 16,
    fontWeight: '600',
  },
  statusText: {
    fontSize: 22,
    fontWeight: '700',
  },
  message: {
    fontSize: 15,
    lineHeight: 22,
  },
  button: {
    alignItems: 'center',
    borderRadius: 10,
    paddingVertical: 14,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '700',
  },
  apiText: {
    fontSize: 12,
    marginTop: 24,
  },
});
