import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

function HeaderSearch() {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');

  function handleSubmit(event) {
    event.preventDefault();

    const trimmedQuery = query.trim();

    if (!trimmedQuery) {
      navigate('/search');
      return;
    }

    navigate(`/search?q=${encodeURIComponent(trimmedQuery)}`);
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

      <button type="submit" className="header-search-button">
        Search
      </button>
    </form>
  );
}

export default HeaderSearch;
