import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import {
  approveAdminPasswordResetRequest,
  getAdminPasswordResetRequests,
  rejectAdminPasswordResetRequest
} from '../api/adminUserManagementApi.js';

function getDisplayName(user) {
  return user?.fullName || user?.username || 'Unknown user';
}

function formatDate(value) {
  if (!value) {
    return 'Unknown';
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return 'Unknown';
  }

  return date.toLocaleString();
}

function AdminPasswordResetRequestsPanel() {
  const { user: currentUser } = useAuth();

  const [requests, setRequests] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [pendingKey, setPendingKey] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [approvalRequest, setApprovalRequest] = useState(null);
  const [temporaryPassword, setTemporaryPassword] = useState('');

  const isBusy = Boolean(pendingKey);

  const loadRequests = useCallback(async ({ silent = false } = {}) => {
    if (!silent) {
      setIsLoading(true);
    }

    setError('');

    try {
      const data = await getAdminPasswordResetRequests('pending');
      setRequests(Array.isArray(data) ? data : []);
    } catch (loadError) {
      setError(
        loadError.message ||
          'Could not load pending password-reset requests.'
      );
    } finally {
      if (!silent) {
        setIsLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    loadRequests();
  }, [loadRequests]);

  async function runAction(actionKey, callback, successMessage) {
    setPendingKey(actionKey);
    setError('');
    setNotice('');

    try {
      await callback();
      await loadRequests({ silent: true });
      setNotice(successMessage);
      return true;
    } catch (requestError) {
      setError(
        requestError.message || 'Could not complete the password-reset action.'
      );
      return false;
    } finally {
      setPendingKey('');
    }
  }

  function openApproval(request) {
    setError('');
    setNotice('');
    setTemporaryPassword('');
    setApprovalRequest(request);
  }

  function closeApproval() {
    if (isBusy) {
      return;
    }

    setTemporaryPassword('');
    setApprovalRequest(null);
  }

  async function handleApproval(event) {
    event.preventDefault();

    if (!approvalRequest) {
      return;
    }

    if (!temporaryPassword.trim()) {
      setError('A temporary password is required.');
      return;
    }

    const targetName = getDisplayName(approvalRequest.user);

    const didApprove = await runAction(
      `approve:${approvalRequest.id}`,
      () =>
        approveAdminPasswordResetRequest(
          approvalRequest.id,
          temporaryPassword
        ),
      `Password-reset request approved for ${targetName}. They must change the temporary password after signing in.`
    );

    setTemporaryPassword('');

    if (didApprove) {
      setApprovalRequest(null);
    }
  }

  async function handleReject(request) {
    const targetName = getDisplayName(request.user);

    const shouldContinue = window.confirm(
      `Reject the password-reset request for ${targetName}?`
    );

    if (!shouldContinue) {
      return;
    }

    await runAction(
      `reject:${request.id}`,
      () => rejectAdminPasswordResetRequest(request.id),
      `Password-reset request rejected for ${targetName}.`
    );
  }

  return (
    <section style={styles.panel} aria-labelledby="password-reset-heading">
      <div style={styles.heading}>
        <div>
          <p style={styles.eyebrow}>ACCOUNT RECOVERY</p>

          <h2 id="password-reset-heading" style={styles.title}>
            Password-reset requests
          </h2>

          <p style={styles.description}>
            Review password-reset requests submitted by active users. Approving
            a request signs the user out, sets a temporary password and requires
            a password change at their next sign-in.
          </p>
        </div>

        <button
          type="button"
          style={styles.refreshButton}
          onClick={() => loadRequests()}
          disabled={isLoading || isBusy}
        >
          {isLoading ? 'Loading...' : 'Refresh'}
        </button>
      </div>

      {error ? (
        <div style={styles.errorBox} role="alert">
          {error}
        </div>
      ) : null}

      {notice ? (
        <div style={styles.noticeBox} role="status">
          {notice}
        </div>
      ) : null}

      {approvalRequest ? (
        <form style={styles.approvalCard} onSubmit={handleApproval}>
          <div>
            <p style={styles.cardEyebrow}>APPROVE REQUEST</p>

            <h3 style={styles.cardTitle}>
              {getDisplayName(approvalRequest.user)}
            </h3>

            <p style={styles.cardDescription}>
              @{approvalRequest.user?.username || 'unknown'} will receive the
              temporary password you set. Do not share it through this page.
            </p>
          </div>

          <label style={styles.passwordLabel} htmlFor="request-temporary-password">
            Temporary password

            <input
              id="request-temporary-password"
              type="password"
              value={temporaryPassword}
              onChange={(event) => {
                setTemporaryPassword(event.target.value);
                setError('');
              }}
              autoComplete="new-password"
              disabled={isBusy}
              style={styles.passwordInput}
            />
          </label>

          <div style={styles.approvalActions}>
            <button
              type="submit"
              style={styles.approveButton}
              disabled={isBusy}
            >
              {pendingKey === `approve:${approvalRequest.id}`
                ? 'Approving...'
                : 'Approve and set temporary password'}
            </button>

            <button
              type="button"
              style={styles.cancelButton}
              onClick={closeApproval}
              disabled={isBusy}
            >
              Cancel
            </button>
          </div>
        </form>
      ) : null}

      {isLoading ? (
        <p style={styles.stateText}>Loading pending requests...</p>
      ) : requests.length === 0 ? (
        <div style={styles.emptyState}>
          <strong>No pending password-reset requests.</strong>
          <span>New matching requests will appear here for review.</span>
        </div>
      ) : (
        <div style={styles.requestList}>
          {requests.map((request) => {
            const isSelf =
              String(request.user?.id || '') ===
              String(currentUser?.id || '');

            return (
              <article key={request.id} style={styles.requestCard}>
                <div style={styles.requestBody}>
                  <p style={styles.cardEyebrow}>PENDING REQUEST</p>

                  <h3 style={styles.requestName}>
                    {getDisplayName(request.user)}
                  </h3>

                  <p style={styles.requestMeta}>
                    @{request.user?.username || 'unknown'} · submitted{' '}
                    {formatDate(request.createdAt)}
                  </p>

                  {isSelf ? (
                    <p style={styles.selfMessage}>
                      Your own request must be reviewed by a different
                      administrator.
                    </p>
                  ) : null}
                </div>

                {!isSelf ? (
                  <div style={styles.requestActions}>
                    <button
                      type="button"
                      style={styles.approveButton}
                      onClick={() => openApproval(request)}
                      disabled={isBusy}
                    >
                      Approve
                    </button>

                    <button
                      type="button"
                      style={styles.rejectButton}
                      onClick={() => handleReject(request)}
                      disabled={isBusy}
                    >
                      {pendingKey === `reject:${request.id}`
                        ? 'Rejecting...'
                        : 'Reject'}
                    </button>
                  </div>
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
    borderRadius: '18px',
    marginTop: '32px',
    padding: '24px'
  },
  heading: {
    alignItems: 'flex-start',
    display: 'flex',
    gap: '20px',
    justifyContent: 'space-between',
    marginBottom: '20px'
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
    margin: '6px 0 8px'
  },
  description: {
    color: 'var(--color-text-muted)',
    lineHeight: 1.55,
    margin: 0,
    maxWidth: '760px'
  },
  refreshButton: {
    background: 'var(--color-surface-muted)',
    border: '1px solid var(--color-border)',
    borderRadius: '10px',
    color: 'var(--color-text)',
    cursor: 'pointer',
    fontWeight: 800,
    padding: '10px 14px'
  },
  errorBox: {
    background: 'var(--color-danger-bg)',
    border: '1px solid var(--color-danger-border)',
    borderRadius: '10px',
    color: 'var(--color-danger)',
    fontWeight: 700,
    marginBottom: '16px',
    padding: '12px 14px'
  },
  noticeBox: {
    background: 'var(--color-info-bg)',
    border: '1px solid var(--color-border)',
    borderRadius: '10px',
    color: 'var(--color-text)',
    fontWeight: 700,
    marginBottom: '16px',
    padding: '12px 14px'
  },
  approvalCard: {
    background: 'var(--color-surface-muted)',
    border: '1px solid var(--color-primary)',
    borderRadius: '14px',
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
    marginBottom: '18px',
    padding: '20px'
  },
  cardEyebrow: {
    color: 'var(--color-primary)',
    fontSize: '0.72rem',
    fontWeight: 800,
    letterSpacing: '0.1em',
    margin: 0
  },
  cardTitle: {
    fontSize: '1.2rem',
    margin: '6px 0'
  },
  cardDescription: {
    color: 'var(--color-text-muted)',
    lineHeight: 1.5,
    margin: 0
  },
  passwordLabel: {
    display: 'flex',
    flexDirection: 'column',
    fontWeight: 800,
    gap: '8px'
  },
  passwordInput: {
    background: 'var(--color-surface)',
    border: '1px solid var(--color-input-border)',
    borderRadius: '10px',
    color: 'var(--color-text)',
    padding: '11px 12px'
  },
  approvalActions: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '10px'
  },
  approveButton: {
    background: 'var(--color-primary)',
    border: 'none',
    borderRadius: '10px',
    color: 'var(--color-primary-contrast)',
    cursor: 'pointer',
    fontWeight: 800,
    padding: '10px 14px'
  },
  cancelButton: {
    background: 'transparent',
    border: '1px solid var(--color-border-strong)',
    borderRadius: '10px',
    color: 'var(--color-text)',
    cursor: 'pointer',
    fontWeight: 800,
    padding: '10px 14px'
  },
  rejectButton: {
    background: 'transparent',
    border: '1px solid var(--color-danger)',
    borderRadius: '10px',
    color: 'var(--color-danger)',
    cursor: 'pointer',
    fontWeight: 800,
    padding: '10px 14px'
  },
  requestList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px'
  },
  requestCard: {
    alignItems: 'center',
    border: '1px solid var(--color-border)',
    borderRadius: '14px',
    display: 'flex',
    gap: '18px',
    justifyContent: 'space-between',
    padding: '18px'
  },
  requestBody: {
    minWidth: 0
  },
  requestName: {
    fontSize: '1.08rem',
    margin: '6px 0'
  },
  requestMeta: {
    color: 'var(--color-text-muted)',
    lineHeight: 1.5,
    margin: 0
  },
  requestActions: {
    display: 'flex',
    flexShrink: 0,
    flexWrap: 'wrap',
    gap: '10px'
  },
  selfMessage: {
    color: 'var(--color-text-muted)',
    fontSize: '0.88rem',
    fontWeight: 700,
    marginBottom: 0
  },
  emptyState: {
    alignItems: 'flex-start',
    background: 'var(--color-surface-muted)',
    border: '1px dashed var(--color-border-strong)',
    borderRadius: '14px',
    color: 'var(--color-text-muted)',
    display: 'flex',
    flexDirection: 'column',
    gap: '5px',
    padding: '22px'
  },
  stateText: {
    color: 'var(--color-text-muted)',
    margin: 0
  }
};

export default AdminPasswordResetRequestsPanel;