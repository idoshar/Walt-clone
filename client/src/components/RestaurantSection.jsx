import RestaurantCard from './RestaurantCard.jsx';

function RestaurantSection({ eyebrow, title, restaurants, emptyMessage }) {
  return (
    <section className="restaurant-section">
      <div className="restaurant-section-heading">
        <div>
          {eyebrow && <p className="section-eyebrow">{eyebrow}</p>}
          <h2>{title}</h2>
        </div>

        <span className="restaurant-count">
          {restaurants.length === 1
            ? '1 restaurant'
            : `${restaurants.length} restaurants`}
        </span>
      </div>

      {restaurants.length > 0 ? (
        <div className="cards-grid">
          {restaurants.map((restaurant) => (
            <RestaurantCard key={restaurant.id} restaurant={restaurant} />
          ))}
        </div>
      ) : (
        <p className="section-empty-message">{emptyMessage}</p>
      )}
    </section>
  );
}

export default RestaurantSection;
