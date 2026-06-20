import { Navigate, Route, Routes } from 'react-router-dom';
import Layout from './components/Layout.jsx';
import HomePage from './pages/HomePage.jsx';
import LoginPage from './pages/LoginPage.jsx';
import RegisterPage from './pages/RegisterPage.jsx';
import SearchPage from './pages/SearchPage.jsx';
import RestaurantPage from './pages/RestaurantPage.jsx';
import NotFoundPage from './pages/NotFoundPage.jsx';
import { useAuth } from './context/AuthContext.jsx';
import RestaurantManagementPage from './pages/RestaurantManagementPage.jsx';
import OrdersPage from './pages/OrdersPage.jsx';
import OrderStatusPage from './pages/OrderStatusPage.jsx';
import CheckoutPage from './pages/CheckoutPage.jsx';

function RequireAuth({ children }) {
  const { token } = useAuth();

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

function App() {
  const { token, logout } = useAuth();

  return (
    <Routes>
      <Route element={<Layout token={token} onLogout={logout} />}>
        <Route
          path="/"
          element={
            <RequireAuth>
              <HomePage />
            </RequireAuth>
          }
        />

        <Route
          path="/search"
          element={
            <RequireAuth>
              <SearchPage />
            </RequireAuth>
          }
        />

        <Route
          path="/restaurants/:id"
          element={
            <RequireAuth>
              <RestaurantPage />
            </RequireAuth>
          }
        />

        <Route
          path="/management"
          element={
            <RequireAuth>
              <RestaurantManagementPage />
            </RequireAuth>
          }
        />

        <Route
          path="/orders"
          element={
            <RequireAuth>
              <OrdersPage />
            </RequireAuth>
          }
        />

        <Route
          path="/order-status"
          element={
            <RequireAuth>
              <OrderStatusPage />
            </RequireAuth>
          }
        />

        <Route
          path="/checkout"
          element={
            <RequireAuth>
              <CheckoutPage />
            </RequireAuth>
          }
        />

        <Route
          path="/login"
          element={token ? <Navigate to="/" replace /> : <LoginPage />}
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