import React, { useState, useRef } from 'react';

const RegisterPage = ({ onRegisterSuccess, switchToLogin }) => {
  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [imageString, setImageString] = useState('');
  const [imagePreview, setImagePreview] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const fileInputRef = useRef(null);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImageString(reader.result);
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const validateClientSide = () => {
    if (!username.trim() || !displayName.trim() || !password || !confirmPassword) {
      return 'All fields are required';
    }
    if (username.trim().length < 3) {
      return 'Username must be at least 3 characters long';
    }
    if (password.length < 8) {
      return 'Password must be at least 8 characters long';
    }
    const hasLetter = /[a-zA-Z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    if (!hasLetter || !hasNumber) {
      return 'Password must contain both letters and numbers';
    }
    if (password !== confirmPassword) {
      return 'Passwords do not match';
    }
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const validationError = validateClientSide();
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);

    const payload = {
      username: username.trim(),
      displayName: displayName.trim(),
      password: password,
      image: imageString
    };

    try {
      const response = await fetch('http://localhost:5000/api/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || data.message || 'Registration failed');
      }

      onRegisterSuccess();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h2 style={styles.title}>Join Us</h2>
        <p style={styles.subtitle}>Create your secure account to start placing orders</p>

        {error && <div style={styles.errorBox}>{error}</div>}

        <form onSubmit={handleSubmit} style={styles.form}>
          
          <div style={styles.imageSection}>
            <div style={styles.previewContainer} onClick={() => fileInputRef.current.click()}>
              {imagePreview ? (
                <img src={imagePreview} alt="Preview" style={styles.previewImage} />
              ) : (
                <div style={styles.avatarPlaceholder}>
                  <span style={styles.avatarPlus}>+</span>
                  <span style={styles.avatarText}>Add Photo</span>
                </div>
              )}
            </div>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleImageChange}
              accept="image/*"
              style={styles.fileInput}
              disabled={loading}
            />
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.label}>Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              style={styles.input}
              placeholder="e.g. janesmith"
              disabled={loading}
            />
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.label}>Display Name</label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              style={styles.input}
              placeholder="e.g. Jane Smith"
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
              placeholder="Min. 8 characters, letters & numbers"
              disabled={loading}
            />
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.label}>Confirm Password</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              style={styles.input}
              placeholder="Repeat your password"
              disabled={loading}
            />
          </div>

          <button type="submit" style={styles.button} disabled={loading}>
            {loading ? 'Creating Account...' : 'Register'}
          </button>
        </form>

        <p style={styles.switchText}>
          Already have an account?{' '}
          <span onClick={switchToLogin} style={styles.link}>
            Log in
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
    gap: '18px'
  },
  imageSection: {
    display: 'flex',
    justifyContent: 'center',
    marginBottom: '10px'
  },
  previewContainer: {
    width: '90px',
    height: '90px',
    borderRadius: '50%',
    backgroundColor: '#f1f3f5',
    border: '2px dashed #ced4da',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    cursor: 'pointer',
    overflow: 'hidden',
    transition: 'border-color 0.2s'
  },
  previewImage: {
    width: '100%',
    height: '100%',
    objectFit: 'cover'
  },
  avatarPlaceholder: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    color: '#adb5bd'
  },
  avatarPlus: {
    fontSize: '20px',
    fontWeight: 'bold',
    marginBottom: '2px'
  },
  avatarText: {
    fontSize: '11px',
    fontWeight: '600'
  },
  fileInput: {
    display: 'none'
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

export default RegisterPage;