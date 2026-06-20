import { deleteProduct } from '../api/productApi.js';

function DeleteProductButton({ restaurantId, productId, onDeleted }) {
  async function handleDelete() {
    const approved = window.confirm('Delete this product?');

    if (!approved) {
      return;
    }

    await deleteProduct(restaurantId, productId);

    if (onDeleted) {
      onDeleted(productId);
    }
  }

  return (
    <button type="button" onClick={handleDelete}>
      Delete
    </button>
  );
}

export default DeleteProductButton;