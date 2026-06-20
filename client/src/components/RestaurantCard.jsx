import { Link } from 'react-router-dom';
import { getRestaurantImage } from '../utils/restaurantImages.js';

function RestaurantCard({ restaurant }) {
  const hasDistance = Number.isFinite(restaurant.distanceKm);
  const displayImage = getRestaurantImage(restaurant);

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
