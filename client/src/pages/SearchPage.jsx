import { useRef, useState } from 'react';
import { apiRequest } from '../api/client.js';
import ProductCard from '../components/ProductCard.jsx';
import RestaurantCard from '../components/RestaurantCard.jsx';

function SearchPage() {
  const debounceTimeoutRef = useRef(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [results, setResults] = useState({ restaurants: [], products: [] });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function fetchSearchResults(query) {
    if (!query.trim()) {
      setResults({ restaurants: [], products: [] });
      return;
    }

    setLoading(true);
    setError('');

    try {
      const data = await apiRequest(`/search/${encodeURIComponent(query.trim())}`);

      setResults({
        restaurants: data?.restaurants || [],
        products: data?.products || []
      });
    } catch (err) {
      setError(err.message || 'Something went wrong, please try again.');
    } finally {
      setLoading(false);
    }
  }

  function handleInputChange(event) {
    const value = event.target.value;
    setSearchTerm(value);

    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }

    debounceTimeoutRef.current = setTimeout(() => {
      fetchSearchResults(value);
    }, 400);
  }

  return (
    <section className="page-container">
      <h1>Search</h1>
      <p className="page-subtitle">Search for restaurants or dishes.</p>

      <input
        type="text"
        placeholder="Search for restaurants or dishes..."
        value={searchTerm}
        onChange={handleInputChange}
        className="search-input"
      />

      {loading && <p>Searching...</p>}
      {error && <p className="error-message">{error}</p>}

      {searchTerm.trim() && !loading && (
        <div className="search-results">
          <section>
            <h2>Restaurants ({results.restaurants.length})</h2>

            {results.restaurants.length > 0 ? (
              <div className="cards-grid">
                {results.restaurants.map((restaurant) => (
                  <RestaurantCard key={restaurant.id} restaurant={restaurant} />
                ))}
              </div>
            ) : (
              <p>No restaurants found.</p>
            )}
          </section>

          <section>
            <h2>Dishes & Products ({results.products.length})</h2>

            {results.products.length > 0 ? (
              <div className="product-list">
                {results.products.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            ) : (
              <p>No products found.</p>
            )}
          </section>
        </div>
      )}
    </section>
  );
}

export default SearchPage;
