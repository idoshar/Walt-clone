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
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadRestaurant() {
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
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <EmptyState
            title="No products yet"
            message="This restaurant does not have any menu items available yet."
          />
        )}
      </div>
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
    color: '#202125',
    marginBottom: '24px',
    borderBottom: '2px solid #f0f0f0',
    paddingBottom: '12px',
  },
  productList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
};

export default RestaurantPage;