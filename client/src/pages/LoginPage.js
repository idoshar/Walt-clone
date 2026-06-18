import React, { useState } from 'react';

const LoginPage = ({ onLoginSuccess, switchToRegister }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!username.trim() || !password.trim()) {
      setError('All fields are required');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('http://localhost:5000/api/tokens', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username: username.trim(), password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || data.message || 'Invalid username or password');
      }

      if (data.token) {
        localStorage.setItem('jwt', data.token);
        if (data.user) {
          localStorage.setItem('user', JSON.stringify(data.user));
        }
        onLoginSuccess(data.token, data.user);
      } else {
        throw new Error('Token not received from server');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h2 style={styles.title}>Welcome Back</h2>
        <p style={styles.subtitle}>Log in to discover and order from your favorite restaurants</p>
        
        {error && <div style={styles.errorBox}>{error}</div>}

        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.inputGroup}>
            <label style={styles.label}>Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              style={styles.input}
              placeholder="Enter your username"
              disabled={loading}
            />
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.label}>Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={styles.input}
              placeholder="Enter your password"
              disabled={loading}
            />
          </div>

          <button type="submit" style={styles.button} disabled={loading}>
            {loading ? 'Logging in...' : 'Log In'}
          </button>
        </form>

        <p style={styles.switchText}>
          New to the platform?{' '}
          <span onClick={switchToRegister} style={styles.link}>
            Create an account
          </span>
        </p>
      </div>
    </div>
  );
};

const styles = {
  container: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '100vh',
    backgroundColor: '#f8f9fa',
    fontFamily: 'system-ui, sans-serif',
    direction: 'ltr',
    padding: '20px'
  },
  card: {
    backgroundColor: '#ffffff',
    padding: '40px',
    borderRadius: '16px',
    boxShadow: '0 4px 24px rgba(0, 0, 0, 0.06)',
    width: '100%',
    maxWidth: '440px',
    boxSizing: 'border-box'
  },
  title: {
    margin: '0 0 8px 0',
    fontSize: '28px',
    fontWeight: '700',
    color: '#202125',
    textAlign: 'center'
  },
  subtitle: {
    margin: '0 0 24px 0',
    fontSize: '14px',
    color: '#5e646e',
    textAlign: 'center',
    lineHeight: '1.5'
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px'
  },
  inputGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px'
  },
  label: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#202125'
  },
  input: {
    padding: '12px 16px',
    fontSize: '15px',
    borderRadius: '8px',
    border: '1px solid #e2e4e8',
    backgroundColor: '#f8f9fa',
    outline: 'none',
    transition: 'border-color 0.2s'
  },
  button: {
    padding: '14px',
    fontSize: '16px',
    fontWeight: '600',
    color: '#ffffff',
    backgroundColor: '#009de0',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    transition: 'background-color 0.2s',
    marginTop: '10px'
  },
  errorBox: {
    backgroundColor: '#fdf2f2',
    color: '#ec3e3e',
    padding: '12px',
    borderRadius: '8px',
    fontSize: '14px',
    marginBottom: '20px',
    border: '1px solid #fbd5d5',
    fontWeight: '500'
  },
  switchText: {
    textAlign: 'center',
    fontSize: '14px',
    color: '#5e646e',
    marginTop: '24px',
    marginBottom: '0'
  },
  link: {
    color: '#009de0',
    fontWeight: '600',
    cursor: 'pointer',
    textDecoration: 'none'
  }
};

export default LoginPage;