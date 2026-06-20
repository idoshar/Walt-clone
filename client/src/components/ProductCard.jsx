import { Link } from 'react-router-dom';
import { useCart } from '../context/CartContext.jsx';

function ProductCard({ product, linkTo }) {
  const { addToCart } = useCart();

  const content = (
    <>
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
    </>
  );

  if (linkTo) {
    return (
      <Link to={linkTo} className="product-card product-card-link">
        {content}
      </Link>
    );
  }

  return (
    <article className="product-card">
      {content}

      <button type="button" onClick={() => addToCart(product)}>
        Add to cart
      </button>
    </article>
  );
}

export default ProductCard;