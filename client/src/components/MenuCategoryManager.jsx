import { useState } from 'react';

const MENU_TYPE_LABELS = {
  main: 'Main dish',
  side: 'Side dish',
  dessert: 'Dessert',
  drink: 'Drink',
  other: 'Other'
};

function getMenuTypeLabel(menuType) {
  return MENU_TYPE_LABELS[menuType] || 'Other';
}

function MenuCategoryManager({
  categories = [],
  isSaving = false,
  isCreating = false,
  isUpdating = false,
  isDeleting = false,
  onMove,
  onCreate,
  onUpdate,
  onDelete
}) {
  const categoryList = Array.isArray(categories) ? categories : [];
  const isBusy =
    isSaving ||
    isCreating ||
    isUpdating ||
    isDeleting;

  const [isCreatorOpen, setIsCreatorOpen] = useState(false);
  const [categoryName, setCategoryName] = useState('');
  const [menuType, setMenuType] = useState('main');
  const [editingCategoryId, setEditingCategoryId] = useState('');
  const [editingName, setEditingName] = useState('');
  const [editingMenuType, setEditingMenuType] = useState('main');
  const [actionError, setActionError] = useState('');

  function closeCreator() {
    if (isBusy) {
      return;
    }

    setIsCreatorOpen(false);
    setCategoryName('');
    setMenuType('main');
    setActionError('');
  }

  function startEditing(category) {
    if (isBusy) {
      return;
    }

    setEditingCategoryId(category.id);
    setEditingName(category.name);
    setEditingMenuType(category.menuType);
    setIsCreatorOpen(false);
    setActionError('');
  }

  function cancelEditing() {
    if (isBusy) {
      return;
    }

    setEditingCategoryId('');
    setEditingName('');
    setEditingMenuType('main');
    setActionError('');
  }

  async function handleCreateCategory(event) {
    event.preventDefault();

    const normalizedName = categoryName.trim();

    if (!normalizedName) {
      setActionError('Category name is required.');
      return;
    }

    setActionError('');

    try {
      await onCreate({
        name: normalizedName,
        menuType
      });

      setCategoryName('');
      setMenuType('main');
      setIsCreatorOpen(false);
    } catch (error) {
      setActionError(
        error?.message || 'Could not create the category.'
      );
    }
  }

  async function handleUpdateCategory(event, category) {
    event.preventDefault();

    const normalizedName = editingName.trim();

    if (!normalizedName) {
      setActionError('Category name is required.');
      return;
    }

    setActionError('');

    try {
      await onUpdate(category.id, {
        name: normalizedName,
        menuType: editingMenuType
      });

      cancelEditing();
    } catch (error) {
      setActionError(
        error?.message || 'Could not update the category.'
      );
    }
  }

  async function handleDeleteCategory(category) {
    if (isBusy) {
      return;
    }

    const shouldDelete = window.confirm(
      'Delete category "' + category.name + '"?'
    );

    if (!shouldDelete) {
      return;
    }

    setActionError('');

    try {
      await onDelete(category.id);
    } catch (error) {
      setActionError(
        error?.message || 'Could not delete the category.'
      );
    }
  }

  return (
    <div className="management-category-manager">
      <div className="management-category-manager-topline">
        <div className="management-category-manager-intro">
          <p>
            Set the order customers see when browsing this restaurant menu.
          </p>
          <small>
            Changes are saved immediately and update the public menu filters.
          </small>
        </div>

        <button
          type="button"
          className="primary-button management-category-create-toggle"
          onClick={() => {
            if (isCreatorOpen) {
              closeCreator();
            } else {
              setIsCreatorOpen(true);
              setEditingCategoryId('');
              setActionError('');
            }
          }}
          disabled={isBusy}
        >
          {isCreatorOpen ? 'Close Creator' : 'Create Category'}
        </button>
      </div>

      {isCreatorOpen && (
        <form
          className="management-category-create-form"
          onSubmit={handleCreateCategory}
        >
          <div className="management-category-form-grid">
            <label>
              Category name
              <input
                type="text"
                value={categoryName}
                onChange={(event) => setCategoryName(event.target.value)}
                placeholder="e.g. Mains, Sides, Specials"
                maxLength="60"
                disabled={isBusy}
                autoFocus
              />
            </label>

            <label>
              Category type
              <select
                value={menuType}
                onChange={(event) => setMenuType(event.target.value)}
                disabled={isBusy}
              >
                <option value="main">Main dish</option>
                <option value="side">Side dish</option>
                <option value="dessert">Dessert</option>
                <option value="drink">Drink</option>
                <option value="other">Other</option>
              </select>
            </label>
          </div>

          <div className="management-category-form-actions">
            <button
              type="button"
              className="secondary-button management-secondary-action"
              onClick={closeCreator}
              disabled={isBusy}
            >
              Cancel
            </button>

            <button
              type="submit"
              className="primary-button management-primary-action"
              disabled={isBusy}
            >
              {isCreating ? 'Creating...' : 'Create Category'}
            </button>
          </div>
        </form>
      )}

      {actionError && (
        <p className="management-category-create-error" role="alert">
          {actionError}
        </p>
      )}

      {categoryList.length === 0 ? (
        <div className="management-category-empty">
          <strong>No categories yet.</strong>
          <p>
            Create your first category to organize this restaurant menu.
          </p>
        </div>
      ) : (
        <div className="management-category-list">
          {categoryList.map((category, index) => {
            const isFirst = index === 0;
            const isLast = index === categoryList.length - 1;
            const isEditing =
              String(editingCategoryId) === String(category.id);

            if (isEditing) {
              return (
                <article
                  key={category.id}
                  className="management-category-row management-category-row-editing"
                >
                  <span className="management-category-position">
                    {index + 1}
                  </span>

                  <form
                    className="management-category-inline-edit-form"
                    onSubmit={(event) =>
                      handleUpdateCategory(event, category)
                    }
                  >
                    <input
                      type="text"
                      value={editingName}
                      onChange={(event) =>
                        setEditingName(event.target.value)
                      }
                      maxLength="60"
                      disabled={isBusy}
                      aria-label={'Category name for ' + category.name}
                      autoFocus
                    />

                    <select
                      value={editingMenuType}
                      onChange={(event) =>
                        setEditingMenuType(event.target.value)
                      }
                      disabled={isBusy}
                      aria-label={'Category type for ' + category.name}
                    >
                      <option value="main">Main dish</option>
                      <option value="side">Side dish</option>
                      <option value="dessert">Dessert</option>
                      <option value="drink">Drink</option>
                      <option value="other">Other</option>
                    </select>

                    <div className="management-category-inline-edit-actions">
                      <button
                        type="button"
                        className="secondary-button management-category-small-button"
                        onClick={cancelEditing}
                        disabled={isBusy}
                      >
                        Cancel
                      </button>

                      <button
                        type="submit"
                        className="primary-button management-category-small-button"
                        disabled={isBusy}
                      >
                        {isUpdating ? 'Saving...' : 'Save'}
                      </button>
                    </div>
                  </form>
                </article>
              );
            }

            return (
              <article
                key={category.id}
                className="management-category-row"
              >
                <span
                  className="management-category-position"
                  aria-label={'Category position ' + (index + 1)}
                >
                  {index + 1}
                </span>

                <div className="management-category-details">
                  <strong>{category.name}</strong>
                  <span>{getMenuTypeLabel(category.menuType)}</span>
                </div>

                <div className="management-category-order-actions">
                  <button
                    type="button"
                    className="secondary-button management-category-order-button"
                    onClick={() => onMove(category.id, -1)}
                    disabled={isBusy || isFirst}
                    aria-label={'Move ' + category.name + ' up'}
                    title={'Move ' + category.name + ' up'}
                  >
                    &uarr;
                  </button>

                  <button
                    type="button"
                    className="secondary-button management-category-order-button"
                    onClick={() => onMove(category.id, 1)}
                    disabled={isBusy || isLast}
                    aria-label={'Move ' + category.name + ' down'}
                    title={'Move ' + category.name + ' down'}
                  >
                    &darr;
                  </button>

                  <button
                    type="button"
                    className="secondary-button management-category-text-button"
                    onClick={() => startEditing(category)}
                    disabled={isBusy}
                  >
                    Edit
                  </button>

                  <button
                    type="button"
                    className="management-category-delete-button"
                    onClick={() => handleDeleteCategory(category)}
                    disabled={isBusy}
                  >
                    {isDeleting ? 'Deleting...' : 'Delete'}
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {isSaving && (
        <p className="management-category-saving" role="status">
          Saving category order...
        </p>
      )}
    </div>
  );
}

export default MenuCategoryManager;
