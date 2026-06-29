import { useAuth } from '../context/AuthContext.jsx';

const ADMIN_TOOLS = [
  {
    title: 'Restaurant moderation',
    description:
      'Review and manage platform restaurants. Full moderation tools will be added next.',
    status: 'Coming soon'
  },
  {
    title: 'Sponsored promotions',
    description:
      'Choose which restaurants appear in sponsored placements.',
    status: 'Coming soon'
  },
  {
    title: 'User roles',
    description:
      'Review platform roles and safely manage administrator access.',
    status: 'Coming soon'
  },
  {
    title: 'Platform insights',
    description:
      'View platform-wide activity, restaurant health and operational trends.',
    status: 'Coming soon'
  }
];

function AdminPage() {
  const { user } = useAuth();

  const displayName =
    user?.fullName || user?.displayName || user?.username || 'Administrator';

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
            Features are enabled here as their dedicated admin workflows are delivered.
          </p>
        </div>

        <div style={styles.grid}>
          {ADMIN_TOOLS.map((tool) => (
            <article key={tool.title} style={styles.toolCard}>
              <div>
                <h3 style={styles.toolTitle}>{tool.title}</h3>
                <p style={styles.toolDescription}>{tool.description}</p>
              </div>

              <span style={styles.comingSoon}>{tool.status}</span>
            </article>
          ))}
        </div>
      </section>
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
  toolCard: {
    background: 'var(--color-surface)',
    border: '1px solid var(--color-border)',
    borderRadius: '18px',
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
    justifyContent: 'space-between',
    minHeight: '195px',
    padding: '22px'
  },
  toolTitle: {
    fontSize: '1.08rem',
    margin: 0
  },
  toolDescription: {
    color: 'var(--color-text-muted)',
    lineHeight: 1.55,
    margin: '10px 0 0'
  },
  comingSoon: {
    alignSelf: 'flex-start',
    background: 'var(--color-info-bg)',
    borderRadius: '999px',
    color: 'var(--color-primary)',
    fontSize: '0.78rem',
    fontWeight: 800,
    padding: '7px 10px'
  }
};

export default AdminPage;
