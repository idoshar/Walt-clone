import { Link } from 'react-router-dom';
import { useEffect, useRef, useState } from 'react';
import ErrorMessage from '../components/ErrorMessage.jsx';
import {
  updateCurrentUserImage,
  updateCurrentUserProfile
} from '../api/userApi.js';
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
  const [fullName, setFullName] = useState(user?.fullName || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [address, setAddress] = useState(user?.address || '');
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isImageSaving, setIsImageSaving] = useState(false);
  const [isDetailsSaving, setIsDetailsSaving] = useState(false);

  const currentImage = user?.image || '';
  const previewImage = pendingImage ?? currentImage;
  const userLabel = getUserLabel(user);
  const initial = userLabel.charAt(0).toUpperCase();

  useEffect(() => {
    setFullName(user?.fullName || '');
    setPhone(user?.phone || '');
    setAddress(user?.address || '');
  }, [user?.address, user?.fullName, user?.phone]);

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
    setIsImageSaving(true);
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
      setIsImageSaving(false);
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

  async function handleSaveDetails(event) {
    event.preventDefault();
    clearFeedback();

    const profile = {
      fullName: fullName.trim(),
      phone: phone.trim(),
      address: address.trim()
    };

    if (!profile.fullName || !profile.phone || !profile.address) {
      setError('Full name, phone number, and address are required.');
      return;
    }

    setIsDetailsSaving(true);

    try {
      const updatedUser = await updateCurrentUserProfile(profile);

      if (!updatedUser?.id) {
        throw new Error('The server returned an invalid profile response.');
      }

      updateUser(updatedUser);
      setSuccessMessage('Profile details updated.');
    } catch (requestError) {
      setError(
        requestError.message ||
          'Your profile details could not be updated. Please try again.'
      );
    } finally {
      setIsDetailsSaving(false);
    }
  }

  return (
    <section className="page-container profile-page">
      <div className="profile-page-heading">
        <div>
          <h1>Your profile</h1>
          <p className="page-subtitle">
            Keep your account details, password, and profile photo up to date.
          </p>
        </div>
      </div>

      <section className="profile-card" aria-label="Profile settings">
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

        <section className="profile-details-section" aria-labelledby="profile-details-heading">
          <div>
            <h2 id="profile-details-heading">Account details</h2>
            <p>
              Keep your name and delivery contact details accurate for future orders.
            </p>
          </div>

          <form className="profile-details-form" onSubmit={handleSaveDetails}>
            <label className="profile-field">
              Full name
              <input
                type="text"
                value={fullName}
                onChange={(event) => setFullName(event.target.value)}
                autoComplete="name"
                disabled={isDetailsSaving}
              />
            </label>

            <label className="profile-field">
              Phone number
              <input
                type="tel"
                value={phone}
                onChange={(event) => setPhone(event.target.value)}
                autoComplete="tel"
                disabled={isDetailsSaving}
              />
            </label>

            <label className="profile-field profile-field-wide">
              Address
              <input
                type="text"
                value={address}
                onChange={(event) => setAddress(event.target.value)}
                autoComplete="street-address"
                disabled={isDetailsSaving}
              />
            </label>

            <div className="profile-details-actions">
              <button
                type="submit"
                className="primary-button"
                disabled={isDetailsSaving}
              >
                {isDetailsSaving ? 'Saving details...' : 'Save details'}
              </button>
            </div>
          </form>
        </section>

        <section className="profile-security-section" aria-labelledby="profile-security-heading">
          <div>
            <h2 id="profile-security-heading">Password</h2>
            <p>Use a unique password with at least eight characters, letters, and numbers.</p>
          </div>

          <Link to="/change-password" className="secondary-button profile-password-link">
            Change password
          </Link>
        </section>

        <section className="profile-image-section" aria-labelledby="profile-photo-heading">
          <div>
            <h2 id="profile-photo-heading">Profile photo</h2>
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
            disabled={isImageSaving}
          />

          <div className="profile-actions">
            <button
              type="button"
              className="primary-button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isImageSaving}
            >
              {previewImage ? 'Choose another photo' : 'Choose photo'}
            </button>

            {pendingImage !== null ? (
              <>
                <button
                  type="button"
                  className="secondary-button"
                  onClick={handleSaveImage}
                  disabled={isImageSaving}
                >
                  {isImageSaving ? 'Saving...' : 'Save photo'}
                </button>

                <button
                  type="button"
                  className="text-button"
                  onClick={discardSelectedImage}
                  disabled={isImageSaving}
                >
                  Discard selection
                </button>
              </>
            ) : currentImage ? (
              <button
                type="button"
                className="danger-button"
                onClick={handleRemoveImage}
                disabled={isImageSaving}
              >
                {isImageSaving ? 'Removing...' : 'Remove photo'}
              </button>
            ) : null}
          </div>

          {selectedFileName ? (
            <p className="profile-file-name">Selected: {selectedFileName}</p>
          ) : null}
        </section>

        {error ? <ErrorMessage message={error} /> : null}

        {successMessage ? (
          <p className="profile-success-message" role="status">
            {successMessage}
          </p>
        ) : null}
      </section>
    </section>
  );
}

export default ProfilePage;
