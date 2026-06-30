import { useEffect, useState } from 'react';
import {
  addRestaurantEditor,
  getRestaurantAccess,
  removeRestaurantEditor,
  transferRestaurantOwnership
} from '../api/restaurantApi.js';
import { lookupUserByUsername } from '../api/userApi.js';

function getUserDisplayName(user) {
  return user?.fullName?.trim() || user?.username || 'Unknown user';
}

function RestaurantAccessManager({
  restaurant,
  onOwnershipTransferred,
  canTransferOwnership = true
}) {
  const [access, setAccess] = useState(null);
  const [username, setUsername] = useState('');
  const [candidate, setCandidate] = useState(null);
  const [feedback, setFeedback] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isLookingUp, setIsLookingUp] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  async function loadAccess() {
    setIsLoading(true);
    setError('');

    try {
      const data = await getRestaurantAccess(restaurant.id);
      setAccess(data);
    } catch (requestError) {
      setError(
        requestError.message ||
          'Could not load restaurant access information.'
      );
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    setAccess(null);
    setCandidate(null);
    setUsername('');
    setFeedback('');
    setError('');
    loadAccess();
  }, [restaurant.id]);

  async function handleLookup(event) {
    event.preventDefault();

    const normalizedUsername = username.trim();

    if (!normalizedUsername) {
      setError('Enter the username of an existing user.');
      return;
    }

    setIsLookingUp(true);
    setError('');
    setFeedback('');
    setCandidate(null);

    try {
      const user = await lookupUserByUsername(normalizedUsername);
      setCandidate(user);
    } catch (requestError) {
      setError(requestError.message || 'Could not find that user.');
    } finally {
      setIsLookingUp(false);
    }
  }

  async function handleAddEditor() {
    if (!candidate) {
      return;
    }

    setIsSaving(true);
    setError('');
    setFeedback('');

    try {
      const updatedAccess = await addRestaurantEditor(
        restaurant.id,
        candidate.id
      );

      setAccess(updatedAccess);
      setCandidate(null);
      setUsername('');
      setFeedback(
        `${getUserDisplayName(candidate)} now has editor access.`
      );
    } catch (requestError) {
      setError(
        requestError.message || 'Could not grant editor access.'
      );
    } finally {
      setIsSaving(false);
    }
  }

  async function handleRemoveEditor(editor) {
    const shouldRemove = window.confirm(
      `Remove editor access from ${getUserDisplayName(editor)}?`
    );

    if (!shouldRemove) {
      return;
    }

    setIsSaving(true);
    setError('');
    setFeedback('');

    try {
      await removeRestaurantEditor(restaurant.id, editor.id);
      await loadAccess();
      setFeedback(
        `${getUserDisplayName(editor)} no longer has editor access.`
      );
    } catch (requestError) {
      setError(
        requestError.message || 'Could not remove editor access.'
      );
    } finally {
      setIsSaving(false);
    }
  }

  async function handleTransferOwnership() {
    if (!candidate) {
      return;
    }

    const shouldTransfer = window.confirm(
      `Transfer ownership of ${restaurant.name} to ${getUserDisplayName(
        candidate
      )}? You will lose management access immediately.`
    );

    if (!shouldTransfer) {
      return;
    }

    setIsSaving(true);
    setError('');
    setFeedback('');

    try {
      const updatedAccess = await transferRestaurantOwnership(
        restaurant.id,
        candidate.id
      );

      setAccess(updatedAccess);
      setFeedback('Restaurant ownership transferred successfully.');

      if (onOwnershipTransferred) {
        await onOwnershipTransferred(updatedAccess);
      }
    } catch (requestError) {
      setError(
        requestError.message || 'Could not transfer restaurant ownership.'
      );
    } finally {
      setIsSaving(false);
    }
  }

  const editors = Array.isArray(access?.editors)
    ? access.editors
    : [];

  const candidateIsOwner =
    candidate &&
    String(candidate.id) === String(access?.owner?.id);

  const candidateIsEditor =
    candidate &&
    editors.some(
      (editor) => String(editor.id) === String(candidate.id)
    );

  return (
    <section className="restaurant-access-manager">
      <p className="restaurant-access-intro">
        {canTransferOwnership ? (
          <>
            Owners can delegate day-to-day restaurant management to editors.
            Editors can manage details, menus, categories, and statistics, but
            cannot manage access, transfer ownership, or delete the restaurant.
          </>
        ) : (
          <>
            As an administrator, you can add and remove team members. Only the
            restaurant owner can transfer ownership.
          </>
        )}
      </p>

      {isLoading ? (
        <p className="restaurant-access-loading" role="status">
          Loading access information...
        </p>
      ) : (
        <>
          <div className="restaurant-access-owner">
            <span className="restaurant-access-label">Owner</span>
            <strong>
              {access?.owner
                ? getUserDisplayName(access.owner)
                : 'No owner assigned'}
            </strong>
            {access?.owner?.username && (
              <small>@{access.owner.username}</small>
            )}
          </div>

          <div className="restaurant-access-section">
            <div className="restaurant-access-section-heading">
              <div>
                <span className="restaurant-access-label">Editors</span>
                <h3>Team members with management access</h3>
              </div>
              <span className="restaurant-access-editor-count">
                {editors.length}{' '}
                {editors.length === 1 ? 'editor' : 'editors'}
              </span>
            </div>

            {editors.length === 0 ? (
              <p className="restaurant-access-empty">
                No editors have access yet.
              </p>
            ) : (
              <div className="restaurant-access-editor-list">
                {editors.map((editor) => (
                  <div
                    key={editor.id}
                    className="restaurant-access-editor-row"
                  >
                    <div>
                      <strong>{getUserDisplayName(editor)}</strong>
                      <small>@{editor.username}</small>
                    </div>

                    <button
                      type="button"
                      className="management-danger-button"
                      disabled={isSaving}
                      onClick={() => handleRemoveEditor(editor)}
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="restaurant-access-section">
            <span className="restaurant-access-label">
              Find an existing user
            </span>

            <form
              className="restaurant-access-lookup-form"
              onSubmit={handleLookup}
            >
              <input
                type="text"
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                placeholder="Enter an exact username"
                aria-label="Username to grant restaurant access"
                disabled={isLookingUp || isSaving}
              />

              <button
                type="submit"
                className="secondary-button management-secondary-action"
                disabled={isLookingUp || isSaving}
              >
                {isLookingUp ? 'Searching...' : 'Find User'}
              </button>
            </form>

            {candidate && (
              <div className="restaurant-access-candidate">
                <div>
                  <strong>{getUserDisplayName(candidate)}</strong>
                  <small>@{candidate.username}</small>
                </div>

                <div className="restaurant-access-candidate-actions">
                  <button
                    type="button"
                    className="primary-button management-primary-action"
                    disabled={
                      isSaving ||
                      candidateIsOwner ||
                      candidateIsEditor
                    }
                    onClick={handleAddEditor}
                  >
                    {candidateIsOwner
                      ? 'Already Owner'
                      : candidateIsEditor
                        ? 'Already an Editor'
                        : 'Grant Editor Access'}
                  </button>

                  {canTransferOwnership && (
                    <button
                      type="button"
                      className="management-danger-button"
                      disabled={isSaving || candidateIsOwner}
                      onClick={handleTransferOwnership}
                    >
                      Transfer Ownership
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </>
      )}

      {feedback && (
        <p className="restaurant-access-feedback" role="status">
          {feedback}
        </p>
      )}

      {error && (
        <p className="restaurant-access-error" role="alert">
          {error}
        </p>
      )}
    </section>
  );
}

export default RestaurantAccessManager;