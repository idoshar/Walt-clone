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
import AdminPage from './pages/AdminPage.jsx';
import ChangePasswordPage from './pages/ChangePasswordPage.jsx';
import ProfilePage from './pages/ProfilePage.jsx';
import ForgotPasswordPage from './pages/ForgotPasswordPage.jsx';

function RequireAuth({ children }) {
  const { token } = useAuth();

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

function RequireAdmin({ children }) {
  const { token, user } = useAuth();

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  if (user?.role !== 'admin') {
    return <Navigate to="/" replace />;
  }

  return children;
}

function App() {
  const { token, user, logout } = useAuth();

  if (token && user?.mustChangePassword) {
    return (
      <Routes>
        <Route path="/change-password" element={<ChangePasswordPage />} />
        <Route path="*" element={<Navigate to="/change-password" replace />} />
      </Routes>
    );
  }

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
          path="/admin/restaurants/:restaurantId/manage"
          element={
            <RequireAdmin>
              <RestaurantManagementPage mode="admin" />
            </RequireAdmin>
          }
        />

        <Route
          path="/admin"
          element={
            <RequireAdmin>
              <AdminPage />
            </RequireAdmin>
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
          path="/profile"
          element={
            <RequireAuth>
              <ProfilePage />
            </RequireAuth>
          }
        />

        <Route
          path="/change-password"
          element={
            <RequireAuth>
              <ChangePasswordPage />
            </RequireAuth>
          }
        />

        <Route
          path="/login"
          element={token ? <Navigate to="/" replace /> : <LoginPage />}
        />

        <Route
          path="/forgot-password"
          element={
            token ? <Navigate to="/" replace /> : <ForgotPasswordPage />
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