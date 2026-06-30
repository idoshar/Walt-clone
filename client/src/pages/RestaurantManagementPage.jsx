import { useEffect, useState } from 'react';
import {
  createRestaurant,
  deleteRestaurant,
  getMyRestaurants,
  getRestaurantStatistics,
  updateRestaurant
} from '../api/restaurantApi.js';
import {
  createProduct,
  deleteProduct,
  getProducts,
  updateProduct
} from '../api/productApi.js';
import {
  createMenuCategory,
  deleteMenuCategory,
  getMenuCategories,
  updateMenuCategory,
  updateMenuCategoryOrder
} from '../api/menuCategoryApi.js';
import Modal from '../components/Modal.jsx';
import RestaurantForm from '../components/RestaurantForm.jsx';
import ProductForm from '../components/ProductForm.jsx';
import MenuCategoryManager from '../components/MenuCategoryManager.jsx';
import { getRestaurantImage } from '../utils/restaurantImages.js';
import RestaurantSalesStatistics from '../components/RestaurantSalesStatistics.jsx';
import RestaurantAccessManager from '../components/RestaurantAccessManager.jsx';
import { useCurrency } from '../context/CurrencyContext.jsx';

function getProductCount(restaurant) {
  const count = Number(restaurant?.productCount);
  return Number.isFinite(count) && count >= 0 ? count : 0;
}

function getRestaurantStatus(restaurant) {
  const productCount = getProductCount(restaurant);

  if (productCount === 0) {
    return {
      label: 'Draft',
      message: 'Not visible to customers yet',
      className: 'management-status-draft'
    };
  }

  return {
    label: 'Published',
    message: 'Visible to customers',
    className: 'management-status-published'
  };
}

function RestaurantManagementPage() {
  const { formatPrice } = useCurrency();
  const [restaurants, setRestaurants] = useState([]);
  const [selectedRestaurant, setSelectedRestaurant] = useState(null);
  const [products, setProducts] = useState([]);
  const [editingProduct, setEditingProduct] = useState(null);
  const [message, setMessage] = useState('');
  const [isCreateRestaurantOpen, setIsCreateRestaurantOpen] = useState(false);
  const [isRestaurantActionsOpen, setIsRestaurantActionsOpen] = useState(false);
  const [isRestaurantDetailsOpen, setIsRestaurantDetailsOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isProductFormOpen, setIsProductFormOpen] = useState(false);
  const [isPostCreatePromptOpen, setIsPostCreatePromptOpen] = useState(false);
  const [restaurantSearchQuery, setRestaurantSearchQuery] = useState('');
  const [menuCategories, setMenuCategories] = useState([]);
  const [isMenuCategoriesLoading, setIsMenuCategoriesLoading] = useState(false);
  const [isMenuCategoryCreating, setIsMenuCategoryCreating] = useState(false);
  const [isMenuCategoryManagerOpen, setIsMenuCategoryManagerOpen] = useState(false);
  const [isMenuCategoryOrderSaving, setIsMenuCategoryOrderSaving] = useState(false);
  const [isMenuCategoryUpdating, setIsMenuCategoryUpdating] = useState(false);
  const [isMenuCategoryDeleting, setIsMenuCategoryDeleting] = useState(false);
  const [isStatisticsOpen, setIsStatisticsOpen] = useState(false);
  const [statistics, setStatistics] = useState(null);
  const [isStatisticsLoading, setIsStatisticsLoading] = useState(false);
  const [statisticsError, setStatisticsError] = useState('');
  const [isAccessManagerOpen, setIsAccessManagerOpen] = useState(false);

  async function loadRestaurants() {
    const data = await getMyRestaurants();
    const myRestaurants = Array.isArray(data) ? data : [];

    setRestaurants(myRestaurants);
    setSelectedRestaurant((currentRestaurant) => {
      if (!currentRestaurant) {
        return null;
      }

      return (
        myRestaurants.find(
          (restaurant) => String(restaurant.id) === String(currentRestaurant.id)
        ) || currentRestaurant
      );
    });

    return myRestaurants;
  }

  async function loadProducts(restaurantId) {
    const data = await getProducts(restaurantId);
    const restaurantProducts = Array.isArray(data) ? data : [];
    setProducts(restaurantProducts);
    return restaurantProducts;
  }

  async function loadMenuCategories(restaurantId) {
    setIsMenuCategoriesLoading(true);

    try {
      const data = await getMenuCategories(restaurantId);
      const restaurantCategories = Array.isArray(data) ? data : [];
      setMenuCategories(restaurantCategories);
      return restaurantCategories;
    } finally {
      setIsMenuCategoriesLoading(false);
    }
  }

  useEffect(() => {
    loadRestaurants().catch((error) => setMessage(error.message));
  }, []);

  async function handleCreateRestaurant(restaurant) {
    try {
      const createdRestaurant = await createRestaurant(restaurant);
      const myRestaurants = await loadRestaurants();
      const savedRestaurant =
        myRestaurants.find(
          (currentRestaurant) =>
            String(currentRestaurant.id) === String(createdRestaurant?.id)
        ) || createdRestaurant;

      setSelectedRestaurant(savedRestaurant);
      setRestaurantSearchQuery('');
      setProducts([]);
      setMenuCategories([]);
      setIsCreateRestaurantOpen(false);
      setIsPostCreatePromptOpen(true);
      setMessage('Restaurant created successfully.');
    } catch (error) {
      setMessage(error.message);
    }
  }

  async function handleSelectRestaurant(restaurant) {
    try {
      await loadProducts(restaurant.id);
      setSelectedRestaurant(restaurant);
      setEditingProduct(null);
      setIsRestaurantActionsOpen(true);
    } catch (error) {
      setMessage(error.message);
    }
  }

  async function handleSaveRestaurantDetails(restaurant) {
    if (!selectedRestaurant) {
      return;
    }

    try {
      await updateRestaurant(selectedRestaurant.id, restaurant);
      await loadRestaurants();
      setIsRestaurantDetailsOpen(false);
      setMessage('Restaurant details updated successfully.');
    } catch (error) {
      setMessage(error.message);
    }
  }

  async function handleSaveProduct(product) {
    if (!selectedRestaurant) {
      return;
    }

    try {
      if (editingProduct?.id) {
        await updateProduct(selectedRestaurant.id, editingProduct.id, product);
        setMessage('Menu item updated successfully.');
      } else {
        await createProduct(selectedRestaurant.id, product);
        setMessage('Menu item added successfully. The restaurant is now visible to customers.');
      }

      setEditingProduct(null);
      setIsProductFormOpen(false);
      await Promise.all([
        loadProducts(selectedRestaurant.id),
        loadRestaurants()
      ]);
      setIsMenuOpen(true);
    } catch (error) {
      setMessage(error.message);
    }
  }

  async function handleCreateMenuCategory(categoryInput) {
    if (!selectedRestaurant) {
      throw new Error('Select a restaurant before creating a category');
    }

    setIsMenuCategoryCreating(true);

    try {
      const createdCategory = await createMenuCategory(
        selectedRestaurant.id,
        categoryInput
      );

      const refreshedCategories = await getMenuCategories(
        selectedRestaurant.id
      );

      setMenuCategories(
        Array.isArray(refreshedCategories)
          ? refreshedCategories
          : []
      );

      setMessage(
        'Category "' + createdCategory.name + '" created successfully.'
      );

      return createdCategory;
    } catch (error) {
      setMessage(error.message);
      throw error;
    } finally {
      setIsMenuCategoryCreating(false);
    }
  }

  async function handleUpdateMenuCategory(categoryId, categoryInput) {
    if (!selectedRestaurant) {
      throw new Error('Select a restaurant before updating a category');
    }

    setIsMenuCategoryUpdating(true);

    try {
      const updatedCategory = await updateMenuCategory(
        selectedRestaurant.id,
        categoryId,
        categoryInput
      );

      await Promise.all([
        loadMenuCategories(selectedRestaurant.id),
        loadProducts(selectedRestaurant.id)
      ]);

      setMessage(
        'Category "' +
          updatedCategory.name +
          '" updated successfully.'
      );

      return updatedCategory;
    } catch (error) {
      setMessage(error.message);
      throw error;
    } finally {
      setIsMenuCategoryUpdating(false);
    }
  }

  async function handleDeleteMenuCategory(categoryId) {
    if (!selectedRestaurant) {
      throw new Error('Select a restaurant before deleting a category');
    }

    setIsMenuCategoryDeleting(true);

    try {
      await deleteMenuCategory(
        selectedRestaurant.id,
        categoryId
      );

      await Promise.all([
        loadMenuCategories(selectedRestaurant.id),
        loadProducts(selectedRestaurant.id)
      ]);

      setMessage('Category deleted successfully.');
    } catch (error) {
      setMessage(error.message);
      throw error;
    } finally {
      setIsMenuCategoryDeleting(false);
    }
  }

  async function handleMoveMenuCategory(categoryId, direction) {
    if (
      !selectedRestaurant ||
      isMenuCategoryOrderSaving ||
      !Number.isInteger(direction)
    ) {
      return;
    }

    const currentIndex = menuCategories.findIndex(
      (category) => String(category.id) === String(categoryId)
    );

    const targetIndex = currentIndex + direction;

    if (
      currentIndex < 0 ||
      targetIndex < 0 ||
      targetIndex >= menuCategories.length
    ) {
      return;
    }

    const reorderedCategories = [...menuCategories];

    [
      reorderedCategories[currentIndex],
      reorderedCategories[targetIndex]
    ] = [
      reorderedCategories[targetIndex],
      reorderedCategories[currentIndex]
    ];

    setMenuCategories(reorderedCategories);
    setIsMenuCategoryOrderSaving(true);

    try {
      const updatedCategories = await updateMenuCategoryOrder(
        selectedRestaurant.id,
        reorderedCategories.map((category) => category.id)
      );

      setMenuCategories(
        Array.isArray(updatedCategories)
          ? updatedCategories
          : reorderedCategories
      );

      setMessage('Category order updated successfully.');
    } catch (error) {
      setMessage(error.message);

      try {
        await loadMenuCategories(selectedRestaurant.id);
      } catch {
        // Keep the optimistic order visible if reload also fails.
      }
    } finally {
      setIsMenuCategoryOrderSaving(false);
    }
  }

  async function openRestaurantStatistics() {
    if (!selectedRestaurant) {
      return;
    }

    setIsRestaurantActionsOpen(false);
    setIsStatisticsOpen(true);
    setStatistics(null);
    setStatisticsError('');
    setIsStatisticsLoading(true);

    try {
      const data = await getRestaurantStatistics(
        selectedRestaurant.id
      );

      setStatistics(data);
    } catch (error) {
      setStatisticsError(
        error.message || 'Could not load restaurant statistics.'
      );
    } finally {
      setIsStatisticsLoading(false);
    }
  }

  async function handleDeleteRestaurant() {
    if (!selectedRestaurant) {
      return;
    }

    const shouldDelete = window.confirm(
      `Delete ${selectedRestaurant.name}? This will also remove its menu items.`
    );

    if (!shouldDelete) {
      return;
    }

    try {
      await deleteRestaurant(selectedRestaurant.id);
      setSelectedRestaurant(null);
      setProducts([]);
      setMenuCategories([]);
      setIsRestaurantActionsOpen(false);
      setIsRestaurantDetailsOpen(false);
      setIsMenuOpen(false);
      setIsMenuCategoryManagerOpen(false);
      setIsAccessManagerOpen(false);
      await loadRestaurants();
      setMessage('Restaurant deleted successfully.');
    } catch (error) {
      setMessage(error.message);
    }
  }

  async function handleDeleteProduct(productId) {
    if (!selectedRestaurant) {
      return;
    }

    const shouldDelete = window.confirm('Delete this menu item?');

    if (!shouldDelete) {
      return;
    }

    try {
      await deleteProduct(selectedRestaurant.id, productId);
      await Promise.all([
        loadProducts(selectedRestaurant.id),
        loadRestaurants()
      ]);
      setMessage('Menu item deleted successfully.');
    } catch (error) {
      setMessage(error.message);
    }
  }

  function openRestaurantDetails() {
    setIsRestaurantActionsOpen(false);
    setIsRestaurantDetailsOpen(true);
  }

  async function openMenuManagement() {
    if (!selectedRestaurant) {
      return;
    }

    try {
      await loadProducts(selectedRestaurant.id);
      setIsRestaurantActionsOpen(false);
      setEditingProduct(null);
      setIsMenuOpen(true);
    } catch (error) {
      setMessage(error.message);
    }
  }

  async function openCategoryManagement() {
    if (!selectedRestaurant) {
      return;
    }

    try {
      await loadMenuCategories(selectedRestaurant.id);
      setIsRestaurantActionsOpen(false);
      setIsMenuCategoryManagerOpen(true);
    } catch (error) {
      setMessage(error.message);
    }
  }

  function openAccessManagement() {
    if (
      !selectedRestaurant ||
      selectedRestaurant.accessRole !== 'owner'
    ) {
      return;
    }

    setIsRestaurantActionsOpen(false);
    setIsAccessManagerOpen(true);
  }

  async function handleOwnershipTransferred() {
    await loadRestaurants();

    setSelectedRestaurant(null);
    setProducts([]);
    setMenuCategories([]);
    setIsAccessManagerOpen(false);
    setIsRestaurantActionsOpen(false);

    setMessage(
      'Restaurant ownership transferred successfully. You no longer have management access.'
    );
  }

  async function openAddMenuItem() {
    if (!selectedRestaurant) {
      return;
    }

    try {
      await loadMenuCategories(selectedRestaurant.id);
      setEditingProduct(null);
      setIsMenuOpen(false);
      setIsProductFormOpen(true);
    } catch (error) {
      setMessage(error.message);
    }
  }

  async function openEditMenuItem(product) {
    if (!selectedRestaurant) {
      return;
    }

    try {
      await loadMenuCategories(selectedRestaurant.id);
      setEditingProduct(product);
      setIsMenuOpen(false);
      setIsProductFormOpen(true);
    } catch (error) {
      setMessage(error.message);
    }
  }

  function returnToRestaurantActions() {
    setEditingProduct(null);
    setIsProductFormOpen(false);
    setIsRestaurantDetailsOpen(false);
    setIsMenuOpen(false);
    setIsMenuCategoryManagerOpen(false);
    setIsStatisticsOpen(false);
    setIsAccessManagerOpen(false);
    setIsPostCreatePromptOpen(false);
    setIsRestaurantActionsOpen(true);
  }

  function returnToMenuManagement() {
    setEditingProduct(null);
    setIsProductFormOpen(false);
    setIsMenuOpen(true);
  }

  function closeProductForm() {
    setEditingProduct(null);
    setIsProductFormOpen(false);
  }

  async function handleCreateMenuItemsNow() {
    if (!selectedRestaurant) {
      return;
    }

    try {
      await loadMenuCategories(selectedRestaurant.id);
      setIsPostCreatePromptOpen(false);
      setEditingProduct(null);
      setIsProductFormOpen(true);
    } catch (error) {
      setMessage(error.message);
    }
  }

  const normalizedRestaurantSearchQuery = restaurantSearchQuery.trim().toLowerCase();
  const filteredRestaurants = restaurants.filter((restaurant) => {
    if (!normalizedRestaurantSearchQuery) {
      return true;
    }

    const searchableRestaurantDetails = [
      restaurant.name,
      restaurant.cuisine,
      restaurant.address
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase();

    return searchableRestaurantDetails.includes(normalizedRestaurantSearchQuery);
  });

  return (
    <main className="page management-page">
      <section className="page-header management-page-header">
        <p className="management-eyebrow">Restaurant owner tools</p>
        <h1>Restaurant Management</h1>
        <p>
          Create restaurants, update their details, and keep every menu item
          accurate.
        </p>
      </section>

      <section className="management-control-card">
        <div>
          <h2>Manage your restaurants</h2>
          <p>
            Create a restaurant, add its menu, and keep its details up to date.
          </p>
        </div>

        <div className="management-control-actions">
          <button
            type="button"
            className="primary-button management-primary-action"
            onClick={() => setIsCreateRestaurantOpen(true)}
          >
            Create Restaurant
          </button>
        </div>
      </section>

      {message && (
        <p className="management-feedback" role="status">
          {message}
        </p>
      )}

      <section
        className="management-restaurants-section"
        aria-labelledby="my-restaurants-title"
      >
        <div className="management-section-heading">
          <div>
            <p className="management-eyebrow">Your workspace</p>
            <h2 id="my-restaurants-title">My Restaurants</h2>
          </div>
          <span className="management-restaurant-count">
            {restaurants.length}{' '}
            {restaurants.length === 1 ? 'restaurant' : 'restaurants'}
          </span>
        </div>

        {restaurants.length === 0 ? (
          <div className="management-empty-state">
            <strong>You do not have any restaurants yet.</strong>
            <p>Create your first restaurant to start building a menu.</p>
            <button
              type="button"
              className="primary-button management-primary-action"
              onClick={() => setIsCreateRestaurantOpen(true)}
            >
              Create Restaurant
            </button>
          </div>
        ) : (
          <>
            <div className="management-restaurant-search">
              <input
                type="search"
                value={restaurantSearchQuery}
                onChange={(event) => setRestaurantSearchQuery(event.target.value)}
                placeholder="Search your restaurants"
                aria-label="Search your restaurants by name, cuisine, or address"
              />
            </div>

            {filteredRestaurants.length === 0 ? (
              <div className="management-empty-state">
                <strong>No restaurants match your search.</strong>
                <p>Try a different restaurant name, cuisine, or address.</p>
              </div>
            ) : (
              <div className="management-restaurant-grid">
                {filteredRestaurants.map((restaurant) => {
                  const status = getRestaurantStatus(restaurant);
                  const productCount = getProductCount(restaurant);

                  return (
                    <article key={restaurant.id} className="management-restaurant-card">
                      <img
                        className="management-restaurant-image"
                        src={getRestaurantImage(restaurant)}
                        alt={restaurant.name}
                      />

                      <div className="management-restaurant-card-body">
                        <div className="management-restaurant-card-topline">
                          <span className={`management-status ${status.className}`}>
                            {status.label}
                          </span>
                          <span className="management-menu-item-count">
                            {productCount}{' '}
                            {productCount === 1 ? 'menu item' : 'menu items'}
                          </span>
                          <span
                            className={`management-role-badge ${
                              restaurant.accessRole === 'editor'
                                ? 'management-role-editor'
                                : 'management-role-owner'
                            }`}
                          >
                            {restaurant.accessRole === 'editor'
                              ? 'Editor access'
                              : 'Owner'}
                          </span>
                        </div>

                        <h3>{restaurant.name}</h3>
                        <p>{restaurant.cuisine || 'Cuisine not specified'}</p>
                        <p>{restaurant.address || 'No address provided'}</p>
                        <small>{status.message}</small>

                        <button
                          type="button"
                          className="primary-button management-primary-action"
                          onClick={() => handleSelectRestaurant(restaurant)}
                        >
                          Manage Restaurant
                        </button>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </>
        )}
      </section>


      {isCreateRestaurantOpen && (
        <Modal
          title="Create Restaurant"
          onClose={() => setIsCreateRestaurantOpen(false)}
        >
          <p className="management-modal-intro">
            Add the core details customers need to discover your restaurant.
            You can add menu items immediately after saving it.
          </p>
          <RestaurantForm
            key="create-restaurant"
            initialRestaurant={null}
            onSubmit={handleCreateRestaurant}
          />
        </Modal>
      )}

      {isPostCreatePromptOpen && selectedRestaurant && (
        <Modal
          title="Restaurant created"
          onClose={() => setIsPostCreatePromptOpen(false)}
        >
          <div className="management-post-create-prompt">
            <p>
              <strong>{selectedRestaurant.name}</strong> is currently a draft and
              is not visible to customers until it has at least one menu item.
            </p>
            <p>Would you like to add menu items now?</p>
            <div className="management-prompt-actions">
              <button
                type="button"
                className="secondary-button management-secondary-action"
                onClick={() => setIsPostCreatePromptOpen(false)}
              >
                Not Now
              </button>
              <button
                type="button"
                className="primary-button management-primary-action"
                onClick={handleCreateMenuItemsNow}
              >
                Add Menu Items
              </button>
            </div>
          </div>
        </Modal>
      )}

      {isRestaurantActionsOpen && selectedRestaurant && (
        <Modal
          title={`Manage ${selectedRestaurant.name}`}
          onClose={() => setIsRestaurantActionsOpen(false)}
        >
          <div className="management-action-summary">
            <p>{selectedRestaurant.address || 'No address provided'}</p>
            <p>{selectedRestaurant.cuisine || 'Cuisine not specified'}</p>
          </div>

          <div className="management-action-list">
            <button
              type="button"
              className="management-action-button"
              onClick={openRestaurantDetails}
            >
              <span>Edit Restaurant Details</span>
              <small>Update the name, address, phone number, cuisine, image, and description.</small>
            </button>
            <button
              type="button"
              className="management-action-button"
              onClick={openMenuManagement}
            >
              <span>Manage Menu</span>
              <small>Add, edit, or delete the dishes available at this restaurant.</small>
            </button>

            <button
              type="button"
              className="management-action-button"
              onClick={openCategoryManagement}
            >
              <span>Manage Categories</span>
              <small>Set the order customers see when browsing your menu.</small>
            </button>

            <button
              type="button"
              className="management-action-button"
              onClick={openRestaurantStatistics}
            >
              <span>View Sales Statistics</span>
              <small>Review orders, revenue, and best-selling menu items.</small>
            </button>

            {selectedRestaurant.accessRole === 'owner' && (
              <button
                type="button"
                className="management-action-button"
                onClick={openAccessManagement}
              >
                <span>Manage Team Access</span>
                <small>
                  Add or remove editors, and transfer restaurant ownership.
                </small>
              </button>
            )}
          </div>

          {selectedRestaurant.accessRole === 'owner' && (
            <button
              type="button"
              className="management-danger-button"
              onClick={handleDeleteRestaurant}
            >
              Delete Restaurant
            </button>
          )}
        </Modal>
      )}

      {isAccessManagerOpen &&
        selectedRestaurant &&
        selectedRestaurant.accessRole === 'owner' && (
          <Modal
            title={`${selectedRestaurant.name} Team Access`}
            onClose={() => setIsAccessManagerOpen(false)}
            onBack={returnToRestaurantActions}
            size="large"
          >
            <RestaurantAccessManager
              restaurant={selectedRestaurant}
              onOwnershipTransferred={handleOwnershipTransferred}
            />
          </Modal>
        )}

      {isRestaurantDetailsOpen && selectedRestaurant && (
        <Modal
          title="Edit Restaurant Details"
          onClose={() => setIsRestaurantDetailsOpen(false)}
          onBack={returnToRestaurantActions}
        >
          <RestaurantForm
            key={`restaurant-${selectedRestaurant.id}`}
            initialRestaurant={selectedRestaurant}
            onSubmit={handleSaveRestaurantDetails}
          />
        </Modal>
      )}

      {isMenuCategoryManagerOpen && selectedRestaurant && (
        <Modal
          title={selectedRestaurant.name + ' Categories'}
          onClose={() => setIsMenuCategoryManagerOpen(false)}
          onBack={returnToRestaurantActions}
        >
          <MenuCategoryManager
            categories={menuCategories}
            isSaving={isMenuCategoryOrderSaving}
            isCreating={isMenuCategoryCreating}
            isUpdating={isMenuCategoryUpdating}
            isDeleting={isMenuCategoryDeleting}
            onMove={handleMoveMenuCategory}
            onCreate={handleCreateMenuCategory}
            onUpdate={handleUpdateMenuCategory}
            onDelete={handleDeleteMenuCategory}
          />
        </Modal>
      )}

      {isMenuOpen && selectedRestaurant && (
        <Modal
          title={`${selectedRestaurant.name} Menu`}
          onClose={() => setIsMenuOpen(false)}
          onBack={returnToRestaurantActions}
          size="large"
        >
          <div className="management-menu-header">
            <p>Keep your menu current so customers always see the right dishes.</p>
            <button
              type="button"
              className="primary-button management-primary-action"
              onClick={openAddMenuItem}
            >
              Add Menu Item
            </button>
          </div>

          {products.length === 0 ? (
            <div className="management-empty-state">
              <strong>This menu is empty.</strong>
              <p>
                Add the first dish for {selectedRestaurant.name} to publish this
                restaurant for customers.
              </p>
              <button
                type="button"
                className="primary-button management-primary-action"
                onClick={openAddMenuItem}
              >
                Add Menu Item
              </button>
            </div>
          ) : (
            <div className="management-menu-list">
              {products.map((product) => (
                <article key={product.id} className="management-menu-item">
                  <div>
                    <h3>{product.name}</h3>
                    {product.category && (
                      <span className="management-menu-category">
                        {product.category}
                      </span>
                    )}
                    {product.description && <p>{product.description}</p>}
                    <strong>{formatPrice(product.price)}</strong>
                  </div>
                  <div className="management-menu-item-actions">
                    <button
                      type="button"
                      className="secondary-button management-secondary-action"
                      onClick={() => openEditMenuItem(product)}
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      className="management-danger-button"
                      onClick={() => handleDeleteProduct(product.id)}
                    >
                      Delete
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </Modal>
      )}

      {isStatisticsOpen && selectedRestaurant && (
        <Modal
          title={`${selectedRestaurant.name} Sales Statistics`}
          onClose={() => setIsStatisticsOpen(false)}
          onBack={returnToRestaurantActions}
          backLabel="Back to restaurant actions"
          size="large"
          modalClassName="app-modal-sales-statistics"
        >
          <RestaurantSalesStatistics
            restaurantName={selectedRestaurant.name}
            statistics={statistics}
            isLoading={isStatisticsLoading}
            error={statisticsError}
          />
        </Modal>
      )}
      {isProductFormOpen && selectedRestaurant && (
        <Modal
          title={editingProduct ? 'Edit Menu Item' : 'Add Menu Item'}
          onClose={closeProductForm}
          onBack={returnToMenuManagement}
        >
          <ProductForm
            key={editingProduct ? `product-${editingProduct.id}` : 'new-product'}
            initialProduct={editingProduct}
            categories={menuCategories}
            isCategoriesLoading={isMenuCategoriesLoading}
            isCreatingCategory={isMenuCategoryCreating}
            onCreateCategory={handleCreateMenuCategory}
            onSubmit={handleSaveProduct}
          />
        </Modal>
      )}
    </main>
  );
}

export default RestaurantManagementPage;
