import {
  SafeAreaView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { useAuth } from '../auth/AuthContext';
import AppCard from '../components/AppCard';
import ThemeToggle from '../components/ThemeToggle';
import { useAppTheme } from '../theme/ThemeContext';

export default function AdminScreen() {
  const { user } = useAuth();
  const { theme } = useAppTheme();

  const displayName = user?.fullName || user?.username || 'Administrator';
  const username = user?.username || 'Unknown user';

  return (
    <SafeAreaView
      style={[styles.safeArea, { backgroundColor: theme.colors.background }]}
    >
      <View style={styles.content}>
        <View style={styles.headerRow}>
          <View style={styles.headerText}>
            <Text style={[styles.eyebrow, { color: theme.colors.primary }]}>
              MANAGEMENT
            </Text>

            <Text style={[styles.title, { color: theme.colors.text }]}>
              Admin area
            </Text>

            <Text style={[styles.subtitle, { color: theme.colors.textMuted }]}>
              Manage restaurants, products and platform activity from one place.
            </Text>
          </View>

          <ThemeToggle compact />
        </View>

        <AppCard style={styles.profileCard}>
          <Text style={[styles.cardLabel, { color: theme.colors.textMuted }]}>
            SIGNED IN AS
          </Text>

          <Text style={[styles.userName, { color: theme.colors.text }]}>
            {displayName}
          </Text>

          <Text style={[styles.username, { color: theme.colors.textMuted }]}>
            @{username}
          </Text>

          <View
            style={[
              styles.roleBadge,
              { backgroundColor: theme.colors.primarySoft },
            ]}
          >
            <Text style={[styles.roleBadgeText, { color: theme.colors.primary }]}>
              Administrator
            </Text>
          </View>
        </AppCard>

        <AppCard style={styles.infoCard}>
          <Text style={[styles.infoTitle, { color: theme.colors.text }]}>
            Management tools are on the way
          </Text>

          <Text style={[styles.infoMessage, { color: theme.colors.textMuted }]}>
            Restaurant ownership, product management and analytics will be added
            in the upcoming mobile management tasks.
          </Text>
        </AppCard>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  content: {
    flex: 1,
    gap: 16,
    padding: 24,
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
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1.1,
    marginBottom: 6,
  },
  title: {
    fontSize: 30,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 15,
    lineHeight: 22,
    marginTop: 8,
  },
  profileCard: {
    gap: 8,
    padding: 22,
  },
  cardLabel: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.9,
  },
  userName: {
    fontSize: 22,
    fontWeight: '800',
    marginTop: 4,
  },
  username: {
    fontSize: 14,
  },
  roleBadge: {
    alignSelf: 'flex-start',
    borderRadius: 999,
    marginTop: 10,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  roleBadgeText: {
    fontSize: 13,
    fontWeight: '800',
  },
  infoCard: {
    gap: 8,
    padding: 22,
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: '800',
  },
  infoMessage: {
    fontSize: 15,
    lineHeight: 22,
  },
});
