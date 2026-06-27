import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

const CART_STORAGE_KEY = '@wolt_delivery_cart';

const CartContext = createContext(null);

function normalizePrice(price) {
  const numericPrice = Number(price);

  return Number.isFinite(numericPrice) && numericPrice >= 0
    ? numericPrice
    : 0;
}

function createCartItem(product, restaurant) {
  const restaurantId = String(
    restaurant?.id || product?.restaurantId || ''
  ).trim();
  const productId = String(product?.id || '').trim();

  if (!restaurantId || !productId) {
    throw new Error('A restaurant and product are required to add an item.');
  }

  return {
    key: `${restaurantId}:${productId}`,
    productId,
    restaurantId,
    restaurantName: restaurant?.name || 'Restaurant',
    name: product?.name || 'Product',
    price: normalizePrice(product?.price),
    image: typeof product?.image === 'string' ? product.image : '',
    quantity: 1,
  };
}

function normalizeStoredItems(value) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .filter((item) => item && typeof item === 'object')
    .map((item) => ({
      key: String(item.key || '').trim(),
      productId: String(item.productId || '').trim(),
      restaurantId: String(item.restaurantId || '').trim(),
      restaurantName: String(item.restaurantName || 'Restaurant'),
      name: String(item.name || 'Product'),
      price: normalizePrice(item.price),
      image: typeof item.image === 'string' ? item.image : '',
      quantity: Math.max(1, Number.parseInt(item.quantity, 10) || 1),
    }))
    .filter((item) => item.key && item.productId && item.restaurantId);
}

export function CartProvider({ children }) {
  const [items, setItems] = useState([]);
  const [isRestoringCart, setIsRestoringCart] = useState(true);

  useEffect(() => {
    async function restoreCart() {
      try {
        const storedCart = await AsyncStorage.getItem(CART_STORAGE_KEY);

        if (storedCart) {
          setItems(normalizeStoredItems(JSON.parse(storedCart)));
        }
      } catch {
        await AsyncStorage.removeItem(CART_STORAGE_KEY);
      } finally {
        setIsRestoringCart(false);
      }
    }

    restoreCart();
  }, []);

  useEffect(() => {
    if (isRestoringCart) {
      return;
    }

    AsyncStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items)).catch(() => {
      // Keep the in-memory cart available if local storage fails.
    });
  }, [isRestoringCart, items]);

  const addItem = useCallback((product, restaurant) => {
    const nextItem = createCartItem(product, restaurant);

    setItems((currentItems) => {
      const existingItem = currentItems.find(
        (item) => item.key === nextItem.key
      );

      if (!existingItem) {
        return [...currentItems, nextItem];
      }

      return currentItems.map((item) =>
        item.key === nextItem.key
          ? { ...item, quantity: item.quantity + 1 }
          : item
      );
    });
  }, []);

  const increaseQuantity = useCallback((itemKey) => {
    setItems((currentItems) =>
      currentItems.map((item) =>
        item.key === itemKey
          ? { ...item, quantity: item.quantity + 1 }
          : item
      )
    );
  }, []);

  const decreaseQuantity = useCallback((itemKey) => {
    setItems((currentItems) =>
      currentItems
        .map((item) =>
          item.key === itemKey
            ? { ...item, quantity: item.quantity - 1 }
            : item
        )
        .filter((item) => item.quantity > 0)
    );
  }, []);

  const removeItem = useCallback((itemKey) => {
    setItems((currentItems) =>
      currentItems.filter((item) => item.key !== itemKey)
    );
  }, []);

  const clearCart = useCallback(() => {
    setItems([]);
  }, []);

  const clearRestaurantItems = useCallback((restaurantId) => {
    const normalizedRestaurantId = String(restaurantId || '').trim();

    if (!normalizedRestaurantId) {
      return;
    }

    setItems((currentItems) =>
      currentItems.filter(
        (item) => item.restaurantId !== normalizedRestaurantId
      )
    );
  }, []);

  const value = useMemo(() => {
    const itemCount = items.reduce(
      (total, item) => total + item.quantity,
      0
    );

    const totalPrice = items.reduce(
      (total, item) => total + item.price * item.quantity,
      0
    );

    return {
      items,
      itemCount,
      totalPrice,
      isRestoringCart,
      addItem,
      increaseQuantity,
      decreaseQuantity,
      removeItem,
      clearCart,
      clearRestaurantItems,
    };
  }, [
    addItem,
    clearCart,
    clearRestaurantItems,
    decreaseQuantity,
    increaseQuantity,
    isRestoringCart,
    items,
    removeItem,
  ]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);

  if (!context) {
    throw new Error('useCart must be used inside CartProvider.');
  }

  return context;
}
