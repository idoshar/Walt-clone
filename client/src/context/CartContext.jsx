import { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from './AuthContext.jsx';
import { getCartItemKey, normalizeCartItem } from '../utils/cart.js';

const CartContext = createContext(null);

function loadSavedCart() {
  const savedCart = localStorage.getItem('cart');

  try {
    const parsedCart = savedCart ? JSON.parse(savedCart) : [];

    if (!Array.isArray(parsedCart)) {
      return [];
    }

    return parsedCart
      .filter((item) => item?.id !== undefined && item?.id !== null)
      .map(normalizeCartItem);
  } catch {
    return [];
  }
}

function createCartItem(product) {
  return normalizeCartItem({
    ...product,
    quantity: 1
  });
}

export function CartProvider({ children }) {
  const { token } = useAuth();
  const [cartItems, setCartItems] = useState(loadSavedCart);

  useEffect(() => {
    localStorage.setItem('cart', JSON.stringify(cartItems));
  }, [cartItems]);

  useEffect(() => {
    if (!token) {
      setCartItems([]);
      localStorage.removeItem('cart');
    }
  }, [token]);

  function addToCart(product) {
    const cartKey = getCartItemKey(product);

    setCartItems((currentItems) => {
      const existingItem = currentItems.find(
        (item) => item.cartKey === cartKey
      );

      if (existingItem) {
        return currentItems.map((item) =>
          item.cartKey === cartKey
            ? {
              ...item,
              ...normalizeCartItem(product),
              quantity: item.quantity + 1
            }
            : item
        );
      }

      return [...currentItems, createCartItem(product)];
    });
  }

  function updateQuantity(cartKey, quantity) {
    const normalizedQuantity = Math.floor(Number(quantity));

    if (!Number.isFinite(normalizedQuantity) || normalizedQuantity <= 0) {
      setCartItems((currentItems) =>
        currentItems.filter((item) => item.cartKey !== cartKey)
      );
      return;
    }

    setCartItems((currentItems) =>
      currentItems.map((item) =>
        item.cartKey === cartKey
          ? { ...item, quantity: normalizedQuantity }
          : item
      )
    );
  }

  function removeFromCart(cartKey) {
    setCartItems((currentItems) => {
      const existingItem = currentItems.find(
        (item) => item.cartKey === cartKey
      );

      if (!existingItem) {
        return currentItems;
      }

      if (existingItem.quantity <= 1) {
        return currentItems.filter((item) => item.cartKey !== cartKey);
      }

      return currentItems.map((item) =>
        item.cartKey === cartKey
          ? { ...item, quantity: item.quantity - 1 }
          : item
      );
    });
  }

  function removeAllFromCart(cartKey) {
    setCartItems((currentItems) =>
      currentItems.filter((item) => item.cartKey !== cartKey)
    );
  }

  function clearRestaurantCart(restaurantId) {
    const normalizedRestaurantId = String(restaurantId);

    setCartItems((currentItems) =>
      currentItems.filter(
        (item) => String(item.restaurantId) !== normalizedRestaurantId
      )
    );
  }

  function clearCart() {
    setCartItems([]);
  }

  const totalPrice = cartItems.reduce((total, item) => {
    const price = Number(item.price) || 0;
    const quantity = Number(item.quantity) || 0;

    return total + price * quantity;
  }, 0);

  return (
    <CartContext.Provider
      value={{
        cartItems,
        setCartItems,
        addToCart,
        updateQuantity,
        removeFromCart,
        removeAllFromCart,
        clearRestaurantCart,
        clearCart,
        totalPrice
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  return useContext(CartContext);
}
