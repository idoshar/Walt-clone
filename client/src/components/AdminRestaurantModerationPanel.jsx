import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  deleteAdminRestaurant,
  getAdminRestaurants,
  updateAdminRestaurant
} from '../api/adminRestaurantModerationApi.js';
import Modal from './Modal.jsx';

function buildDraft(restaurant) {
  return {
    name: restaurant?.name ?? '',
    address: restaurant?.address ?? '',
    phone: restaurant?.phone ?? '',
    cuisine: restaurant?.cuisine ?? '',
    description: restaurant?.description ?? '',
    image: restaurant?.image ?? '',
    latitude:
      restaurant?.latitude === null || restaurant?.latitude === undefined
        ? ''
        : String(restaurant.latitude),
    longitude:
      restaurant?.longitude === null || restaurant?.longitude === undefined
        ? ''
        : String(restaurant.longitude)
  };
}

function getOwnershipLabel(ownershipStatus) {
  if (ownershipStatus === 'user-owned') {
    return 'User-owned restaurant';
  }

  if (ownershipStatus === 'unassigned') {
    return 'No assigned owner';
  }

  return 'System catalog';
}

function getRestaurantMeta(restaurant) {
  const productCount = Number(restaurant?.productCount || 0);

  return `${productCount} ${productCount === 1 ? 'menu item' : 'menu items'} · ${getOwnershipLabel(
    restaurant?.ownershipStatus
  )}`;
}

function AdminRestaurantModerationPanel() {
  const [restaurants, setRestaurants] = useState([]);
  const [selectedRestaurantId, setSelectedRestaurantId] = useState('');
  const [draft, setDraft] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const manageableRestaurants = useMemo(
    () =>
      restaurants.filter(
        (restaurant) => restaurant?.isModerationProtected !== true
      ),
    [restaurants]
  );

  const protectedRestaurants = useMemo(
    () =>
      restaurants.filter(
        (restaurant) => restaurant?.isModerationProtected === true
      ),
    [restaurants]
  );

  const selectedRestaurant = useMemo(
    () =>
      manageableRestaurants.find(
        (restaurant) =>
          String(restaurant.id) === String(selectedRestaurantId)
      ) || null,
    [manageableRestaurants, selectedRestaurantId]
  );

  const loadRestaurants = useCallback(async (preferredRestaurantId = '') => {
    setIsLoading(true);
    setError('');

    try {
      const data = await getAdminRestaurants();
      const nextRestaurants = Array.isArray(data) ? data : [];

      setRestaurants(nextRestaurants);

      const nextSelectedRestaurant = preferredRestaurantId
        ? nextRestaurants.find(
            (restaurant) =>
              restaurant?.isModerationProtected !== true &&
              String(restaurant.id) === String(preferredRestaurantId)
          ) || null
        : null;

      setSelectedRestaurantId(nextSelectedRestaurant?.id || '');
      setDraft(
        nextSelectedRestaurant ? buildDraft(nextSelectedRestaurant) : null
      );
    } catch (loadError) {
      setError(
        loadError.message ||
          'Could not load restaurants for administrator moderation.'
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadRestaurants();
  }, [loadRestaurants]);

  function selectRestaurant(restaurant) {
    setSelectedRestaurantId(restaurant.id);
    setDraft(buildDraft(restaurant));
    setError('');
    setNotice('');
  }

  function closeEditor() {
    setSelectedRestaurantId('');
    setDraft(null);
    setError('');
  }

  function updateDraftField(event) {
    const { name, value } = event.target;

    setDraft((currentDraft) => ({
      ...currentDraft,
      [name]: value
    }));
  }

  async function handleSave(event) {
    event.preventDefault();

    if (!selectedRestaurant || !draft) {
      return;
    }

    const latitudeText = String(draft.latitude || '').trim();
    const longitudeText = String(draft.longitude || '').trim();

    if ((latitudeText && !longitudeText) || (!latitudeText && longitudeText)) {
      setError('Latitude and longitude must be provided together.');
      return;
    }

    const updates = {
      name: String(draft.name || '').trim(),
      address: String(draft.address || '').trim(),
      phone: String(draft.phone || '').trim(),
      cuisine: String(draft.cuisine || '').trim(),
      description: String(draft.description || '').trim(),
      image: String(draft.image || '').trim()
    };

    if (!updates.name) {
      setError('Restaurant name is required.');
      return;
    }

    if (!latitudeText && !longitudeText) {
      updates.latitude = null;
      updates.longitude = null;
    } else {
      const latitude = Number(latitudeText);
      const longitude = Number(longitudeText);

      if (
        !Number.isFinite(latitude) ||
        latitude < -90 ||
        latitude > 90
      ) {
        setError('Latitude must be a number between -90 and 90.');
        return;
      }

      if (
        !Number.isFinite(longitude) ||
        longitude < -180 ||
        longitude > 180
      ) {
        setError('Longitude must be a number between -180 and 180.');
        return;
      }

      updates.latitude = latitude;
      updates.longitude = longitude;
    }

    setIsSaving(true);
    setError('');
    setNotice('');

    try {
      const updatedRestaurant = await updateAdminRestaurant(
        selectedRestaurant.id,
        updates
      );

      await loadRestaurants();
      setNotice(`Saved changes for ${updatedRestaurant.name}.`);
    } catch (saveError) {
      setError(
        saveError.message || 'Could not save the restaurant changes.'
      );
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDelete() {
    if (!selectedRestaurant) {
      return;
    }

    const shouldDelete = window.confirm(
      `Delete "${selectedRestaurant.name}" permanently?\n\n` +
        'Its menu categories and products will also be deleted. Existing order snapshots will be retained.'
    );

    if (!shouldDelete) {
      return;
    }

    setIsSaving(true);
    setError('');
    setNotice('');

    try {
      const deletedName = selectedRestaurant.name;

      await deleteAdminRestaurant(selectedRestaurant.id);
      await loadRestaurants();

      setNotice(`Deleted ${deletedName}.`);
    } catch (deleteError) {
      setError(
        deleteError.message || 'Could not delete the restaurant.'
      );
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <section style={styles.panel} aria-labelledby="restaurant-moderation-heading">
      <div style={styles.heading}>
        <div>
          <p style={styles.eyebrow}>ADMINISTRATION</p>
          <h2 id="restaurant-moderation-heading" style={styles.title}>
            Restaurant moderation
          </h2>
          <p style={styles.description}>
            Review all platform restaurants. System catalog entries remain
            visible but are protected from edits and deletion.
          </p>
        </div>

        <button
          type="button"
          style={styles.secondaryButton}
          onClick={() => loadRestaurants()}
          disabled={isLoading || isSaving}
        >
          Refresh list
        </button>
      </div>

      {error ? (
        <p style={styles.errorMessage} role="alert">
          {error}
        </p>
      ) : null}

      {notice ? (
        <p style={styles.noticeMessage} role="status">
          {notice}
        </p>
      ) : null}

      {isLoading ? (
        <p style={styles.stateMessage}>Loading moderation data...</p>
      ) : (
        <>
          <div style={styles.summaryGrid}>
            <article style={styles.summaryCard}>
              <strong style={styles.summaryNumber}>
                {manageableRestaurants.length}
              </strong>
              <span style={styles.summaryLabel}>Manageable restaurants</span>
            </article>

            <article style={styles.summaryCard}>
              <strong style={styles.summaryNumber}>
                {protectedRestaurants.length}
              </strong>
              <span style={styles.summaryLabel}>Protected catalog entries</span>
            </article>
          </div>

          <div style={styles.contentGrid}>
            <div>
              <h3 style={styles.groupTitle}>Manageable restaurants</h3>

              {manageableRestaurants.length === 0 ? (
                <div style={styles.emptyCard}>
                  <strong>No user-managed restaurants yet.</strong>
                  <p>
                    Restaurants created outside the system catalog will appear
                    here for review.
                  </p>
                </div>
              ) : (
                <div style={styles.restaurantList}>
                  {manageableRestaurants.map((restaurant) => {
                    const isSelected =
                      String(restaurant.id) === String(selectedRestaurantId);

                    return (
                      <article
                        key={restaurant.id}
                        style={{
                          ...styles.restaurantCard,
                          ...(isSelected ? styles.selectedRestaurantCard : {})
                        }}
                      >
                        <div>
                          <h4 style={styles.restaurantName}>
                            {restaurant.name}
                          </h4>
                          <p style={styles.restaurantDetails}>
                            {restaurant.cuisine || 'Cuisine not specified'} ·{' '}
                            {restaurant.address || 'Address not specified'}
                          </p>
                          <small style={styles.restaurantMeta}>
                            {getRestaurantMeta(restaurant)}
                          </small>
                        </div>

                        <button
                          type="button"
                          style={styles.primaryButton}
                          onClick={() => selectRestaurant(restaurant)}
                        >
                          {isSelected ? 'Editing' : 'Edit'}
                        </button>
                      </article>
                    );
                  })}
                </div>
              )}

              <details style={styles.protectedDetails}>
                <summary style={styles.protectedSummary}>
                  View protected system catalog ({protectedRestaurants.length})
                </summary>

                <p style={styles.protectedExplanation}>
                  These starter restaurants are restored from the catalog when
                  the server starts, so they cannot be changed or removed here.
                </p>

                <div style={styles.restaurantList}>
                  {protectedRestaurants.map((restaurant) => (
                    <article key={restaurant.id} style={styles.protectedCard}>
                      <div>
                        <h4 style={styles.restaurantName}>{restaurant.name}</h4>
                        <p style={styles.restaurantDetails}>
                          {restaurant.cuisine || 'Cuisine not specified'} ·{' '}
                          {restaurant.address || 'Address not specified'}
                        </p>
                        <small style={styles.restaurantMeta}>
                          {getRestaurantMeta(restaurant)}
                        </small>
                      </div>

                      <span style={styles.protectedBadge}>Protected</span>
                    </article>
                  ))}
                </div>
              </details>
            </div>

          </div>

          {selectedRestaurant && draft ? (
            <Modal
              title={`Edit ${selectedRestaurant.name}`}
              onClose={closeEditor}
              size="large"
            >
              <div style={styles.modalEditor} aria-live="polite">
                <p style={styles.editorDescription}>
                  Changes are applied as an administrator. Ownership,
                  sponsorship and catalog-protection fields cannot be changed
                  here.
                </p>

                {error ? (
                  <p style={styles.errorMessage} role="alert">
                    {error}
                  </p>
                ) : null}

                <form onSubmit={handleSave}>
                  <div style={styles.formGrid}>
                    <label style={styles.label}>
                      Name
                      <input
                        required
                        name="name"
                        value={draft.name}
                        onChange={updateDraftField}
                        style={styles.input}
                      />
                    </label>

                    <label style={styles.label}>
                      Cuisine
                      <input
                        name="cuisine"
                        value={draft.cuisine}
                        onChange={updateDraftField}
                        style={styles.input}
                      />
                    </label>

                    <label style={styles.label}>
                      Address
                      <input
                        name="address"
                        value={draft.address}
                        onChange={updateDraftField}
                        style={styles.input}
                      />
                    </label>

                    <label style={styles.label}>
                      Phone
                      <input
                        name="phone"
                        value={draft.phone}
                        onChange={updateDraftField}
                        style={styles.input}
                      />
                    </label>

                    <label style={styles.label}>
                      Image URL
                      <input
                        name="image"
                        type="url"
                        value={draft.image}
                        onChange={updateDraftField}
                        style={styles.input}
                      />
                    </label>

                    <label style={styles.label}>
                      Latitude
                      <input
                        name="latitude"
                        inputMode="decimal"
                        value={draft.latitude}
                        onChange={updateDraftField}
                        style={styles.input}
                      />
                    </label>

                    <label style={styles.label}>
                      Longitude
                      <input
                        name="longitude"
                        inputMode="decimal"
                        value={draft.longitude}
                        onChange={updateDraftField}
                        style={styles.input}
                      />
                    </label>
                  </div>

                  <label style={{ ...styles.label, marginTop: '16px' }}>
                    Description
                    <textarea
                      name="description"
                      rows="4"
                      value={draft.description}
                      onChange={updateDraftField}
                      style={styles.textarea}
                    />
                  </label>

                  <div style={styles.formActions}>
                    <button
                      type="button"
                      style={styles.secondaryButton}
                      onClick={closeEditor}
                      disabled={isSaving}
                    >
                      Cancel
                    </button>

                    <button
                      type="submit"
                      style={styles.primaryButton}
                      disabled={isSaving}
                    >
                      {isSaving ? 'Saving...' : 'Save changes'}
                    </button>

                    <button
                      type="button"
                      style={styles.dangerButton}
                      onClick={handleDelete}
                      disabled={isSaving}
                    >
                      Delete restaurant
                    </button>
                  </div>
                </form>
              </div>
            </Modal>
          ) : null}
        </>
      )}
    </section>
  );
}

const styles = {
  panel: {
    borderTop: '1px solid var(--color-border)',
    marginTop: '48px',
    paddingTop: '42px'
  },
  heading: {
    alignItems: 'flex-start',
    display: 'flex',
    flexWrap: 'wrap',
    gap: '18px',
    justifyContent: 'space-between',
    marginBottom: '24px'
  },
  eyebrow: {
    color: 'var(--color-primary)',
    fontSize: '0.78rem',
    fontWeight: 800,
    letterSpacing: '0.12em',
    margin: 0
  },
  title: {
    fontSize: '1.65rem',
    margin: '6px 0 8px'
  },
  description: {
    color: 'var(--color-text-muted)',
    lineHeight: 1.6,
    margin: 0,
    maxWidth: '720px'
  },
  secondaryButton: {
    background: 'var(--color-surface)',
    border: '1px solid var(--color-border)',
    borderRadius: '10px',
    color: 'var(--color-text)',
    cursor: 'pointer',
    fontWeight: 750,
    padding: '10px 13px'
  },
  primaryButton: {
    background: 'var(--color-primary)',
    border: '1px solid var(--color-primary)',
    borderRadius: '10px',
    color: '#fff',
    cursor: 'pointer',
    fontWeight: 800,
    padding: '10px 13px'
  },
  dangerButton: {
    background: 'transparent',
    border: '1px solid var(--color-danger, #c53b3b)',
    borderRadius: '10px',
    color: 'var(--color-danger, #c53b3b)',
    cursor: 'pointer',
    fontWeight: 800,
    padding: '10px 13px'
  },
  errorMessage: {
    background: 'var(--color-danger-bg, #fff0f0)',
    border: '1px solid var(--color-danger, #c53b3b)',
    borderRadius: '12px',
    color: 'var(--color-danger, #c53b3b)',
    margin: '0 0 18px',
    padding: '12px 14px'
  },
  noticeMessage: {
    background: 'var(--color-info-bg)',
    border: '1px solid var(--color-border)',
    borderRadius: '12px',
    color: 'var(--color-text)',
    margin: '0 0 18px',
    padding: '12px 14px'
  },
  stateMessage: {
    color: 'var(--color-text-muted)',
    lineHeight: 1.55,
    margin: 0
  },
  summaryGrid: {
    display: 'grid',
    gap: '14px',
    gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
    marginBottom: '22px'
  },
  summaryCard: {
    background: 'var(--color-surface)',
    border: '1px solid var(--color-border)',
    borderRadius: '16px',
    display: 'flex',
    flexDirection: 'column',
    gap: '5px',
    padding: '18px'
  },
  summaryNumber: {
    color: 'var(--color-primary)',
    fontSize: '1.8rem'
  },
  summaryLabel: {
    color: 'var(--color-text-muted)',
    fontSize: '0.9rem',
    fontWeight: 700
  },
  contentGrid: {
    alignItems: 'start',
    display: 'grid',
    gap: '22px',
    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))'
  },
  groupTitle: {
    fontSize: '1.05rem',
    margin: '0 0 12px'
  },
  restaurantList: {
    display: 'grid',
    gap: '10px'
  },
  restaurantCard: {
    alignItems: 'center',
    background: 'var(--color-surface)',
    border: '1px solid var(--color-border)',
    borderRadius: '14px',
    display: 'flex',
    gap: '14px',
    justifyContent: 'space-between',
    padding: '15px'
  },
  selectedRestaurantCard: {
    borderColor: 'var(--color-primary)',
    boxShadow: '0 0 0 2px var(--color-info-bg)'
  },
  protectedCard: {
    alignItems: 'center',
    background: 'var(--color-surface)',
    border: '1px solid var(--color-border)',
    borderRadius: '14px',
    display: 'flex',
    gap: '14px',
    justifyContent: 'space-between',
    opacity: 0.86,
    padding: '15px'
  },
  restaurantName: {
    fontSize: '1rem',
    margin: 0
  },
  restaurantDetails: {
    color: 'var(--color-text-muted)',
    lineHeight: 1.45,
    margin: '5px 0'
  },
  restaurantMeta: {
    color: 'var(--color-text-muted)'
  },
  protectedBadge: {
    background: 'var(--color-info-bg)',
    borderRadius: '999px',
    color: 'var(--color-primary)',
    fontSize: '0.76rem',
    fontWeight: 800,
    padding: '7px 9px',
    whiteSpace: 'nowrap'
  },
  protectedDetails: {
    borderTop: '1px solid var(--color-border)',
    marginTop: '28px',
    paddingTop: '18px'
  },
  protectedSummary: {
    color: 'var(--color-text-muted)',
    cursor: 'pointer',
    fontSize: '0.94rem',
    fontWeight: 800
  },
  protectedExplanation: {
    color: 'var(--color-text-muted)',
    lineHeight: 1.5,
    margin: '12px 0'
  },
  emptyCard: {
    background: 'var(--color-surface)',
    border: '1px dashed var(--color-border)',
    borderRadius: '14px',
    color: 'var(--color-text-muted)',
    padding: '18px'
  },
  modalEditor: {
    minWidth: 0
  },
  editorDescription: {
    color: 'var(--color-text-muted)',
    lineHeight: 1.5,
    margin: '0 0 16px'
  },
  formGrid: {
    display: 'grid',
    gap: '12px',
    gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))'
  },
  label: {
    color: 'var(--color-text)',
    display: 'grid',
    fontSize: '0.84rem',
    fontWeight: 750,
    gap: '6px'
  },
  input: {
    background: 'var(--color-background)',
    border: '1px solid var(--color-border)',
    borderRadius: '9px',
    boxSizing: 'border-box',
    color: 'var(--color-text)',
    font: 'inherit',
    minWidth: 0,
    padding: '10px',
    width: '100%'
  },
  textarea: {
    background: 'var(--color-background)',
    border: '1px solid var(--color-border)',
    borderRadius: '9px',
    boxSizing: 'border-box',
    color: 'var(--color-text)',
    font: 'inherit',
    minWidth: 0,
    padding: '10px',
    resize: 'vertical',
    width: '100%'
  },
  formActions: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '10px',
    marginTop: '18px'
  }
};

export default AdminRestaurantModerationPanel;
