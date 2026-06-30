import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import ProductFormScreen from '../screens/ProductFormScreen';
import ProfileScreen from '../screens/ProfileScreen';
import RestaurantProductsScreen from '../screens/RestaurantProductsScreen';
import RestaurantSalesStatisticsScreen from '../screens/RestaurantSalesStatisticsScreen';
import RestaurantAccessScreen from '../screens/RestaurantAccessScreen';
import { useMemo } from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { useAuth } from '../auth/AuthContext';
import AdminRestaurantModerationScreen from '../screens/AdminRestaurantModerationScreen';
import AdminScreen from '../screens/AdminScreen';
import AdminUserManagementScreen from '../screens/AdminUserManagementScreen';
import AdminStatisticsScreen from '../screens/AdminStatisticsScreen';
import CartScreen from '../screens/CartScreen';
import ChangePasswordScreen from '../screens/ChangePasswordScreen';
import CheckoutScreen from '../screens/CheckoutScreen';
import HomeScreen from '../screens/HomeScreen';
import LoginScreen from '../screens/LoginScreen';
import MyRestaurantsScreen from '../screens/MyRestaurantsScreen';
import MenuCategoryManagementScreen from '../screens/MenuCategoryManagementScreen';
import OrderDetailsScreen from '../screens/OrderDetailsScreen';
import OrdersScreen from '../screens/OrdersScreen';
import RegisterScreen from '../screens/RegisterScreen';
import RestaurantDetailsScreen from '../screens/RestaurantDetailsScreen';
import RestaurantFormScreen from '../screens/RestaurantFormScreen';
import SearchScreen from '../screens/SearchScreen';
import { createNavigationTheme } from '../theme/colors';
import { useAppTheme } from '../theme/ThemeContext';

const Stack = createNativeStackNavigator();

function LoadingScreen() {
  const { theme } = useAppTheme();

  return (
    <View
      style={[
        styles.loadingContainer,
        { backgroundColor: theme.colors.background },
      ]}
    >
      <ActivityIndicator color={theme.colors.primary} size="large" />
      <Text style={[styles.loadingText, { color: theme.colors.textMuted }]}>
        Restoring your session...
      </Text>
    </View>
  );
}

function AuthNavigator({ screenOptions }) {
  return (
    <Stack.Navigator screenOptions={screenOptions}>
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

function PasswordChangeNavigator({ screenOptions }) {
  return (
    <Stack.Navigator screenOptions={screenOptions}>
      <Stack.Screen
        component={ChangePasswordScreen}
        name="ChangePassword"
        options={{ headerShown: false }}
      />
    </Stack.Navigator>
  );
}

function AppNavigator({ screenOptions }) {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  return (
    <Stack.Navigator screenOptions={screenOptions}>
      <Stack.Screen
        component={HomeScreen}
        name="Home"
        options={{ headerShown: false }}
      />
      <Stack.Screen
        component={ProfileScreen}
        name="Profile"
        options={{ title: 'Your profile' }}
      />
      <Stack.Screen
        component={SearchScreen}
        name="Search"
        options={{ headerShown: false }}
      />
      <Stack.Screen
        component={RestaurantDetailsScreen}
        name="RestaurantDetails"
        options={{ title: 'Restaurant' }}
      />
      <Stack.Screen
        component={CartScreen}
        name="Cart"
        options={{ title: 'Your cart' }}
      />
      <Stack.Screen
        component={CheckoutScreen}
        name="Checkout"
        options={{ title: 'Checkout' }}
      />
      <Stack.Screen
        component={OrdersScreen}
        name="MyOrders"
        options={{ title: 'My orders' }}
      />
      <Stack.Screen
        component={OrderDetailsScreen}
        name="OrderDetails"
        options={{ title: 'Order details' }}
      />
      <Stack.Screen
        component={MyRestaurantsScreen}
        name="MyRestaurants"
        options={{ title: 'My Restaurants' }}
      />
      <Stack.Screen
        component={RestaurantAccessScreen}
        name="RestaurantAccess"
        options={{ title: 'Team access' }}
      />
      <Stack.Screen
        component={RestaurantProductsScreen}
        name="RestaurantProducts"
        options={{ title: 'Menu management' }}
      />
      <Stack.Screen
        component={RestaurantSalesStatisticsScreen}
        name="RestaurantSalesStatistics"
        options={{ title: 'Sales insights' }}
      />
      <Stack.Screen
        component={MenuCategoryManagementScreen}
        name="MenuCategoryManagement"
        options={{ title: 'Menu categories' }}
      />
      <Stack.Screen
        component={ProductFormScreen}
        name="ProductForm"
        options={{ title: 'Product' }}
      />
      <Stack.Screen
        component={RestaurantFormScreen}
        name="RestaurantForm"
        options={{ title: 'Restaurant' }}
      />
      {isAdmin ? (
        <>
          <Stack.Screen
            component={AdminScreen}
            name="Admin"
            options={{ title: 'Admin area' }}
          />
          <Stack.Screen
            component={AdminRestaurantModerationScreen}
            name="AdminRestaurantModeration"
            options={{ title: 'Restaurant moderation' }}
          />
          <Stack.Screen
            component={AdminUserManagementScreen}
            name="AdminUserManagement"
            options={{ title: 'User account management' }}
          />
          <Stack.Screen
            component={AdminStatisticsScreen}
            name="AdminStatistics"
            options={{ title: 'Platform insights' }}
          />
        </>
      ) : null}
    </Stack.Navigator>
  );
}

export default function RootNavigator() {
  const { isAuthenticated, isRestoringSession, user } = useAuth();
  const { isRestoringTheme, theme } = useAppTheme();

  const navigationTheme = useMemo(
    () => createNavigationTheme(theme.mode),
    [theme.mode]
  );

  const screenOptions = useMemo(
    () => ({
      contentStyle: { backgroundColor: theme.colors.background },
      headerBackTitle: 'Back',
      headerShadowVisible: false,
      headerStyle: { backgroundColor: theme.colors.surface },
      headerTintColor: theme.colors.text,
      headerTitleStyle: { color: theme.colors.text, fontWeight: '800' },
    }),
    [theme]
  );

  if (isRestoringSession || isRestoringTheme) {
    return <LoadingScreen />;
  }

  return (
    <NavigationContainer theme={navigationTheme}>
      {!isAuthenticated ? (
        <AuthNavigator screenOptions={screenOptions} />
      ) : user?.mustChangePassword ? (
        <PasswordChangeNavigator screenOptions={screenOptions} />
      ) : (
        <AppNavigator screenOptions={screenOptions} />
      )}
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
  loadingText: { fontSize: 16 },
});