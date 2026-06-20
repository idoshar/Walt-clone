import { Link } from 'react-router-dom';
import { useEffect, useMemo, useState } from 'react';
import { apiRequest } from '../api/client.js';
import EmptyState from '../components/EmptyState.jsx';
import ErrorMessage from '../components/ErrorMessage.jsx';
import LoadingState from '../components/LoadingState.jsx';
import RestaurantSection from '../components/RestaurantSection.jsx';

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

function getRestaurantCategory(restaurant) {
  return restaurant.category || restaurant.cuisine || 'Other';
}

function HomePage() {
  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

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

  const categories = useMemo(() => {
    const uniqueCategories = new Set(
      restaurants
        .map(getRestaurantCategory)
        .filter(Boolean)
    );

    return ['All', ...uniqueCategories];
  }, [restaurants]);

  const nearbyRestaurants = useMemo(() => {
    if (selectedCategory === 'All') {
      return restaurants;
    }

    return restaurants.filter(
      (restaurant) => getRestaurantCategory(restaurant) === selectedCategory
    );
  }, [restaurants, selectedCategory]);

  const popularRestaurants = useMemo(() => {
    return restaurants.slice(0, 3);
  }, [restaurants]);

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
        <div className="home-sections">
          <section className="categories-section" aria-labelledby="categories-title">
            <div className="restaurant-section-heading">
              <div>
                <p className="section-eyebrow">Browse by cuisine</p>
                <h2 id="categories-title">Categories</h2>
              </div>
            </div>

            <div className="category-chips" role="list">
              {categories.map((category) => (
                <button
                  type="button"
                  key={category}
                  className={`category-chip ${
                    selectedCategory === category ? 'category-chip-active' : ''
                  }`}
                  onClick={() => setSelectedCategory(category)}
                  aria-pressed={selectedCategory === category}
                >
                  {category}
                </button>
              ))}
            </div>
          </section>

          <RestaurantSection
            eyebrow="Hand-picked from today’s list"
            title="Popular picks"
            restaurants={popularRestaurants}
            emptyMessage="No popular restaurants are available right now."
          />

          <RestaurantSection
            eyebrow={
              selectedCategory === 'All'
                ? 'Restaurants near you'
                : `${selectedCategory} restaurants near you`
            }
            title="Nearby restaurants"
            restaurants={nearbyRestaurants}
            emptyMessage={`No ${selectedCategory.toLowerCase()} restaurants are available right now.`}
          />
        </div>
      )}
    </section>
  );
}

export default HomePage;
