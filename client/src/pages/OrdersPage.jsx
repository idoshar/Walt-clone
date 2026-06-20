import { useEffect, useState } from 'react';
import { getOrders } from '../api/orderApi.js';
import EmptyState from '../components/EmptyState.jsx';
import ErrorMessage from '../components/ErrorMessage.jsx';
import LoadingState from '../components/LoadingState.jsx';

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
          {orders.map((order) => (
            <article key={order.id} className="order-card">
              <h3>Order #{order.id}</h3>
              <p>Status: {order.status || 'Created'}</p>
              <p>Total: {order.totalPrice ?? order.total ?? 0} ₪</p>
            </article>
          ))}
        </div>
      )}
    </main>
  );
}

export default OrdersPage;