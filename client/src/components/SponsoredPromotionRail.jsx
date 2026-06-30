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
  initialIndex = 0,
  showEmptyState = true
}) {
  const sponsoredRestaurants = useMemo(
    () => getUniqueRestaurants(restaurants),
    [restaurants]
  );

  const [activeIndex, setActiveIndex] = useState(0);
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

    if (restaurantCount < 2 || prefersReducedMotion) {
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
  }, [prefersReducedMotion, sponsoredRestaurants.length]);

  if (sponsoredRestaurants.length === 0) {
    if (!showEmptyState) {
      return null;
    }

    return (
      <aside
        className={`sponsored-side-rail sponsored-side-rail-${placement}`}
        aria-label="Sponsored placement information"
      >
        <article className="sponsored-side-rail-card sponsored-side-rail-empty-card">
          <div className="sponsored-side-rail-empty-visual" aria-hidden="true">
            W
          </div>

          <div className="sponsored-side-rail-content">
            <p className="sponsored-side-rail-label">Sponsored placement</p>
            <h2>Your restaurant here</h2>
            <p className="sponsored-side-rail-description">
              Want to promote your restaurant? Contact the site administration
              to learn about sponsored placements.
            </p>
          </div>
        </article>
      </aside>
    );
  }

  const activeRestaurant = sponsoredRestaurants[activeIndex];
  const restaurantCount = sponsoredRestaurants.length;
  const cuisine = getRestaurantCuisine(activeRestaurant);
  const description =
    activeRestaurant.description ||
    activeRestaurant.address ||
    'Explore this restaurant and its menu.';

  return (
    <aside
      className={`sponsored-side-rail sponsored-side-rail-${placement}`}
      aria-label={`${placement} sponsored restaurant offers`}
      aria-roledescription="carousel"
    >
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
          <p className="sponsored-side-rail-label">Sponsored</p>

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
    </aside>
  );
}

export default SponsoredPromotionRail;
