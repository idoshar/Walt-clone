import { Navigate, Route, Routes } from 'react-router-dom';
import { useState } from 'react';
import Layout from './components/Layout.jsx';
import HomePage from './pages/HomePage.jsx';
import LoginPage from './pages/LoginPage.jsx';
import RegisterPage from './pages/RegisterPage.jsx';
import SearchPage from './pages/SearchPage.jsx';
import RestaurantPage from './pages/RestaurantPage.jsx';
import NotFoundPage from './pages/NotFoundPage.jsx';

function RequireAuth({ token, children }) {
  if (!token) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

function App() {
  const [token, setToken] = useState(localStorage.getItem('jwt') || '');

  function handleLoginSuccess(receivedToken) {
    localStorage.setItem('jwt', receivedToken);
    setToken(receivedToken);
  }

  function handleLogout() {
    localStorage.removeItem('jwt');
    localStorage.removeItem('user');
    setToken('');
  }

  return (
    <Routes>
      <Route element={<Layout token={token} onLogout={handleLogout} />}>
        <Route
          path="/"
          element={
            <RequireAuth token={token}>
              <HomePage />
            </RequireAuth>
          }
        />

        <Route
          path="/search"
          element={
            <RequireAuth token={token}>
              <SearchPage />
            </RequireAuth>
          }
        />

        <Route
          path="/restaurants/:id"
          element={
            <RequireAuth token={token}>
              <RestaurantPage />
            </RequireAuth>
          }
        />

        <Route
          path="/login"
          element={
            token ? (
              <Navigate to="/" replace />
            ) : (
              <LoginPage onLoginSuccess={handleLoginSuccess} />
            )
          }
        />

        <Route
          path="/register"
          element={token ? <Navigate to="/" replace /> : <RegisterPage />}
        />

        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}

export default App;
