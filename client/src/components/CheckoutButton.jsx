import { createOrder } from '../api/orderApi.js';
import { useCart } from '../context/CartContext.jsx';

function CheckoutButton({ restaurantId }) {
  const { cartItems, setCartItems } = useCart();

  async function handleCheckout() {
    await createOrder({
      restaurantId,
      items: cartItems.map((item) => ({
        productId: item.id,
        quantity: item.quantity,
        price: item.price
      }))
    });

    setCartItems([]);
    alert('Order created successfully');
  }

  return (
    <button
      type="button"
      className="checkout-button"
      onClick={handleCheckout}
      disabled={cartItems.length === 0}
    >
      Checkout
    </button>
  );
}

export default CheckoutButton;