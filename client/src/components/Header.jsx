import { Link, NavLink } from 'react-router-dom';
import HeaderSearch from './HeaderSearch.jsx';
import ThemeToggle from './ThemeToggle.jsx';

function getUserLabel() {
  const savedUser = localStorage.getItem('user');

  if (savedUser) {
    try {
      const user = JSON.parse(savedUser);
      return user.fullName || user.displayName || user.username || 'Signed in';
    } catch {
      return 'Signed in';
    }
  }

  const userId = localStorage.getItem('userId');

  if (userId) {
    return `User ${userId}`;
  }

  return 'Signed in';
}

function Header({ token, onLogout }) {
  const userLabel = token ? getUserLabel() : '';

  return (
    <header className="navbar">
      <Link to={token ? '/' : '/login'} className="logo">
        <span className="logo-mark">W</span>
        <span>Wolt Clone</span>
      </Link>

      {token && <HeaderSearch />}

      <nav className="navbar-actions" aria-label="Main navigation">
        {token ? (
          <>
            <NavLink to="/" end className="nav-link">
              Home
            </NavLink>

            <NavLink to="/search" className="nav-link">
              Search
            </NavLink>

            <ThemeToggle />

            <div className="user-area">
              <span className="user-avatar" aria-hidden="true">
                {userLabel.charAt(0).toUpperCase()}
              </span>

              <span className="user-label">{userLabel}</span>

              <button type="button" onClick={onLogout} className="logout-button">
                Log Out
              </button>
            </div>
          </>
        ) : (
          <>
            <ThemeToggle />

            <NavLink to="/login" className="nav-link">
              Login
            </NavLink>

            <NavLink to="/register" className="nav-link register-link">
              Register
            </NavLink>
          </>
        )}
      </nav>
    </header>
  );
}

export default Header;
