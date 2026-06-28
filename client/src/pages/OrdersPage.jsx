import { useEffect, useState } from 'react';
import { getOrders } from '../api/orderApi.js';
import EmptyState from '../components/EmptyState.jsx';
import ErrorMessage from '../components/ErrorMessage.jsx';
import LoadingState from '../components/LoadingState.jsx';
import { formatCurrency } from '../utils/cart.js';

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
  const [orders, setOrders] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

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

  if (loading) {
    return <LoadingState message="Loading previous orders..." />;
  }

  if (error) {
    return <ErrorMessage message={error} />;
  }

  return (
    <main className="page">
      <h1>Previous Orders</h1>

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
                          key={
                            `${item.productId || 'item'}-${index}`
                          }
                        >
                          <span>
                            {getItemLabel(item)}
                            {' \u00d7 '}
                            {Number(item.quantity) || 0}
                          </span>

                          <strong>
                            {formatCurrency(
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
                    {formatCurrency(
                      order.totalPrice ?? order.total ?? 0
                    )}
                  </strong>
                </footer>
              </article>
            );
          })}
        </div>
      )}
    </main>
  );
}

export default OrdersPage;
