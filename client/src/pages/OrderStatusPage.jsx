import { useSearchParams, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';

function OrderStatusPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  const [isDarkMode, setIsDarkMode] = useState(
    document.body.classList.contains('dark') || document.body.classList.contains('dark-mode')
  );

  useEffect(() => {
    const observer = new MutationObserver(() => {
      setIsDarkMode(document.body.classList.contains('dark') || document.body.classList.contains('dark-mode'));
    });
    observer.observe(document.body, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);

  const status = searchParams.get('status');
  const orderId = searchParams.get('orderId');
  const message = searchParams.get('message');

  const isSuccess = status === 'success';

  const themeStyles = {
    container: {
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: '75vh',
      fontFamily: 'system-ui, sans-serif',
      padding: '20px',
      color: isDarkMode ? '#ffffff' : '#202125',
      transition: 'color 0.3s'
    },
    card: {
      backgroundColor: isDarkMode ? '#1e1e1e' : '#ffffff',
      padding: '40px',
      borderRadius: '16px',
      boxShadow: isDarkMode ? '0 4px 20px rgba(0, 0, 0, 0.5)' : '0 4px 16px rgba(0, 0, 0, 0.08)',
      maxWidth: '500px',
      width: '100%',
      textAlign: 'center',
      transition: 'background-color 0.3s, box-shadow 0.3s'
    },
    iconContainer: {
      width: '72px',
      height: '72px',
      borderRadius: '50%',
      backgroundColor: isSuccess 
        ? (isDarkMode ? 'rgba(34, 197, 94, 0.2)' : '#e6f7ed') 
        : (isDarkMode ? 'rgba(239, 68, 68, 0.2)' : '#fdf2f2'),
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      margin: '0 auto 24px auto'
    },
    icon: {
      fontSize: '32px',
      color: isSuccess ? '#22c55e' : '#ef4444'
    },
    title: {
      fontSize: '24px',
      fontWeight: '700',
      margin: '0 0 12px 0',
      color: isDarkMode ? '#ffffff' : '#202125'
    },
    text: {
      fontSize: '16px',
      color: isDarkMode ? '#a0aec0' : '#5e646e',
      margin: '0 0 32px 0'
    },
    infoBox: {
      backgroundColor: isDarkMode ? '#2d2d2d' : '#f1f5f9',
      padding: '16px',
      borderRadius: '10px',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: '32px',
      transition: 'background-color 0.3s'
    },
    infoLabel: {
      fontSize: '14px',
      color: isDarkMode ? '#a0aec0' : '#5e646e'
    },
    infoValue: {
      fontSize: '14px',
      fontWeight: '600',
      fontFamily: 'monospace',
      color: isDarkMode ? '#ffffff' : '#202125'
    },
    button: {
      backgroundColor: '#009de0',
      color: '#ffffff',
      border: 'none',
      padding: '14px 28px',
      borderRadius: '10px',
      fontSize: '16px',
      fontWeight: '600',
      cursor: 'pointer',
      width: '100%',
      transition: 'background-color 0.2s'
    }
  };

  return (
    <div style={themeStyles.container}>
      <div style={themeStyles.card}>
        <div style={themeStyles.iconContainer}>
          <span style={themeStyles.icon}>{isSuccess ? '✓' : '✕'}</span>
        </div>

        <h1 style={themeStyles.title}>
          {isSuccess ? 'Order Placed Successfully!' : 'Order Failed'}
        </h1>

        <p style={themeStyles.text}>
          {isSuccess 
            ? 'Thank you for your order. Your food is on the way!' 
            : (message || 'Something went wrong with your transaction. Please try again.')}
        </p>

        {orderId && (
          <div style={themeStyles.infoBox}>
            <span style={themeStyles.infoLabel}>Order ID:</span>
            <span style={themeStyles.infoValue}>{orderId}</span>
          </div>
        )}

        <button style={themeStyles.button} onClick={() => navigate('/')}>
          Track Order & Go Home
        </button>
      </div>
    </div>
  );
}

export default OrderStatusPage;