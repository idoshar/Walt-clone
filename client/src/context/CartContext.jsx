import { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from './AuthContext.jsx';

const CartContext = createContext(null);

export function CartProvider({ children }) {
  const { token } = useAuth();
  const [cartItems, setCartItems] = useState([]);

  useEffect(() => {
    setCartItems([]);
  }, [token]);

  function addToCart(product) {
    setCartItems((currentItems) => {
      const existingItem = currentItems.find(
        (item) => item.id === product.id
      );

      if (existingItem) {
        return currentItems.map((item) =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }

      return [
        ...currentItems,
        {
          ...product,
          quantity: 1
        }
      ];
    });
  }

  function updateQuantity(productId, quantity) {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }

    setCartItems((currentItems) =>
      currentItems.map((item) =>
        item.id === productId
          ? { ...item, quantity }
          : item
      )
    );
  }

  function removeFromCart(productId) {
    setCartItems((currentItems) =>
      currentItems.filter(
        (item) => item.id !== productId
      )
    );
  }

  const totalPrice = cartItems.reduce(
    (total, item) => {
      const price = Number(item.price) || 0;
      const quantity = Number(item.quantity) || 0;

      return total + price * quantity;
    },
    0
  );

  return (
    <CartContext.Provider
      value={{
        cartItems,
        setCartItems,
        addToCart,
        updateQuantity,
        removeFromCart,
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
