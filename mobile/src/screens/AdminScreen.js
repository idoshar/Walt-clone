import {
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { useAuth } from '../auth/AuthContext';
import AppCard from '../components/AppCard';
import { useAppTheme } from '../theme/ThemeContext';

const ADMIN_TOOLS = [
  {
    area: 'RESTAURANTS',
    title: 'Restaurant moderation',
    description:
      'Review every platform restaurant and open full management tools.',
    route: 'AdminRestaurantModeration',
  },
  {
    area: 'PROMOTIONS',
    title: 'Sponsored promotions',
    description:
      'Choose sponsored restaurants and control their rotation order.',
    route: 'AdminSponsoredPromotions',
  },
  {
    area: 'ACCESS',
    title: 'User account management',
    description:
      'Review accounts and manage access, roles, passwords and eligible deletion.',
    route: 'AdminUserManagement',
  },
  {
    area: 'RECOVERY',
    title: 'Password recovery requests',
    description:
      'Review pending password-reset requests and issue temporary passwords.',
    route: 'AdminPasswordResetRequests',
  },
  {
    area: 'INSIGHTS',
    title: 'Platform insights',
    description:
      'View platform activity, restaurant health and operational trends.',
    route: 'AdminStatistics',
  },
];

export default function AdminScreen({ navigation }) {
  const { user } = useAuth();
  const { theme } = useAppTheme();

  const displayName =
    user?.fullName || user?.displayName || user?.username || 'Administrator';
  const username = user?.username || 'Unknown user';

  return (
    <SafeAreaView
      style={[styles.safeArea, { backgroundColor: theme.colors.background }]}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.content}>
          <View style={styles.headerText}>
            <Text style={[styles.eyebrow, { color: theme.colors.primary }]}>
              ADMINISTRATION
            </Text>
            <Text style={[styles.title, { color: theme.colors.text }]}>
              Admin workspace
            </Text>
            <Text style={[styles.subtitle, { color: theme.colors.textMuted }]}>
              Use this workspace as the central entry point for platform
              administration.
            </Text>
          </View>

          <AppCard style={styles.profileCard}>
            <View>
              <Text style={[styles.cardLabel, { color: theme.colors.textMuted }]}>
                SIGNED IN AS
              </Text>
              <Text style={[styles.userName, { color: theme.colors.text }]}>
                {displayName}
              </Text>
              <Text style={[styles.username, { color: theme.colors.textMuted }]}>
                @{username}
              </Text>
            </View>

            <View
              style={[
                styles.roleBadge,
                { backgroundColor: theme.colors.primarySoft },
              ]}
            >
              <Text
                style={[styles.roleBadgeText, { color: theme.colors.primary }]}
              >
                Administrator
              </Text>
            </View>
          </AppCard>

          <View style={styles.sectionHeader}>
            <Text style={[styles.eyebrow, { color: theme.colors.primary }]}>
              WORKSPACE
            </Text>
            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
              Management tools
            </Text>
            <Text
              style={[styles.sectionDescription, { color: theme.colors.textMuted }]}
            >
              Open a dedicated workspace for each administration task.
            </Text>
          </View>

          <View style={styles.toolsList}>
            {ADMIN_TOOLS.map((tool) => (
              <Pressable
                key={tool.route}
                onPress={() => navigation.navigate(tool.route)}
                style={({ pressed }) => (pressed ? styles.toolPressed : null)}
              >
                <AppCard style={styles.toolCard}>
                  <Text style={[styles.toolArea, { color: theme.colors.primary }]}>
                    {tool.area}
                  </Text>
                  <Text style={[styles.toolTitle, { color: theme.colors.text }]}>
                    {tool.title}
                  </Text>
                  <Text
                    style={[
                      styles.toolDescription,
                      { color: theme.colors.textMuted },
                    ]}
                  >
                    {tool.description}
                  </Text>
                </AppCard>
              </Pressable>
            ))}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  scrollContent: { flexGrow: 1 },
  content: { gap: 16, padding: 24, paddingBottom: 40 },
  headerText: { gap: 0 },
  eyebrow: { fontSize: 12, fontWeight: '800', letterSpacing: 1.1, marginBottom: 6 },
  title: { fontSize: 30, fontWeight: '800', letterSpacing: -0.5 },
  subtitle: { fontSize: 15, lineHeight: 22, marginTop: 8 },
  profileCard: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 22,
  },
  cardLabel: { fontSize: 12, fontWeight: '800', letterSpacing: 0.9 },
  userName: { fontSize: 21, fontWeight: '800', marginTop: 5 },
  username: { fontSize: 14, marginTop: 2 },
  roleBadge: { borderRadius: 999, paddingHorizontal: 12, paddingVertical: 7 },
  roleBadgeText: { fontSize: 13, fontWeight: '800' },
  sectionHeader: { gap: 6, marginTop: 10 },
  sectionTitle: { fontSize: 22, fontWeight: '800' },
  sectionDescription: { fontSize: 14, lineHeight: 20 },
  toolsList: { gap: 12 },
  toolCard: { gap: 8, padding: 20 },
  toolPressed: { opacity: 0.78 },
  toolArea: { fontSize: 11, fontWeight: '800', letterSpacing: 1 },
  toolTitle: { fontSize: 18, fontWeight: '800' },
  toolDescription: { fontSize: 15, lineHeight: 22 },
});
