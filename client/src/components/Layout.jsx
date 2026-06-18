import { Outlet } from 'react-router-dom';
import Header from './Header.jsx';

function Layout({ token, onLogout }) {
  return (
    <div className="app-shell">
      <Header token={token} onLogout={onLogout} />

      <main className="main-content">
        <Outlet />
      </main>
    </div>
  );
}

export default Layout;
