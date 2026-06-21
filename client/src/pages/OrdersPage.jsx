import { useEffect, useState } from 'react';
import { getOrders } from '../api/orderApi.js';
import EmptyState from '../components/EmptyState.jsx';
import ErrorMessage from '../components/ErrorMessage.jsx';
import LoadingState from '../components/LoadingState.jsx';
import { formatCurrency } from '../utils/cart.js';

function getItemCount(items = []) {
  return items.reduce((total, item) => total + (Number(item.quantity) || 0), 0);
}

function getItemLabel(item = {}) {
  return item.productName || item.name || 'Menu item';
}

function formatStatus(status = '') {
  const normalizedStatus = String(status || 'created');
  return `${normalizedStatus.charAt(0).toUpperCase()}${normalizedStatus.slice(1)}`;
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
            const items = Array.isArray(order.items) ? order.items : [];
            const itemCount = getItemCount(items);

            return (
              <article key={order.id} className="order-card order-history-card">
                <header className="order-history-header">
                  <div>
                    <p className="order-history-id">Order #{order.id}</p>
                    <h3>
                      {order.restaurantName || `Restaurant #${order.restaurantId}`}
                    </h3>
                    <p className="order-history-item-count">
                      {itemCount} {itemCount === 1 ? 'item' : 'items'}
                    </p>
                  </div>

                  <span className="order-history-status">
                    {formatStatus(order.status)}
                  </span>
                </header>

                <section className="order-history-items" aria-label="Ordered items">
                  {items.length > 0 ? (
                    <ul>
                      {items.map((item, index) => (
                        <li key={`${item.productId || 'item'}-${index}`}>
                          <span>
                            {getItemLabel(item)} × {Number(item.quantity) || 0}
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
                    <p>Item details are not available for this order.</p>
                  )}
                </section>

                <footer className="order-history-total">
                  <span>Total</span>
                  <strong>{formatCurrency(order.totalPrice ?? order.total ?? 0)}</strong>
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
