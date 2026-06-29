import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getOrders } from '../api/orderApi.js';
import { apiRequest } from '../api/client.js';
import { getMenuCategories } from '../api/menuCategoryApi.js';
import { useCart } from '../context/CartContext.jsx';
import { useCurrency } from '../context/CurrencyContext.jsx';
import EmptyState from '../components/EmptyState.jsx';
import ErrorMessage from '../components/ErrorMessage.jsx';
import LoadingState from '../components/LoadingState.jsx';
import {
  normalizeCartItem
} from '../utils/cart.js';

function getItemCount(items = []) {
  return items.reduce(
    (total, item) => total + (Number(item.quantity) || 0),
    0
  );
}

function getItemLabel(item = {}) {
  return item.productName || item.name || 'Menu item';
}

function formatStatus(status = '') {
  const normalizedStatus = String(status || 'created');

  return (
    normalizedStatus.charAt(0).toUpperCase() +
    normalizedStatus.slice(1)
  );
}

function getReorderQuantity(value) {
  const quantity = Math.floor(Number(value));

  return (
    Number.isFinite(quantity) &&
    quantity > 0
  )
    ? quantity
    : null;
}

function getReorderStorageKey(restaurantId) {
  return 'checkout-reorder:' + String(restaurantId);
}

function getReorderDeliveryDetails(deliveryDetails) {
  if (
    !deliveryDetails ||
    typeof deliveryDetails !== 'object'
  ) {
    return null;
  }

  const dinerCount = getReorderQuantity(
    deliveryDetails.dinerCount
  );

  return {
    recipientName:
      typeof deliveryDetails.recipientName === 'string'
        ? deliveryDetails.recipientName
        : '',
    phone:
      typeof deliveryDetails.phone === 'string'
        ? deliveryDetails.phone
        : '',
    address:
      typeof deliveryDetails.address === 'string'
        ? deliveryDetails.address
        : '',
    dinerCount: dinerCount || 1,
    notes:
      typeof deliveryDetails.notes === 'string'
        ? deliveryDetails.notes
        : ''
  };
}

function getRestaurantInitials(restaurantName = '') {
  const words = String(restaurantName)
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (words.length === 0) {
    return 'R';
  }

  return words
    .slice(0, 2)
    .map((word) => word.charAt(0).toUpperCase())
    .join('');
}

function OrderRestaurantImage({
  restaurantName,
  restaurantImage
}) {
  const [imageFailed, setImageFailed] = useState(false);

  const canShowImage =
    Boolean(restaurantImage) &&
    !imageFailed;

  return (
    <div className="order-history-restaurant-media">
      {canShowImage ? (
        <img
          className="order-history-restaurant-image"
          src={restaurantImage}
          alt={`${restaurantName} restaurant`}
          loading="lazy"
          onError={() => setImageFailed(true)}
        />
      ) : (
        <div
          className="order-history-restaurant-fallback"
          aria-label={`${restaurantName} restaurant`}
        >
          {getRestaurantInitials(restaurantName)}
        </div>
      )}
    </div>
  );
}

function getLocationSummary(location) {
  if (!location) {
    return '';
  }

  return location.source === 'shared'
    ? 'Current location was attached'
    : 'Saved profile location was attached';
}

function DeliveryDetails({ deliveryDetails }) {
  if (!deliveryDetails) {
    return (
      <section className="order-history-delivery">
        <h4>Delivery details</h4>

        <p className="order-history-delivery-unavailable">
          Delivery details are unavailable for this older order.
        </p>
      </section>
    );
  }

  const locationSummary = getLocationSummary(
    deliveryDetails.location
  );

  return (
    <section className="order-history-delivery">
      <h4>Delivery details</h4>

      <dl className="order-history-delivery-grid">
        <div>
          <dt>Recipient</dt>
          <dd>{deliveryDetails.recipientName || 'Not available'}</dd>
        </div>

        <div>
          <dt>Phone</dt>
          <dd>{deliveryDetails.phone || 'Not available'}</dd>
        </div>

        <div className="order-history-delivery-grid-wide">
          <dt>Address</dt>
          <dd>{deliveryDetails.address || 'Not available'}</dd>
        </div>

        <div>
          <dt>Diners</dt>
          <dd>{deliveryDetails.dinerCount || 1}</dd>
        </div>

        {locationSummary && (
          <div>
            <dt>Location</dt>
            <dd>{locationSummary}</dd>
          </div>
        )}

        {deliveryDetails.notes && (
          <div className="order-history-delivery-grid-wide">
            <dt>Notes</dt>
            <dd>{deliveryDetails.notes}</dd>
          </div>
        )}
      </dl>
    </section>
  );
}

function OrdersPage() {
  const { formatPrice } = useCurrency();
  const navigate = useNavigate();
  const { setCartItems } = useCart();

  const [orders, setOrders] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [reorderingOrderId, setReorderingOrderId] = useState('');
  const [reorderError, setReorderError] = useState('');

  useEffect(() => {
    async function loadOrders() {
      try {
        const data = await getOrders();
        setOrders(Array.isArray(data) ? data : []);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    loadOrders();
  }, []);

  async function handleReorder(order) {
    const restaurantId = order?.restaurantId;
    const previousItems = Array.isArray(order?.items)
      ? order.items
      : [];

    if (
      !restaurantId ||
      previousItems.length === 0 ||
      reorderingOrderId
    ) {
      return;
    }

    setReorderError('');
    setReorderingOrderId(String(order.id));

    try {
      const productsData = await apiRequest(
        `/restaurants/${encodeURIComponent(restaurantId)}/products`
      );

      const currentProducts = Array.isArray(productsData)
        ? productsData
        : [];

      let menuCategories = [];

      try {
        const categoriesData = await getMenuCategories(restaurantId);

        menuCategories = Array.isArray(categoriesData)
          ? categoriesData
          : [];
      } catch {
        menuCategories = [];
      }

      const productsById = new Map(
        currentProducts
          .filter(
            (product) =>
              product?.id !== undefined &&
              product?.id !== null
          )
          .map((product) => [
            String(product.id),
            product
          ])
      );

      const unavailableItems = previousItems.filter((item) => {
        const quantity = getReorderQuantity(item?.quantity);

        return (
          !quantity ||
          !productsById.has(String(item?.productId))
        );
      });

      if (unavailableItems.length > 0) {
        const unavailableNames = unavailableItems
          .map((item) => getItemLabel(item))
          .join(', ');

        throw new Error(
          `This order cannot be reordered because these items are no longer available: ${unavailableNames}.`
        );
      }

      const categoriesById = new Map(
        menuCategories
          .filter(
            (category) =>
              category?.id !== undefined &&
              category?.id !== null
          )
          .map((category) => [
            String(category.id),
            category
          ])
      );

      const reorderedItemsByKey = new Map();

      previousItems.forEach((previousItem) => {
        const currentProduct = productsById.get(
          String(previousItem.productId)
        );

        const quantity = getReorderQuantity(
          previousItem.quantity
        );

        const category = categoriesById.get(
          String(currentProduct.categoryId || '')
        );

        const cartItem = normalizeCartItem({
          ...currentProduct,
          quantity,
          menuType:
            category?.menuType ||
            currentProduct.menuType ||
            '',
          restaurantId:
            currentProduct.restaurantId ?? restaurantId,
          restaurantName:
            currentProduct.restaurantName ||
            order.restaurantName ||
            `Restaurant ${String(restaurantId)}`,
          restaurantImage:
            currentProduct.restaurantImage ||
            order.restaurantImage ||
            ''
        });

        const existingItem = reorderedItemsByKey.get(
          cartItem.cartKey
        );

        reorderedItemsByKey.set(
          cartItem.cartKey,
          existingItem
            ? {
              ...existingItem,
              quantity:
                existingItem.quantity +
                cartItem.quantity
            }
            : cartItem
        );
      });

      const reorderedItems = Array.from(
        reorderedItemsByKey.values()
      );

      if (reorderedItems.length === 0) {
        throw new Error(
          'No available items were found for this order.'
        );
      }

      const reorderDeliveryDetails =
        getReorderDeliveryDetails(
          order.deliveryDetails
        );

      try {
        window.sessionStorage.setItem(
          getReorderStorageKey(restaurantId),
          JSON.stringify(reorderDeliveryDetails)
        );
      } catch {
        // Checkout will use normal profile defaults if session storage is unavailable.
      }

      setCartItems((currentItems) => [
        ...currentItems.filter(
          (item) =>
            String(item.restaurantId) !==
            String(restaurantId)
        ),
        ...reorderedItems
      ]);

      navigate(
        `/checkout?restaurantId=${encodeURIComponent(
          restaurantId
        )}&reorder=1`
      );
    } catch (err) {
      setReorderError(
        err.message ||
        'We could not prepare this order for checkout.'
      );
    } finally {
      setReorderingOrderId('');
    }
  }

  if (loading) {
    return <LoadingState message="Loading previous orders..." />;
  }

  if (error) {
    return <ErrorMessage message={error} />;
  }

  return (
    <main className="page">
      <h1>Previous Orders</h1>

      {reorderError && (
        <p
          className="order-history-reorder-error"
          role="alert"
        >
          {reorderError}
        </p>
      )}

      {orders.length === 0 ? (
        <EmptyState
          title="No previous orders"
          message="Your previous orders will appear here."
        />
      ) : (
        <div className="orders-list">
          {orders.map((order) => {
            const items = Array.isArray(order.items)
              ? order.items
              : [];

            const itemCount = getItemCount(items);

            const restaurantName =
              order.restaurantName ||
              `Restaurant #${order.restaurantId}`;

            const isPreparingReorder =
              String(reorderingOrderId) ===
              String(order.id);

            return (
              <article
                key={order.id}
                className="order-card order-history-card"
              >
                <header className="order-history-header">
                  <OrderRestaurantImage
                    restaurantName={restaurantName}
                    restaurantImage={order.restaurantImage}
                  />

                  <div className="order-history-restaurant-summary">
                    <p className="order-history-id">
                      Order #{order.id}
                    </p>

                    <h3>{restaurantName}</h3>

                    <p className="order-history-item-count">
                      {itemCount} {itemCount === 1 ? 'item' : 'items'}
                    </p>
                  </div>

                  <span className="order-history-status">
                    {formatStatus(order.status)}
                  </span>
                </header>

                <section
                  className="order-history-items"
                  aria-label="Ordered items"
                >
                  {items.length > 0 ? (
                    <ul>
                      {items.map((item, index) => (
                        <li
                          key={`${item.productId || 'item'}-${index}`}
                        >
                          <span>
                            {getItemLabel(item)}
                            {' × '}
                            {Number(item.quantity) || 0}
                          </span>

                          <strong>
                            {formatPrice(
                              (Number(item.price) || 0) *
                                (Number(item.quantity) || 0)
                            )}
                          </strong>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p>
                      Item details are not available for this order.
                    </p>
                  )}
                </section>

                <DeliveryDetails
                  deliveryDetails={order.deliveryDetails}
                />

                <footer className="order-history-total">
                  <span>Total</span>

                  <strong>
                    {formatPrice(
                      order.totalPrice ?? order.total ?? 0
                    )}
                  </strong>
                </footer>

                <div className="order-history-actions">
                  <button
                    type="button"
                    className="order-history-reorder-button"
                    onClick={() => handleReorder(order)}
                    disabled={Boolean(reorderingOrderId)}
                    aria-busy={isPreparingReorder}
                  >
                    {isPreparingReorder
                      ? 'Preparing reorder...'
                      : 'Reorder'}
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </main>
  );
}

export default OrdersPage;
