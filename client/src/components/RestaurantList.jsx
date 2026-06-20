import RestaurantCard from './RestaurantCard.jsx';

function RestaurantList({ restaurants }) {
  const restaurantCountLabel =
    restaurants.length === 1 ? '1 restaurant available' : `${restaurants.length} restaurants available`;

  return (
    <section className="restaurant-section" aria-labelledby="restaurant-section-title">
      <div className="restaurant-section-heading">
        <div>
          <p className="section-eyebrow">Restaurants near you</p>
          <h2 id="restaurant-section-title">Popular choices</h2>
        </div>

        <span className="restaurant-count">{restaurantCountLabel}</span>
      </div>

      <div className="cards-grid">
        {restaurants.map((restaurant) => (
          <RestaurantCard key={restaurant.id} restaurant={restaurant} />
        ))}
      </div>
    </section>
  );
}

export default RestaurantList;
