import { Link } from 'react-router-dom';
import { useEffect, useMemo, useState } from 'react';
import { apiRequest } from '../api/client.js';
import { updateCurrentUserLocation } from '../api/userApi.js';
import { useAuth } from '../context/AuthContext.jsx';
import EmptyState from '../components/EmptyState.jsx';
import ErrorMessage from '../components/ErrorMessage.jsx';
import LoadingState from '../components/LoadingState.jsx';
import RestaurantCarousel from '../components/RestaurantCarousel.jsx';
import SponsoredPromotionRail from '../components/SponsoredPromotionRail.jsx';
import { getFeaturedRestaurants } from '../utils/featuredRestaurants.js';

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

function getCoordinates(entity) {
  const rawLatitude = entity?.latitude;
  const rawLongitude = entity?.longitude;

  if (
    rawLatitude === null ||
    rawLatitude === undefined ||
    rawLatitude === '' ||
    rawLongitude === null ||
    rawLongitude === undefined ||
    rawLongitude === ''
  ) {
    return null;
  }

  const latitude = Number(rawLatitude);
  const longitude = Number(rawLongitude);

  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    return null;
  }

  return { latitude, longitude };
}

function calculateDistanceKm(fromLocation, toLocation) {
  const earthRadiusKm = 6371;
  const toRadians = (degrees) => (degrees * Math.PI) / 180;

  const latitudeDifference = toRadians(toLocation.latitude - fromLocation.latitude);
  const longitudeDifference = toRadians(toLocation.longitude - fromLocation.longitude);

  const a =
    Math.sin(latitudeDifference / 2) ** 2 +
    Math.cos(toRadians(fromLocation.latitude)) *
      Math.cos(toRadians(toLocation.latitude)) *
      Math.sin(longitudeDifference / 2) ** 2;

  return earthRadiusKm * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function getLocationErrorMessage(error) {
  if (error?.code === 1) {
    return 'Location permission was denied. Restaurants are shown in their default order.';
  }

  if (error?.code === 2) {
    return 'Your location is currently unavailable. Restaurants are shown in their default order.';
  }

  if (error?.code === 3) {
    return 'Finding your location took too long. Please try again.';
  }

  return 'Unable to use your location. Restaurants are shown in their default order.';
}

function HomePage() {
  const { user, updateUser } = useAuth();
  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [userLocation, setUserLocation] = useState(() => getCoordinates(user));
  const [locationStatus, setLocationStatus] = useState('idle');
  const [locationMessage, setLocationMessage] = useState('');

  const userFirstName = getUserFirstName();

  useEffect(() => {
    setUserLocation(getCoordinates(user));
  }, [user]);

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

  function handleUseMyLocation() {
    if (!user) {
      setLocationStatus('error');
      setLocationMessage('Log in before using your location to sort nearby restaurants.');
      return;
    }

    if (!('geolocation' in navigator)) {
      setUserLocation(null);
      setLocationStatus('error');
      setLocationMessage(
        'Location is not supported by this browser. Restaurants are shown in their default order.'
      );
      return;
    }

    setLocationStatus('requesting');
    setLocationMessage('');

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const requestedLocation = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude
        };

        try {
          const updatedUser = await updateCurrentUserLocation(requestedLocation);
          const savedLocation = getCoordinates(updatedUser) || requestedLocation;

          updateUser(updatedUser);
          setUserLocation(savedLocation);
          setLocationStatus('success');
          setLocationMessage(
            'Location saved. Nearby restaurants are now sorted by distance.'
          );
        } catch (err) {
          setUserLocation(getCoordinates(user));
          setLocationStatus('error');
          setLocationMessage(
            err.message || 'Unable to save your location. Please try again.'
          );
        }
      },
      (locationError) => {
        setUserLocation(getCoordinates(user));
        setLocationStatus('error');
        setLocationMessage(getLocationErrorMessage(locationError));
      },
      {
        enableHighAccuracy: false,
        timeout: 10000,
        maximumAge: 60000
      }
    );
  }

  const categories = useMemo(() => {
    const uniqueCategories = new Set(
      restaurants
        .map(getRestaurantCategory)
        .filter(Boolean)
    );

    return ['All', ...uniqueCategories];
  }, [restaurants]);

  const nearbyRestaurants = useMemo(() => {
    const filteredRestaurants =
      selectedCategory === 'All'
        ? restaurants
        : restaurants.filter(
            (restaurant) => getRestaurantCategory(restaurant) === selectedCategory
          );

    if (!userLocation) {
      return filteredRestaurants;
    }

    return filteredRestaurants
      .map((restaurant) => {
        const restaurantLocation = getCoordinates(restaurant);

        if (!restaurantLocation) {
          return {
            ...restaurant,
            distanceKm: null
          };
        }

        return {
          ...restaurant,
          distanceKm: calculateDistanceKm(userLocation, restaurantLocation)
        };
      })
      .sort((firstRestaurant, secondRestaurant) => {
        if (firstRestaurant.distanceKm === null && secondRestaurant.distanceKm === null) {
          return 0;
        }

        if (firstRestaurant.distanceKm === null) {
          return 1;
        }

        if (secondRestaurant.distanceKm === null) {
          return -1;
        }

        return firstRestaurant.distanceKm - secondRestaurant.distanceKm;
      });
  }, [restaurants, selectedCategory, userLocation]);

  const featuredRestaurants = useMemo(() => {
    return getFeaturedRestaurants(restaurants);
  }, [restaurants]);

  const sponsoredRestaurants = useMemo(() => {
    return restaurants
      .filter((restaurant) => restaurant?.isSponsored === true)
      .sort((leftRestaurant, rightRestaurant) => {
        const leftRank = Number(leftRestaurant.sponsoredRank);
        const rightRank = Number(rightRestaurant.sponsoredRank);

        const normalizedLeftRank =
          Number.isInteger(leftRank) && leftRank > 0
            ? leftRank
            : Number.MAX_SAFE_INTEGER;

        const normalizedRightRank =
          Number.isInteger(rightRank) && rightRank > 0
            ? rightRank
            : Number.MAX_SAFE_INTEGER;

        if (normalizedLeftRank !== normalizedRightRank) {
          return normalizedLeftRank - normalizedRightRank;
        }

        return String(leftRestaurant.name || '').localeCompare(
          String(rightRestaurant.name || '')
        );
      });
  }, [restaurants]);


  const locationButtonText =
    locationStatus === 'requesting'
      ? 'Finding your location...'
      : userLocation
        ? 'Update my location'
        : 'Use my location';

  const nearbyEyebrow = userLocation
    ? selectedCategory === 'All'
      ? 'Sorted by distance from your saved location'
      : `${selectedCategory} restaurants sorted by distance`
    : selectedCategory === 'All'
      ? 'Use your location to sort restaurants by distance'
      : `${selectedCategory} restaurants`;

  return (
    <section className="page-container home-page">
      <section className="home-hero" aria-labelledby="home-title">
      <p className="home-eyebrow">Food delivery made easy</p>

      <h1 id="home-title">Hi {userFirstName}, what are you craving today?</h1>

      <p className="home-hero-description">
        Explore restaurants nearby, discover dishes and choose your next meal.
      </p>

      <div className="home-hero-actions">
        <Link to="/search" className="home-search-cta">
          Search restaurants or dishes
          <span aria-hidden="true">→</span>
        </Link>

        <button
          type="button"
          className="home-location-cta"
          onClick={handleUseMyLocation}
          disabled={locationStatus === 'requesting'}
        >
          {locationButtonText}
        </button>
      </div>

      {locationMessage && (
        <p
          className={`location-feedback ${
            locationStatus === 'error' ? 'location-feedback-error' : ''
          }`}
          role={locationStatus === 'error' ? 'alert' : 'status'}
        >
          {locationMessage}
        </p>
      )}
      </section>


      {loading && <LoadingState message="Loading restaurants..." />}

      {!loading && error && <ErrorMessage message={error} />}

      {!loading && !error && restaurants.length === 0 && (
        <EmptyState
          title="No restaurants available"
          message="There are currently no restaurants to display. Please try again later."
        />
      )}

      {!loading && !error && restaurants.length > 0 && (() => {
        const restaurantSections = (
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

            <RestaurantCarousel
              sectionId="featured-restaurants"
              eyebrow="Selected from restaurants available today"
              title="Featured restaurants"
              restaurants={featuredRestaurants}
              emptyMessage="No featured restaurants are available right now."
            />

            <RestaurantCarousel
              sectionId="nearby-restaurants"
              eyebrow={nearbyEyebrow}
              title="Nearby restaurants"
              restaurants={nearbyRestaurants}
              emptyMessage={`No ${selectedCategory.toLowerCase()} restaurants are available right now.`}
            />
          </div>
        );

        return (
          <div className="home-content-with-rails">
            <SponsoredPromotionRail
              placement="left"
              initialIndex={0}
              restaurants={sponsoredRestaurants}
            />

            {restaurantSections}

            <SponsoredPromotionRail
              placement="right"
              initialIndex={1}
              restaurants={sponsoredRestaurants}
            />
          </div>
        );
      })()}
    </section>
  );
}

export default HomePage;
