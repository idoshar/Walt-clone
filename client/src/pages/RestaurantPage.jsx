import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { apiRequest } from '../api/client.js';
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
    return <p className="page-container">Loading restaurant...</p>;
  }

  if (error) {
    return <p className="page-container error-message">{error}</p>;
  }

  if (!restaurant) {
    return <p className="page-container">Restaurant not found.</p>;
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
        <p>No products yet.</p>
      )}
    </section>
  );
}

export default RestaurantPage;
