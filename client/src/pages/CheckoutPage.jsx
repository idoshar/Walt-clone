import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useCart } from '../context/CartContext.jsx';
import { createOrder } from '../api/orderApi.js';
import {
  formatCurrency,
  groupCartItemsByRestaurant
} from '../utils/cart.js';

function CheckoutPage() {
  const {
    cartItems,
    clearRestaurantCart
  } = useCart();

  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const requestedRestaurantId = searchParams.get('restaurantId');

  const [isDarkMode, setIsDarkMode] = useState(
    document.documentElement.dataset.theme === 'dark'
  );

  useEffect(() => {
    const observer = new MutationObserver(() => {
      setIsDarkMode(document.documentElement.dataset.theme === 'dark');
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme']
    });

    return () => observer.disconnect();
  }, []);

  const cartGroups = useMemo(
    () => groupCartItemsByRestaurant(cartItems),
    [cartItems]
  );

  const selectedGroup = requestedRestaurantId
    ? cartGroups.find(
        (group) =>
          String(group.restaurantId) === String(requestedRestaurantId)
      )
    : cartGroups.length === 1
      ? cartGroups[0]
      : null;

  async function handleConfirmOrder() {
    if (!selectedGroup || selectedGroup.items.length === 0) {
      return;
    }

    try {
      const response = await createOrder({
        restaurantId: selectedGroup.restaurantId,
        items: selectedGroup.items.map((item) => ({
          productId: item.id,
          quantity: item.quantity,
          price: item.price
        }))
      });

      const orderId =
        response?.id ||
        response?.orderId ||
        response?.data?.id ||
        `WOLT-${Math.floor(10000 + Math.random() * 90000)}`;

      clearRestaurantCart(selectedGroup.restaurantId);

      navigate(`/order-status?status=success&orderId=${orderId}`);
    } catch (error) {
      const errorMessage =
        error.response?.data?.message ||
        error.message ||
        'Payment failure';

      navigate(
        `/order-status?status=fail&message=${encodeURIComponent(errorMessage)}`
      );
    }
  }

  const themeStyles = {
    container: {
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: '75vh',
      padding: '20px',
      color: isDarkMode ? '#ffffff' : '#202125'
    },
    card: {
      width: '100%',
      maxWidth: '540px',
      padding: '40px',
      borderRadius: '16px',
      backgroundColor: isDarkMode ? '#1e1e1e' : '#ffffff',
      boxShadow: isDarkMode
        ? '0 4px 20px rgba(0, 0, 0, 0.5)'
        : '0 4px 16px rgba(0, 0, 0, 0.08)'
    },
    title: {
      margin: '0 0 8px',
      color: isDarkMode ? '#ffffff' : '#202125',
      fontSize: '24px',
      fontWeight: '700',
      textAlign: 'center'
    },
    subtitle: {
      margin: '0 0 22px',
      color: isDarkMode ? '#cbd5e1' : '#5e646e',
      textAlign: 'center'
    },
    itemRow: {
      display: 'flex',
      justifyContent: 'space-between',
      gap: '16px',
      padding: '10px 0',
      color: isDarkMode ? '#e2e8f0' : '#5e646e',
      fontSize: '16px'
    },
    divider: {
      height: '1px',
      margin: '15px 0',
      backgroundColor: isDarkMode ? '#4a5568' : '#cbd5e1'
    },
    totalRow: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: '30px'
    },
    totalPrice: {
      color: '#009de0',
      fontSize: '22px',
      fontWeight: '700'
    },
    buttonGroup: {
      display: 'flex',
      flexDirection: 'column',
      gap: '12px'
    },
    primaryButton: {
      padding: '14px 20px',
      border: 'none',
      borderRadius: '10px',
      backgroundColor: '#009de0',
      color: '#ffffff',
      cursor: 'pointer',
      fontSize: '16px',
      fontWeight: '600'
    },
    secondaryButton: {
      padding: '14px 20px',
      border: isDarkMode
        ? '1px solid #4a5568'
        : '1px solid #cbd5e1',
      borderRadius: '10px',
      backgroundColor: isDarkMode ? '#2d2d2d' : '#ffffff',
      color: isDarkMode ? '#ffffff' : '#202125',
      cursor: 'pointer',
      fontSize: '16px',
      fontWeight: '600'
    }
  };

  if (!selectedGroup) {
    return (
      <section style={themeStyles.container}>
        <div style={themeStyles.card}>
          <h2 style={themeStyles.title}>Choose a restaurant to checkout</h2>
          <p style={themeStyles.subtitle}>
            Open your cart and choose Checkout for the restaurant you want to order from.
          </p>
          <button
            type="button"
            style={themeStyles.primaryButton}
            onClick={() => navigate('/')}
          >
            Go Back Home
          </button>
        </div>
      </section>
    );
  }

  return (
    <section style={themeStyles.container}>
      <div style={themeStyles.card}>
        <h1 style={themeStyles.title}>Order Summary</h1>

        <p style={themeStyles.subtitle}>
          Ordering from {selectedGroup.restaurantName}
        </p>

        <div>
          {selectedGroup.items.map((item) => (
            <div key={item.cartKey} style={themeStyles.itemRow}>
              <span>{item.name} × {item.quantity}</span>
              <span>{formatCurrency(item.price * item.quantity)}</span>
            </div>
          ))}
        </div>

        <div style={themeStyles.divider} />

        <div style={themeStyles.totalRow}>
          <span>Total Amount:</span>
          <span style={themeStyles.totalPrice}>
            {formatCurrency(selectedGroup.totalPrice)}
          </span>
        </div>

        <div style={themeStyles.buttonGroup}>
          <button
            type="button"
            style={themeStyles.primaryButton}
            onClick={handleConfirmOrder}
          >
            Confirm & Place Order
          </button>

          <button
            type="button"
            style={themeStyles.secondaryButton}
            onClick={() => navigate(-1)}
          >
            Cancel
          </button>
        </div>
      </div>
    </section>
  );
}

export default CheckoutPage;
