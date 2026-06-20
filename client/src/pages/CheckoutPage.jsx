import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext.jsx';
import { createOrder } from '../api/orderApi.js';
import { useEffect, useState } from 'react';

function CheckoutPage() {
  const { cartItems, totalPrice, setCartItems } = useCart();
  const navigate = useNavigate();
  
  const [isDarkMode, setIsDarkMode] = useState(
    document.body.classList.contains('dark') || document.body.classList.contains('dark-mode')
  );

  useEffect(() => {
    const observer = new MutationObserver(() => {
      setIsDarkMode(document.body.classList.contains('dark') || document.body.classList.contains('dark-mode'));
    });
    observer.observe(document.body, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);

  async function handleConfirmOrder() {
    if (cartItems.length === 0) return;

    try {
      const restaurantId = cartItems[0]?.restaurantId || '1'; 
      const response = await createOrder({
        restaurantId,
        items: cartItems.map((item) => ({
          productId: item.id,
          quantity: item.quantity,
          price: item.price
        }))
      });

      const orderId = response?.id || response?.orderId || response?.data?.id || 'WOLT-' + Math.floor(10000 + Math.random() * 90000);
      setCartItems([]);
      navigate(`/order-status?status=success&orderId=${orderId}`);
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message || 'Payment failure';
      navigate(`/order-status?status=fail&message=${encodeURIComponent(errorMessage)}`);
    }
  }

  const themeStyles = {
    container: {
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: '75vh',
      fontFamily: 'system-ui, sans-serif',
      padding: '20px',
      color: isDarkMode ? '#ffffff' : '#202125',
      transition: 'color 0.3s'
    },
    card: {
      backgroundColor: isDarkMode ? '#1e1e1e' : '#ffffff',
      padding: '40px',
      borderRadius: '16px',
      boxShadow: isDarkMode ? '0 4px 20px rgba(0, 0, 0, 0.5)' : '0 4px 16px rgba(0, 0, 0, 0.08)',
      maxWidth: '500px',
      width: '100%',
      transition: 'background-color 0.3s, box-shadow 0.3s'
    },
    title: {
      fontSize: '24px',
      fontWeight: '700',
      color: isDarkMode ? '#ffffff' : '#202125',
      margin: '0 0 20px 0',
      textAlign: 'center'
    },
    itemsList: {
      marginBottom: '20px'
    },
    itemRow: {
      display: 'flex',
      justifyContent: 'space-between',
      padding: '10px 0',
      fontSize: '16px',
      color: isDarkMode ? '#e2e8f0' : '#5e646e'
    },
    divider: {
      height: '1px',
      backgroundColor: isDarkMode ? '#4a5568' : '#cbd5e1',
      margin: '15px 0'
    },
    totalRow: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: '30px'
    },
    totalPrice: {
      fontSize: '22px',
      fontWeight: '700',
      color: '#009de0'
    },
    buttonGroup: {
      display: 'flex',
      flexDirection: 'column',
      gap: '12px'
    },
    primaryButton: {
      backgroundColor: '#009de0',
      color: '#ffffff',
      border: 'none',
      padding: '14px 20px',
      borderRadius: '10px',
      fontSize: '16px',
      fontWeight: '600',
      cursor: 'pointer'
    },
    secondaryButton: {
      backgroundColor: isDarkMode ? '#2d2d2d' : '#ffffff',
      color: isDarkMode ? '#ffffff' : '#202125',
      border: isDarkMode ? '1px solid #4a5568' : '1px solid #cbd5e1',
      padding: '14px 20px',
      borderRadius: '10px',
      fontSize: '16px',
      fontWeight: '600',
      cursor: 'pointer'
    }
  };

  if (cartItems.length === 0) {
    return (
      <div style={themeStyles.container}>
        <div style={themeStyles.card}>
          <h2>Your cart is empty</h2>
          <button style={themeStyles.primaryButton} onClick={() => navigate('/')}>Go Back Home</button>
        </div>
      </div>
    );
  }

  return (
    <section style={themeStyles.container}>
      <div style={themeStyles.card}>
        <h1 style={themeStyles.title}>Order Summary</h1>
        
        <div style={themeStyles.itemsList}>
          {cartItems.map((item) => (
            <div key={item.id} style={themeStyles.itemRow}>
              <span>{item.name} x {item.quantity}</span>
              <span>₪{item.price * item.quantity}</span>
            </div>
          ))}
        </div>

        <div style={themeStyles.divider}></div>

        <div style={themeStyles.totalRow}>
          <span>Total Amount:</span>
          <span style={themeStyles.totalPrice}>₪{totalPrice}</span>
        </div>

        <div style={themeStyles.buttonGroup}>
          <button style={themeStyles.primaryButton} onClick={handleConfirmOrder}>
            Confirm & Place Order
          </button>
          <button style={themeStyles.secondaryButton} onClick={() => navigate(-1)}>
            Cancel
          </button>
        </div>
      </div>
    </section>
  );
}

export default CheckoutPage;