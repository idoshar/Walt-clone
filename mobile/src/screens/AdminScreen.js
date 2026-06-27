import {
  SafeAreaView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { useAuth } from '../auth/AuthContext';

export default function AdminScreen() {
  const { user } = useAuth();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Admin area</Text>
        <Text style={styles.message}>
          Signed in as {user?.fullName || user?.username || 'admin'}.
        </Text>
        <Text style={styles.message}>
          Administrative statistics and management tools will appear here.
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#f7f7f7',
    flex: 1,
  },
  content: {
    gap: 16,
    padding: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
  },
  message: {
    fontSize: 16,
    lineHeight: 24,
  },
});
