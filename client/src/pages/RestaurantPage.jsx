import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { apiRequest } from '../api/client.js';
import { getMenuCategories } from '../api/menuCategoryApi.js';
import CheckoutButton from '../components/CheckoutButton.jsx';
import EmptyState from '../components/EmptyState.jsx';
import ErrorMessage from '../components/ErrorMessage.jsx';
import LoadingState from '../components/LoadingState.jsx';
import ProductCard from '../components/ProductCard.jsx';
import { getRestaurantImage } from '../utils/restaurantImages.js';

function RestaurantPage() {
  const { id } = useParams();

  const [restaurant, setRestaurant] = useState(null);
  const [products, setProducts] = useState([]);
  const [menuCategories, setMenuCategories] = useState([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState('');
  const [recommendations, setRecommendations] = useState([]);
  const [selectedProductKey, setSelectedProductKey] = useState('');
  const [selectedProductName, setSelectedProductName] = useState('');
  const [recommendationsLoading, setRecommendationsLoading] = useState(false);
  const [recommendationError, setRecommendationError] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadRestaurant() {
      setLoading(true);
      setError('');
      setProducts([]);
      setMenuCategories([]);
      setSelectedCategoryId('');
      setRecommendations([]);
      setSelectedProductKey('');
      setSelectedProductName('');
      setRecommendationError('');

      try {
        const [
          restaurantData,
          productsData,
          categoriesData
        ] = await Promise.all([
          apiRequest(`/restaurants/${id}`),
          apiRequest(`/restaurants/${id}/products`),
          getMenuCategories(id)
        ]);

        setRestaurant(restaurantData);
        setProducts(Array.isArray(productsData) ? productsData : []);
        setMenuCategories(
          Array.isArray(categoriesData) ? categoriesData : []
        );
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    loadRestaurant();
  }, [id]);

  const selectedCategory = useMemo(
    () =>
      menuCategories.find(
        (category) =>
          String(category.id) === String(selectedCategoryId)
      ) || null,
    [menuCategories, selectedCategoryId]
  );

  const filteredProducts = useMemo(() => {
    if (!selectedCategoryId) {
      return products;
    }

    return products.filter(
      (product) =>
        String(product.categoryId || '') === String(selectedCategoryId)
    );
  }, [products, selectedCategoryId]);

  function getProductKey(product) {
    const restaurantId = product.restaurantId ?? id;
    return `${restaurantId}-${product.id}`;
  }

  function handleCategoryFilterSelect(categoryId) {
    setSelectedCategoryId(categoryId);
    setRecommendations([]);
    setSelectedProductKey('');
    setSelectedProductName('');
    setRecommendationError('');
  }

  async function handleProductSelect(product) {
    if (!product?.id || recommendationsLoading) {
      return;
    }

    const restaurantId = product.restaurantId ?? id;

    setSelectedProductKey(getProductKey(product));
    setSelectedProductName(product.name);
    setRecommendations([]);
    setRecommendationError('');
    setRecommendationsLoading(true);

    try {
      const data = await apiRequest(
        `/restaurants/${restaurantId}/products/${product.id}/recommendations`
      );

      const recommendedProducts = Array.isArray(data)
        ? data.filter(
            (recommendedProduct) =>
              recommendedProduct?.id !== product.id
          )
        : [];

      setRecommendations(recommendedProducts);
    } catch (err) {
      setRecommendationError(
        err.message || 'Could not load recommendations right now.'
      );
    } finally {
      setRecommendationsLoading(false);
    }
  }

  function createCartProduct(product) {
    const displayImage = getRestaurantImage(restaurant);

    const menuCategory = menuCategories.find(
      (category) =>
        String(category.id) === String(product.categoryId || '')
    );

    return {
      ...product,
      menuType: menuCategory?.menuType || product.menuType || '',
      restaurantId: product.restaurantId ?? restaurant.id,
      restaurantName: product.restaurantName ?? restaurant.name,
      restaurantImage:
        typeof product.restaurantImage === 'string' &&
        product.restaurantImage.trim() !== ''
          ? product.restaurantImage
          : displayImage
    };
  }

  function getCategoryFilterStyle(isActive) {
    return {
      ...styles.categoryFilterButton,
      ...(isActive
        ? styles.categoryFilterButtonActive
        : styles.categoryFilterButtonInactive)
    };
  }

  if (loading) {
    return (
      <section style={styles.centerContainer}>
        <LoadingState message="Loading restaurant menu..." />
      </section>
    );
  }

  if (error) {
    return (
      <section style={styles.centerContainer}>
        <ErrorMessage message={error} />
      </section>
    );
  }

  if (!restaurant) {
    return (
      <section style={styles.centerContainer}>
        <EmptyState
          title="Restaurant not found"
          message="The restaurant you requested does not exist."
        />
      </section>
    );
  }

  const displayImage = getRestaurantImage(restaurant);
  const hasProducts = products.length > 0;
  const hasCategories = menuCategories.length > 0;

  return (
    <section style={styles.container}>
      <div style={styles.heroSection}>
        <img
          src={displayImage}
          alt={restaurant.name}
          style={styles.heroImage}
        />

        <div style={styles.heroOverlay}>
          <h1 style={styles.restaurantName}>{restaurant.name}</h1>

          {restaurant.description && (
            <p style={styles.restaurantDescription}>
              {restaurant.description}
            </p>
          )}

          <div style={styles.metaInfo}>
            <span>📍 {restaurant.address}</span>
            {restaurant.phone && <span>• 📞 {restaurant.phone}</span>}
          </div>
        </div>
      </div>

      <div style={styles.menuSection}>
        <h2 style={styles.menuTitle}>Menu Items</h2>

        {hasProducts ? (
          <>
            {hasCategories && (
              <div
                style={styles.categoryFilterSection}
                aria-label="Filter menu items by category"
              >
                <span style={styles.categoryFilterLabel}>
                  Browse menu
                </span>

                <div style={styles.categoryFilterList}>
                  <button
                    type="button"
                    style={getCategoryFilterStyle(!selectedCategoryId)}
                    onClick={() => handleCategoryFilterSelect('')}
                    aria-pressed={!selectedCategoryId}
                  >
                    All
                  </button>

                  {menuCategories.map((category) => {
                    const isActive =
                      String(category.id) === String(selectedCategoryId);

                    return (
                      <button
                        key={category.id}
                        type="button"
                        style={getCategoryFilterStyle(isActive)}
                        onClick={() =>
                          handleCategoryFilterSelect(category.id)
                        }
                        aria-pressed={isActive}
                      >
                        {category.name}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {filteredProducts.length > 0 ? (
              <div style={styles.productList}>
                {filteredProducts.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={createCartProduct(product)}
                    onSelect={handleProductSelect}
                    selected={
                      selectedProductKey === getProductKey(product)
                    }
                    disabled={recommendationsLoading}
                  />
                ))}
              </div>
            ) : (
              <EmptyState
                title={
                  selectedCategory
                    ? `No ${selectedCategory.name} items yet`
                    : 'No products found'
                }
                message={
                  selectedCategory
                    ? `This restaurant does not currently have menu items in ${selectedCategory.name}.`
                    : 'No matching menu items are available right now.'
                }
              />
            )}

            <CheckoutButton
              restaurantId={restaurant.id}
              restaurantName={restaurant.name}
            />
          </>
        ) : (
          <EmptyState
            title="No products yet"
            message="This restaurant does not have any menu items available yet."
          />
        )}
      </div>

      {recommendationsLoading && (
        <section className="recommendations-section">
          <LoadingState message="Finding recommendations..." />
        </section>
      )}

      {!recommendationsLoading && recommendationError && (
        <section className="recommendations-section">
          <ErrorMessage message={recommendationError} />
        </section>
      )}

      {!recommendationsLoading && recommendations.length > 0 && (
        <section className="recommendations-section">
          <h2 style={styles.menuTitle}>Recommended for you</h2>
          <p className="recommendations-subtitle">
            Based on {selectedProductName}.
          </p>

          <div style={styles.productList}>
            {recommendations.map((product) => (
              <ProductCard
                key={`${product.restaurantId ?? id}-${product.id}`}
                product={createCartProduct(product)}
                onSelect={handleProductSelect}
                selected={selectedProductKey === getProductKey(product)}
                disabled={recommendationsLoading}
              />
            ))}
          </div>
        </section>
      )}
    </section>
  );
}

const styles = {
  container: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '20px',
    fontFamily: 'system-ui, sans-serif',
    direction: 'ltr'
  },
  centerContainer: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '60vh',
    direction: 'ltr'
  },
  heroSection: {
    position: 'relative',
    width: '100%',
    height: '320px',
    borderRadius: '16px',
    overflow: 'hidden',
    marginBottom: '40px',
    backgroundColor: '#141517'
  },
  heroImage: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    opacity: '0.55'
  },
  heroOverlay: {
    position: 'absolute',
    bottom: '0',
    left: '0',
    right: '0',
    padding: '30px',
    background: 'linear-gradient(to top, rgba(0,0,0,0.9), rgba(0,0,0,0))',
    color: '#ffffff'
  },
  restaurantName: {
    fontSize: '38px',
    fontWeight: '800',
    margin: '0 0 12px 0'
  },
  restaurantDescription: {
    margin: '0 0 14px 0',
    fontSize: '16px',
    color: '#e2e4e8',
    lineHeight: '1.5',
    maxWidth: '750px'
  },
  metaInfo: {
    display: 'flex',
    gap: '15px',
    fontSize: '14px',
    fontWeight: '500',
    color: '#ced4da',
    flexWrap: 'wrap'
  },
  menuSection: {
    width: '100%'
  },
  menuTitle: {
    fontSize: '24px',
    fontWeight: '700',
    color: 'var(--color-text)',
    marginBottom: '24px',
    borderBottom: '2px solid var(--color-border)',
    paddingBottom: '12px'
  },
  categoryFilterSection: {
    display: 'grid',
    gap: '10px',
    marginBottom: '24px'
  },
  categoryFilterLabel: {
    color: 'var(--color-text-muted)',
    fontSize: '13px',
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: '0.05em'
  },
  categoryFilterList: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '9px'
  },
  categoryFilterButton: {
    minHeight: '38px',
    padding: '8px 14px',
    borderRadius: '999px',
    fontSize: '14px',
    fontWeight: '800',
    cursor: 'pointer',
    transition: 'background-color 160ms ease, color 160ms ease, border-color 160ms ease'
  },
  categoryFilterButtonActive: {
    border: '1px solid var(--color-primary)',
    backgroundColor: 'var(--color-primary)',
    color: 'var(--color-primary-contrast)'
  },
  categoryFilterButtonInactive: {
    border: '1px solid var(--color-border)',
    backgroundColor: 'var(--color-surface)',
    color: 'var(--color-text)'
  },
  productList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px'
  }
};

export default RestaurantPage;
