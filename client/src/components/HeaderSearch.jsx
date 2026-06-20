import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

function HeaderSearch() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [query, setQuery] = useState(searchParams.get('q') || '');

  useEffect(() => {
    setQuery(searchParams.get('q') || '');
  }, [searchParams]);

  function handleSubmit(event) {
    event.preventDefault();

    const trimmedQuery = query.trim();

    if (!trimmedQuery) {
      navigate('/search');
      return;
    }

    navigate(`/search?q=${encodeURIComponent(trimmedQuery)}`);
  }

  function handleClearSearch() {
    setQuery('');
    navigate('/search');
  }

  return (
    <form className="header-search" onSubmit={handleSubmit} role="search">
      <input
        type="search"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder="Search restaurants or dishes"
        className="header-search-input"
        aria-label="Search restaurants or dishes"
      />

      {query && (
        <button
          type="button"
          className="header-search-clear-button"
          onClick={handleClearSearch}
          aria-label="Clear search"
        >
          ×
        </button>
      )}

      <button type="submit" className="header-search-button">
        Search
      </button>
    </form>
  );
}

export default HeaderSearch;
