import { useNavigate, useSearchParams } from 'react-router-dom';

function OrderStatusPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const status = searchParams.get('status');
  const orderId = searchParams.get('orderId');
  const message = searchParams.get('message');
  const restaurantId = searchParams.get('restaurantId');

  const isSuccess = status === 'success';

  const checkoutPath = restaurantId
    ? `/checkout?restaurantId=${encodeURIComponent(restaurantId)}`
    : '/checkout';

  return (
    <section className="order-status-page">
      <div className="order-status-card">
        <div
          className={`order-status-icon ${
            isSuccess
              ? 'order-status-icon--success'
              : 'order-status-icon--error'
          }`}
          aria-hidden="true"
        >
          <span className="order-status-icon-symbol">
            {isSuccess ? '✓' : '×'}
          </span>
        </div>

        <h1 className="order-status-title">
          {isSuccess ? 'Order Placed Successfully!' : 'Order Failed'}
        </h1>

        <p className="order-status-text">
          {isSuccess
            ? 'Your order has been received. You can view its status in My Orders.'
            : message ||
              'We could not place your order. Your cart is still waiting for you.'}
        </p>

        {isSuccess && orderId && (
          <div className="order-status-info-box">
            <span className="order-status-info-label">Order ID</span>

            <span className="order-status-info-value">{orderId}</span>
          </div>
        )}

        <div className="order-status-actions">
          {isSuccess ? (
            <>
              <button
                type="button"
                className="order-status-primary-button"
                onClick={() => navigate('/orders')}
              >
                View My Orders
              </button>

              <button
                type="button"
                className="order-status-secondary-button"
                onClick={() => navigate('/')}
              >
                Return Home
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                className="order-status-primary-button"
                onClick={() => navigate(checkoutPath)}
              >
                Return to Checkout
              </button>

              <button
                type="button"
                className="order-status-secondary-button"
                onClick={() => navigate('/')}
              >
                Return Home
              </button>
            </>
          )}
        </div>
      </div>
    </section>
  );
}

export default OrderStatusPage;
