import { Link } from 'react-router-dom';

function ProductCard({
  product,
  linkTo,
  onSelect,
  selected = false,
  disabled = false
}) {
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
      <button
        type="button"
        className={`product-card product-card-button${selected ? ' product-card-selected' : ''}`}
        onClick={() => onSelect(product)}
        aria-label={`Show recommendations based on ${product.name}`}
        aria-pressed={selected}
        disabled={disabled}
      >
        {content}
      </button>
    );
  }

  return <article className="product-card">{content}</article>;
}

export default ProductCard;
