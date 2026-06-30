import EmptyState from './EmptyState.jsx';
import ErrorMessage from './ErrorMessage.jsx';
import LoadingState from './LoadingState.jsx';
import { useCurrency } from '../context/CurrencyContext.jsx';

function formatNumber(value) {
  const amount = Number(value);

  return new Intl.NumberFormat('en-US').format(
    Number.isFinite(amount) ? amount : 0
  );
}

function RestaurantSalesStatistics({
  restaurantName,
  statistics,
  isLoading,
  error
}) {
  const { formatPrice } = useCurrency();
  if (isLoading) {
    return <LoadingState message="Loading restaurant sales statistics..." />;
  }

  if (error) {
    return <ErrorMessage message={error} />;
  }

  if (!statistics || Number(statistics.totalOrders) === 0) {
    return (
      <EmptyState
        title="No sales data yet"
        message={`Orders for ${restaurantName} will appear here after customers place them.`}
      />
    );
  }

  const productSales = Array.isArray(statistics.productSales)
    ? statistics.productSales
    : [];

  const topQuantity = Math.max(
    ...productSales.map((product) => Number(product.quantitySold) || 0),
    1
  );

  return (
    <section className="analytics-dashboard">
      <p className="analytics-dashboard-intro">
        Sales figures exclude cancelled orders and are based on the historical
        item prices stored in completed order snapshots.
      </p>

      <div className="analytics-summary-grid">
        <article className="analytics-summary-card">
          <span className="analytics-summary-label">Total orders</span>
          <strong>{formatNumber(statistics.totalOrders)}</strong>
          <small>Non-cancelled customer orders</small>
        </article>

        <article className="analytics-summary-card">
          <span className="analytics-summary-label">Average order value</span>
          <strong>{formatPrice(statistics.averageOrderValue)}</strong>
          <small>Average revenue per order</small>
        </article>

        <article className="analytics-summary-card analytics-summary-card-revenue">
          <span className="analytics-summary-label">Total revenue</span>
          <strong>{formatPrice(statistics.totalRevenue)}</strong>
          <small>Revenue from all qualifying orders</small>
        </article>
      </div>

      <section
        className="analytics-product-section"
        aria-labelledby="analytics-product-sales-title"
      >
        <div className="analytics-product-section-heading">
          <div>
            <p className="management-eyebrow">Menu performance</p>
            <h3 id="analytics-product-sales-title">Sales by dish</h3>
          </div>

          <span className="analytics-product-count">
            {productSales.length}{' '}
            {productSales.length === 1 ? 'dish' : 'dishes'}
          </span>
        </div>

        <div className="analytics-product-list">
          {productSales.map((product) => {
            const quantitySold = Number(product.quantitySold) || 0;
            const salesPercentage = Math.round(
              (quantitySold / topQuantity) * 100
            );

            return (
              <article
                key={`${product.productId}-${product.productName}`}
                className="analytics-product-row"
              >
                <div className="analytics-product-main">
                  <div className="analytics-product-title-row">
                    <h4>{product.productName}</h4>

                    {statistics.topProduct?.productId === product.productId && (
                      <span className="analytics-top-product-badge">
                        Top seller
                      </span>
                    )}
                  </div>

                  <p>
                    Appeared in {formatNumber(product.ordersContainingProduct)}{' '}
                    {product.ordersContainingProduct === 1 ? 'order' : 'orders'}
                  </p>

                  <div
                    className="analytics-sales-bar"
                    role="progressbar"
                    aria-label={`${product.productName}: ${quantitySold} units sold`}
                    aria-valuemin="0"
                    aria-valuemax={topQuantity}
                    aria-valuenow={quantitySold}
                  >
                    <span
                      className="analytics-sales-bar-fill"
                      style={{ width: `${salesPercentage}%` }}
                    />
                  </div>
                </div>

                <div className="analytics-product-values">
                  <span>
                    <strong>{formatNumber(quantitySold)}</strong>
                    units sold
                  </span>

                  <span>
                    <strong>{formatPrice(product.revenue)}</strong>
                    revenue
                  </span>
                </div>
              </article>
            );
          })}
        </div>
      </section>
    </section>
  );
}

export default RestaurantSalesStatistics;
