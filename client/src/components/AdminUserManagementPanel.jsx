import { useCallback, useEffect, useState } from 'react';
import {
  deleteAdminUser,
  getAdminUsers,
  resetAdminUserPassword,
  updateAdminUserRole,
  updateAdminUserStatus
} from '../api/adminUserManagementApi.js';

function getDisplayName(user) {
  return user.fullName || user.username || 'Unknown user';
}

function getInitials(user) {
  const source = getDisplayName(user).trim();

  if (!source) {
    return '?';
  }

  return source
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase();
}

function formatRole(role) {
  if (role === 'admin') {
    return 'Administrator';
  }

  if (role === 'owner') {
    return 'Restaurant owner';
  }

  return 'Customer';
}

function formatDate(value) {
  if (!value) {
    return 'Unknown';
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return 'Unknown';
  }

  return date.toLocaleDateString();
}

function AdminUserManagementPanel({ onOpenPasswordResetRequests }) {
  const [users, setUsers] = useState([]);
  const [searchInput, setSearchInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [pendingKey, setPendingKey] = useState('');
  const [error, setError] = useState('');
  const [actionError, setActionError] = useState({
    userId: '',
    message: ''
  });
  const [notice, setNotice] = useState('');
  const [resetUser, setResetUser] = useState(null);
  const [temporaryPassword, setTemporaryPassword] = useState('');

  const loadUsers = useCallback(async (query = '', { silent = false } = {}) => {
    if (!silent) {
      setIsLoading(true);
    }

    setError('');

    try {
      const data = await getAdminUsers(query);
      setUsers(Array.isArray(data) ? data : []);
    } catch (loadError) {
      setError(
        loadError.message ||
          'Could not load users for administrator management.'
      );
    } finally {
      if (!silent) {
        setIsLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  const isBusy = Boolean(pendingKey);

  async function runAction(
    actionKey,
    callback,
    successMessage,
    affectedUserId = ''
  ) {
    setPendingKey(actionKey);
    setError('');
    setActionError({
      userId: '',
      message: ''
    });
    setNotice('');

    try {
      await callback();
      await loadUsers(searchQuery, { silent: true });
      setNotice(successMessage);
      return true;
    } catch (requestError) {
      setActionError({
        userId: affectedUserId,
        message: requestError.message || 'Could not complete this action.'
      });
      return false;
    } finally {
      setPendingKey('');
    }
  }

  async function handleSearch(event) {
    event.preventDefault();

    const nextQuery = searchInput.trim();

    setSearchQuery(nextQuery);
    setActionError({
      userId: '',
      message: ''
    });
    setNotice('');
    await loadUsers(nextQuery);
  }

  async function handleStatusChange(user) {
    const nextStatus = user.isActive !== true;
    const actionLabel = nextStatus ? 'reactivate' : 'deactivate';

    const shouldContinue = window.confirm(
      `${nextStatus ? 'Reactivate' : 'Deactivate'} ${getDisplayName(user)}?` +
        (nextStatus
          ? ''
          : '\n\nTheir active sessions will be invalidated immediately.')
    );

    if (!shouldContinue) {
      return;
    }

    await runAction(
      `status:${user.id}`,
      () => updateAdminUserStatus(user.id, nextStatus),
      `${getDisplayName(user)} was ${actionLabel}d.`,
      user.id
    );
  }

  async function handleRoleChange(user) {
    const nextRole = user.role === 'admin' ? 'customer' : 'admin';
    const actionLabel =
      nextRole === 'admin' ? 'promote to administrator' : 'demote to customer';

    const shouldContinue = window.confirm(
      `${actionLabel[0].toUpperCase()}${actionLabel.slice(1)}: ${getDisplayName(
        user
      )}?\n\nTheir active sessions will be invalidated.`
    );

    if (!shouldContinue) {
      return;
    }

    await runAction(
      `role:${user.id}`,
      () => updateAdminUserRole(user.id, nextRole),
      `${getDisplayName(user)} is now a ${formatRole(nextRole).toLowerCase()}.`,
      user.id
    );
  }

  async function handleDelete(user) {
    const shouldContinue = window.confirm(
      `Delete ${getDisplayName(user)} permanently?\n\n` +
        'Deletion is allowed only when the account has no orders and owns no restaurants.'
    );

    if (!shouldContinue) {
      return;
    }

    await runAction(
      `delete:${user.id}`,
      () => deleteAdminUser(user.id),
      `${getDisplayName(user)} was deleted permanently.`,
      user.id
    );
  }

  async function handlePasswordReset(event) {
    event.preventDefault();

    if (!resetUser) {
      return;
    }

    if (!temporaryPassword.trim()) {
      setError('A temporary password is required.');
      return;
    }

    const didReset = await runAction(
      `password:${resetUser.id}`,
      () => resetAdminUserPassword(resetUser.id, temporaryPassword),
      `Temporary password set for ${getDisplayName(
        resetUser
      )}. They must change it after signing in.`,
      resetUser.id
    );

    setTemporaryPassword('');

    if (didReset) {
      setResetUser(null);
    }
  }

  function openPasswordReset(user) {
    setError('');
    setActionError({
      userId: '',
      message: ''
    });
    setNotice('');
    setTemporaryPassword('');
    setResetUser(user);
  }

  function closePasswordReset() {
    if (isBusy) {
      return;
    }

    setActionError({
      userId: '',
      message: ''
    });
    setTemporaryPassword('');
    setResetUser(null);
  }

  return (
    <section style={styles.panel} aria-labelledby="user-management-heading">
      <div style={styles.heading}>
        <div>
          <p style={styles.eyebrow}>ADMINISTRATION</p>
          <h2 id="user-management-heading" style={styles.title}>
            User account management
          </h2>
          <p style={styles.description}>
            Search platform accounts and manage access, administrator roles,
            temporary password resets and eligible account deletion.
          </p>
        </div>

        <div style={styles.headingActions}>
          <button
            type="button"
            style={styles.passwordRequestsButton}
            onClick={onOpenPasswordResetRequests}
            disabled={isBusy}
          >
            Password reset requests
          </button>

          <button
            type="button"
            style={styles.refreshButton}
            onClick={() => loadUsers(searchQuery)}
            disabled={isLoading || isBusy}
          >
            {isLoading ? 'Loading…' : 'Refresh users'}
          </button>
        </div>
      </div>

      <form style={styles.searchForm} onSubmit={handleSearch}>
        <label style={styles.searchLabel} htmlFor="admin-user-search">
          Search users
        </label>

        <div style={styles.searchControls}>
          <input
            id="admin-user-search"
            type="search"
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
            placeholder="Name, username, phone, address or role"
            style={styles.searchInput}
          />

          <button type="submit" style={styles.searchButton} disabled={isLoading || isBusy}>
            Search
          </button>
        </div>
      </form>

      {notice ? (
        <p style={styles.notice} role="status">
          {notice}
        </p>
      ) : null}

      {error ? (
        <p style={styles.error} role="alert">
          {error}
        </p>
      ) : null}

      {resetUser ? (
        <div
          style={styles.modalBackdrop}
          onClick={(event) => {
            if (event.target === event.currentTarget) {
              closePasswordReset();
            }
          }}
        >
          <div
            aria-labelledby="temporary-password-dialog-title"
            aria-modal="true"
            role="dialog"
            style={styles.modal}
          >
            <form style={styles.modalForm} onSubmit={handlePasswordReset}>
              <div>
                <p style={styles.eyebrow}>SECURE ACCESS RECOVERY</p>
                <h3
                  id="temporary-password-dialog-title"
                  style={styles.resetTitle}
                >
                  Set temporary password
                </h3>
                <p style={styles.resetDescription}>
                  Set a temporary password for {getDisplayName(resetUser)}.
                  They will be signed out and must choose a new password after
                  their next login.
                </p>
              </div>

              {actionError.userId === resetUser.id ? (
                <p style={styles.modalError} role="alert">
                  {actionError.message}
                </p>
              ) : null}

              <label
                style={styles.passwordLabel}
                htmlFor="admin-temporary-password"
              >
                Temporary password
              </label>

              <input
                id="admin-temporary-password"
                type="password"
                value={temporaryPassword}
                onChange={(event) => setTemporaryPassword(event.target.value)}
                autoComplete="new-password"
                autoFocus
                minLength="8"
                placeholder="At least 8 characters, letters and numbers"
                style={styles.passwordInput}
                disabled={isBusy}
              />

              <div style={styles.resetActions}>
                <button
                  type="submit"
                  style={styles.primaryAction}
                  disabled={isBusy}
                >
                  {pendingKey === `password:${resetUser.id}`
                    ? 'Saving…'
                    : 'Set temporary password'}
                </button>

                <button
                  type="button"
                  style={styles.secondaryAction}
                  onClick={closePasswordReset}
                  disabled={isBusy}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      {isLoading ? (
        <div style={styles.emptyState}>Loading user accounts…</div>
      ) : users.length === 0 ? (
        <div style={styles.emptyState}>
          No users match the current search.
        </div>
      ) : (
        <div style={styles.userList}>
          {users.map((user) => {
            const isSelf = user.protection?.isSelf === true;
            const isFinalActiveAdmin =
              user.protection?.isFinalActiveAdmin === true;
            const canChangeStatus =
              !isSelf && !(user.isActive === true && isFinalActiveAdmin);
            const canChangeRole =
              !isSelf &&
              user.role !== 'owner' &&
              !(user.role === 'admin' &&
                user.isActive === true &&
                isFinalActiveAdmin);
            const canResetPassword = !isSelf;
            const canDelete = !isSelf && user.role !== 'admin';
            const isUserPending = pendingKey.includes(`:${user.id}`);

            return (
              <article key={user.id} style={styles.userCard}>
                <div style={styles.userSummary}>
                  {user.image ? (
                    <img
                      src={user.image}
                      alt=""
                      style={styles.avatarImage}
                    />
                  ) : (
                    <div style={styles.avatarFallback} aria-hidden="true">
                      {getInitials(user)}
                    </div>
                  )}

                  <div style={styles.userDetails}>
                    <div style={styles.nameRow}>
                      <h3 style={styles.userName}>{getDisplayName(user)}</h3>

                      <span
                        style={{
                          ...styles.badge,
                          ...(user.isActive ? styles.activeBadge : styles.inactiveBadge)
                        }}
                      >
                        {user.isActive ? 'Active' : 'Deactivated'}
                      </span>

                      <span style={styles.roleBadge}>
                        {formatRole(user.role)}
                      </span>
                    </div>

                    <p style={styles.username}>@{user.username}</p>

                    <p style={styles.meta}>
                      {user.phone || 'No phone'} · Joined {formatDate(user.createdAt)}
                    </p>

                    {user.mustChangePassword ? (
                      <p style={styles.passwordRequired}>
                        Password change required at next login.
                      </p>
                    ) : null}

                    {isSelf ? (
                      <p style={styles.protectionNote}>
                        Your own account is protected from administrator actions.
                      </p>
                    ) : null}

                    {isFinalActiveAdmin ? (
                      <p style={styles.protectionNote}>
                        Final active administrator: deactivation and demotion are protected.
                      </p>
                    ) : null}

                    {user.role === 'owner' ? (
                      <p style={styles.protectionNote}>
                        Owner roles are managed through restaurant ownership.
                      </p>
                    ) : null}
                  </div>
                </div>

                <div style={styles.actionGroup}>
                  <button
                    type="button"
                    style={styles.secondaryAction}
                    onClick={() => handleStatusChange(user)}
                    disabled={!canChangeStatus || isBusy}
                  >
                    {isUserPending && pendingKey === `status:${user.id}`
                      ? 'Saving…'
                      : user.isActive
                        ? 'Deactivate'
                        : 'Reactivate'}
                  </button>

                  {user.role !== 'owner' ? (
                    <button
                      type="button"
                      style={styles.secondaryAction}
                      onClick={() => handleRoleChange(user)}
                      disabled={!canChangeRole || isBusy}
                    >
                      {isUserPending && pendingKey === `role:${user.id}`
                        ? 'Saving…'
                        : user.role === 'admin'
                          ? 'Demote to customer'
                          : 'Promote to admin'}
                    </button>
                  ) : null}

                  <button
                    type="button"
                    style={styles.secondaryAction}
                    onClick={() => openPasswordReset(user)}
                    disabled={!canResetPassword || isBusy}
                  >
                    Reset password
                  </button>

                  <button
                    type="button"
                    style={styles.dangerAction}
                    onClick={() => handleDelete(user)}
                    disabled={!canDelete || isBusy}
                  >
                    {isUserPending && pendingKey === `delete:${user.id}`
                      ? 'Deleting…'
                      : 'Delete account'}
                  </button>
                </div>

                {actionError.userId === user.id ? (
                  <p style={styles.inlineActionError} role="alert">
                    {actionError.message}
                  </p>
                ) : null}
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}

const styles = {
  panel: {
    background: 'var(--color-surface)',
    border: '1px solid var(--color-border)',
    borderRadius: '20px',
    marginTop: '28px',
    padding: '24px'
  },
  heading: {
    alignItems: 'flex-start',
    display: 'flex',
    flexWrap: 'wrap',
    gap: '18px',
    justifyContent: 'space-between'
  },
  eyebrow: {
    color: 'var(--color-primary)',
    fontSize: '0.78rem',
    fontWeight: 800,
    letterSpacing: '0.12em',
    margin: 0
  },
  title: {
    fontSize: '1.45rem',
    margin: '7px 0 10px'
  },
  description: {
    color: 'var(--color-text-muted)',
    lineHeight: 1.55,
    margin: 0,
    maxWidth: '720px'
  },
  headingActions: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '10px'
  },
  passwordRequestsButton: {
    background: 'var(--color-surface)',
    border: '1px solid var(--color-border)',
    borderRadius: '10px',
    color: 'var(--color-text)',
    cursor: 'pointer',
    fontWeight: 800,
    padding: '10px 13px'
  },
  refreshButton: {
    background: 'var(--color-info-bg)',
    border: '1px solid var(--color-border)',
    borderRadius: '10px',
    color: 'var(--color-primary)',
    cursor: 'pointer',
    fontWeight: 800,
    padding: '10px 13px'
  },
  searchForm: {
    borderTop: '1px solid var(--color-border)',
    marginTop: '22px',
    paddingTop: '20px'
  },
  searchLabel: {
    display: 'block',
    fontSize: '0.84rem',
    fontWeight: 800,
    marginBottom: '8px'
  },
  searchControls: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '10px'
  },
  searchInput: {
    background: 'var(--color-background)',
    border: '1px solid var(--color-border)',
    borderRadius: '10px',
    color: 'var(--color-text)',
    flex: '1 1 270px',
    font: 'inherit',
    minWidth: 0,
    padding: '11px 12px'
  },
  searchButton: {
    background: 'var(--color-primary)',
    border: '1px solid var(--color-primary)',
    borderRadius: '10px',
    color: '#ffffff',
    cursor: 'pointer',
    fontWeight: 800,
    padding: '11px 16px'
  },
  notice: {
    background: 'var(--color-info-bg)',
    borderRadius: '10px',
    color: 'var(--color-primary)',
    fontWeight: 700,
    margin: '18px 0 0',
    padding: '12px'
  },
  error: {
    background: 'var(--color-error-bg)',
    borderRadius: '10px',
    color: 'var(--color-error)',
    fontWeight: 700,
    margin: '18px 0 0',
    padding: '12px'
  },
  modalBackdrop: {
    alignItems: 'center',
    background: 'rgba(0, 0, 0, 0.58)',
    display: 'flex',
    inset: 0,
    justifyContent: 'center',
    padding: '20px',
    position: 'fixed',
    zIndex: 1200
  },
  modal: {
    background: 'var(--color-surface)',
    border: '1px solid var(--color-border)',
    borderRadius: '18px',
    boxShadow: '0 20px 56px rgba(0, 0, 0, 0.38)',
    maxHeight: 'calc(100vh - 40px)',
    maxWidth: '560px',
    overflowY: 'auto',
    padding: '24px',
    width: '100%'
  },
  modalForm: {
    display: 'grid',
    gap: '12px'
  },
  resetTitle: {
    fontSize: '1rem',
    fontWeight: 800,
    margin: 0
  },
  resetDescription: {
    color: 'var(--color-text-muted)',
    lineHeight: 1.45,
    margin: '7px 0 0'
  },
  modalError: {
    background: 'var(--color-error-bg)',
    borderRadius: '10px',
    color: 'var(--color-error)',
    fontWeight: 700,
    margin: 0,
    padding: '11px'
  },
  passwordLabel: {
    fontSize: '0.84rem',
    fontWeight: 800,
    marginTop: '4px'
  },
  passwordInput: {
    background: 'var(--color-surface)',
    border: '1px solid var(--color-border)',
    borderRadius: '10px',
    color: 'var(--color-text)',
    font: 'inherit',
    padding: '11px 12px'
  },
  resetActions: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '10px',
    marginTop: '4px'
  },
  userList: {
    display: 'grid',
    gap: '14px',
    marginTop: '20px'
  },
  userCard: {
    border: '1px solid var(--color-border)',
    borderRadius: '16px',
    display: 'flex',
    flexWrap: 'wrap',
    gap: '18px',
    justifyContent: 'space-between',
    padding: '18px'
  },
  userSummary: {
    display: 'flex',
    flex: '1 1 430px',
    gap: '13px',
    minWidth: 0
  },
  avatarImage: {
    borderRadius: '50%',
    flex: '0 0 auto',
    height: '46px',
    objectFit: 'cover',
    width: '46px'
  },
  avatarFallback: {
    alignItems: 'center',
    background: 'var(--color-info-bg)',
    borderRadius: '50%',
    color: 'var(--color-primary)',
    display: 'flex',
    flex: '0 0 auto',
    fontSize: '0.9rem',
    fontWeight: 800,
    height: '46px',
    justifyContent: 'center',
    width: '46px'
  },
  userDetails: {
    minWidth: 0
  },
  nameRow: {
    alignItems: 'center',
    display: 'flex',
    flexWrap: 'wrap',
    gap: '7px'
  },
  userName: {
    fontSize: '1rem',
    margin: 0
  },
  badge: {
    borderRadius: '999px',
    fontSize: '0.72rem',
    fontWeight: 800,
    padding: '5px 8px',
    whiteSpace: 'nowrap'
  },
  activeBadge: {
    background: 'var(--color-success-bg)',
    color: 'var(--color-success)'
  },
  inactiveBadge: {
    background: 'var(--color-error-bg)',
    color: 'var(--color-error)'
  },
  roleBadge: {
    background: 'var(--color-info-bg)',
    borderRadius: '999px',
    color: 'var(--color-primary)',
    fontSize: '0.72rem',
    fontWeight: 800,
    padding: '5px 8px',
    whiteSpace: 'nowrap'
  },
  username: {
    color: 'var(--color-text-muted)',
    margin: '4px 0 0'
  },
  meta: {
    color: 'var(--color-text-muted)',
    fontSize: '0.86rem',
    lineHeight: 1.45,
    margin: '7px 0 0'
  },
  passwordRequired: {
    color: 'var(--color-primary)',
    fontSize: '0.84rem',
    fontWeight: 700,
    margin: '8px 0 0'
  },
  protectionNote: {
    color: 'var(--color-text-muted)',
    fontSize: '0.8rem',
    lineHeight: 1.4,
    margin: '8px 0 0'
  },
  actionGroup: {
    alignContent: 'flex-start',
    display: 'flex',
    flex: '1 1 250px',
    flexWrap: 'wrap',
    gap: '8px',
    justifyContent: 'flex-end'
  },
  primaryAction: {
    background: 'var(--color-primary)',
    border: '1px solid var(--color-primary)',
    borderRadius: '9px',
    color: '#ffffff',
    cursor: 'pointer',
    fontWeight: 800,
    padding: '9px 11px'
  },
  secondaryAction: {
    background: 'var(--color-surface)',
    border: '1px solid var(--color-border)',
    borderRadius: '9px',
    color: 'var(--color-text)',
    cursor: 'pointer',
    fontWeight: 700,
    padding: '9px 11px'
  },
  dangerAction: {
    background: 'var(--color-error-bg)',
    border: '1px solid var(--color-error)',
    borderRadius: '9px',
    color: 'var(--color-error)',
    cursor: 'pointer',
    fontWeight: 800,
    padding: '9px 11px'
  },
  inlineActionError: {
    background: 'var(--color-error-bg)',
    borderRadius: '9px',
    color: 'var(--color-error)',
    flexBasis: '100%',
    fontSize: '0.86rem',
    fontWeight: 700,
    lineHeight: 1.4,
    margin: 0,
    padding: '10px 11px'
  },
  emptyState: {
    color: 'var(--color-text-muted)',
    padding: '28px 0 6px',
    textAlign: 'center'
  }
};

export default AdminUserManagementPanel;
