import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  getAdminRestaurants,
  updateAdminSponsorshipOrder
} from '../api/adminRestaurantModerationApi.js';

function compareByName(left, right) {
  return String(left?.name || '').localeCompare(String(right?.name || ''));
}

function compareSponsoredRestaurants(left, right) {
  const leftRank = Number(left?.sponsoredRank) || Number.MAX_SAFE_INTEGER;
  const rightRank = Number(right?.sponsoredRank) || Number.MAX_SAFE_INTEGER;

  return leftRank - rightRank || compareByName(left, right);
}

function getRestaurantDescription(restaurant) {
  return [restaurant?.cuisine, restaurant?.address]
    .filter(Boolean)
    .join(' · ') || 'Restaurant details are not available.';
}

function AdminSponsoredPromotionsPanel() {
  const [restaurants, setRestaurants] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const sponsoredRestaurants = useMemo(
    () =>
      restaurants
        .filter((restaurant) => restaurant.isSponsored)
        .sort(compareSponsoredRestaurants),
    [restaurants]
  );

  const availableRestaurants = useMemo(
    () =>
      restaurants
        .filter((restaurant) => !restaurant.isSponsored)
        .sort(compareByName),
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
          'Could not load restaurants for sponsorship management.'
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadRestaurants();
  }, [loadRestaurants]);

  async function saveSponsoredOrder(nextSponsoredRestaurants, successMessage) {
    const restaurantIds = nextSponsoredRestaurants.map((restaurant) =>
      String(restaurant.id)
    );

    setIsSaving(true);
    setError('');
    setNotice('');

    try {
      const updatedRestaurants = await updateAdminSponsorshipOrder(
        restaurantIds
      );

      setRestaurants(
        Array.isArray(updatedRestaurants) ? updatedRestaurants : []
      );
      setNotice(successMessage);
    } catch (saveError) {
      setError(
        saveError.message || 'Could not save the sponsored restaurant order.'
      );
    } finally {
      setIsSaving(false);
    }
  }

  function handleAddRestaurant(restaurant) {
    saveSponsoredOrder(
      [...sponsoredRestaurants, restaurant],
      `${restaurant.name} was added to sponsored placements.`
    );
  }

  function handleRemoveRestaurant(restaurant) {
    saveSponsoredOrder(
      sponsoredRestaurants.filter(
        (currentRestaurant) =>
          String(currentRestaurant.id) !== String(restaurant.id)
      ),
      `${restaurant.name} was removed from sponsored placements.`
    );
  }

  function handleMoveRestaurant(restaurantId, direction) {
    const currentIndex = sponsoredRestaurants.findIndex(
      (restaurant) => String(restaurant.id) === String(restaurantId)
    );
    const targetIndex = currentIndex + direction;

    if (
      currentIndex < 0 ||
      targetIndex < 0 ||
      targetIndex >= sponsoredRestaurants.length
    ) {
      return;
    }

    const nextSponsoredRestaurants = [...sponsoredRestaurants];
    const [movedRestaurant] = nextSponsoredRestaurants.splice(currentIndex, 1);
    nextSponsoredRestaurants.splice(targetIndex, 0, movedRestaurant);

    saveSponsoredOrder(
      nextSponsoredRestaurants,
      `${movedRestaurant.name} was moved to position ${targetIndex + 1}.`
    );
  }

  return (
    <section style={styles.panel} aria-labelledby="sponsored-promotions-heading">
      <div style={styles.heading}>
        <div>
          <p style={styles.eyebrow}>ADMINISTRATION</p>
          <h2 id="sponsored-promotions-heading" style={styles.title}>
            Sponsored promotions
          </h2>
          <p style={styles.description}>
            Add restaurants to customer-facing sponsored placements, then use
            the arrows to control the display order.
          </p>
        </div>

        <button
          type="button"
          style={styles.secondaryButton}
          onClick={loadRestaurants}
          disabled={isLoading || isSaving}
        >
          Refresh list
        </button>
      </div>

      <div style={styles.summaryGrid} aria-label="Sponsorship summary">
        <article style={styles.summaryCard}>
          <strong style={styles.summaryNumber}>{sponsoredRestaurants.length}</strong>
          <span style={styles.summaryLabel}>Sponsored restaurants</span>
        </article>
        <article style={styles.summaryCard}>
          <strong style={styles.summaryNumber}>{availableRestaurants.length}</strong>
          <span style={styles.summaryLabel}>Available to add</span>
        </article>
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
        <p style={styles.stateMessage}>Loading sponsorship settings...</p>
      ) : (
        <div style={styles.contentGrid}>
          <section aria-labelledby="sponsored-placement-order-heading">
            <h3 id="sponsored-placement-order-heading" style={styles.groupTitle}>
              Sponsored placement order
            </h3>

            {sponsoredRestaurants.length === 0 ? (
              <div style={styles.emptyCard}>
                <strong>No sponsored restaurants yet.</strong>
                <p>Add a restaurant from the available list to create the first placement.</p>
              </div>
            ) : (
              <div style={styles.restaurantList}>
                {sponsoredRestaurants.map((restaurant, index) => (
                  <article key={restaurant.id} style={styles.restaurantCard}>
                    <div style={styles.restaurantDetails}>
                      <div style={styles.restaurantTitleRow}>
                        <span style={styles.orderBadge}>{index + 1}</span>
                        <h4 style={styles.restaurantName}>{restaurant.name}</h4>
                      </div>
                      <p
                        style={styles.restaurantMeta}
                        title={getRestaurantDescription(restaurant)}
                      >
                        {getRestaurantDescription(restaurant)}
                      </p>
                    </div>

                    <div style={styles.actions}>
                      <button
                        type="button"
                        style={styles.orderButton}
                        onClick={() => handleMoveRestaurant(restaurant.id, -1)}
                        disabled={isSaving || index === 0}
                        aria-label={`Move ${restaurant.name} up`}
                        title="Move up"
                      >
                        ↑
                      </button>
                      <button
                        type="button"
                        style={styles.orderButton}
                        onClick={() => handleMoveRestaurant(restaurant.id, 1)}
                        disabled={
                          isSaving ||
                          index === sponsoredRestaurants.length - 1
                        }
                        aria-label={`Move ${restaurant.name} down`}
                        title="Move down"
                      >
                        ↓
                      </button>
                      <button
                        type="button"
                        style={styles.dangerButton}
                        onClick={() => handleRemoveRestaurant(restaurant)}
                        disabled={isSaving}
                      >
                        Remove
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>

          <section aria-labelledby="available-restaurants-heading">
            <h3 id="available-restaurants-heading" style={styles.groupTitle}>
              Available restaurants
            </h3>

            {availableRestaurants.length === 0 ? (
              <div style={styles.emptyCard}>
                <strong>Every restaurant is currently sponsored.</strong>
                <p>Remove a placement to make a restaurant available here again.</p>
              </div>
            ) : (
              <div style={styles.restaurantList}>
                {availableRestaurants.map((restaurant) => (
                  <article key={restaurant.id} style={styles.restaurantCard}>
                    <div style={styles.restaurantDetails}>
                      <h4 style={styles.restaurantName}>{restaurant.name}</h4>
                      <p
                        style={styles.restaurantMeta}
                        title={getRestaurantDescription(restaurant)}
                      >
                        {getRestaurantDescription(restaurant)}
                      </p>
                    </div>

                    <button
                      type="button"
                      style={styles.primaryButton}
                      onClick={() => handleAddRestaurant(restaurant)}
                      disabled={isSaving}
                    >
                      Add
                    </button>
                  </article>
                ))}
              </div>
            )}
          </section>
        </div>
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
    padding: '10px 13px',
    whiteSpace: 'nowrap'
  },
  dangerButton: {
    background: 'transparent',
    border: '1px solid var(--color-danger, #c53b3b)',
    borderRadius: '10px',
    color: 'var(--color-danger, #c53b3b)',
    cursor: 'pointer',
    fontWeight: 800,
    padding: '10px 13px',
    whiteSpace: 'nowrap'
  },
  orderButton: {
    alignItems: 'center',
    background: 'var(--color-surface)',
    border: '1px solid var(--color-border)',
    borderRadius: '10px',
    color: 'var(--color-text)',
    cursor: 'pointer',
    display: 'inline-flex',
    fontSize: '1.05rem',
    fontWeight: 900,
    height: '40px',
    justifyContent: 'center',
    padding: 0,
    width: '40px'
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
    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))'
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
    flexWrap: 'nowrap',
    gap: '14px',
    justifyContent: 'space-between',
    minWidth: 0,
    padding: '15px'
  },
  restaurantDetails: {
    flex: '1 1 0',
    minWidth: 0
  },
  restaurantTitleRow: {
    alignItems: 'center',
    display: 'flex',
    flexWrap: 'wrap',
    gap: '8px'
  },
  orderBadge: {
    alignItems: 'center',
    background: 'var(--color-info-bg)',
    borderRadius: '999px',
    color: 'var(--color-primary)',
    display: 'inline-flex',
    fontSize: '0.8rem',
    fontWeight: 900,
    height: '26px',
    justifyContent: 'center',
    width: '26px'
  },
  restaurantName: {
    fontSize: '1rem',
    margin: 0
  },
  restaurantMeta: {
    color: 'var(--color-text-muted)',
    lineHeight: 1.45,
    margin: '5px 0 0',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap'
  },
  actions: {
    alignItems: 'center',
    display: 'flex',
    flex: '0 0 auto',
    flexWrap: 'nowrap',
    gap: '8px',
    justifyContent: 'flex-end'
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
  emptyCard: {
    background: 'var(--color-surface)',
    border: '1px dashed var(--color-border)',
    borderRadius: '14px',
    color: 'var(--color-text-muted)',
    padding: '18px'
  }
};

export default AdminSponsoredPromotionsPanel;
