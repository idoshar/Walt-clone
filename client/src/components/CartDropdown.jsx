import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext.jsx';
import { useCurrency } from '../context/CurrencyContext.jsx';
import { getRestaurantImage } from '../utils/restaurantImages.js';
import {
  groupCartItemsByRestaurant
} from '../utils/cart.js';

function getCartProductImage(item = {}) {
  const customImage =
    typeof item.image === 'string' ? item.image.trim() : '';

  if (customImage) {
    return customImage;
  }

  const productName = String(item.name || '').toLowerCase();

  if (productName.includes('margherita')) {
    return 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=400&q=80';
  }

  if (productName.includes('alfredo')) {
    return 'https://images.unsplash.com/photo-1645177628172-a94c1f96e6db?w=400&q=80';
  }

  if (productName.includes('tiramisu')) {
    return 'https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?w=400&q=80';
  }

  if (productName.includes('classic beef')) {
    return 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400&q=80';
  }

  if (productName.includes('crispy fries')) {
    return 'https://images.unsplash.com/photo-1630384060421-cb20d0e0649d?w=400&q=80';
  }

  if (productName.includes('crispy chicken')) {
    return 'https://images.unsplash.com/photo-1626645738196-c2a7c87a8f58?w=400&q=80';
  }

  if (productName.includes('salmon avocado')) {
    return 'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=400&q=80';
  }

  if (productName.includes('spicy tuna')) {
    return 'https://images.unsplash.com/photo-1648146298904-d58a8c79e0a7?w=400&q=80';
  }

  if (productName.includes('edamame')) {
    return 'https://plus.unsplash.com/premium_photo-1666318300348-a4d0226d81ad?w=400&q=80';
  }

  return 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=400&q=80';
}

function CartDropdown() {
  const { formatPrice } = useCurrency();
  const {
    cartItems,
    addToCart,
    removeFromCart,
    removeAllFromCart,
    clearCart,
    totalPrice
  } = useCart();

  const [isOpen, setIsOpen] = useState(false);
  const cartRef = useRef(null);
  const navigate = useNavigate();

  const cartGroups = useMemo(
    () => groupCartItemsByRestaurant(cartItems),
    [cartItems]
  );

  const totalItemsCount = cartItems.reduce(
    (sum, item) => sum + item.quantity,
    0
  );

  useEffect(() => {
    if (!isOpen) {
      return undefined;
    }

    function handlePointerDown(event) {
      if (cartRef.current && !cartRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }

    function handleKeyDown(event) {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    }

    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  function handleRestaurantCheckout(restaurantId) {
    setIsOpen(false);

    navigate(
      `/checkout?restaurantId=${encodeURIComponent(String(restaurantId))}`
    );
  }

  function handleClearCart() {
    const shouldClear = window.confirm(
      'Remove all items from your cart?'
    );

    if (!shouldClear) {
      return;
    }

    clearCart();
    setIsOpen(false);
  }

  return (
    <div className="cart-dropdown" ref={cartRef}>
      <button
        type="button"
        className="cart-toggle"
        onClick={() => setIsOpen((currentValue) => !currentValue)}
        aria-label="Shopping cart"
        aria-expanded={isOpen}
        aria-haspopup="dialog"
      >
        <svg
          className="cart-icon"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <circle cx="9" cy="21" r="1" fill="currentColor" />
          <circle cx="20" cy="21" r="1" fill="currentColor" />
          <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
        </svg>

        {totalItemsCount > 0 && (
          <span
            className="cart-badge"
            aria-label={`${totalItemsCount} items in cart`}
          >
            {totalItemsCount}
          </span>
        )}
      </button>

      {isOpen && (
        <section
          className="cart-panel"
          role="dialog"
          aria-label="Shopping cart"
        >
          <div className="cart-panel-header">
            <div>
              <h3>Your Cart</h3>

              {cartItems.length > 0 && (
                <p className="cart-panel-subtitle">
                  Checkout is handled separately for each restaurant.
                </p>
              )}
            </div>

            <button
              type="button"
              className="cart-close-button"
              onClick={() => setIsOpen(false)}
              aria-label="Close shopping cart"
            >
              ×
            </button>
          </div>

          {cartItems.length === 0 ? (
            <p className="cart-empty">Your cart is empty.</p>
          ) : (
            <>
              <div className="cart-restaurant-groups">
                {cartGroups.map((group) => {
                  const restaurantImage = getRestaurantImage({
                    name: group.restaurantName,
                    image: group.restaurantImage
                  });

                  return (
                    <section
                      className="cart-restaurant-group"
                      key={String(group.restaurantId)}
                    >
                      <div className="cart-restaurant-header">
                        <div className="cart-restaurant-hero">
                          <img
                            className="cart-restaurant-image"
                            src={restaurantImage}
                            alt={group.restaurantName}
                          />

                          <div className="cart-restaurant-meta">
                            <h4>{group.restaurantName}</h4>

                            <span className="cart-group-count">
                              {group.totalItems}{' '}
                              {group.totalItems === 1 ? 'item' : 'items'}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="cart-restaurant-items">
                        {group.items.map((item) => (
                          <article className="cart-item" key={item.cartKey}>
                            <div className="cart-item-main">
                              <img
                                className="cart-item-thumbnail"
                                src={getCartProductImage(item)}
                                alt={item.name}
                              />

                              <div className="cart-item-info">
                                <h5>{item.name}</h5>
                                <span>{formatPrice(item.price)}</span>
                              </div>
                            </div>

                            <div className="cart-item-actions">
                              <div className="cart-quantity-controls">
                                <button
                                  type="button"
                                  className="cart-quantity-button"
                                  onClick={() => removeFromCart(item.cartKey)}
                                  aria-label={`Decrease quantity of ${item.name}`}
                                >
                                  −
                                </button>

                                <span className="cart-quantity-value">
                                  {item.quantity}
                                </span>

                                <button
                                  type="button"
                                  className="cart-quantity-button"
                                  onClick={() => addToCart(item)}
                                  aria-label={`Increase quantity of ${item.name}`}
                                >
                                  +
                                </button>
                              </div>

                              <button
                                type="button"
                                className="cart-remove-item-button"
                                onClick={() => removeAllFromCart(item.cartKey)}
                                aria-label={`Remove all ${item.name} items from cart`}
                                title="Remove item"
                              >
                                <svg
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="2"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  aria-hidden="true"
                                >
                                  <path d="M3 6h18" />
                                  <path d="M8 6V4h8v2" />
                                  <path d="M19 6l-1 14H6L5 6" />
                                  <path d="M10 11v5" />
                                  <path d="M14 11v5" />
                                </svg>
                              </button>
                            </div>
                          </article>
                        ))}
                      </div>

                      <div className="cart-restaurant-total">
                        <span>{group.restaurantName} total</span>
                        <strong>{formatPrice(group.totalPrice)}</strong>
                      </div>

                      <button
                        type="button"
                        className="cart-restaurant-checkout"
                        onClick={() =>
                          handleRestaurantCheckout(group.restaurantId)
                        }
                      >
                        Checkout {group.restaurantName}
                      </button>
                    </section>
                  );
                })}
              </div>

              <div className="cart-total">
                <span>All restaurants total</span>
                <strong>{formatPrice(totalPrice)}</strong>
              </div>

              <button
                type="button"
                className="cart-empty-all-button"
                onClick={handleClearCart}
              >
                Empty cart
              </button>
            </>
          )}
        </section>
      )}
    </div>
  );
}

export default CartDropdown;
