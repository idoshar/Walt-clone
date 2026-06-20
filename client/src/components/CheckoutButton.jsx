import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext.jsx';

function CheckoutButton() {
  const { cartItems } = useCart();
  const navigate = useNavigate();

  function handleGoToCheckout() {
    navigate('/checkout');
  }

  return (
    <button
      type="button"
      className="checkout-button"
      onClick={handleGoToCheckout}
      disabled={cartItems.length === 0}
    >
      Checkout
    </button>
  );
}

export default CheckoutButton;