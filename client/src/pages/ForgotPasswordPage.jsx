import { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import ErrorMessage from '../components/ErrorMessage.jsx';
import { submitPasswordResetRequest } from '../api/passwordResetRequestApi.js';

function ForgotPasswordPage() {
  const usernameRef = useRef(null);

  const [username, setUsername] = useState('');
  const [fieldError, setFieldError] = useState('');
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [loading, setLoading] = useState(false);

  function handleUsernameChange(event) {
    setUsername(event.target.value);
    setFieldError('');
    setError('');
    setSuccessMessage('');
  }

  async function handleSubmit(event) {
    event.preventDefault();

    const normalizedUsername = username.trim();

    setError('');
    setSuccessMessage('');

    if (!normalizedUsername) {
      setFieldError('Username is required.');
      usernameRef.current?.focus();
      return;
    }

    setFieldError('');
    setLoading(true);

    try {
      const data = await submitPasswordResetRequest(normalizedUsername);

      setSuccessMessage(
        data?.message ||
          'If an active account matches the supplied username, an administrator can review the request.'
      );
    } catch (requestError) {
      setError(
        requestError.message ||
          'Could not submit the password-reset request. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="auth-page">
      <form onSubmit={handleSubmit} className="form-card" noValidate>
        <h1>Request password reset</h1>

        <p>
          Enter your username. For security, the same response is shown whether
          or not an account matches it.
        </p>

        <label className="form-field">
          Username

          <input
            ref={usernameRef}
            type="text"
            value={username}
            onChange={handleUsernameChange}
            placeholder="Enter username"
            autoComplete="username"
            disabled={loading}
            aria-invalid={Boolean(fieldError)}
          />

          <span className={fieldError ? 'field-error' : 'field-helper'}>
            {fieldError ||
              'An administrator will review a matching active account request.'}
          </span>
        </label>

        {error ? <ErrorMessage message={error} /> : null}

        {successMessage ? (
          <div
            role="status"
            style={{
              background: 'var(--color-info-bg)',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-md)',
              color: 'var(--color-text)',
              lineHeight: 1.5,
              padding: '12px 14px'
            }}
          >
            {successMessage}
          </div>
        ) : null}

        <button type="submit" className="primary-button" disabled={loading}>
          {loading ? 'Submitting request...' : 'Request password reset'}
        </button>

        <p className="form-footer">
          <Link to="/login">Back to login</Link>
          <br />
          New user? <Link to="/register">Create account</Link>
        </p>
      </form>
    </section>
  );
}

export default ForgotPasswordPage;