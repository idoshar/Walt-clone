import { AuthProvider } from './src/auth/AuthContext';
import { CartProvider } from './src/cart/CartContext';
import { CurrencyProvider } from './src/currency/CurrencyContext';
import RootNavigator from './src/navigation/RootNavigator';
import { ThemeProvider } from './src/theme/ThemeContext';

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <CurrencyProvider>
          <CartProvider>
            <RootNavigator />
          </CartProvider>
        </CurrencyProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
