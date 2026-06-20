import { useEffect, useState } from 'react';
import {
  createRestaurant,
  deleteRestaurant,
  getRestaurants,
  updateRestaurant
} from '../api/restaurantApi.js';
import {
  createProduct,
  deleteProduct,
  getProducts,
  updateProduct
} from '../api/productApi.js';
import RestaurantForm from '../components/RestaurantForm.jsx';
import ProductForm from '../components/ProductForm.jsx';

function RestaurantManagementPage() {
  const [restaurants, setRestaurants] = useState([]);
  const [selectedRestaurant, setSelectedRestaurant] = useState(null);
  const [products, setProducts] = useState([]);
  const [editingRestaurant, setEditingRestaurant] = useState(null);
  const [editingProduct, setEditingProduct] = useState(null);
  const [message, setMessage] = useState('');

  async function loadRestaurants() {
    const data = await getRestaurants();

    const savedUser = localStorage.getItem('user');
    const currentUser = savedUser ? JSON.parse(savedUser) : null;
    const currentUserId = currentUser?.id;

    const myRestaurants = Array.isArray(data)
      ? data.filter((restaurant) =>
          !restaurant.isDefault &&
          String(restaurant.ownerId) === String(currentUserId)
        )
      : [];

    setRestaurants(myRestaurants);
  }

  async function loadProducts(restaurantId) {
    const data = await getProducts(restaurantId);
    setProducts(Array.isArray(data) ? data : []);
  }

  useEffect(() => {
    loadRestaurants();
  }, []);

  async function handleSelectRestaurant(restaurant) {
    setSelectedRestaurant(restaurant);
    setEditingRestaurant(restaurant);
    setEditingProduct(null);
    await loadProducts(restaurant.id);
  }

  async function handleSaveRestaurant(restaurant) {
    if (editingRestaurant?.id) {
      await updateRestaurant(editingRestaurant.id, restaurant);
      setMessage('Restaurant updated');
    } else {
      await createRestaurant(restaurant);
      setMessage('Restaurant created');
    }

    setEditingRestaurant(null);
    await loadRestaurants();
  }

  async function handleDeleteRestaurant(id) {
    if (!window.confirm('Delete this restaurant?')) {
      return;
    }

    await deleteRestaurant(id);
    setMessage('Restaurant deleted');
    setSelectedRestaurant(null);
    setEditingRestaurant(null);
    setProducts([]);
    await loadRestaurants();
  }

  async function handleSaveProduct(product) {
    if (!selectedRestaurant) {
      setMessage('Select a restaurant first');
      return;
    }

    if (editingProduct?.id) {
      await updateProduct(selectedRestaurant.id, editingProduct.id, product);
      setMessage('Product updated');
    } else {
      await createProduct(selectedRestaurant.id, product);
      setMessage('Product created');
    }

    setEditingProduct(null);
    await loadProducts(selectedRestaurant.id);
  }

  async function handleDeleteProduct(productId) {
    if (!selectedRestaurant) {
      return;
    }

    if (!window.confirm('Delete this product?')) {
      return;
    }

    await deleteProduct(selectedRestaurant.id, productId);
    setMessage('Product deleted');
    await loadProducts(selectedRestaurant.id);
  }

  return (
    <main className="page">
      <section className="page-header">
        <h1>Restaurant Management</h1>
        <p>Add restaurants, edit restaurant details and manage menu items.</p>
      </section>

      {message && <p>{message}</p>}

      <section>
        <h2>{editingRestaurant ? 'Edit Restaurant' : 'Create Restaurant'}</h2>

        <RestaurantForm
          initialRestaurant={editingRestaurant}
          onSubmit={handleSaveRestaurant}
        />

        <button type="button" onClick={() => setEditingRestaurant(null)}>
          New Restaurant
        </button>
      </section>

      <section>
        <h2>Restaurants</h2>

        {restaurants.map((restaurant) => (
          <article key={restaurant.id} className="restaurant-card">
            <h3>{restaurant.name}</h3>
            <p>{restaurant.address}</p>
            <p>{restaurant.cuisine}</p>

            <button type="button" onClick={() => handleSelectRestaurant(restaurant)}>
              Manage
            </button>

            <button type="button" onClick={() => handleDeleteRestaurant(restaurant.id)}>
              Delete
            </button>
          </article>
        ))}
      </section>

      {selectedRestaurant && (
        <section>
          <h2>Menu for {selectedRestaurant.name}</h2>

          <ProductForm
            initialProduct={editingProduct}
            onSubmit={handleSaveProduct}
          />

          <button type="button" onClick={() => setEditingProduct(null)}>
            New Product
          </button>

          {products.map((product) => (
            <article key={product.id} className="product-card">
              <h3>{product.name}</h3>
              <p>{product.description}</p>
              <strong>{product.price} ₪</strong>

              <button type="button" onClick={() => setEditingProduct(product)}>
                Edit
              </button>

              <button type="button" onClick={() => handleDeleteProduct(product.id)}>
                Delete
              </button>
            </article>
          ))}
        </section>
      )}
    </main>
  );
}

export default RestaurantManagementPage;