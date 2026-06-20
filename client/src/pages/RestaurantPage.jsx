import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { apiRequest } from '../api/client.js';
import EmptyState from '../components/EmptyState.jsx';
import ErrorMessage from '../components/ErrorMessage.jsx';
import LoadingState from '../components/LoadingState.jsx';
import ProductCard from '../components/ProductCard.jsx';

function RestaurantPage() {
  const { id } = useParams();

  const [restaurant, setRestaurant] = useState(null);
  const [products, setProducts] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [selectedProductKey, setSelectedProductKey] = useState('');
  const [selectedProductName, setSelectedProductName] = useState('');
  const [recommendationsLoading, setRecommendationsLoading] = useState(false);
  const [recommendationError, setRecommendationError] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadRestaurant() {
      setRecommendations([]);
      setSelectedProductKey('');
      setSelectedProductName('');
      setRecommendationError('');

      try {
        const restaurantData = await apiRequest(`/restaurants/${id}`);
        const productsData = await apiRequest(`/restaurants/${id}/products`);

        setRestaurant(restaurantData);
        setProducts(Array.isArray(productsData) ? productsData : []);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    loadRestaurant();
  }, [id]);

  function getProductKey(product) {
    const restaurantId = product.restaurantId ?? id;
    return `${restaurantId}-${product.id}`;
  }

  async function handleProductSelect(product) {
    if (!product?.id || recommendationsLoading) {
      return;
    }

    const restaurantId = product.restaurantId ?? id;

    setSelectedProductKey(getProductKey(product));
    setSelectedProductName(product.name);
    setRecommendations([]);
    setRecommendationError('');
    setRecommendationsLoading(true);

    try {
      const data = await apiRequest(
        `/restaurants/${restaurantId}/products/${product.id}/recommendations`
      );

      const recommendedProducts = Array.isArray(data)
        ? data.filter((recommendedProduct) => recommendedProduct?.id !== product.id)
        : [];

      setRecommendations(recommendedProducts);
    } catch (err) {
      setRecommendationError(
        err.message || 'Could not load recommendations right now.'
      );
    } finally {
      setRecommendationsLoading(false);
    }
  }

  if (loading) {
    return (
      <section style={styles.centerContainer}>
        <LoadingState message="Loading restaurant menu..." />
      </section>
    );
  }

  if (error) {
    return (
      <section style={styles.centerContainer}>
        <ErrorMessage message={error} />
      </section>
    );
  }

  if (!restaurant) {
    return (
      <section style={styles.centerContainer}>
        <EmptyState
          title="Restaurant not found"
          message="The restaurant you requested does not exist."
        />
      </section>
    );
  }

  return (
    <section style={styles.container}>
      <div style={styles.heroSection}>
        {restaurant.image && (
          <img src={restaurant.image} alt={restaurant.name} style={styles.heroImage} />
        )}

        <div style={styles.heroOverlay}>
          <h1 style={styles.restaurantName}>{restaurant.name}</h1>

          {restaurant.description && (
            <p style={styles.restaurantDescription}>{restaurant.description}</p>
          )}

          <div style={styles.metaInfo}>
            <span>📍 {restaurant.address}</span>
            {restaurant.phone && <span>• 📞 {restaurant.phone}</span>}
          </div>
        </div>
      </div>

      <div style={styles.menuSection}>
        <h2 style={styles.menuTitle}>Menu Items</h2>

        {products.length > 0 ? (
          <div style={styles.productList}>
            {products.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onSelect={handleProductSelect}
                selected={selectedProductKey === getProductKey(product)}
                disabled={recommendationsLoading}
              />
            ))}
          </div>
        ) : (
          <EmptyState
            title="No products yet"
            message="This restaurant does not have any menu items available yet."
          />
        )}
      </div>

      {recommendationsLoading && (
        <section className="recommendations-section">
          <LoadingState message="Finding recommendations..." />
        </section>
      )}

      {!recommendationsLoading && recommendationError && (
        <section className="recommendations-section">
          <ErrorMessage message={recommendationError} />
        </section>
      )}

      {!recommendationsLoading && recommendations.length > 0 && (
        <section className="recommendations-section">
          <h2 style={styles.menuTitle}>Recommended for you</h2>
          <p className="recommendations-subtitle">
            Based on {selectedProductName}.
          </p>

          <div style={styles.productList}>
            {recommendations.map((product) => (
              <ProductCard
                key={`${product.restaurantId ?? id}-${product.id}`}
                product={product}
                onSelect={handleProductSelect}
                selected={selectedProductKey === getProductKey(product)}
                disabled={recommendationsLoading}
              />
            ))}
          </div>
        </section>
      )}
    </section>
  );
}

const styles = {
  container: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '20px',
    fontFamily: 'system-ui, sans-serif',
    direction: 'ltr',
  },
  centerContainer: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '60vh',
    direction: 'ltr',
  },
  heroSection: {
    position: 'relative',
    width: '100%',
    height: '320px',
    borderRadius: '16px',
    overflow: 'hidden',
    marginBottom: '40px',
    backgroundColor: '#141517',
  },
  heroImage: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    opacity: '0.55',
  },
  heroOverlay: {
    position: 'absolute',
    bottom: '0',
    left: '0',
    right: '0',
    padding: '30px',
    background: 'linear-gradient(to top, rgba(0,0,0,0.9), rgba(0,0,0,0))',
    color: '#ffffff',
  },
  restaurantName: {
    fontSize: '38px',
    fontWeight: '800',
    margin: '0 0 12px 0',
  },
  restaurantDescription: {
    margin: '0 0 14px 0',
    fontSize: '16px',
    color: '#e2e4e8',
    lineHeight: '1.5',
    maxWidth: '750px',
  },
  metaInfo: {
    display: 'flex',
    gap: '15px',
    fontSize: '14px',
    fontWeight: '500',
    color: '#ced4da',
  },
  menuSection: {
    width: '100%',
  },
  menuTitle: {
    fontSize: '24px',
    fontWeight: '700',
    color: 'var(--color-text)',
    marginBottom: '24px',
    borderBottom: '2px solid var(--color-border)',
    paddingBottom: '12px',
  },
  productList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
};

export default RestaurantPage;

