import { useEffect, useState } from 'react';
import { apiRequest } from '../api/client.js';
import RestaurantCard from '../components/RestaurantCard.jsx';

function HomePage() {
  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadRestaurants() {
      try {
        const data = await apiRequest('/restaurants');
        setRestaurants(Array.isArray(data) ? data : []);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    loadRestaurants();
  }, []);

  return (
    <section className="page-container">
      <h1>Restaurants near you</h1>
      <p className="page-subtitle">Choose a restaurant and view its menu.</p>

      {loading && <p>Loading restaurants...</p>}
      {error && <p className="error-message">{error}</p>}

      <div className="cards-grid">
        {restaurants.map((restaurant) => (
          <RestaurantCard key={restaurant.id} restaurant={restaurant} />
        ))}
      </div>
    </section>
  );
}

export default HomePage;
