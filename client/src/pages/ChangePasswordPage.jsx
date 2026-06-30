import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiRequest } from '../api/client.js';
import ErrorMessage from '../components/ErrorMessage.jsx';
import { useAuth } from '../context/AuthContext.jsx';

function validatePassword(password) {
  if (!password) {
    return 'Password is required';
  }

  if (password.length < 8) {
    return 'Password must be at least 8 characters long';
  }

  if (!/[a-zA-Z]/.test(password) || !/[0-9]/.test(password)) {
    return 'Password must contain both letters and numbers';
  }

  return '';
}

function ChangePasswordPage() {
  const navigate = useNavigate();
  const { login, logout, user } = useAuth();
  const mustChangePassword = Boolean(user?.mustChangePassword);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  function clearFieldError(fieldName) {
    setFieldErrors((currentErrors) => ({
      ...currentErrors,
      [fieldName]: ''
    }));

    setError('');
  }

  function validateForm() {
    const errors = {};

    if (!currentPassword) {
      errors.currentPassword = 'Current password is required';
    }

    const newPasswordError = validatePassword(newPassword);

    if (newPasswordError) {
      errors.newPassword = newPasswordError;
    }

    if (!confirmPassword) {
      errors.confirmPassword = 'Please confirm your new password';
    } else if (newPassword !== confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
    }

    if (currentPassword && newPassword && currentPassword === newPassword) {
      errors.newPassword = 'New password must be different from current password';
    }

    return errors;
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');

    const errors = validateForm();
    setFieldErrors(errors);

    if (Object.keys(errors).length > 0) {
      setError('Please fix the highlighted fields before continuing.');
      return;
    }

    setLoading(true);

    try {
      const result = await apiRequest('/users/me/password', {
        method: 'PATCH',
        body: JSON.stringify({
          currentPassword,
          newPassword
        })
      });

      if (!result?.token || !result?.user) {
        throw new Error('The server returned an invalid password-change response.');
      }

      login(result.token, result.user);
      navigate(mustChangePassword ? '/' : '/profile', { replace: true });
    } catch (requestError) {
      setError(
        requestError.message ||
          'Password could not be updated. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="auth-page">
      <form onSubmit={handleSubmit} className="form-card" noValidate>
        <h1>{mustChangePassword ? 'Update your password' : 'Change your password'}</h1>

        <p>
          {mustChangePassword
            ? 'Your account requires a password update before you can continue.'
            : 'Enter your current password and choose a new one for your account.'}
        </p>

        <label className="form-field">
          Current password
          <input
            type="password"
            value={currentPassword}
            onChange={(event) => {
              setCurrentPassword(event.target.value);
              clearFieldError('currentPassword');
            }}
            placeholder="Enter current password"
            autoComplete="current-password"
            disabled={loading}
            aria-invalid={Boolean(fieldErrors.currentPassword)}
          />
          <span
            className={
              fieldErrors.currentPassword ? 'field-error' : 'field-helper'
            }
          >
            {fieldErrors.currentPassword ||
              'Enter the password used to sign in.'}
          </span>
        </label>

        <label className="form-field">
          New password
          <input
            type="password"
            value={newPassword}
            onChange={(event) => {
              setNewPassword(event.target.value);
              clearFieldError('newPassword');
              clearFieldError('confirmPassword');
            }}
            placeholder="Create a new password"
            autoComplete="new-password"
            disabled={loading}
            aria-invalid={Boolean(fieldErrors.newPassword)}
          />
          <span
            className={
              fieldErrors.newPassword ? 'field-error' : 'field-helper'
            }
          >
            {fieldErrors.newPassword ||
              'Use at least 8 characters with letters and numbers.'}
          </span>
        </label>

        <label className="form-field">
          Confirm new password
          <input
            type="password"
            value={confirmPassword}
            onChange={(event) => {
              setConfirmPassword(event.target.value);
              clearFieldError('confirmPassword');
            }}
            placeholder="Repeat new password"
            autoComplete="new-password"
            disabled={loading}
            aria-invalid={Boolean(fieldErrors.confirmPassword)}
          />
          <span
            className={
              fieldErrors.confirmPassword ? 'field-error' : 'field-helper'
            }
          >
            {fieldErrors.confirmPassword ||
              'Repeat the same new password.'}
          </span>
        </label>

        {error && <ErrorMessage message={error} />}

        <button type="submit" className="primary-button" disabled={loading}>
          {loading ? 'Updating password...' : 'Update password'}
        </button>

        {mustChangePassword ? (
          <button
            type="button"
            className="password-change-signout"
            onClick={logout}
            disabled={loading}
          >
            Sign out instead
          </button>
        ) : (
          <button
            type="button"
            className="password-change-signout"
            onClick={() => navigate('/profile')}
            disabled={loading}
          >
            Back to profile
          </button>
        )}
      </form>
    </section>
  );
}

export default ChangePasswordPage;
