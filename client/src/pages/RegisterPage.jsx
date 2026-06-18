import { useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { apiRequest } from '../api/client.js';
import ErrorMessage from '../components/ErrorMessage.jsx';

function RegisterPage() {
  const fileInputRef = useRef(null);
  const usernameRef = useRef(null);
  const displayNameRef = useRef(null);
  const passwordRef = useRef(null);
  const confirmPasswordRef = useRef(null);
  const navigate = useNavigate();

  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [imagePreview, setImagePreview] = useState('');
  const [imageName, setImageName] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  function clearFieldError(fieldName) {
    setFieldErrors((currentErrors) => ({ ...currentErrors, [fieldName]: '' }));
    setError('');
  }

  function handleImageChange(event) {
    const file = event.target.files?.[0];

    if (!file) {
      setImagePreview('');
      setImageName('');
      return;
    }

    if (!file.type.startsWith('image/')) {
      setFieldErrors((currentErrors) => ({
        ...currentErrors,
        image: 'Please choose an image file.'
      }));
      setImagePreview('');
      setImageName('');
      return;
    }

    setFieldErrors((currentErrors) => ({ ...currentErrors, image: '' }));
    setImagePreview(URL.createObjectURL(file));
    setImageName(file.name);
  }

  function validateForm() {
    const errors = {};

    if (!username.trim()) {
      errors.username = 'Username is required';
    } else if (username.trim().length < 3) {
      errors.username = 'Username must be at least 3 characters long';
    }

    if (!displayName.trim()) {
      errors.displayName = 'Display name is required';
    } else if (displayName.trim().length < 2) {
      errors.displayName = 'Display name must be at least 2 characters long';
    }

    if (!password) {
      errors.password = 'Password is required';
    } else if (password.length < 8) {
      errors.password = 'Password must be at least 8 characters long';
    } else if (!/[a-zA-Z]/.test(password) || !/[0-9]/.test(password)) {
      errors.password = 'Password must contain both letters and numbers';
    }

    if (!confirmPassword) {
      errors.confirmPassword = 'Please confirm your password';
    } else if (password !== confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
    }

    return errors;
  }

  function focusFirstError(errors) {
    if (errors.username) {
      usernameRef.current?.focus();
      return;
    }

    if (errors.displayName) {
      displayNameRef.current?.focus();
      return;
    }

    if (errors.password) {
      passwordRef.current?.focus();
      return;
    }

    if (errors.confirmPassword) {
      confirmPasswordRef.current?.focus();
    }
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');

    const errors = validateForm();
    setFieldErrors(errors);

    if (Object.keys(errors).length > 0) {
      focusFirstError(errors);
      setError('Please fix the highlighted fields before registering.');
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
      setError(err.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="auth-page">
      <form onSubmit={handleSubmit} className="form-card" noValidate>
        <h1>Create account</h1>
        <p>Register to start using the app.</p>

        <div className="image-picker">
          {imagePreview ? (
            <>
              <img src={imagePreview} alt="Selected profile preview" className="avatar-preview" />
              <button
                type="button"
                className="image-change-button"
                onClick={() => fileInputRef.current?.click()}
                disabled={loading}
              >
                Change photo
              </button>
              <span className="field-helper">{imageName}</span>
            </>
          ) : (
            <>
              <button
                type="button"
                className="avatar-placeholder"
                onClick={() => fileInputRef.current?.click()}
                disabled={loading}
              >
                Add Photo
              </button>
              <span className="field-helper">Optional: choose a profile image from your computer.</span>
            </>
          )}

          {fieldErrors.image && <span className="field-error">{fieldErrors.image}</span>}

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleImageChange}
            className="hidden-input"
            disabled={loading}
          />
        </div>

        <label className="form-field">
          Username
          <input
            ref={usernameRef}
            type="text"
            value={username}
            onChange={(event) => {
              setUsername(event.target.value);
              clearFieldError('username');
            }}
            placeholder="At least 3 characters"
            autoComplete="username"
            disabled={loading}
            aria-invalid={Boolean(fieldErrors.username)}
          />
          <span className={fieldErrors.username ? 'field-error' : 'field-helper'}>
            {fieldErrors.username || 'At least 3 characters.'}
          </span>
        </label>

        <label className="form-field">
          Display name
          <input
            ref={displayNameRef}
            type="text"
            value={displayName}
            onChange={(event) => {
              setDisplayName(event.target.value);
              clearFieldError('displayName');
            }}
            placeholder="Your full name"
            autoComplete="name"
            disabled={loading}
            aria-invalid={Boolean(fieldErrors.displayName)}
          />
          <span className={fieldErrors.displayName ? 'field-error' : 'field-helper'}>
            {fieldErrors.displayName || 'This name will appear in the app header.'}
          </span>
        </label>

        <label className="form-field">
          Password
          <input
            ref={passwordRef}
            type="password"
            value={password}
            onChange={(event) => {
              setPassword(event.target.value);
              clearFieldError('password');
            }}
            placeholder="At least 8 characters, letters and numbers"
            autoComplete="new-password"
            disabled={loading}
            aria-invalid={Boolean(fieldErrors.password)}
          />
          <span className={fieldErrors.password ? 'field-error' : 'field-helper'}>
            {fieldErrors.password || 'Use at least 8 characters with letters and numbers.'}
          </span>
        </label>

        <label className="form-field">
          Confirm password
          <input
            ref={confirmPasswordRef}
            type="password"
            value={confirmPassword}
            onChange={(event) => {
              setConfirmPassword(event.target.value);
              clearFieldError('confirmPassword');
            }}
            placeholder="Repeat password"
            autoComplete="new-password"
            disabled={loading}
            aria-invalid={Boolean(fieldErrors.confirmPassword)}
          />
          <span className={fieldErrors.confirmPassword ? 'field-error' : 'field-helper'}>
            {fieldErrors.confirmPassword || 'Repeat the same password.'}
          </span>
        </label>

        {error && <ErrorMessage message={error} />}

        <button type="submit" className="primary-button" disabled={loading}>
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
