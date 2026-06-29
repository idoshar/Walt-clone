import { useRef, useState } from 'react';
import ErrorMessage from '../components/ErrorMessage.jsx';
import { updateCurrentUserImage } from '../api/userApi.js';
import { useAuth } from '../context/AuthContext.jsx';

const SUPPORTED_IMAGE_TYPES = new Set([
  'image/png',
  'image/jpeg',
  'image/webp',
  'image/heic'
]);

const MAX_IMAGE_SIZE_BYTES = 2 * 1024 * 1024;

function getUserLabel(user) {
  return user?.fullName || user?.displayName || user?.username || 'Signed in';
}

function ProfilePage() {
  const fileInputRef = useRef(null);
  const { user, updateUser } = useAuth();

  const [pendingImage, setPendingImage] = useState(null);
  const [selectedFileName, setSelectedFileName] = useState('');
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const currentImage = user?.image || '';
  const previewImage = pendingImage ?? currentImage;
  const userLabel = getUserLabel(user);
  const initial = userLabel.charAt(0).toUpperCase();

  function clearFeedback() {
    setError('');
    setSuccessMessage('');
  }

  function discardSelectedImage() {
    setPendingImage(null);
    setSelectedFileName('');
    clearFeedback();
  }

  function handleImageSelection(event) {
    const file = event.target.files?.[0];

    event.target.value = '';

    if (!file) {
      return;
    }

    clearFeedback();

    if (!SUPPORTED_IMAGE_TYPES.has(file.type)) {
      setError('Choose a PNG, JPEG, WebP, or HEIC image.');
      return;
    }

    if (file.size > MAX_IMAGE_SIZE_BYTES) {
      setError('Choose an image smaller than 3 MB.');
      return;
    }

    const reader = new FileReader();

    reader.onload = () => {
      if (typeof reader.result !== 'string') {
        setError('The selected image could not be read.');
        return;
      }

      setPendingImage(reader.result);
      setSelectedFileName(file.name);
    };

    reader.onerror = () => {
      setError('The selected image could not be read.');
    };

    reader.readAsDataURL(file);
  }

  async function saveImage(image, successText) {
    setLoading(true);
    clearFeedback();

    try {
      const updatedUser = await updateCurrentUserImage(image);

      if (!updatedUser?.id) {
        throw new Error('The server returned an invalid profile response.');
      }

      updateUser(updatedUser);
      setPendingImage(null);
      setSelectedFileName('');
      setSuccessMessage(successText);
    } catch (requestError) {
      setError(
        requestError.message ||
          'Your profile image could not be updated. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleSaveImage() {
    if (pendingImage === null) {
      return;
    }

    await saveImage(pendingImage, 'Profile photo updated.');
  }

  async function handleRemoveImage() {
    await saveImage('', 'Profile photo removed.');
  }

  return (
    <section className="page-container profile-page">
      <div className="profile-page-heading">
        <div>
          <h1>Your profile</h1>
          <p className="page-subtitle">
            Manage the photo shown in your account area.
          </p>
        </div>
      </div>

      <section className="profile-card" aria-label="Profile image settings">
        <div className="profile-summary">
          {previewImage ? (
            <img
              src={previewImage}
              alt=""
              className="profile-avatar-image"
            />
          ) : (
            <span className="profile-avatar-placeholder" aria-hidden="true">
              {initial}
            </span>
          )}

          <div className="profile-summary-details">
            <h2>{userLabel}</h2>
            <p>@{user?.username || 'account'}</p>
            <span className="profile-role-label">
              {user?.role || 'customer'}
            </span>
          </div>
        </div>

        <div className="profile-image-section">
          <div>
            <h2>Profile photo</h2>
            <p>
              Upload a PNG, JPEG, WebP, or HEIC image up to 2 MB. Your photo
              appears in the application header.
            </p>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp,image/heic"
            className="hidden-input"
            onChange={handleImageSelection}
            disabled={loading}
          />

          <div className="profile-actions">
            <button
              type="button"
              className="primary-button"
              onClick={() => fileInputRef.current?.click()}
              disabled={loading}
            >
              {previewImage ? 'Choose another photo' : 'Choose photo'}
            </button>

            {pendingImage !== null ? (
              <>
                <button
                  type="button"
                  className="secondary-button"
                  onClick={handleSaveImage}
                  disabled={loading}
                >
                  {loading ? 'Saving...' : 'Save photo'}
                </button>

                <button
                  type="button"
                  className="text-button"
                  onClick={discardSelectedImage}
                  disabled={loading}
                >
                  Discard selection
                </button>
              </>
            ) : currentImage ? (
              <button
                type="button"
                className="danger-button"
                onClick={handleRemoveImage}
                disabled={loading}
              >
                {loading ? 'Removing...' : 'Remove photo'}
              </button>
            ) : null}
          </div>

          {selectedFileName ? (
            <p className="profile-file-name">Selected: {selectedFileName}</p>
          ) : null}

          {error ? <ErrorMessage message={error} /> : null}

          {successMessage ? (
            <p className="profile-success-message" role="status">
              {successMessage}
            </p>
          ) : null}
        </div>
      </section>
    </section>
  );
}

export default ProfilePage;
