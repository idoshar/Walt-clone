import { useSearchParams, useNavigate } from 'react-router-dom';

function OrderStatusPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const status = searchParams.get('status'); // 'success' or 'fail'
  const orderId = searchParams.get('orderId') || 'N/A';
  const errorMessage = searchParams.get('message') || 'Something went wrong with your payment.';

  const isSuccess = status === 'success';

  return (
    <section style={styles.container}>
      <div style={styles.card}>
        <div style={styles.iconContainer}>
          {isSuccess ? (
            <span style={{ ...styles.icon, ...styles.successIcon }}>✓</span>
          ) : (
            <span style={{ ...styles.icon, ...styles.failIcon }}>✕</span>
          )}
        </div>

        <h1 style={styles.title}>
          {isSuccess ? 'Order Placed Successfully!' : 'Order Placement Failed'}
        </h1>

        <p style={styles.subtitle}>
          {isSuccess
            ? `Thank you for your order. Your food is on the way!`
            : errorMessage}
        </p>

        {isSuccess && (
          <div style={styles.detailsBox}>
            <span style={styles.detailsLabel}>Order ID:</span>
            <span style={styles.detailsValue}>{orderId}</span>
          </div>
        )}

        <div style={styles.actions}>
          {isSuccess ? (
            <button style={styles.primaryButton} onClick={() => navigate('/')}>
              Track Order & Go Home
            </button>
          ) : (
            <div style={styles.buttonGroup}>
              <button style={styles.primaryButton} onClick={() => navigate('/cart')}>
                Try Again
              </button>
              <button style={styles.secondaryButton} onClick={() => navigate('/')}>
                Cancel
              </button>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

const styles = {
  container: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '75vh',
    fontFamily: 'system-ui, sans-serif',
    padding: '20px',
    backgroundColor: '#f8f9fa',
    direction: 'ltr',
  },
  card: {
    backgroundColor: '#ffffff',
    padding: '40px',
    borderRadius: '16px',
    boxShadow: '0 4px 16px rgba(0, 0, 0, 0.08)',
    maxWidth: '480px',
    width: '100%',
    textAlign: 'center',
  },
  iconContainer: {
    display: 'flex',
    justifyContent: 'center',
    marginBottom: '24px',
  },
  icon: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    width: '72px',
    height: '72px',
    borderRadius: '50%',
    fontSize: '32px',
    fontWeight: 'bold',
  },
  successIcon: {
    backgroundColor: '#e6f7ed',
    color: '#00a04b',
  },
  failIcon: {
    backgroundColor: '#fde8e8',
    color: '#e02424',
  },
  title: {
    fontSize: '24px',
    fontWeight: '700',
    color: '#202125',
    margin: '0 0 12px 0',
  },
  subtitle: {
    fontSize: '15px',
    color: '#5e646e',
    margin: '0 0 24px 0',
    lineHeight: '1.5',
  },
  detailsBox: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#f1f3f5',
    padding: '12px 16px',
    borderRadius: '8px',
    marginBottom: '30px',
  },
  detailsLabel: {
    fontSize: '14px',
    color: '#5e646e',
    fontWeight: '500',
  },
  detailsValue: {
    fontSize: '14px',
    color: '#202125',
    fontWeight: '700',
  },
  actions: {
    marginTop: '10px',
  },
  buttonGroup: {
    display: 'flex',
    gap: '12px',
  },
  primaryButton: {
    flex: 1,
    backgroundColor: '#009de0',
    color: '#ffffff',
    border: 'none',
    padding: '14px 20px',
    borderRadius: '10px',
    fontSize: '15px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'background-color 0.2s',
  },
  secondaryButton: {
    flex: 1,
    backgroundColor: '#ffffff',
    color: '#202125',
    border: '1px solid #cbd5e1',
    padding: '14px 20px',
    borderRadius: '10px',
    fontSize: '15px',
    fontWeight: '600',
    cursor: 'pointer',
  },
};

export default OrderStatusPage;