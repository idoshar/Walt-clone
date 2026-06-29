import { Link } from 'react-router-dom';
import { useEffect, useMemo, useState } from 'react';

import { getRestaurantImage } from '../utils/restaurantImages.js';

const ROTATION_INTERVAL_MS = 7000;

function getCampaignIndex(currentIndex, offset, count) {
  return (currentIndex + offset + count) % count;
}

function getReducedMotionPreference() {
  return window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
}

function getUniqueRestaurants(restaurants) {
  const seenRestaurantIds = new Set();

  return (Array.isArray(restaurants) ? restaurants : []).filter((restaurant) => {
    const restaurantId = String(restaurant?.id ?? '').trim();

    if (!restaurantId || seenRestaurantIds.has(restaurantId)) {
      return false;
    }

    seenRestaurantIds.add(restaurantId);
    return true;
  });
}

function getRestaurantCuisine(restaurant) {
  return restaurant.category || restaurant.cuisine || 'Restaurant';
}

function SponsoredPromotionRail({
  restaurants = [],
  placement = 'right',
  initialIndex = 0
}) {
  const sponsoredRestaurants = useMemo(
    () => getUniqueRestaurants(restaurants).slice(0, 3),
    [restaurants]
  );

  const [activeIndex, setActiveIndex] = useState(0);
  const [isManuallyPaused, setIsManuallyPaused] = useState(false);
  const [isPointerInside, setIsPointerInside] = useState(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(
    getReducedMotionPreference
  );

  useEffect(() => {
    const mediaQuery = window.matchMedia?.('(prefers-reduced-motion: reduce)');

    if (!mediaQuery) {
      return undefined;
    }

    function handlePreferenceChange(event) {
      setPrefersReducedMotion(event.matches);
    }

    mediaQuery.addEventListener('change', handlePreferenceChange);

    return () => {
      mediaQuery.removeEventListener('change', handlePreferenceChange);
    };
  }, []);

  useEffect(() => {
    const restaurantCount = sponsoredRestaurants.length;

    setActiveIndex(
      restaurantCount > 0
        ? initialIndex % restaurantCount
        : 0
    );
  }, [initialIndex, sponsoredRestaurants.length]);

  useEffect(() => {
    const restaurantCount = sponsoredRestaurants.length;

    if (
      restaurantCount < 2 ||
      prefersReducedMotion ||
      isManuallyPaused ||
      isPointerInside
    ) {
      return undefined;
    }

    const intervalId = window.setInterval(() => {
      setActiveIndex((currentIndex) =>
        getCampaignIndex(currentIndex, 1, restaurantCount)
      );
    }, ROTATION_INTERVAL_MS);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [
    isManuallyPaused,
    isPointerInside,
    prefersReducedMotion,
    sponsoredRestaurants.length
  ]);

  if (sponsoredRestaurants.length === 0) {
    return null;
  }

  const activeRestaurant = sponsoredRestaurants[activeIndex];
  const restaurantCount = sponsoredRestaurants.length;
  const isPaused = prefersReducedMotion || isManuallyPaused;
  const cuisine = getRestaurantCuisine(activeRestaurant);
  const description =
    activeRestaurant.description ||
    activeRestaurant.address ||
    'Explore this restaurant and its menu.';

  function showPreviousRestaurant() {
    setIsManuallyPaused(true);
    setActiveIndex((currentIndex) =>
      getCampaignIndex(currentIndex, -1, restaurantCount)
    );
  }

  function showNextRestaurant() {
    setIsManuallyPaused(true);
    setActiveIndex((currentIndex) =>
      getCampaignIndex(currentIndex, 1, restaurantCount)
    );
  }

  function selectRestaurant(index) {
    setIsManuallyPaused(true);
    setActiveIndex(index);
  }

  return (
    <aside
      className={`sponsored-side-rail sponsored-side-rail-${placement}`}
      aria-label={`${placement} sponsored restaurant offers`}
      aria-roledescription="carousel"
      onFocusCapture={() => setIsManuallyPaused(true)}
      onMouseEnter={() => setIsPointerInside(true)}
      onMouseLeave={() => setIsPointerInside(false)}
    >
      <div className="sponsored-side-rail-header">
        <span>Sponsored</span>
        <span className="sponsored-side-rail-demo-badge">Demo</span>
      </div>

      <article
        className="sponsored-side-rail-card"
        aria-label={`Promotion ${activeIndex + 1} of ${restaurantCount}`}
        aria-roledescription="slide"
      >
        <img
          className="sponsored-side-rail-image"
          src={getRestaurantImage(activeRestaurant)}
          alt={activeRestaurant.name}
        />

        <div className="sponsored-side-rail-content">
          <p className="sponsored-side-rail-label">Sponsored · Demo</p>

          <h2>{activeRestaurant.name}</h2>

          <p className="sponsored-side-rail-meta">
            {cuisine}
            {activeRestaurant.address ? ` · ${activeRestaurant.address}` : ''}
          </p>

          <p className="sponsored-side-rail-description">
            {description}
          </p>

          <Link
            to={`/restaurants/${activeRestaurant.id}`}
            className="sponsored-side-rail-cta"
          >
            View restaurant
            <span aria-hidden="true">→</span>
          </Link>
        </div>
      </article>

      <div className="sponsored-side-rail-controls">
        <button
          type="button"
          className="sponsored-side-rail-arrow"
          onClick={showPreviousRestaurant}
          aria-label="Show previous sponsored restaurant"
          disabled={restaurantCount < 2}
        >
          <span aria-hidden="true">←</span>
        </button>

        <div
          className="sponsored-side-rail-indicators"
          role="group"
          aria-label="Choose a sponsored restaurant"
        >
          {sponsoredRestaurants.map((restaurant, index) => (
            <button
              type="button"
              key={restaurant.id}
              className={`sponsored-side-rail-indicator ${
                index === activeIndex
                  ? 'sponsored-side-rail-indicator-active'
                  : ''
              }`}
              onClick={() => selectRestaurant(index)}
              aria-label={`Show promotion ${index + 1}: ${restaurant.name}`}
              aria-pressed={index === activeIndex}
            />
          ))}
        </div>

        <button
          type="button"
          className="sponsored-side-rail-arrow"
          onClick={showNextRestaurant}
          aria-label="Show next sponsored restaurant"
          disabled={restaurantCount < 2}
        >
          <span aria-hidden="true">→</span>
        </button>

        <button
          type="button"
          className="sponsored-side-rail-pause"
          onClick={() => setIsManuallyPaused((currentValue) => !currentValue)}
          disabled={prefersReducedMotion || restaurantCount < 2}
        >
          {prefersReducedMotion
            ? 'Reduced motion'
            : isPaused
              ? 'Resume'
              : 'Pause'}
        </button>
      </div>
    </aside>
  );
}

export default SponsoredPromotionRail;
