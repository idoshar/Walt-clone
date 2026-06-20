import { useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { apiRequest } from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';
import ErrorMessage from '../components/ErrorMessage.jsx';

function LoginPage() {
  const usernameRef = useRef(null);
  const passwordRef = useRef(null);
  const navigate = useNavigate();
  const { login } = useAuth();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  function validateForm() {
    const errors = {};

    if (!username.trim()) {
      errors.username = 'Username is required';
    }

    if (!password.trim()) {
      errors.password = 'Password is required';
    }

    return errors;
  }

  function handleUsernameChange(event) {
    setUsername(event.target.value);
    setFieldErrors((currentErrors) => ({ ...currentErrors, username: '' }));
    setError('');
  }

  function handlePasswordChange(event) {
    setPassword(event.target.value);
    setFieldErrors((currentErrors) => ({ ...currentErrors, password: '' }));
    setError('');
  }

  function handleLoginEnter(event) {
    if (event.key !== 'Enter' || loading) {
      return;
    }

    event.preventDefault();
    event.currentTarget.form?.requestSubmit();
  }
  async function handleSubmit(event) {
    event.preventDefault();
    setError('');

    const errors = validateForm();
    setFieldErrors(errors);

    if (Object.keys(errors).length > 0) {
      if (errors.username) {
        usernameRef.current?.focus();
      } else {
        passwordRef.current?.focus();
      }

      setError('Please fill in the highlighted fields before logging in.');
      return;
    }

    setLoading(true);

    try {
      const data = await apiRequest('/tokens', {
        method: 'POST',
        body: JSON.stringify({
          username: username.trim(),
          password
        })
      });

      const receivedToken = data?.token;

      if (!receivedToken) {
        throw new Error('Token not received from server');
      }

      if (data?.userId) {
        localStorage.setItem('userId', String(data.userId));
      }

      if (data?.user) {
        localStorage.setItem('user', JSON.stringify(data.user));
      }

      login(String(receivedToken), data?.user || null);
      navigate('/');
    } catch (err) {
      setError(err.message || 'Login failed. Please check your details and try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="auth-page">
      <form onSubmit={handleSubmit} className="form-card" noValidate>
        <h1>Welcome back</h1>
        <p>Log in to continue ordering from restaurants.</p>

        <label className="form-field">
          Username
          <input
            ref={usernameRef}
            type="text"
            value={username}
            onChange={handleUsernameChange}
            onKeyDown={handleLoginEnter}
            placeholder="Enter username"
            autoComplete="username"
            disabled={loading}
            aria-invalid={Boolean(fieldErrors.username)}
          />
          <span className={fieldErrors.username ? 'field-error' : 'field-helper'}>
            {fieldErrors.username || 'Use the username you registered with.'}
          </span>
        </label>

        <label className="form-field">
          Password
          <input
            ref={passwordRef}
            type="password"
            value={password}
            onChange={handlePasswordChange}
            onKeyDown={handleLoginEnter}
            placeholder="Enter password"
            autoComplete="current-password"
            disabled={loading}
            aria-invalid={Boolean(fieldErrors.password)}
          />
          <span className={fieldErrors.password ? 'field-error' : 'field-helper'}>
            {fieldErrors.password || 'Enter your account password.'}
          </span>
        </label>

        {error && <ErrorMessage message={error} />}

        <button type="submit" className="primary-button" disabled={loading}>
          {loading ? 'Logging in...' : 'Log In'}
        </button>

        <p className="form-footer">
          New user? <Link to="/register">Create account</Link>
        </p>
      </form>
    </section>
  );
}

export default LoginPage;
