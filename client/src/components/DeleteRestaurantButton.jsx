import { deleteRestaurant } from '../api/restaurantApi.js';

function DeleteRestaurantButton({ restaurantId, onDeleted }) {
  async function handleDelete() {
    const approved = window.confirm('Delete this restaurant?');

    if (!approved) {
      return;
    }

    await deleteRestaurant(restaurantId);

    if (onDeleted) {
      onDeleted(restaurantId);
    }
  }

  return (
    <button type="button" onClick={handleDelete}>
      Delete
    </button>
  );
}

export default DeleteRestaurantButton;