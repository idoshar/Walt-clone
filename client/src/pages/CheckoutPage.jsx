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

function getReorderStorageKey(restaurantId) {
  return 'checkout-reorder:' + String(restaurantId);
}

function getStoredReorderDetails(restaurantId) {
  try {
    const savedDetails = window.sessionStorage.getItem(
      getReorderStorageKey(restaurantId)
    );

    if (!savedDetails) {
      return null;
    }

    const parsedDetails = JSON.parse(savedDetails);

    return (
      parsedDetails &&
      typeof parsedDetails === 'object' &&
      !Array.isArray(parsedDetails)
    )
      ? parsedDetails
      : null;
  } catch {
    return null;
  }
}

function getReorderedText(reorderDetails, field) {
  const value = reorderDetails?.[field];

  return typeof value === 'string' && value.trim() !== ''
    ? value
    : '';
}

function getReorderedDinerCount(reorderDetails) {
  const dinerCount = Number(reorderDetails?.dinerCount);

  return (
    Number.isSafeInteger(dinerCount) &&
    dinerCount >= 1 &&
    dinerCount <= 99
  )
    ? String(dinerCount)
    : '';
}

function getInitialDeliveryDetails(
  user,
  reorderDetails
) {
  const defaults = {
    recipientName: getUserText(user, 'fullName'),
    phone: getUserText(user, 'phone'),
    address: getUserText(user, 'address'),
    dinerCount: '1',
    notes: ''
  };

  if (
    !reorderDetails ||
    typeof reorderDetails !== 'object'
  ) {
    return defaults;
  }

  return {
    recipientName:
      getReorderedText(
        reorderDetails,
        'recipientName'
      ) || defaults.recipientName,
    phone:
      getReorderedText(
        reorderDetails,
        'phone'
      ) || defaults.phone,
    address:
      getReorderedText(
        reorderDetails,
        'address'
      ) || defaults.address,
    dinerCount:
      getReorderedDinerCount(reorderDetails) ||
      defaults.dinerCount,
    notes:
      typeof reorderDetails.notes === 'string'
        ? reorderDetails.notes
        : defaults.notes
  };
}

function validateDeliveryDetails(
  deliveryDetails,
  sharedLocation
) {
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

  const value = {
    recipientName,
    phone,
    address,
    dinerCount,
    notes
  };

  if (sharedLocation) {
    const latitude = Number(sharedLocation.latitude);
    const longitude = Number(sharedLocation.longitude);

    if (!isValidLocationCoordinates(latitude, longitude)) {
      return {
        error: 'The selected location is invalid. Remove it and try again.'
      };
    }

    value.location = {
      latitude,
      longitude
    };
  }

  return {
    value
  };
}

function isValidLocationCoordinates(latitude, longitude) {
  return (
    Number.isFinite(latitude) &&
    Number.isFinite(longitude) &&
    latitude >= -90 &&
    latitude <= 90 &&
    longitude >= -180 &&
    longitude <= 180
  );
}

function getLocationErrorMessage(error) {
  switch (error?.code) {
    case 1:
      return 'Location permission was not granted. You can still place the order without sharing your location.';
    case 2:
      return 'Your current location could not be determined. You can still place the order without it.';
    case 3:
      return 'Location sharing timed out. You can still place the order without it.';
    default:
      return 'Location sharing is currently unavailable. You can still place the order without it.';
  }
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
  const isReorderCheckout = searchParams.get('reorder') === '1';

  const [reorderDeliveryDetails] = useState(() => (
    isReorderCheckout
      ? getStoredReorderDetails(requestedRestaurantId)
      : null
  ));

  const hasReorderedDinerCount =
    getReorderedDinerCount(reorderDeliveryDetails) !== '';

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [deliveryDetails, setDeliveryDetails] = useState(() =>
    getInitialDeliveryDetails(
      user,
      reorderDeliveryDetails
    )
  );
  const [isDinerCountTouched, setIsDinerCountTouched] =
    useState(hasReorderedDinerCount);
  const [sharedLocation, setSharedLocation] = useState(null);
  const [isLocationLoading, setIsLocationLoading] = useState(false);
  const [locationNotice, setLocationNotice] = useState(null);
  const locationRequestRef = useRef(0);
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
    const keepReorderedDinerCount =
      isReorderCheckout &&
      hasReorderedDinerCount &&
      selectedRestaurantKey !== '' &&
      String(requestedRestaurantId) === selectedRestaurantKey;

    if (keepReorderedDinerCount) {
      setIsDinerCountTouched(true);
      return;
    }

    setIsDinerCountTouched(false);
  }, [
    hasReorderedDinerCount,
    isReorderCheckout,
    requestedRestaurantId,
    selectedRestaurantKey
  ]);

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

  function handleUseCurrentLocation() {
    if (
      isSubmitting ||
      isLocationLoading
    ) {
      return;
    }

    if (!navigator.geolocation) {
      setSharedLocation(null);
      setLocationNotice({
        tone: 'error',
        text: 'This browser does not support location sharing. You can still place the order without it.'
      });

      return;
    }

    const requestId = locationRequestRef.current + 1;

    locationRequestRef.current = requestId;
    setIsLocationLoading(true);
    setLocationNotice(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        if (requestId !== locationRequestRef.current) {
          return;
        }

        const latitude = position?.coords?.latitude;
        const longitude = position?.coords?.longitude;

        setIsLocationLoading(false);

        if (!isValidLocationCoordinates(latitude, longitude)) {
          setSharedLocation(null);
          setLocationNotice({
            tone: 'error',
            text: 'The browser returned an invalid location. You can still place the order without it.'
          });

          return;
        }

        setSharedLocation({
          latitude,
          longitude
        });

        setLocationNotice({
          tone: 'success',
          text: 'Your current location is attached to this order.'
        });
      },
      (error) => {
        if (requestId !== locationRequestRef.current) {
          return;
        }

        setIsLocationLoading(false);
        setSharedLocation(null);
        setLocationNotice({
          tone: 'error',
          text: getLocationErrorMessage(error)
        });
      },
      {
        enableHighAccuracy: false,
        timeout: 10000,
        maximumAge: 60000
      }
    );
  }

  function handleRemoveSharedLocation() {
    locationRequestRef.current += 1;
    setIsLocationLoading(false);
    setSharedLocation(null);
    setLocationNotice({
      tone: 'neutral',
      text: 'Current location will not be shared with this order.'
    });
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
      validateDeliveryDetails(
        deliveryDetails,
        sharedLocation
      );

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

      if (isReorderCheckout) {
        try {
          window.sessionStorage.removeItem(
            getReorderStorageKey(selectedGroup.restaurantId)
          );
        } catch {
          // The order can still be completed if session storage is unavailable.
        }
      }

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

            <section className="checkout-location-section checkout-field--wide">
              <div className="checkout-location-heading">
                <div>
                  <h3>Current location</h3>
                  <p>
                    Optional. Share your current location to help with delivery.
                  </p>
                </div>

                {sharedLocation ? (
                  <button
                    type="button"
                    className="checkout-location-remove-button"
                    onClick={handleRemoveSharedLocation}
                    disabled={isSubmitting}
                  >
                    Remove location
                  </button>
                ) : (
                  <button
                    type="button"
                    className="checkout-location-button"
                    onClick={handleUseCurrentLocation}
                    disabled={isSubmitting || isLocationLoading}
                    aria-busy={isLocationLoading}
                  >
                    {isLocationLoading
                      ? 'Getting location...'
                      : 'Use my current location'}
                  </button>
                )}
              </div>

              {locationNotice && (
                <p
                  className={
                    'checkout-location-notice checkout-location-notice--' +
                    locationNotice.tone
                  }
                  role="status"
                  aria-live="polite"
                >
                  {locationNotice.text}
                </p>
              )}
            </section>

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
