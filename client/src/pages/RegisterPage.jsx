import { useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { apiRequest } from '../api/client.js';

function RegisterPage() {
  const fileInputRef = useRef(null);
  const navigate = useNavigate();

  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [imagePreview, setImagePreview] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  function handleImageChange(event) {
    const file = event.target.files?.[0];

    if (!file) {
      setImagePreview('');
      return;
    }

    setImagePreview(URL.createObjectURL(file));
  }

  function validateForm() {
    if (!username.trim() || !displayName.trim() || !password || !confirmPassword) {
      return 'All fields are required';
    }

    if (username.trim().length < 3) {
      return 'Username must be at least 3 characters long';
    }

    if (password.length < 8) {
      return 'Password must be at least 8 characters long';
    }

    if (!/[a-zA-Z]/.test(password) || !/[0-9]/.test(password)) {
      return 'Password must contain both letters and numbers';
    }

    if (password !== confirmPassword) {
      return 'Passwords do not match';
    }

    return '';
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');

    const validationError = validateForm();

    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);

    try {
      await apiRequest('/users', {
        method: 'POST',
        body: JSON.stringify({
          username: username.trim(),
          password,
          fullName: displayName.trim(),
          phone: '0500000000',
          address: 'Default address'
        })
      });

      navigate('/login');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="auth-page">
      <form onSubmit={handleSubmit} className="form-card">
        <h1>Create account</h1>
        <p>Register to start using the app.</p>

        <div className="image-picker">
          {imagePreview ? (
            <img src={imagePreview} alt="Selected profile preview" className="avatar-preview" />
          ) : (
            <button
              type="button"
              className="avatar-placeholder"
              onClick={() => fileInputRef.current?.click()}
            >
              Add Photo
            </button>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleImageChange}
            className="hidden-input"
            disabled={loading}
          />
        </div>

        <label>
          Username
          <input
            type="text"
            value={username}
            onChange={(event) => setUsername(event.target.value)}
            placeholder="At least 3 characters"
            disabled={loading}
          />
        </label>

        <label>
          Display name
          <input
            type="text"
            value={displayName}
            onChange={(event) => setDisplayName(event.target.value)}
            placeholder="Your full name"
            disabled={loading}
          />
        </label>

        <label>
          Password
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="At least 8 characters, letters and numbers"
            disabled={loading}
          />
        </label>

        <label>
          Confirm password
          <input
            type="password"
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            placeholder="Repeat password"
            disabled={loading}
          />
        </label>

        {error && <p className="error-message">{error}</p>}

        <button type="submit" disabled={loading}>
          {loading ? 'Creating account...' : 'Register'}
        </button>

        <p className="form-footer">
          Already registered? <Link to="/login">Log in</Link>
        </p>
      </form>
    </section>
  );
}

export default RegisterPage;
