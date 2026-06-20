import { useEffect, useState } from 'react';

const THEME_STORAGE_KEY = 'theme';

function applyTheme(theme) {
  if (theme === 'dark') {
    document.documentElement.dataset.theme = 'dark';
  } else {
    document.documentElement.removeAttribute('data-theme');
  }
}

function ThemeToggle() {
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem(THEME_STORAGE_KEY) || 'light';
  });

  useEffect(() => {
    applyTheme(theme);
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  }, [theme]);

  function toggleTheme() {
    setTheme((currentTheme) => (currentTheme === 'dark' ? 'light' : 'dark'));
  }

  const isDark = theme === 'dark';

  return (
    <button
      type="button"
      className="theme-toggle-button"
      onClick={toggleTheme}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      <span className="theme-toggle-icon" aria-hidden="true">
        {isDark ? '☀️' : '🌙'}
      </span>
      <span>{isDark ? 'Light' : 'Dark'}</span>
    </button>
  );
}

export default ThemeToggle;
