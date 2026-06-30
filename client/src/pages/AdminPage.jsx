import { useState } from 'react';
import { useLocation } from 'react-router-dom';
import AdminPasswordResetRequestsPanel from '../components/AdminPasswordResetRequestsPanel.jsx';
import AdminRestaurantModerationPanel from '../components/AdminRestaurantModerationPanel.jsx';
import AdminSponsoredPromotionsPanel from '../components/AdminSponsoredPromotionsPanel.jsx';
import AdminStatisticsPanel from '../components/AdminStatisticsPanel.jsx';
import AdminUserManagementPanel from '../components/AdminUserManagementPanel.jsx';
import { useAuth } from '../context/AuthContext.jsx';

const ADMIN_TOOLS = [
  {
    id: 'restaurants',
    title: 'Restaurant moderation',
    description:
      'Review and manage every platform restaurant. Catalog entries are protected from deletion.'
  },
  {
    id: 'promotions',
    title: 'Sponsored promotions',
    description:
      'Choose which restaurants appear in sponsored placements and control their order.'
  },
  {
    id: 'users',
    title: 'User accounts',
    description:
      'Manage access, roles, temporary passwords and eligible account deletion.'
  },
  {
    id: 'insights',
    title: 'Platform insights',
    description:
      'View platform-wide activity, restaurant health and operational trends.'
  }
];

function AdminPage() {
  const { user } = useAuth();
  const location = useLocation();
  const initialActiveToolId =
    location.state?.activeToolId === 'restaurants'
      ? 'restaurants'
      : '';
  const [activeToolId, setActiveToolId] = useState(initialActiveToolId);
  const [activeUserView, setActiveUserView] = useState('users');

  const displayName =
    user?.fullName || user?.displayName || user?.username || 'Administrator';

  function handleToolClick(toolId) {
    if (activeToolId === toolId) {
      setActiveToolId('');
      return;
    }

    setActiveToolId(toolId);

    if (toolId === 'users') {
      setActiveUserView('users');
    }
  }

  function renderActiveTool() {
    if (activeToolId === 'restaurants') {
      return <AdminRestaurantModerationPanel />;
    }

    if (activeToolId === 'promotions') {
      return <AdminSponsoredPromotionsPanel />;
    }

    if (activeToolId === 'users') {
      return activeUserView === 'password-reset-requests' ? (
        <AdminPasswordResetRequestsPanel
          onBackToUsers={() => setActiveUserView('users')}
        />
      ) : (
        <AdminUserManagementPanel
          onOpenPasswordResetRequests={() =>
            setActiveUserView('password-reset-requests')
          }
        />
      );
    }

    if (activeToolId === 'insights') {
      return <AdminStatisticsPanel />;
    }

    return null;
  }

  return (
    <section style={styles.page}>
      <header style={styles.hero}>
        <p style={styles.eyebrow}>ADMINISTRATION</p>

        <h1 style={styles.title}>Admin workspace</h1>

        <p style={styles.subtitle}>
          Welcome back, {displayName}. Use this workspace as the central entry
          point for platform administration.
        </p>
      </header>

      <section style={styles.accessCard} aria-label="Administrator access">
        <div>
          <p style={styles.accessLabel}>SIGNED IN AS</p>
          <p style={styles.accessName}>{displayName}</p>
        </div>

        <span style={styles.roleBadge}>Administrator</span>
      </section>

      <section aria-labelledby="admin-tools-heading">
        <div style={styles.sectionHeading}>
          <div>
            <p style={styles.eyebrow}>WORKSPACE</p>
            <h2 id="admin-tools-heading" style={styles.sectionTitle}>
              Management tools
            </h2>
          </div>

          <p style={styles.sectionNote}>
            Select one tool to open its workspace. Select the active tool again
            to close it.
          </p>
        </div>

        <div style={styles.grid}>
          {ADMIN_TOOLS.map((tool) => {
            const isActive = activeToolId === tool.id;

            return (
              <button
                key={tool.id}
                type="button"
                aria-controls={`admin-tool-${tool.id}`}
                aria-pressed={isActive}
                onClick={() => handleToolClick(tool.id)}
                style={{
                  ...styles.toolButton,
                  ...(isActive ? styles.activeToolButton : {})
                }}
              >
                <span>
                  <span style={styles.toolTitle}>{tool.title}</span>
                  <span style={styles.toolDescription}>{tool.description}</span>
                </span>
              </button>
            );
          })}
        </div>
      </section>

      {activeToolId ? (
        <section
          id={`admin-tool-${activeToolId}`}
          aria-live="polite"
          style={styles.toolPanel}
        >
          {renderActiveTool()}
        </section>
      ) : null}
    </section>
  );
}

const styles = {
  page: {
    margin: '0 auto',
    maxWidth: '1120px',
    padding: '40px 24px 64px'
  },
  hero: {
    marginBottom: '28px',
    maxWidth: '760px'
  },
  eyebrow: {
    color: 'var(--color-primary)',
    fontSize: '0.78rem',
    fontWeight: 800,
    letterSpacing: '0.12em',
    margin: 0
  },
  title: {
    fontSize: 'clamp(2rem, 4vw, 3rem)',
    margin: '8px 0 12px'
  },
  subtitle: {
    color: 'var(--color-text-muted)',
    fontSize: '1.05rem',
    lineHeight: 1.65,
    margin: 0
  },
  accessCard: {
    alignItems: 'center',
    background: 'var(--color-surface)',
    border: '1px solid var(--color-border)',
    borderRadius: '18px',
    display: 'flex',
    gap: '18px',
    justifyContent: 'space-between',
    marginBottom: '40px',
    padding: '22px'
  },
  accessLabel: {
    color: 'var(--color-text-muted)',
    fontSize: '0.72rem',
    fontWeight: 800,
    letterSpacing: '0.1em',
    margin: 0
  },
  accessName: {
    fontSize: '1.15rem',
    fontWeight: 800,
    margin: '5px 0 0'
  },
  roleBadge: {
    background: 'var(--color-info-bg)',
    borderRadius: '999px',
    color: 'var(--color-primary)',
    fontSize: '0.88rem',
    fontWeight: 800,
    padding: '8px 12px',
    whiteSpace: 'nowrap'
  },
  sectionHeading: {
    alignItems: 'end',
    display: 'flex',
    flexWrap: 'wrap',
    gap: '20px',
    justifyContent: 'space-between',
    marginBottom: '18px'
  },
  sectionTitle: {
    fontSize: '1.45rem',
    margin: '5px 0 0'
  },
  sectionNote: {
    color: 'var(--color-text-muted)',
    lineHeight: 1.5,
    margin: 0,
    maxWidth: '390px'
  },
  grid: {
    display: 'grid',
    gap: '16px',
    gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))'
  },
  toolButton: {
    background: 'var(--color-surface)',
    border: '1px solid var(--color-border)',
    borderRadius: '18px',
    color: 'var(--color-text)',
    cursor: 'pointer',
    display: 'flex',
    flexDirection: 'column',
    font: 'inherit',
    gap: '20px',
    justifyContent: 'space-between',
    minHeight: '170px',
    padding: '22px',
    textAlign: 'left',
    transition: 'border-color 140ms ease, box-shadow 140ms ease, transform 140ms ease',
    width: '100%'
  },
  activeToolButton: {
    border: '2px solid var(--color-primary)',
    boxShadow: '0 10px 26px rgba(0, 0, 0, 0.12)',
    transform: 'translateY(-2px)'
  },
  toolTitle: {
    display: 'block',
    fontSize: '1.08rem',
    fontWeight: 800
  },
  toolDescription: {
    color: 'var(--color-text-muted)',
    display: 'block',
    lineHeight: 1.55,
    marginTop: '10px'
  },
  toolStatus: {
    alignSelf: 'flex-start',
    background: 'var(--color-info-bg)',
    borderRadius: '999px',
    color: 'var(--color-primary)',
    fontSize: '0.78rem',
    fontWeight: 800,
    padding: '7px 10px'
  },
  toolPanel: {
    marginTop: '28px'
  }
};

export default AdminPage;
