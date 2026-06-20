import { Link } from 'react-router-dom';
import { useCart } from '../context/CartContext.jsx';

function getProductImage(name = '') {
  const productName = name.toLowerCase();

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
    return 'https://images.unsplash.com/photo-1630384060421-cb20d0e0649d??w=400&q=80';
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

function ProductCard({
  product,
  linkTo,
  onSelect,
  selected = false,
  disabled = false
}) {
  const { cartItems, addToCart, removeFromCart } = useCart();

  const quantityInCart =
    cartItems.find((item) => item.id === product.id)?.quantity ?? 0;

  const displayImage = product.image && product.image.trim() !== ''
    ? product.image
    : getProductImage(product.name);

  const content = (
    <div className="product-card-content">
      <div>
        <h3>{product.name}</h3>
        <p>{product.description || 'Fresh and tasty dish'}</p>
        <strong>{product.price !== undefined ? `${product.price} ₪` : ''}</strong>
      </div>

      <img src={displayImage} alt={product.name} className="product-image" />
    </div>
  );

  const addToCartButton = quantityInCart === 0 ? (
    <button
      type="button"
      className="add-to-cart-button"
      onClick={(e) => {
        e.stopPropagation();
        addToCart(product);
      }}
      aria-label={`Add ${product.name} to cart`}
    >
      Add to cart
    </button>
  ) : (
    <div className="quantity-selector" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', marginTop: '10px' }}>
      <button
        type="button"
        className="add-to-cart-button"
        style={{ width: '35px', padding: '5px' }}
        onClick={(e) => {
          e.stopPropagation();
          removeFromCart(product.id);
        }}
        aria-label={`Decrease quantity of ${product.name}`}
      >
        -
      </button>
      <span style={{ fontWeight: 'bold', fontSize: '16px', minWidth: '20px', textAlign: 'center' }}>
        {quantityInCart}
      </span>
      <button
        type="button"
        className="add-to-cart-button"
        style={{ width: '35px', padding: '5px' }}
        onClick={(e) => {
          e.stopPropagation();
          addToCart(product);
        }}
        aria-label={`Increase quantity of ${product.name}`}
      >
        +
      </button>
    </div>
  );

  if (linkTo) {
    return (
      <Link
        to={linkTo}
        className="product-card product-card-link"
        aria-label={`View restaurant for ${product.name}`}
      >
        {content}
      </Link>
    );
  }

  if (typeof onSelect === 'function') {
    return (
      <article
        className={`product-card product-card-with-actions${
          selected ? ' product-card-selected' : ''
        }`}
      >
        <button
          type="button"
          className="product-card-select-button"
          onClick={() => onSelect(product)}
          aria-label={`Show recommendations based on ${product.name}`}
          aria-pressed={selected}
          disabled={disabled}
        >
          {content}
        </button>

        {addToCartButton}
      </article>
    );
  }

  return (
    <article className="product-card product-card-with-actions">
      <div className="product-card-static-content">{content}</div>

      {addToCartButton}
    </article>
  );
}

export default ProductCard;