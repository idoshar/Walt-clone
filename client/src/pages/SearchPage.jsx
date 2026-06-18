import { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { apiRequest } from '../api/client.js';
import EmptyState from '../components/EmptyState.jsx';
import ErrorMessage from '../components/ErrorMessage.jsx';
import LoadingState from '../components/LoadingState.jsx';
import ProductCard from '../components/ProductCard.jsx';
import RestaurantCard from '../components/RestaurantCard.jsx';

function SearchPage() {
  const debounceTimeoutRef = useRef(null);
  const [searchParams, setSearchParams] = useSearchParams();

  const [searchTerm, setSearchTerm] = useState(searchParams.get('q') || '');
  const [results, setResults] = useState({ restaurants: [], products: [] });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function fetchSearchResults(query) {
    if (!query.trim()) {
      setResults({ restaurants: [], products: [] });
      setError('');
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

  useEffect(() => {
    const queryFromUrl = searchParams.get('q') || '';
    setSearchTerm(queryFromUrl);
    fetchSearchResults(queryFromUrl);
  }, [searchParams]);

  function handleInputChange(event) {
    const value = event.target.value;
    setSearchTerm(value);

    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }

    debounceTimeoutRef.current = setTimeout(() => {
      const trimmedValue = value.trim();

      if (trimmedValue) {
        setSearchParams({ q: trimmedValue });
      } else {
        setSearchParams({});
        setResults({ restaurants: [], products: [] });
        setError('');
      }
    }, 400);
  }

  const hasSearchTerm = searchTerm.trim().length > 0;
  const hasResults = results.restaurants.length > 0 || results.products.length > 0;

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

      {loading && <LoadingState message="Searching..." />}

      {!loading && error && <ErrorMessage message={error} />}

      {!loading && hasSearchTerm && !error && !hasResults && (
        <EmptyState
          title="No results found"
          message="Try searching for another restaurant or dish."
        />
      )}

      {!loading && hasSearchTerm && !error && hasResults && (
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
              <EmptyState
                title="No restaurants found"
                message="No restaurants match this search."
              />
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
              <EmptyState
                title="No dishes found"
                message="No dishes or products match this search."
              />
            )}
          </section>
        </div>
      )}
    </section>
  );
}

export default SearchPage;
