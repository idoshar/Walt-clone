import { useState } from 'react';
import { useCart } from '../context/CartContext.jsx';
import { useNavigate } from 'react-router-dom';

function CartDropdown() {
  const { cartItems, addToCart, removeFromCart, totalPrice } = useCart();
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();

  const totalItemsCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div style={{ position: 'relative', display: 'inline-block', fontFamily: 'system-ui, sans-serif' }}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          position: 'relative',
          padding: '8px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
        aria-label="Shopping Cart"
      >
        <svg
          width="28"
          height="28"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#009de0"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="9" cy="21" r="1" fill="#009de0" />
          <circle cx="20" cy="21" r="1" fill="#009de0" />
          <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
        </svg>

        {totalItemsCount > 0 && (
          <span
            style={{
              position: 'absolute',
              top: '-2px',
              right: '-2px',
              backgroundColor: '#009de0',
              color: '#ffffff',
              borderRadius: '50%',
              width: '18px',
              height: '18px',
              fontSize: '11px',
              fontWeight: '700',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            {totalItemsCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div
          style={{
            position: 'absolute',
            top: '45px',
            right: '0',
            backgroundColor: 'var(--color-bg-card, #1e1e1e)',
            border: '1px solid var(--color-border, #4a5568)',
            borderRadius: '12px',
            boxShadow: '0 10px 25px rgba(0,0,0,0.4)',
            width: '320px',
            maxHeight: '450px',
            overflowY: 'auto',
            zIndex: 1000,
            padding: '16px',
            color: 'var(--color-text, #ffffff)'
          }}
        >
          <h3 style={{ margin: '0 0 16px 0', fontSize: '18px', borderBottom: '1px solid var(--color-border, #4a5568)', paddingBottom: '8px', color: 'var(--color-text, #ffffff)' }}>
            Your Cart
          </h3>

          {cartItems.length === 0 ? (
            <p style={{ textAlign: 'center', color: '#a0aec0', margin: '20px 0' }}>Your cart is empty</p>
          ) : (
            <div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '16px' }}>
                {cartItems.map((item) => (
                  <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ flex: 1, paddingRight: '10px' }}>
                      <h4 style={{ margin: '0 0 4px 0', fontSize: '14px', fontWeight: '600', color: 'var(--color-text, #ffffff)' }}>{item.name}</h4>
                      <span style={{ fontSize: '13px', color: '#009de0', fontWeight: '600' }}>₪{item.price}</span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', backgroundColor: 'var(--color-bg-selected, #2d2d2d)', borderRadius: '12px', padding: '2px' }}>
                      <button
                        onClick={() => removeFromCart(item.id)}
                        style={{ background: 'none', border: 'none', color: 'var(--color-text, #ffffff)', width: '24px', height: '24px', cursor: 'pointer', fontSize: '16px' }}
                      >
                        -
                      </button>
                      <span style={{ fontSize: '13px', fontWeight: '700', minWidth: '14px', textAlign: 'center', margin: '0 6px', color: 'var(--color-text, #ffffff)' }}>
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => addToCart(item)}
                        style={{ background: 'none', border: 'none', color: 'var(--color-text, #ffffff)', width: '24px', height: '24px', cursor: 'pointer', fontSize: '16px' }}
                      >
                        +
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <div style={{ borderTop: '1px solid var(--color-border, #4a5568)', paddingTop: '12px', marginBottom: '16px', display: 'flex', justifyContent: 'space-between', fontWeight: '700', color: 'var(--color-text, #ffffff)' }}>
                <span>Total:</span>
                <span style={{ color: '#009de0' }}>₪{totalPrice}</span>
              </div>

              <button
                onClick={() => {
                  setIsOpen(false);
                  navigate('/checkout');
                }}
                style={{
                  backgroundColor: '#009de0',
                  color: '#ffffff',
                  border: 'none',
                  width: '100%',
                  padding: '10px',
                  borderRadius: '8px',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                Go to Checkout
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default CartDropdown;