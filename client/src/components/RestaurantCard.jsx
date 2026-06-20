import { Link } from 'react-router-dom';

function getRestaurantImage(name = '') {
  const restaurantName = name.toLowerCase();

  if (restaurantName.includes('pizza')) {
    return 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=600&q=80';
  }
  if (restaurantName.includes('burger')) {
    return 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=600&q=80';
  }
  if (restaurantName.includes('sushi')) {
    return 'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=600&q=80';
  }

  return 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=600&q=80';
}

function RestaurantCard({ restaurant }) {
  const hasDistance = Number.isFinite(restaurant.distanceKm);
  const displayImage = getRestaurantImage(restaurant.name);

  return (
    <Link to={`/restaurants/${restaurant.id}`} className="restaurant-card">
      <img src={displayImage} alt={restaurant.name} className="restaurant-image" />

      <div className="card-body">
        <h3>{restaurant.name}</h3>
        <p>{restaurant.category || restaurant.cuisine || 'Restaurant'}</p>
        <p>{restaurant.address}</p>
        {hasDistance && (
          <p className="restaurant-distance">
            {restaurant.distanceKm.toFixed(1)} km away
          </p>
        )}
      </div>
    </Link>
  );
}

export default RestaurantCard;