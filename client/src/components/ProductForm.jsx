import { useState } from 'react';

const MENU_TYPE_OPTIONS = [
  { value: 'main', label: 'Main dish' },
  { value: 'side', label: 'Side dish' },
  { value: 'dessert', label: 'Dessert' },
  { value: 'drink', label: 'Drink' },
  { value: 'other', label: 'Other' }
];

function ProductForm({
  initialProduct,
  categories = [],
  isCategoriesLoading = false,
  isCreatingCategory = false,
  onCreateCategory,
  onSubmit
}) {
  const [product, setProduct] = useState({
    name: initialProduct?.name || '',
    description: initialProduct?.description || '',
    price: initialProduct?.price || '',
    image: initialProduct?.image || '',
    categoryId: initialProduct?.categoryId || ''
  });

  const [errors, setErrors] = useState({});
  const [isCategoryCreatorOpen, setIsCategoryCreatorOpen] = useState(false);
  const [newCategory, setNewCategory] = useState({
    name: '',
    menuType: 'main'
  });
  const [categoryCreationError, setCategoryCreationError] = useState('');

  const availableCategories = Array.isArray(categories) ? categories : [];
  const hasCategories = availableCategories.length > 0;

  function toggleCategoryCreator() {
    setIsCategoryCreatorOpen((isOpen) => !isOpen);
    setCategoryCreationError('');
  }

  function handleProductChange(event) {
    const { name, value } = event.target;

    setProduct((current) => ({
      ...current,
      [name]: value
    }));

    if (errors[name]) {
      setErrors((current) => ({
        ...current,
        [name]: ''
      }));
    }
  }

  function handleNewCategoryChange(event) {
    const { name, value } = event.target;

    setNewCategory((current) => ({
      ...current,
      [name]: value
    }));

    if (categoryCreationError) {
      setCategoryCreationError('');
    }
  }

  async function handleCreateCategory() {
    const name = newCategory.name.trim().replace(/\s+/g, ' ');

    if (!name) {
      setCategoryCreationError('Category name is required');
      return;
    }

    if (typeof onCreateCategory !== 'function') {
      setCategoryCreationError('Category creation is not available');
      return;
    }

    try {
      const createdCategory = await onCreateCategory({
        name,
        menuType: newCategory.menuType
      });

      if (!createdCategory?.id) {
        throw new Error('The new category did not return an ID');
      }

      setProduct((current) => ({
        ...current,
        categoryId: createdCategory.id
      }));

      setErrors((current) => ({
        ...current,
        categoryId: ''
      }));

      setNewCategory({
        name: '',
        menuType: 'main'
      });

      setCategoryCreationError('');
      setIsCategoryCreatorOpen(false);
    } catch (error) {
      setCategoryCreationError(
        error.message || 'Could not create the menu category'
      );
    }
  }

  function handleSubmit(event) {
    event.preventDefault();

    const newErrors = {};

    if (!product.name.trim()) {
      newErrors.name = 'Product name is required';
    }

    if (!product.price || Number(product.price) <= 0) {
      newErrors.price = 'Price must be a valid positive number';
    }

    if (!product.categoryId) {
      newErrors.categoryId =
        'Select a category or create one before saving this product';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    onSubmit({
      name: product.name.trim(),
      description: product.description.trim(),
      price: Number(product.price),
      image: product.image.trim(),
      categoryId: product.categoryId
    });

    setErrors({});
  }

  return (
    <form className="product-form" onSubmit={handleSubmit}>
      <div className="product-form-field">
        <label htmlFor="product-name">Product name</label>
        <input
          id="product-name"
          name="name"
          placeholder="Product name"
          value={product.name}
          onChange={handleProductChange}
          className={errors.name ? 'product-form-control-error' : ''}
        />
        {errors.name && (
          <span className="product-form-error">{errors.name}</span>
        )}
      </div>

      <div className="product-form-field">
        <label htmlFor="product-description">Description</label>
        <input
          id="product-description"
          name="description"
          placeholder="Description"
          value={product.description}
          onChange={handleProductChange}
        />
      </div>

      <div className="product-form-field">
        <label htmlFor="product-price">Price</label>
        <input
          id="product-price"
          name="price"
          placeholder="Price"
          type="number"
          min="0.01"
          step="0.01"
          value={product.price}
          onChange={handleProductChange}
          className={errors.price ? 'product-form-control-error' : ''}
        />
        {errors.price && (
          <span className="product-form-error">{errors.price}</span>
        )}
      </div>

      <div className="product-form-field">
        <div className="product-form-category-heading">
          <label htmlFor="product-category">Menu category</label>

          {hasCategories && (
            <button
              type="button"
              className="product-form-inline-toggle"
              onClick={toggleCategoryCreator}
            >
              {isCategoryCreatorOpen
                ? 'Cancel category creation'
                : 'Create new category'}
            </button>
          )}
        </div>

        {isCategoriesLoading ? (
          <p className="product-form-category-loading">
            Loading categories...
          </p>
        ) : hasCategories ? (
          <select
            id="product-category"
            name="categoryId"
            value={product.categoryId}
            onChange={handleProductChange}
            className={errors.categoryId ? 'product-form-control-error' : ''}
          >
            <option value="">Select a category</option>

            {availableCategories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        ) : (
          <div className="product-form-category-empty-state">
            <p>
              Create a category before adding this menu item.
            </p>

            <button
              type="button"
              className="secondary-button management-secondary-action product-form-create-category-button"
              onClick={toggleCategoryCreator}
              disabled={isCreatingCategory}
            >
              {isCategoryCreatorOpen
                ? 'Cancel'
                : 'Create category'}
            </button>
          </div>
        )}

        {errors.categoryId && (
          <span className="product-form-error">{errors.categoryId}</span>
        )}

        {isCategoryCreatorOpen && (
          <div className="product-form-inline-category">
            <p>
              Categories are shared by this restaurant and can be reused for
              future menu items.
            </p>

            <div className="product-form-inline-category-grid">
              <div className="product-form-field">
                <label htmlFor="new-category-name">Category name</label>
                <input
                  id="new-category-name"
                  name="name"
                  placeholder="e.g. Mains, Sides, Specials"
                  value={newCategory.name}
                  onChange={handleNewCategoryChange}
                />
              </div>

              <div className="product-form-field">
                <label htmlFor="new-category-type">Category type</label>
                <select
                  id="new-category-type"
                  name="menuType"
                  value={newCategory.menuType}
                  onChange={handleNewCategoryChange}
                >
                  {MENU_TYPE_OPTIONS.map((menuType) => (
                    <option key={menuType.value} value={menuType.value}>
                      {menuType.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {categoryCreationError && (
              <span className="product-form-error">
                {categoryCreationError}
              </span>
            )}

            <button
              type="button"
              className="secondary-button management-secondary-action"
              onClick={handleCreateCategory}
              disabled={isCreatingCategory}
            >
              {isCreatingCategory ? 'Creating category...' : 'Add category'}
            </button>
          </div>
        )}
      </div>

      <div className="product-form-field">
        <label htmlFor="product-image">Image URL</label>
        <input
          id="product-image"
          name="image"
          placeholder="Image URL"
          value={product.image}
          onChange={handleProductChange}
        />
      </div>

      <button
        type="submit"
        className="primary-button management-primary-action product-form-submit"
        disabled={isCreatingCategory}
      >
        Save Product
      </button>
    </form>
  );
}

export default ProductForm;