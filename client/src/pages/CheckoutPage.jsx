import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext.jsx';
import { createOrder } from '../api/orderApi.js';

function CheckoutPage() {
  const { cartItems, totalPrice, setCartItems } = useCart();
  const navigate = useNavigate();

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

  if (cartItems.length === 0) {
    return (
      <div style={styles.container}>
        <div style={styles.card}>
          <h2>Your cart is empty</h2>
          <button style={styles.primaryButton} onClick={() => navigate('/')}>Go Back Home</button>
        </div>
      </div>
    );
  }

  return (
    <section style={styles.container}>
      <div style={styles.card}>
        <h1 style={styles.title}>Order Summary</h1>
        
        <div style={styles.itemsList}>
          {cartItems.map((item) => (
            <div key={item.id} style={styles.itemRow}>
              <span>{item.name} x {item.quantity}</span>
              <span>₪{item.price * item.quantity}</span>
            </div>
          ))}
        </div>

        <div style={styles.divider}></div>

        <div style={styles.totalRow}>
          <span>Total Amount:</span>
          <span style={styles.totalPrice}>₪{totalPrice}</span>
        </div>

        <div style={styles.buttonGroup}>
          <button style={styles.primaryButton} onClick={handleConfirmOrder}>
            Confirm & Place Order
          </button>
          <button style={styles.secondaryButton} onClick={() => navigate(-1)}>
            Cancel
          </button>
        </div>
      </div>
    </section>
  );
}

const styles = {
  container: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '75vh',
    fontFamily: 'system-ui, sans-serif',
    padding: '20px',
    backgroundColor: '#f8f9fa',
    direction: 'ltr'
  },
  card: {
    backgroundColor: '#ffffff',
    padding: '40px',
    borderRadius: '16px',
    boxShadow: '0 4px 16px rgba(0, 0, 0, 0.08)',
    maxWidth: '500px',
    width: '100%'
  },
  title: {
    fontSize: '24px',
    fontWeight: '700',
    color: '#202125',
    margin: '0 0 20px 0',
    textAlign: 'center'
  },
  itemsList: {
    marginBottom: '20px'
  },
  itemRow: {
    display: 'flex',
    justifyContent: 'span-between',
    justifyContent: 'space-between',
    padding: '10px 0',
    fontSize: '16px',
    color: '#5e646e'
  },
  divider: {
    height: '1px',
    backgroundColor: '#cbd5e1',
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
    backgroundColor: '#ffffff',
    color: '#202125',
    border: '1px solid #cbd5e1',
    padding: '14px 20px',
    borderRadius: '10px',
    fontSize: '16px',
    fontWeight: '600',
    cursor: 'pointer'
  }
};

export default CheckoutPage;