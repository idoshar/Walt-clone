import { useState } from 'react';

function RestaurantForm({ initialRestaurant, onSubmit }) {
  const [restaurant, setRestaurant] = useState({
    name: initialRestaurant?.name || '',
    address: initialRestaurant?.address || '',
    phone: initialRestaurant?.phone || '',
    cuisine: initialRestaurant?.cuisine || '',
    description: initialRestaurant?.description || ''
  });

  function handleChange(event) {
    const { name, value } = event.target;

    setRestaurant((current) => ({
      ...current,
      [name]: value
    }));
  }

  function handleSubmit(event) {
    event.preventDefault();
    onSubmit(restaurant);
  }

  return (
    <form onSubmit={handleSubmit}>
      <input
        name="name"
        placeholder="Restaurant name"
        value={restaurant.name}
        onChange={handleChange}
      />

      <input
        name="address"
        placeholder="Address"
        value={restaurant.address}
        onChange={handleChange}
      />

      <input
        name="phone"
        placeholder="Phone"
        value={restaurant.phone}
        onChange={handleChange}
      />

      <input
        name="cuisine"
        placeholder="Cuisine"
        value={restaurant.cuisine}
        onChange={handleChange}
      />

      <textarea
        name="description"
        placeholder="Description"
        value={restaurant.description}
        onChange={handleChange}
      />

      <button type="submit">
        Save Restaurant
      </button>
    </form>
  );
}

export default RestaurantForm;