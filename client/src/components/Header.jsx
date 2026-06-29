import { Link, NavLink } from 'react-router-dom';
import HeaderSearch from './HeaderSearch.jsx';
import ThemeToggle from './ThemeToggle.jsx';
import CartDropdown from './CartDropdown.jsx';

function getSavedUser() {
  const savedUser = localStorage.getItem('user');

  if (!savedUser) {
    return null;
  }

  try {
    return JSON.parse(savedUser);
  } catch {
    return null;
  }
}

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
  const user = token ? getSavedUser() : null;
  const userLabel = token ? getUserLabel() : '';
  const userImage = user?.image || '';

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
            <div className="primary-nav-links">
              <NavLink to="/" end className="nav-link">Home</NavLink>
              <NavLink to="/search" className="nav-link">Search</NavLink>
              <NavLink to="/orders" className="nav-link">Orders</NavLink>
              <NavLink to="/management" className="nav-link">Management</NavLink>
              {user?.role === 'admin' ? (
                <NavLink to="/admin" className="nav-link">Admin</NavLink>
              ) : null}
            </div>

            <div className="navbar-utilities">
              <CartDropdown />
              <ThemeToggle />

              <div className="user-area">
                {userImage ? (
                  <img src={userImage} alt={userLabel} className="user-avatar" />
                ) : (
                  <span className="user-avatar" aria-hidden="true">
                    {userLabel.charAt(0).toUpperCase()}
                  </span>
                )}

                <span className="user-label">{userLabel}</span>

                <button type="button" onClick={onLogout} className="logout-button">
                  Log Out
                </button>
              </div>
            </div>
          </>
        ) : (
          <>
            <div className="navbar-utilities">
              <ThemeToggle />
            </div>

            <div className="primary-nav-links">
              <NavLink to="/login" className="nav-link">Login</NavLink>
              <NavLink to="/register" className="nav-link register-link">Register</NavLink>
            </div>
          </>
        )}
      </nav>
    </header>
  );
}

export default Header;
