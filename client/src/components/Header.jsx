import { Link, NavLink } from 'react-router-dom';

function Header({ token, onLogout }) {
  return (
    <header className="navbar">
      <Link to="/" className="logo">
        Wolt Clone
      </Link>

      <nav className="navbar-actions">
        {token && (
          <>
            <NavLink to="/" className="nav-link">
              Home
            </NavLink>

            <NavLink to="/search" className="nav-link">
              Search
            </NavLink>

            <button type="button" onClick={onLogout} className="logout-button">
              Log Out
            </button>
          </>
        )}

        {!token && (
          <>
            <NavLink to="/login" className="nav-link">
              Login
            </NavLink>

            <NavLink to="/register" className="nav-link">
              Register
            </NavLink>
          </>
        )}
      </nav>
    </header>
  );
}

export default Header;
