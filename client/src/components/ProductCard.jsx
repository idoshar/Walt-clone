import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useCart } from '../context/CartContext.jsx';
import { useCurrency } from '../context/CurrencyContext.jsx';
import { getCartItemKey } from '../utils/cart.js';
import { getRestaurantImage } from '../utils/restaurantImages.js';

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
    return 'https://images.unsplash.com/photo-1630384060421-cb20d0e0649d?w=400&q=80';
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

function ProductImage({ product }) {
  const customImage =
    typeof product.image === 'string' ? product.image.trim() : '';

  const imageSources = useMemo(() => {
    const fallbackImage = getProductImage(product.name);

    return customImage && customImage !== fallbackImage
      ? [customImage, fallbackImage]
      : [fallbackImage];
  }, [customImage, product.name]);

  const [imageIndex, setImageIndex] = useState(0);

  useEffect(() => {
    setImageIndex(0);
  }, [imageSources]);

  const imageSource = imageSources[imageIndex] || '';

  if (!imageSource) {
    return (
      <div
        className="product-image product-image-fallback"
        role="img"
        aria-label={`No image available for ${product.name}`}
      >
        <span aria-hidden="true">🍽</span>
      </div>
    );
  }

  return (
    <img
      src={imageSource}
      alt={product.name}
      className="product-image"
      onError={() => setImageIndex((currentIndex) => currentIndex + 1)}
    />
  );
}

function ProductCard({
  product,
  linkTo,
  onSelect,
  selected = false,
  disabled = false
}) {
  const { cartItems, addToCart, removeFromCart } = useCart();
  const { formatPrice } = useCurrency();

  const cartKey = getCartItemKey(product);

  const quantityInCart =
    cartItems.find((item) => item.cartKey === cartKey)?.quantity ?? 0;

  const customImage =
    typeof product.image === 'string' ? product.image.trim() : '';
  const displayImage = customImage || getProductImage(product.name);

  const restaurantImage = getRestaurantImage({
    name: product.restaurantName,
    image: product.restaurantImage
  });

  const productForCart = {
    ...product,
    image: displayImage,
    restaurantImage
  };

  function handleAddToCart(event) {
    event?.stopPropagation();
    addToCart(productForCart);
  }

  const content = (
    <div className="product-card-content">
      <div>
        <h3>{product.name}</h3>
        <p>{product.description || 'Fresh and tasty dish'}</p>
        <strong>{product.price !== undefined ? formatPrice(product.price) : ''}</strong>
      </div>

      <ProductImage product={product} />
    </div>
  );

  const addToCartButton =
    quantityInCart === 0 ? (
      <button
        type="button"
        className="add-to-cart-button"
        onClick={handleAddToCart}
        aria-label={`Add ${product.name} to cart`}
      >
        Add to cart
      </button>
    ) : (
      <div className="product-quantity-selector">
        <button
          type="button"
          className="add-to-cart-button product-quantity-button"
          onClick={(event) => {
            event.stopPropagation();
            removeFromCart(cartKey);
          }}
          aria-label={`Decrease quantity of ${product.name}`}
        >
          -
        </button>

        <span className="product-quantity-value">{quantityInCart}</span>

        <button
          type="button"
          className="add-to-cart-button product-quantity-button"
          onClick={handleAddToCart}
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
