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
      <section className="page-container">
        <LoadingState message="Loading restaurant..." />
      </section>
    );
  }

  if (error) {
    return (
      <section className="page-container">
        <ErrorMessage message={error} />
      </section>
    );
  }

  if (!restaurant) {
    return (
      <section className="page-container">
        <EmptyState
          title="Restaurant not found"
          message="The restaurant you requested does not exist."
        />
      </section>
    );
  }

  return (
    <section className="page-container">
      <h1>{restaurant.name}</h1>
      <p className="page-subtitle">{restaurant.description}</p>
      <p>{restaurant.address}</p>
      <p>{restaurant.phone}</p>

      <h2>Menu</h2>

      {products.length > 0 ? (
        <div className="product-list">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      ) : (
        <EmptyState
          title="No products yet"
          message="This restaurant does not have menu items yet."
        />
      )}
    </section>
  );
}

export default RestaurantPage;
