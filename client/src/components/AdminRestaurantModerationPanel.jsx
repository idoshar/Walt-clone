import { useCallback, useEffect, useMemo, useState } from 'react';
import { getAdminRestaurants } from '../api/adminRestaurantModerationApi.js';
import RestaurantManagementPage from '../pages/RestaurantManagementPage.jsx';

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

function RestaurantCard({ restaurant, isProtected, onManage }) {
  return (
    <article
      style={isProtected ? styles.protectedCard : styles.restaurantCard}
    >
      <div style={styles.restaurantContent}>
        <h4 style={styles.restaurantName}>{restaurant.name}</h4>
        <p style={styles.restaurantDetails}>
          {restaurant.cuisine || 'Cuisine not specified'} ·{' '}
          {restaurant.address || 'Address not specified'}
        </p>
        <small style={styles.restaurantMeta}>{getRestaurantMeta(restaurant)}</small>
      </div>

      <div style={isProtected ? styles.protectedActions : styles.restaurantCardActions}>
        <button
          type="button"
          style={styles.primaryButton}
          onClick={() => onManage(restaurant)}
        >
          Manage Restaurant
        </button>

        {isProtected ? (
          <span style={styles.protectedBadge}>Deletion protected</span>
        ) : null}
      </div>
    </article>
  );
}

function AdminRestaurantModerationPanel() {
  const [restaurants, setRestaurants] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [managedRestaurantId, setManagedRestaurantId] = useState('');

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

  const loadRestaurants = useCallback(async () => {
    setIsLoading(true);
    setError('');

    try {
      const data = await getAdminRestaurants();
      setRestaurants(Array.isArray(data) ? data : []);
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

  function openRestaurantManagement(restaurant) {
    setManagedRestaurantId(String(restaurant.id));
  }

  async function closeRestaurantManagement() {
    setManagedRestaurantId('');
    await loadRestaurants();
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
            Review every platform restaurant and open the full management tools
            for the selected restaurant. System catalog entries are protected
            from deletion.
          </p>
        </div>

        <button
          type="button"
          style={styles.secondaryButton}
          onClick={loadRestaurants}
          disabled={isLoading}
        >
          Refresh list
        </button>
      </div>

      {error ? (
        <p style={styles.errorMessage} role="alert">
          {error}
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
              <span style={styles.summaryLabel}>Standard restaurants</span>
            </article>

            <article style={styles.summaryCard}>
              <strong style={styles.summaryNumber}>
                {protectedRestaurants.length}
              </strong>
              <span style={styles.summaryLabel}>Protected catalog entries</span>
            </article>
          </div>

          <div style={styles.contentGrid}>
            <section aria-labelledby="standard-restaurants-heading">
              <h3 id="standard-restaurants-heading" style={styles.groupTitle}>
                Standard restaurants
              </h3>

              {manageableRestaurants.length === 0 ? (
                <div style={styles.emptyCard}>
                  <strong>No standard restaurants yet.</strong>
                  <p>
                    Restaurants created outside the system catalog will appear
                    here for review.
                  </p>
                </div>
              ) : (
                <div style={styles.restaurantList}>
                  {manageableRestaurants.map((restaurant) => (
                    <RestaurantCard
                      key={restaurant.id}
                      restaurant={restaurant}
                      isProtected={false}
                      onManage={openRestaurantManagement}
                    />
                  ))}
                </div>
              )}
            </section>

            <section aria-labelledby="protected-restaurants-heading">
              <h3 id="protected-restaurants-heading" style={styles.groupTitle}>
                Protected system catalog
              </h3>

              <p style={styles.protectedExplanation}>
                These starter restaurants can use the same management tools,
                but their deletion action remains unavailable.
              </p>

              {protectedRestaurants.length === 0 ? (
                <div style={styles.emptyCard}>
                  <strong>No protected catalog entries are available.</strong>
                </div>
              ) : (
                <div style={styles.restaurantList}>
                  {protectedRestaurants.map((restaurant) => (
                    <RestaurantCard
                      key={restaurant.id}
                      restaurant={restaurant}
                      isProtected
                      onManage={openRestaurantManagement}
                    />
                  ))}
                </div>
              )}
            </section>
          </div>
        </>
      )}

      {managedRestaurantId ? (
        <RestaurantManagementPage
          mode="admin"
          presentation="modal"
          restaurantId={managedRestaurantId}
          onClose={closeRestaurantManagement}
        />
      ) : null}
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
  errorMessage: {
    background: 'var(--color-danger-bg, #fff0f0)',
    border: '1px solid var(--color-danger, #c53b3b)',
    borderRadius: '12px',
    color: 'var(--color-danger, #c53b3b)',
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
  protectedCard: {
    alignItems: 'center',
    background: 'var(--color-surface)',
    border: '1px solid var(--color-border)',
    borderRadius: '14px',
    display: 'flex',
    gap: '14px',
    justifyContent: 'space-between',
    padding: '15px'
  },
  restaurantCardActions: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '8px',
    justifyContent: 'flex-end'
  },
  protectedActions: {
    alignItems: 'flex-end',
    display: 'flex',
    flexDirection: 'column',
    gap: '8px'
  },
  restaurantContent: {
    minWidth: 0
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
  protectedExplanation: {
    color: 'var(--color-text-muted)',
    lineHeight: 1.5,
    margin: '0 0 12px'
  },
  emptyCard: {
    background: 'var(--color-surface)',
    border: '1px dashed var(--color-border)',
    borderRadius: '14px',
    color: 'var(--color-text-muted)',
    padding: '18px'
  }
};

export default AdminRestaurantModerationPanel;
