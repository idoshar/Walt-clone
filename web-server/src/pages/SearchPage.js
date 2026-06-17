import React, { useState, useRef } from 'react';
import RestaurantCard from './RestaurantCard';
import ProductCard from './ProductCard';

const SearchPage = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [results, setResults] = useState({ restaurants: [], products: [] });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const debounceTimeoutRef = useRef(null);

  const fetchSearchResults = async (query) => {
    if (!query.trim()) {
      setResults({ restaurants: [], products: [] });
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch(`http://localhost:5000/api/search/${encodeURIComponent(query.trim())}`);
      
      if (!response.ok) {
        throw new Error('Error fetching search results');
      }

      const data = await response.json();
      setResults({
        restaurants: data.restaurants || [],
        products: data.products || []
      });
    } catch (err) {
      setError(err.message || 'Something went wrong, please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const value = e.target.value;
    setSearchTerm(value);

    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }

    debounceTimeoutRef.current = setTimeout(() => {
      fetchSearchResults(value);
    }, 400);
  };

  return (
    <div style={styles.container}>
      <div style={styles.searchBoxWrapper}>
        <input
          type="text"
          placeholder="Search for restaurants or dishes..."
          value={searchTerm}
          onChange={handleInputChange}
          style={styles.searchInput}
        />
      </div>

      {loading && <div style={styles.statusMessage}>Searching for delicious items... 🍕</div>}
      {error && <div style={styles.errorMessage}>{error}</div>}

      {!loading && searchTerm.trim() && (
        <div style={styles.resultsContainer}>
          
          <section style={styles.section}>
            <h2 style={styles.sectionTitle}>Restaurants ({results.restaurants.length})</h2>
            {results.restaurants.length > 0 ? (
              <div style={styles.grid}>
                {results.restaurants.map((item, index) => (
                  <RestaurantCard key={item.id || index} restaurant={item} />
                ))}
              </div>
            ) : (
              <p style={styles.noResults}>No restaurants found</p>
            )}
          </section>

          <section style={styles.section}>
            <h2 style={styles.sectionTitle}>Dishes & Products ({results.products.length})</h2>
            {results.products.length > 0 ? (
              <div style={styles.list}>
                {results.products.map((item, index) => (
                  <ProductCard key={item.id || index} product={item} />
                ))}
              </div>
            ) : (
              <p style={styles.noResults}>No products found matching your search</p>
            )}
          </section>

        </div>
      )}
    </div>
  );
};

const styles = {
  container: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '20px',
    fontFamily: 'system-ui, sans-serif',
    direction: 'ltr',
  },
  searchBoxWrapper: {
    display: 'flex',
    justifyContent: 'center',
    marginBottom: '30px',
  },
  searchInput: {
    width: '100%',
    maxWidth: '600px',
    padding: '14px 20px',
    fontSize: '16px',
    borderRadius: '25px',
    border: '1px solid #e0e0e0',
    backgroundColor: '#f3f3f3',
    outline: 'none',
    transition: 'all 0.2s ease',
    boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.05)'
  },
  resultsContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '40px',
  },
  section: {
    width: '100%',
  },
  sectionTitle: {
    fontSize: '22px',
    fontWeight: '700',
    marginBottom: '16px',
    color: '#2b2b2b',
    borderBottom: '2px solid #f0f0f0',
    paddingBottom: '8px'
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
    gap: '20px',
  },
  list: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  statusMessage: {
    textAlign: 'center',
    color: '#009de0',
    fontSize: '16px',
    marginTop: '20px',
  },
  errorMessage: {
    textAlign: 'center',
    color: '#e23e3e',
    fontSize: '16px',
    marginTop: '20px',
  },
  noResults: {
    color: '#8c8c8c',
    fontSize: '14px',
    fontStyle: 'italic',
  }
};

export default SearchPage;