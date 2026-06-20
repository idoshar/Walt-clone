import { Link } from 'react-router-dom';
import { useCart } from '../context/CartContext.jsx';

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

  const content = (
    <div className="product-card-content">
      <div>
        <h3>{product.name}</h3>
        <p>{product.description || 'Fresh and tasty dish'}</p>
        <strong>{product.price !== undefined ? `${product.price} ₪` : ''}</strong>
      </div>

      {product.image ? (
        <img src={product.image} alt={product.name} className="product-image" />
      ) : (
        <div className="small-image-placeholder">Food</div>
      )}
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