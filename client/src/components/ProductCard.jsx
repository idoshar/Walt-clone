import { Link } from 'react-router-dom';

function ProductCard({ product, linkTo }) {
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

  return <article className="product-card">{content}</article>;
}

export default ProductCard;
