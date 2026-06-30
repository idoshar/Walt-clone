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

import { getRestaurantSalesStatistics } from '../api/restaurantStatistics';
import { useAuth } from '../auth/AuthContext';
import AppCard from '../components/AppCard';
import { useAppTheme } from '../theme/ThemeContext';

function formatNumber(value) {
  const numericValue = Number(value);

  return new Intl.NumberFormat('en-US').format(
    Number.isFinite(numericValue) ? numericValue : 0
  );
}

function formatCurrency(value) {
  const numericValue = Number(value);

  return new Intl.NumberFormat('en-IL', {
    currency: 'ILS',
    maximumFractionDigits: 2,
    minimumFractionDigits: 2,
    style: 'currency',
  }).format(Number.isFinite(numericValue) ? numericValue : 0);
}

function normalizeProductSales(value) {
  return Array.isArray(value) ? value : [];
}

function getProductKey(product, index) {
  return String(
    product?.productId ||
      `${product?.productName || 'product'}-${index}`
  );
}

function buildMetricCards(statistics) {
  return [
    {
      label: 'Total orders',
      helper: 'Non-cancelled customer orders',
      value: formatNumber(statistics?.totalOrders),
    },
    {
      label: 'Total revenue',
      helper: 'Revenue from qualifying orders',
      value: formatCurrency(statistics?.totalRevenue),
    },
    {
      label: 'Average order',
      helper: 'Average revenue per order',
      value: formatCurrency(statistics?.averageOrderValue),
    },
  ];
}

export default function RestaurantSalesStatisticsScreen({
  route,
}) {
  const { token } = useAuth();
  const { theme } = useAppTheme();
  const styles = useMemo(
    () => createStyles(theme.colors),
    [theme.colors]
  );

  const { restaurantId, restaurantName } = route.params || {};

  const [statistics, setStatistics] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState('');

  const loadStatistics = useCallback(
    async ({ refreshing = false } = {}) => {
      if (!restaurantId) {
        setStatistics(null);
        setError('Restaurant id is missing.');
        setIsLoading(false);
        setIsRefreshing(false);
        return;
      }

      if (refreshing) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }

      setError('');

      try {
        const data = await getRestaurantSalesStatistics(
          restaurantId,
          token
        );

        setStatistics(data || {});
      } catch (requestError) {
        setError(
          requestError.message ||
            'Could not load restaurant sales statistics.'
        );
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [restaurantId, token]
  );

  useEffect(() => {
    void loadStatistics();
  }, [loadStatistics]);

  const metricCards = useMemo(
    () => buildMetricCards(statistics),
    [statistics]
  );

  const productSales = useMemo(
    () => normalizeProductSales(statistics?.productSales),
    [statistics]
  );

  const topQuantity = useMemo(
    () =>
      Math.max(
        ...productSales.map(
          (product) => Number(product?.quantitySold) || 0
        ),
        1
      ),
    [productSales]
  );

  const hasSales = Number(statistics?.totalOrders) > 0;

  if (isLoading) {
    return (
      <SafeAreaView style={styles.center}>
        <ActivityIndicator color={theme.colors.primary} size="large" />
        <Text style={styles.stateText}>
          Loading restaurant sales insights...
        </Text>
      </SafeAreaView>
    );
  }

  if (error && !statistics) {
    return (
      <SafeAreaView style={styles.center}>
        <Text style={styles.errorTitle}>
          Could not load sales insights
        </Text>
        <Text style={styles.errorText}>{error}</Text>

        <Pressable
          onPress={() => void loadStatistics()}
          style={({ pressed }) => [
            styles.primaryButton,
            pressed ? styles.pressed : null,
          ]}
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
            onRefresh={() => void loadStatistics({ refreshing: true })}
            tintColor={theme.colors.primary}
          />
        }
      >
        <View style={styles.headerRow}>
          <View style={styles.headerText}>
            <Text style={styles.eyebrow}>RESTAURANT ANALYTICS</Text>
            <Text style={styles.title}>Sales insights</Text>
            <Text style={styles.subtitle}>
              {restaurantName ||
                'Live sales performance for this restaurant.'}
            </Text>
          </View>

          <Pressable
            disabled={isRefreshing}
            onPress={() => void loadStatistics({ refreshing: true })}
            style={({ pressed }) => [
              styles.refreshButton,
              isRefreshing ? styles.disabled : null,
              pressed ? styles.pressed : null,
            ]}
          >
            <Text style={styles.refreshButtonText}>Refresh</Text>
          </Pressable>
        </View>

        {error ? (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        {!hasSales ? (
          <AppCard style={styles.emptyCard}>
            <Text style={styles.emptyTitle}>No sales data yet</Text>
            <Text style={styles.emptyText}>
              Orders for this restaurant will appear here after customers place
              them. Cancelled orders are excluded.
            </Text>
          </AppCard>
        ) : (
          <>
            <View style={styles.metricsGrid}>
              {metricCards.map((metric) => (
                <AppCard key={metric.label} style={styles.metricCard}>
                  <Text style={styles.metricValue}>{metric.value}</Text>
                  <Text style={styles.metricLabel}>{metric.label}</Text>
                  <Text style={styles.metricHelper}>{metric.helper}</Text>
                </AppCard>
              ))}
            </View>

            <AppCard style={styles.topProductCard}>
              <Text style={styles.sectionEyebrow}>TOP SELLER</Text>
              <Text style={styles.topProductName}>
                {statistics?.topProduct?.productName || 'No sales yet'}
              </Text>
              <Text style={styles.topProductMeta}>
                {statistics?.topProduct
                  ? `${formatNumber(
                      statistics.topProduct.quantitySold
                    )} units sold across ${formatNumber(
                      statistics.topProduct.ordersContainingProduct
                    )} order${
                      Number(
                        statistics.topProduct.ordersContainingProduct
                      ) === 1
                        ? ''
                        : 's'
                    }`
                  : 'A top dish will appear after orders are placed.'}
              </Text>
              {statistics?.topProduct ? (
                <Text style={styles.topProductRevenue}>
                  {formatCurrency(statistics.topProduct.revenue)} revenue
                </Text>
              ) : null}
            </AppCard>

            <AppCard style={styles.productsCard}>
              <View style={styles.productsHeader}>
                <View>
                  <Text style={styles.sectionEyebrow}>
                    MENU PERFORMANCE
                  </Text>
                  <Text style={styles.sectionTitle}>Sales by dish</Text>
                </View>

                <View style={styles.productCountBadge}>
                  <Text style={styles.productCountText}>
                    {productSales.length} dish
                    {productSales.length === 1 ? '' : 'es'}
                  </Text>
                </View>
              </View>

              {productSales.length === 0 ? (
                <View style={styles.emptyInline}>
                  <Text style={styles.emptyInlineText}>
                    No menu-item sales are available yet.
                  </Text>
                </View>
              ) : (
                <View style={styles.productList}>
                  {productSales.map((product, index) => {
                    const quantitySold =
                      Number(product?.quantitySold) || 0;

                    const salesPercentage = Math.max(
                      0,
                      Math.min(
                        100,
                        Math.round(
                          (quantitySold / topQuantity) * 100
                        )
                      )
                    );

                    const isTopProduct =
                      String(product?.productId || '') ===
                      String(statistics?.topProduct?.productId || '');

                    return (
                      <View
                        key={getProductKey(product, index)}
                        style={styles.productRow}
                      >
                        <View style={styles.productMain}>
                          <View style={styles.productTitleRow}>
                            <Text
                              numberOfLines={1}
                              style={styles.productName}
                            >
                              {product?.productName || 'Unnamed product'}
                            </Text>

                            {isTopProduct ? (
                              <View style={styles.topSellerBadge}>
                                <Text style={styles.topSellerBadgeText}>
                                  Top seller
                                </Text>
                              </View>
                            ) : null}
                          </View>

                          <Text style={styles.productOrders}>
                            Appeared in{' '}
                            {formatNumber(
                              product?.ordersContainingProduct
                            )}{' '}
                            order
                            {Number(
                              product?.ordersContainingProduct
                            ) === 1
                              ? ''
                              : 's'}
                          </Text>

                          <View style={styles.salesTrack}>
                            <View
                              style={[
                                styles.salesFill,
                                { width: `${salesPercentage}%` },
                              ]}
                            />
                          </View>
                        </View>

                        <View style={styles.productValues}>
                          <Text style={styles.productValue}>
                            {formatNumber(quantitySold)}
                          </Text>
                          <Text style={styles.productValueLabel}>
                            units sold
                          </Text>

                          <Text style={styles.productRevenue}>
                            {formatCurrency(product?.revenue)}
                          </Text>
                          <Text style={styles.productValueLabel}>
                            revenue
                          </Text>
                        </View>
                      </View>
                    );
                  })}
                </View>
              )}
            </AppCard>
          </>
        )}

        <AppCard style={styles.noteCard}>
          <Text style={styles.noteTitle}>About these figures</Text>
          <Text style={styles.noteText}>
            Sales figures exclude cancelled orders and use the historical prices
            stored with each completed order.
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
      gap: 12,
      justifyContent: 'space-between',
    },
    headerText: {
      flex: 1,
    },
    eyebrow: {
      color: colors.primary,
      fontSize: 11,
      fontWeight: '800',
      letterSpacing: 1,
      marginBottom: 5,
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
      marginTop: 7,
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
      backgroundColor: colors.dangerSoft,
      borderColor: colors.danger,
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
      color: colors.danger,
      fontSize: 14,
      lineHeight: 20,
      textAlign: 'center',
    },
    stateText: {
      color: colors.textMuted,
      fontSize: 15,
    },
    primaryButton: {
      alignItems: 'center',
      backgroundColor: colors.primary,
      borderRadius: 12,
      marginTop: 8,
      paddingHorizontal: 18,
      paddingVertical: 12,
    },
    primaryButtonText: {
      color: colors.onPrimary,
      fontWeight: '800',
    },
    metricsGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 12,
    },
    metricCard: {
      flexBasis: '45%',
      flexGrow: 1,
      gap: 5,
      minWidth: 145,
      padding: 16,
    },
    metricValue: {
      color: colors.primary,
      fontSize: 22,
      fontWeight: '800',
    },
    metricLabel: {
      color: colors.text,
      fontSize: 14,
      fontWeight: '800',
    },
    metricHelper: {
      color: colors.textMuted,
      fontSize: 12,
      lineHeight: 17,
    },
    emptyCard: {
      gap: 8,
      padding: 20,
    },
    emptyTitle: {
      color: colors.text,
      fontSize: 19,
      fontWeight: '800',
    },
    emptyText: {
      color: colors.textMuted,
      fontSize: 14,
      lineHeight: 20,
    },
    topProductCard: {
      gap: 7,
      padding: 18,
    },
    sectionEyebrow: {
      color: colors.primary,
      fontSize: 11,
      fontWeight: '800',
      letterSpacing: 1,
    },
    topProductName: {
      color: colors.text,
      fontSize: 23,
      fontWeight: '800',
    },
    topProductMeta: {
      color: colors.textMuted,
      fontSize: 14,
      lineHeight: 20,
    },
    topProductRevenue: {
      color: colors.primary,
      fontSize: 15,
      fontWeight: '800',
    },
    productsCard: {
      gap: 14,
      padding: 18,
    },
    productsHeader: {
      alignItems: 'center',
      flexDirection: 'row',
      justifyContent: 'space-between',
    },
    sectionTitle: {
      color: colors.text,
      fontSize: 20,
      fontWeight: '800',
      marginTop: 4,
    },
    productCountBadge: {
      backgroundColor: colors.primarySoft,
      borderRadius: 999,
      paddingHorizontal: 10,
      paddingVertical: 7,
    },
    productCountText: {
      color: colors.primary,
      fontSize: 12,
      fontWeight: '800',
    },
    emptyInline: {
      paddingVertical: 8,
    },
    emptyInlineText: {
      color: colors.textMuted,
      fontSize: 14,
      lineHeight: 20,
    },
    productList: {
      gap: 14,
    },
    productRow: {
      borderBottomColor: colors.border,
      borderBottomWidth: 1,
      flexDirection: 'row',
      gap: 12,
      paddingBottom: 14,
    },
    productMain: {
      flex: 1,
      gap: 6,
    },
    productTitleRow: {
      alignItems: 'center',
      flexDirection: 'row',
      gap: 8,
    },
    productName: {
      color: colors.text,
      flex: 1,
      fontSize: 16,
      fontWeight: '800',
    },
    topSellerBadge: {
      backgroundColor: colors.primarySoft,
      borderRadius: 999,
      paddingHorizontal: 8,
      paddingVertical: 4,
    },
    topSellerBadgeText: {
      color: colors.primary,
      fontSize: 11,
      fontWeight: '800',
    },
    productOrders: {
      color: colors.textMuted,
      fontSize: 13,
    },
    salesTrack: {
      backgroundColor: colors.surfaceVariant,
      borderRadius: 999,
      height: 8,
      overflow: 'hidden',
    },
    salesFill: {
      backgroundColor: colors.primary,
      borderRadius: 999,
      height: '100%',
    },
    productValues: {
      alignItems: 'flex-end',
      minWidth: 88,
    },
    productValue: {
      color: colors.text,
      fontSize: 16,
      fontWeight: '800',
    },
    productValueLabel: {
      color: colors.textMuted,
      fontSize: 11,
    },
    productRevenue: {
      color: colors.primary,
      fontSize: 14,
      fontWeight: '800',
      marginTop: 7,
    },
    noteCard: {
      gap: 6,
      padding: 16,
    },
    noteTitle: {
      color: colors.text,
      fontSize: 16,
      fontWeight: '800',
    },
    noteText: {
      color: colors.textMuted,
      fontSize: 13,
      lineHeight: 19,
    },
    disabled: {
      opacity: 0.5,
    },
    pressed: {
      opacity: 0.72,
    },
  });
}