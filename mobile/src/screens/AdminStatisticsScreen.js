import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { getAdminStatistics } from '../api/adminStatistics';
import { useAuth } from '../auth/AuthContext';
import AppCard from '../components/AppCard';
import { useAppTheme } from '../theme/ThemeContext';

function formatNumber(value) {
  return new Intl.NumberFormat('en-US').format(Number(value || 0));
}

function formatCurrency(value) {
  return new Intl.NumberFormat('en-IL', {
    currency: 'ILS',
    maximumFractionDigits: 2,
    minimumFractionDigits: 2,
    style: 'currency',
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
    {
      label: 'Users',
      value: formatNumber(statistics?.users),
    },
    {
      label: 'Restaurants',
      value: formatNumber(statistics?.restaurants),
    },
    {
      label: 'Menu items',
      value: formatNumber(statistics?.menuItems),
    },
    {
      label: 'Orders',
      value: formatNumber(statistics?.orders),
    },
    {
      label: 'Total revenue',
      value: formatCurrency(statistics?.totalRevenue),
    },
    {
      label: 'Average order',
      value: formatCurrency(statistics?.averageOrderValue),
    },
  ];
}

export default function AdminStatisticsScreen() {
  const { token, user } = useAuth();
  const { theme } = useAppTheme();
  const styles = useMemo(() => createStyles(theme.colors), [theme.colors]);

  const isAdmin = user?.role === 'admin' || user?.isAdmin === true;

  const [statistics, setStatistics] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState('');

  const loadStatistics = useCallback(
    async ({ refreshing = false } = {}) => {
      // Non-admin guard — don't even hit the API
      if (!isAdmin) {
        setIsLoading(false);
        return;
      }

      if (refreshing) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }

      setError('');

      try {
        const data = await getAdminStatistics(token);
        setStatistics(data || {});
      } catch (loadError) {
        setError(
          loadError.message ||
            'Could not load platform statistics right now.'
        );
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [token, isAdmin]
  );

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

  // Non-admin access denied state
  if (!isAdmin) {
    return (
      <SafeAreaView style={styles.center}>
        <Text style={styles.errorTitle}>Access restricted</Text>
        <Text style={styles.stateText}>
          This dashboard is available to administrators only.
        </Text>
      </SafeAreaView>
    );
  }

  if (isLoading) {
    return (
      <SafeAreaView style={styles.center}>
        <ActivityIndicator color={theme.colors.primary} size="large" />
        <Text style={styles.stateText}>Loading platform insights...</Text>
      </SafeAreaView>
    );
  }

  if (error && !statistics) {
    return (
      <SafeAreaView style={styles.center}>
        <Text style={styles.errorTitle}>Could not load platform insights</Text>
        <Text style={styles.errorText}>{error}</Text>

        <Pressable
          style={({ pressed }) => [
            styles.primaryButton,
            pressed ? styles.pressed : null,
          ]}
          onPress={() => loadStatistics()}
        >
          <Text style={styles.primaryButtonText}>Try again</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={() => loadStatistics({ refreshing: true })}
            tintColor={theme.colors.primary}
          />
        }
      >
        <View style={styles.headerRow}>
          <View style={styles.headerText}>
            <Text style={styles.eyebrow}>ADMINISTRATION</Text>
            <Text style={styles.title}>Platform insights</Text>
            <Text style={styles.subtitle}>
              A live overview of platform growth, catalog scale and order
              activity.
            </Text>
          </View>

          <Pressable
            style={({ pressed }) => [
              styles.refreshButton,
              pressed ? styles.pressed : null,
            ]}
            disabled={isRefreshing}
            onPress={() => loadStatistics({ refreshing: true })}
          >
            <Text style={styles.refreshButtonText}>Refresh</Text>
          </Pressable>
        </View>

        {error ? (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        <View style={styles.metricsGrid}>
          {metricCards.map((metric) => (
            <AppCard key={metric.label} style={styles.metricCard}>
              <Text style={styles.metricValue}>{metric.value}</Text>
              <Text style={styles.metricLabel}>{metric.label}</Text>
            </AppCard>
          ))}
        </View>

        <AppCard style={styles.ordersCard}>
          <Text style={styles.sectionEyebrow}>ORDER HEALTH</Text>
          <Text style={styles.sectionTitle}>Order status breakdown</Text>

          {statusEntries.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyTitle}>No orders yet</Text>
              <Text style={styles.emptyText}>
                Status distribution will appear after customers place orders.
              </Text>
            </View>
          ) : (
            <View style={styles.statusList}>
              {statusEntries.map(([status, count]) => (
                <View key={status} style={styles.statusRow}>
                  <Text style={styles.statusName}>
                    {formatStatusLabel(status)}
                  </Text>

                  <View style={styles.statusCountBadge}>
                    <Text style={styles.statusCount}>
                      {formatNumber(count)}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          )}
        </AppCard>

        <AppCard style={styles.noteCard}>
          <Text style={styles.noteTitle}>How to read these numbers</Text>
          <Text style={styles.noteText}>
            Revenue and average order value are calculated from recorded order
            totals. Pull down or use Refresh to load the latest values.
          </Text>
        </AppCard>
      </ScrollView>
    </SafeAreaView>
  );
}

function createStyles(colors) {
  return StyleSheet.create({
    safeArea: {
      backgroundColor: colors.background,
      flex: 1,
    },
    center: {
      alignItems: 'center',
      backgroundColor: colors.background,
      flex: 1,
      gap: 12,
      justifyContent: 'center',
      padding: 24,
    },
    content: {
      gap: 16,
      padding: 20,
      paddingBottom: 44,
    },
    headerRow: {
      alignItems: 'flex-start',
      flexDirection: 'row',
      gap: 14,
      justifyContent: 'space-between',
    },
    headerText: {
      flex: 1,
    },
    eyebrow: {
      color: colors.primary,
      fontSize: 12,
      fontWeight: '800',
      letterSpacing: 1.1,
      marginBottom: 6,
    },
    title: {
      color: colors.text,
      fontSize: 29,
      fontWeight: '800',
      letterSpacing: -0.5,
    },
    subtitle: {
      color: colors.textMuted,
      fontSize: 15,
      lineHeight: 22,
      marginTop: 8,
    },
    refreshButton: {
      borderColor: colors.border,
      borderRadius: 10,
      borderWidth: 1,
      paddingHorizontal: 11,
      paddingVertical: 9,
    },
    refreshButtonText: {
      color: colors.text,
      fontSize: 13,
      fontWeight: '800',
    },
    errorBox: {
      backgroundColor: colors.dangerSoft || '#fff0f0',
      borderColor: colors.danger || '#b00020',
      borderRadius: 12,
      borderWidth: 1,
      padding: 13,
    },
    errorTitle: {
      color: colors.text,
      fontSize: 20,
      fontWeight: '800',
      textAlign: 'center',
    },
    errorText: {
      color: colors.danger || '#b00020',
      fontSize: 14,
      lineHeight: 20,
      textAlign: 'center',
    },
    stateText: {
      color: colors.textMuted,
      fontSize: 15,
    },
    metricsGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 12,
    },
    metricCard: {
      flexGrow: 1,
      flexBasis: '45%',
      gap: 6,
      minWidth: 145,
      padding: 16,
    },
    metricValue: {
      color: colors.primary,
      fontSize: 23,
      fontWeight: '800',
    },
    metricLabel: {
      color: colors.textMuted,
      fontSize: 13,
      fontWeight: '700',
    },
    ordersCard: {
      gap: 10,
      padding: 18,
    },
    sectionEyebrow: {
      color: colors.primary,
      fontSize: 11,
      fontWeight: '800',
      letterSpacing: 1,
    },
    sectionTitle: {
      color: colors.text,
      fontSize: 20,
      fontWeight: '800',
    },
    emptyState: {
      gap: 5,
      paddingTop: 6,
    },
    emptyTitle: {
      color: colors.text,
      fontSize: 16,
      fontWeight: '800',
    },
    emptyText: {
      color: colors.textMuted,
      fontSize: 14,
      lineHeight: 20,
    },
    statusList: {
      gap: 10,
      paddingTop: 4,
    },
    statusRow: {
      alignItems: 'center',
      borderTopColor: colors.border,
      borderTopWidth: 1,
      flexDirection: 'row',
      justifyContent: 'space-between',
      paddingTop: 10,
    },
    statusName: {
      color: colors.text,
      fontSize: 15,
      fontWeight: '700',
    },
    statusCountBadge: {
      backgroundColor: colors.primarySoft,
      borderRadius: 999,
      paddingHorizontal: 10,
      paddingVertical: 5,
    },
    statusCount: {
      color: colors.primary,
      fontSize: 13,
      fontWeight: '800',
    },
    noteCard: {
      gap: 6,
      padding: 18,
    },
    noteTitle: {
      color: colors.text,
      fontSize: 16,
      fontWeight: '800',
    },
    noteText: {
      color: colors.textMuted,
      fontSize: 14,
      lineHeight: 20,
    },
    primaryButton: {
      alignItems: 'center',
      backgroundColor: colors.primary,
      borderRadius: 10,
      marginTop: 8,
      paddingHorizontal: 14,
      paddingVertical: 11,
    },
    primaryButtonText: {
      color: '#fff',
      fontSize: 14,
      fontWeight: '800',
    },
    pressed: {
      opacity: 0.78,
    },
  });
}