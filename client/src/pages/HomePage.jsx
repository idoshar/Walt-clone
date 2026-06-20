import { useEffect, useState } from 'react';
import { apiRequest } from '../api/client.js';
import EmptyState from '../components/EmptyState.jsx';
import ErrorMessage from '../components/ErrorMessage.jsx';
import LoadingState from '../components/LoadingState.jsx';
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
        setError(err.message || 'Unable to load restaurants. Please try again.');
      } finally {
        setLoading(false);
      }
    }

    loadRestaurants();
  }, []);

  if (loading) {
    return (
      <section className="page-container">
        <LoadingState message="Loading restaurants..." />
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

  return (
    <section className="page-container">
      <h1>Restaurants near you</h1>
      <p className="page-subtitle">Choose a restaurant and view its menu.</p>

      {restaurants.length === 0 ? (
        <EmptyState
          title="No restaurants available"
          message="There are currently no restaurants to display. Please try again later."
        />
      ) : (
        <div className="cards-grid">
          {restaurants.map((restaurant) => (
            <RestaurantCard key={restaurant.id} restaurant={restaurant} />
          ))}
        </div>
      )}
    </section>
  );
}

export default HomePage;
