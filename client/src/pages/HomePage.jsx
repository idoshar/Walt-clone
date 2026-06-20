import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { apiRequest } from '../api/client.js';
import EmptyState from '../components/EmptyState.jsx';
import ErrorMessage from '../components/ErrorMessage.jsx';
import LoadingState from '../components/LoadingState.jsx';
import RestaurantList from '../components/RestaurantList.jsx';

function getUserFirstName() {
  const savedUser = localStorage.getItem('user');

  if (!savedUser) {
    return 'there';
  }

  try {
    const user = JSON.parse(savedUser);
    const name = user.fullName || user.displayName || user.username || '';

    return name.trim().split(/\s+/)[0] || 'there';
  } catch {
    return 'there';
  }
}

function HomePage() {
  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const userFirstName = getUserFirstName();

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

  return (
    <section className="page-container home-page">
      <section className="home-hero" aria-labelledby="home-title">
        <p className="home-eyebrow">Food delivery made easy</p>

        <h1 id="home-title">Hi {userFirstName}, what are you craving today?</h1>

        <p className="home-hero-description">
          Explore restaurants nearby, discover dishes and choose your next meal.
        </p>

        <Link to="/search" className="home-search-cta">
          Search restaurants or dishes
          <span aria-hidden="true">→</span>
        </Link>
      </section>

      {loading && <LoadingState message="Loading restaurants..." />}

      {!loading && error && <ErrorMessage message={error} />}

      {!loading && !error && restaurants.length === 0 && (
        <EmptyState
          title="No restaurants available"
          message="There are currently no restaurants to display. Please try again later."
        />
      )}

      {!loading && !error && restaurants.length > 0 && (
        <RestaurantList restaurants={restaurants} />
      )}
    </section>
  );
}

export default HomePage;
