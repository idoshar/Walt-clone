import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { useAuth } from '../auth/AuthContext';
import AdminScreen from '../screens/AdminScreen';
import HomeScreen from '../screens/HomeScreen';
import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import RestaurantDetailsScreen from '../screens/RestaurantDetailsScreen';

const Stack = createNativeStackNavigator();

function LoadingScreen() {
  return (
    <View style={styles.loadingContainer}>
      <ActivityIndicator size="large" />
      <Text style={styles.loadingText}>Restoring your session...</Text>
    </View>
  );
}

function AuthNavigator() {
  return (
    <Stack.Navigator>
      <Stack.Screen
        component={LoginScreen}
        name="Login"
        options={{ headerShown: false }}
      />
      <Stack.Screen
        component={RegisterScreen}
        name="Register"
        options={{ title: 'Create account' }}
      />
    </Stack.Navigator>
  );
}

function AppNavigator() {
  const { user } = useAuth();

  return (
    <Stack.Navigator>
      <Stack.Screen
        component={HomeScreen}
        name="Home"
        options={{ headerShown: false }}
      />

      <Stack.Screen
        component={RestaurantDetailsScreen}
        name="RestaurantDetails"
        options={{ title: 'Restaurant' }}
      />

      {user?.role === 'admin' && (
        <Stack.Screen
          component={AdminScreen}
          name="Admin"
          options={{ title: 'Admin area' }}
        />
      )}
    </Stack.Navigator>
  );
}

export default function RootNavigator() {
  const { isAuthenticated, isRestoringSession } = useAuth();

  if (isRestoringSession) {
    return <LoadingScreen />;
  }

  return (
    <NavigationContainer>
      {isAuthenticated ? <AppNavigator /> : <AuthNavigator />}
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    alignItems: 'center',
    flex: 1,
    gap: 16,
    justifyContent: 'center',
  },
  loadingText: {
    fontSize: 16,
  },
});
