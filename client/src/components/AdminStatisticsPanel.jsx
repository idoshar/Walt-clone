import { useCallback, useEffect, useMemo, useState } from 'react';
import { getAdminStatistics } from '../api/adminStatisticsApi.js';

function formatNumber(value) {
  return new Intl.NumberFormat('en-US').format(Number(value || 0));
}

function formatCurrency(value) {
  return new Intl.NumberFormat('en-IL', {
    currency: 'ILS',
    maximumFractionDigits: 2,
    minimumFractionDigits: 2,
    style: 'currency'
  }).format(Number(value || 0));
}

function formatStatusLabel(status) {
  if (!status || status === 'unknown') {
    return 'Unknown';
  }

  return String(status)
    .replace(/[-_]+/g, ' ')
    .replace(/\b\w/g, (character) => character.toUpperCase());
}

function buildMetricCards(statistics) {
  return [
    { label: 'Users', value: formatNumber(statistics?.users) },
    { label: 'Restaurants', value: formatNumber(statistics?.restaurants) },
    { label: 'Menu items', value: formatNumber(statistics?.menuItems) },
    { label: 'Orders', value: formatNumber(statistics?.orders) },
    { label: 'Total revenue', value: formatCurrency(statistics?.totalRevenue) },
    {
      label: 'Average order',
      value: formatCurrency(statistics?.averageOrderValue)
    }
  ];
}

function AdminStatisticsPanel() {
  const [statistics, setStatistics] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState('');

  const loadStatistics = useCallback(async ({ refreshing = false } = {}) => {
    if (refreshing) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }

    setError('');

    try {
      const data = await getAdminStatistics();
      setStatistics(data || {});
    } catch (loadError) {
      setError(
        loadError.message || 'Could not load platform insights right now.'
      );
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadStatistics();
  }, [loadStatistics]);

  const metricCards = useMemo(
    () => buildMetricCards(statistics),
    [statistics]
  );

  const statusEntries = useMemo(
    () =>
      Object.entries(statistics?.orderStatuses || {}).sort(
        ([leftStatus], [rightStatus]) =>
          String(leftStatus).localeCompare(String(rightStatus))
      ),
    [statistics]
  );

  if (isLoading) {
    return (
      <section style={styles.panel} aria-labelledby="platform-insights-heading">
        <p style={styles.stateText}>Loading platform insights...</p>
      </section>
    );
  }

  if (error && !statistics) {
    return (
      <section style={styles.panel} aria-labelledby="platform-insights-heading">
        <p style={styles.eyebrow}>ADMINISTRATION</p>
        <h2 id="platform-insights-heading" style={styles.title}>
          Platform insights
        </h2>
        <p style={styles.errorBox} role="alert">
          {error}
        </p>
        <button
          type="button"
          style={styles.refreshButton}
          onClick={() => loadStatistics()}
        >
          Try again
        </button>
      </section>
    );
  }

  return (
    <section style={styles.panel} aria-labelledby="platform-insights-heading">
      <div style={styles.heading}>
        <div>
          <p style={styles.eyebrow}>ADMINISTRATION</p>
          <h2 id="platform-insights-heading" style={styles.title}>
            Platform insights
          </h2>
          <p style={styles.description}>
            A live overview of platform growth, catalog scale and order activity.
          </p>
        </div>

        <button
          type="button"
          style={styles.refreshButton}
          onClick={() => loadStatistics({ refreshing: true })}
          disabled={isRefreshing}
        >
          {isRefreshing ? 'Refreshing...' : 'Refresh'}
        </button>
      </div>

      {error ? (
        <p style={styles.errorBox} role="alert">
          {error}
        </p>
      ) : null}

      <div style={styles.metricsGrid}>
        {metricCards.map((metric) => (
          <article key={metric.label} style={styles.metricCard}>
            <strong style={styles.metricValue}>{metric.value}</strong>
            <span style={styles.metricLabel}>{metric.label}</span>
          </article>
        ))}
      </div>

      <article style={styles.ordersCard}>
        <p style={styles.cardEyebrow}>ORDER HEALTH</p>
        <h3 style={styles.cardTitle}>Order status breakdown</h3>

        {statusEntries.length === 0 ? (
          <p style={styles.stateText}>
            No orders yet. Status distribution will appear after customers place
            orders.
          </p>
        ) : (
          <div style={styles.statusList}>
            {statusEntries.map(([status, count]) => (
              <div key={status} style={styles.statusRow}>
                <span>{formatStatusLabel(status)}</span>
                <span style={styles.statusCount}>{formatNumber(count)}</span>
              </div>
            ))}
          </div>
        )}
      </article>

      <p style={styles.note}>
        Revenue and average order value are calculated from recorded order totals.
      </p>
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
  refreshButton: {
    background: 'var(--color-info-bg)',
    border: '1px solid var(--color-border)',
    borderRadius: '10px',
    color: 'var(--color-primary)',
    cursor: 'pointer',
    fontWeight: 800,
    padding: '10px 13px'
  },
  errorBox: {
    background: 'var(--color-danger-bg)',
    borderRadius: '10px',
    color: 'var(--color-danger)',
    fontWeight: 700,
    margin: '18px 0 0',
    padding: '12px'
  },
  metricsGrid: {
    display: 'grid',
    gap: '12px',
    gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
    marginTop: '22px'
  },
  metricCard: {
    border: '1px solid var(--color-border)',
    borderRadius: '14px',
    display: 'grid',
    gap: '6px',
    padding: '16px'
  },
  metricValue: {
    color: 'var(--color-primary)',
    fontSize: '1.35rem'
  },
  metricLabel: {
    color: 'var(--color-text-muted)',
    fontSize: '0.88rem',
    fontWeight: 700
  },
  ordersCard: {
    border: '1px solid var(--color-border)',
    borderRadius: '14px',
    marginTop: '16px',
    padding: '18px'
  },
  cardEyebrow: {
    color: 'var(--color-primary)',
    fontSize: '0.72rem',
    fontWeight: 800,
    letterSpacing: '0.1em',
    margin: 0
  },
  cardTitle: {
    fontSize: '1.08rem',
    margin: '7px 0 14px'
  },
  statusList: {
    display: 'grid',
    gap: '9px'
  },
  statusRow: {
    alignItems: 'center',
    display: 'flex',
    justifyContent: 'space-between',
    gap: '12px'
  },
  statusCount: {
    background: 'var(--color-info-bg)',
    borderRadius: '999px',
    color: 'var(--color-primary)',
    fontWeight: 800,
    padding: '5px 9px'
  },
  stateText: {
    color: 'var(--color-text-muted)',
    lineHeight: 1.55,
    margin: 0
  },
  note: {
    color: 'var(--color-text-muted)',
    fontSize: '0.88rem',
    lineHeight: 1.5,
    margin: '16px 0 0'
  }
};

export default AdminStatisticsPanel;
