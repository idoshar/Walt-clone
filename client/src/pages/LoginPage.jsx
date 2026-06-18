import { useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { apiRequest } from '../api/client.js';

function LoginPage({ onLoginSuccess }) {
  const usernameRef = useRef(null);
  const navigate = useNavigate();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');

    if (!username.trim() || !password.trim()) {
      setError('Username and password are required');
      usernameRef.current?.focus();
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

      const receivedToken = data?.token || data?.userId;

      if (!receivedToken) {
        throw new Error('Token not received from server');
      }

      if (data?.userId) {
        localStorage.setItem('userId', String(data.userId));
      }

      if (data?.user) {
        localStorage.setItem('user', JSON.stringify(data.user));
      }

      onLoginSuccess(String(receivedToken));
      navigate('/');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="auth-page">
      <form onSubmit={handleSubmit} className="form-card">
        <h1>Welcome back</h1>
        <p>Log in to continue ordering from restaurants.</p>

        <label>
          Username
          <input
            ref={usernameRef}
            type="text"
            value={username}
            onChange={(event) => setUsername(event.target.value)}
            placeholder="Enter username"
            disabled={loading}
          />
        </label>

        <label>
          Password
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Enter password"
            disabled={loading}
          />
        </label>

        {error && <p className="error-message">{error}</p>}

        <button type="submit" disabled={loading}>
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
