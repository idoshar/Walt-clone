import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useCart } from '../context/CartContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { createOrder } from '../api/orderApi.js';
import {
  formatCurrency,
  groupCartItemsByRestaurant
} from '../utils/cart.js';

function getUserText(user, field) {
  return typeof user?.[field] === 'string'
    ? user[field]
    : '';
}

function getInitialDeliveryDetails(user) {
  return {
    recipientName: getUserText(user, 'fullName'),
    phone: getUserText(user, 'phone'),
    address: getUserText(user, 'address'),
    dinerCount: '1',
    notes: ''
  };
}

function validateDeliveryDetails(deliveryDetails) {
  const recipientName = deliveryDetails.recipientName
    .trim()
    .replace(/\s+/g, ' ');

  const phone = deliveryDetails.phone
    .trim()
    .replace(/\s+/g, ' ');

  const address = deliveryDetails.address
    .trim()
    .replace(/\s+/g, ' ');

  const dinerCount = Number(deliveryDetails.dinerCount);
  const notes = deliveryDetails.notes.trim();

  if (!recipientName) {
    return {
      error: 'Enter the recipient name for this delivery.'
    };
  }

  if (!phone) {
    return {
      error: 'Enter a phone number for this delivery.'
    };
  }

  if (!address) {
    return {
      error: 'Enter a delivery address.'
    };
  }

  if (
    !Number.isSafeInteger(dinerCount) ||
    dinerCount < 1 ||
    dinerCount > 99
  ) {
    return {
      error: 'Number of diners must be a whole number between 1 and 99.'
    };
  }

  if (notes.length > 500) {
    return {
      error: 'Delivery notes cannot exceed 500 characters.'
    };
  }

  return {
    value: {
      recipientName,
      phone,
      address,
      dinerCount,
      notes
    }
  };
}

function CheckoutPage() {
  const {
    cartItems,
    clearRestaurantCart
  } = useCart();

  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const requestedRestaurantId = searchParams.get('restaurantId');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [deliveryDetails, setDeliveryDetails] = useState(() =>
    getInitialDeliveryDetails(user)
  );
  const [isDinerCountTouched, setIsDinerCountTouched] =
    useState(false);
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

  // SCRUM-438 dynamic diner default
  const selectedRestaurantKey = selectedGroup
    ? String(selectedGroup.restaurantId)
    : '';

  const suggestedDinerCount = useMemo(() => {
    if (!selectedGroup) {
      return 1;
    }

    const mainDishQuantity = selectedGroup.items.reduce(
      (total, item) => {
        if (item?.menuType !== 'main') {
          return total;
        }

        const quantity = Number(item.quantity);

        return (
          total +
          (
            Number.isSafeInteger(quantity) && quantity > 0
              ? quantity
              : 0
          )
        );
      },
      0
    );

    return Math.max(1, mainDishQuantity);
  }, [selectedGroup]);

  useEffect(() => {
    setIsDinerCountTouched(false);
  }, [selectedRestaurantKey]);

  useEffect(() => {
    if (isDinerCountTouched) {
      return;
    }

    const dinerCount = String(suggestedDinerCount);

    setDeliveryDetails((currentDetails) => (
      currentDetails.dinerCount === dinerCount
        ? currentDetails
        : {
            ...currentDetails,
            dinerCount
          }
    ));
  }, [isDinerCountTouched, suggestedDinerCount]);

  function handleDeliveryFieldChange(event) {
    const { name, value } = event.target;

    if (name === 'dinerCount') {
      setIsDinerCountTouched(true);
    }

    setDeliveryDetails((currentDetails) => ({
      ...currentDetails,
      [name]: value
    }));

    setFormError('');
  }

  async function handleConfirmOrder(event) {
    event?.preventDefault();

    if (
      isSubmitting ||
      submittingRef.current ||
      !selectedGroup ||
      selectedGroup.items.length === 0
    ) {
      return;
    }

    const validatedDeliveryDetails =
      validateDeliveryDetails(deliveryDetails);

    if (validatedDeliveryDetails.error) {
      setFormError(validatedDeliveryDetails.error);
      return;
    }

    submittingRef.current = true;
    setIsSubmitting(true);
    setFormError('');

    try {
      const response = await createOrder({
        restaurantId: selectedGroup.restaurantId,
        items: selectedGroup.items.map((item) => ({
          productId: item.id,
          quantity: item.quantity,
          price: item.price
        })),
        deliveryDetails: validatedDeliveryDetails.value
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
                {item.name}{' \u00d7 '}{item.quantity}
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

        <form
          className="checkout-delivery-section"
          onSubmit={handleConfirmOrder}
        >
          <div className="checkout-section-heading">
            <div>
              <h2>Delivery details</h2>
              <p>
                These details will be saved with this order.
              </p>
            </div>

            <span className="checkout-required-label">
              Required fields *
            </span>
          </div>

          <div className="checkout-delivery-grid">
            <label className="checkout-field">
              Recipient name *
              <input
                type="text"
                name="recipientName"
                value={deliveryDetails.recipientName}
                onChange={handleDeliveryFieldChange}
                maxLength="100"
                autoComplete="name"
                disabled={isSubmitting}
              />
            </label>

            <label className="checkout-field">
              Phone number *
              <input
                type="tel"
                name="phone"
                value={deliveryDetails.phone}
                onChange={handleDeliveryFieldChange}
                maxLength="40"
                autoComplete="tel"
                disabled={isSubmitting}
              />
            </label>

            <label className="checkout-field checkout-field--wide">
              Delivery address *
              <input
                type="text"
                name="address"
                value={deliveryDetails.address}
                onChange={handleDeliveryFieldChange}
                maxLength="240"
                autoComplete="street-address"
                disabled={isSubmitting}
              />
            </label>

            <label className="checkout-field">
              Number of diners *
              <input
                type="number"
                name="dinerCount"
                value={deliveryDetails.dinerCount}
                onChange={handleDeliveryFieldChange}
                min="1"
                max="99"
                step="1"
                inputMode="numeric"
                disabled={isSubmitting}
              />
            </label>

            <label className="checkout-field checkout-field--wide">
              Delivery notes
              <textarea
                name="notes"
                value={deliveryDetails.notes}
                onChange={handleDeliveryFieldChange}
                maxLength="500"
                rows="3"
                placeholder="Building entrance, floor, door code, or other helpful details"
                disabled={isSubmitting}
              />
              <small>
                {deliveryDetails.notes.length}/500 characters
              </small>
            </label>
          </div>

          {formError && (
            <p
              className="checkout-form-error"
              role="alert"
            >
              {formError}
            </p>
          )}

          <div className="checkout-button-group">
            <button
              type="submit"
              className="checkout-primary-button"
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
        </form>
      </div>
    </section>
  );
}

export default CheckoutPage;
