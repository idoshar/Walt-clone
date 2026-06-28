import { useMemo, useRef, useState } from 'react';
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

  const [isSubmitting, setIsSubmitting] = useState(false);
  const submittingRef = useRef(false);

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
    if (
      isSubmitting ||
      submittingRef.current ||
      !selectedGroup ||
      selectedGroup.items.length === 0
    ) {
      return;
    }

    submittingRef.current = true;
    setIsSubmitting(true);

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
        response?.order?.id ||
        `WOLT-${Math.floor(10000 + Math.random() * 90000)}`;

      clearRestaurantCart(selectedGroup.restaurantId);

      navigate(
        `/order-status?status=success&orderId=${encodeURIComponent(orderId)}`
      );
    } catch (error) {
      const errorMessage =
        error.response?.data?.message ||
        error.message ||
        'We could not place your order. Please try again.';

      navigate(
        `/order-status?status=fail&restaurantId=${encodeURIComponent(
          selectedGroup.restaurantId
        )}&message=${encodeURIComponent(errorMessage)}`
      );
    } finally {
      submittingRef.current = false;
      setIsSubmitting(false);
    }
  }

  if (!selectedGroup) {
    return (
      <section className="checkout-page">
        <div className="checkout-card checkout-card--empty">
          <h1 className="checkout-title">Choose a restaurant to checkout</h1>

          <p className="checkout-subtitle">
            Open your cart and choose Checkout for the restaurant you want to
            order from.
          </p>

          <button
            type="button"
            className="checkout-primary-button"
            onClick={() => navigate('/')}
          >
            Go Back Home
          </button>
        </div>
      </section>
    );
  }

  return (
    <section className="checkout-page">
      <div className="checkout-card">
        <h1 className="checkout-title">Order Summary</h1>

        <p className="checkout-subtitle">
          Ordering from {selectedGroup.restaurantName}
        </p>

        <div className="checkout-items" aria-label="Order items">
          {selectedGroup.items.map((item) => (
            <div key={item.cartKey} className="checkout-item-row">
              <span>
                {item.name} × {item.quantity}
              </span>

              <span>{formatCurrency(item.price * item.quantity)}</span>
            </div>
          ))}
        </div>

        <div className="checkout-divider" />

        <div className="checkout-total-row">
          <span>Total Amount:</span>

          <span className="checkout-total-price">
            {formatCurrency(selectedGroup.totalPrice)}
          </span>
        </div>

        <div className="checkout-button-group">
          <button
            type="button"
            className="checkout-primary-button"
            onClick={handleConfirmOrder}
            disabled={isSubmitting}
            aria-busy={isSubmitting}
          >
            {isSubmitting ? 'Placing order...' : 'Confirm & Place Order'}
          </button>

          <button
            type="button"
            className="checkout-secondary-button"
            onClick={() => navigate(-1)}
            disabled={isSubmitting}
          >
            Cancel
          </button>
        </div>

        <p className="checkout-submission-message" aria-live="polite">
          {isSubmitting
            ? 'Your order is being submitted. Please do not refresh or close this page.'
            : ''}
        </p>
      </div>
    </section>
  );
}

export default CheckoutPage;
