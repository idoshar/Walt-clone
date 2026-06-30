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
import ThemeToggle from '../components/ThemeToggle';
import { useAppTheme } from '../theme/ThemeContext';

const ADMIN_TOOLS = [
  {
    area: 'RESTAURANTS',
    title: 'Restaurant moderation',
    description:
      'Review platform restaurants and manage moderation workflows.',
    route: 'AdminRestaurantModeration',
    status: 'Available now',
  },
  {
    area: 'PROMOTIONS',
    title: 'Sponsored promotions',
    description:
      'Choose which restaurants appear in sponsored placements.',
  },
  {
    area: 'ACCESS',
    title: 'User account management',
    description:
      'Manage access, roles, temporary passwords and eligible account deletion.',
    route: 'AdminUserManagement',
    status: 'Available now',
  },
  {
    area: 'INSIGHTS',
    title: 'Platform insights',
    description:
      'View platform activity, restaurant health and operational trends.',
    route: 'AdminStatistics',
    status: 'Available now',
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
          <View style={styles.headerRow}>
            <View style={styles.headerText}>
              <Text style={[styles.eyebrow, { color: theme.colors.primary }]}>
                ADMINISTRATION
              </Text>

              <Text style={[styles.title, { color: theme.colors.text }]}>
                Admin workspace
              </Text>

              <Text
                style={[styles.subtitle, { color: theme.colors.textMuted }]}
              >
                Use this workspace as the central entry point for platform
                administration.
              </Text>
            </View>

            <ThemeToggle compact />
          </View>

          <AppCard style={styles.profileCard}>
            <View>
              <Text
                style={[styles.cardLabel, { color: theme.colors.textMuted }]}
              >
                SIGNED IN AS
              </Text>

              <Text style={[styles.userName, { color: theme.colors.text }]}>
                {displayName}
              </Text>

              <Text
                style={[styles.username, { color: theme.colors.textMuted }]}
              >
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
                style={[
                  styles.roleBadgeText,
                  { color: theme.colors.primary },
                ]}
              >
                Administrator
              </Text>
            </View>
          </AppCard>

          <View style={styles.sectionHeader}>
            <View>
              <Text
                style={[styles.eyebrow, { color: theme.colors.primary }]}
              >
                WORKSPACE
              </Text>

              <Text
                style={[styles.sectionTitle, { color: theme.colors.text }]}
              >
                Management tools
              </Text>
            </View>

            <Text
              style={[
                styles.sectionDescription,
                { color: theme.colors.textMuted },
              ]}
            >
              Features are enabled here as their dedicated workflows are
              delivered.
            </Text>
          </View>

          <View style={styles.toolsList}>
            {ADMIN_TOOLS.map((tool) => (
              <Pressable
                key={tool.title}
                disabled={!tool.route}
                onPress={() => navigation.navigate(tool.route)}
                style={({ pressed }) =>
                  pressed && tool.route ? styles.toolPressed : null
                }
              >
                <AppCard style={styles.toolCard}>
                  <Text
                    style={[
                      styles.toolArea,
                      { color: theme.colors.primary },
                    ]}
                  >
                    {tool.area}
                  </Text>

                  <Text
                    style={[styles.toolTitle, { color: theme.colors.text }]}
                  >
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

                  <View
                    style={[
                      styles.comingSoonBadge,
                      { backgroundColor: theme.colors.primarySoft },
                    ]}
                  >
                    <Text
                      style={[
                        styles.comingSoonText,
                        { color: theme.colors.primary },
                      ]}
                    >
                      {tool.status || 'Coming soon'}
                    </Text>
                  </View>
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
  safeArea: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  content: {
    gap: 16,
    padding: 24,
    paddingBottom: 40,
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
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 22,
  },
  cardLabel: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.9,
  },
  userName: {
    fontSize: 21,
    fontWeight: '800',
    marginTop: 5,
  },
  username: {
    fontSize: 14,
    marginTop: 2,
  },
  roleBadge: {
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  roleBadgeText: {
    fontSize: 13,
    fontWeight: '800',
  },
  sectionHeader: {
    gap: 8,
    marginTop: 10,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '800',
  },
  sectionDescription: {
    fontSize: 14,
    lineHeight: 20,
  },
  toolsList: {
    gap: 12,
  },
  toolCard: {
    gap: 8,
    padding: 20,
  },
  toolPressed: {
    opacity: 0.78,
  },
  toolArea: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
  },
  toolTitle: {
    fontSize: 18,
    fontWeight: '800',
  },
  toolDescription: {
    fontSize: 15,
    lineHeight: 22,
  },
  comingSoonBadge: {
    alignSelf: 'flex-start',
    borderRadius: 999,
    marginTop: 6,
    paddingHorizontal: 11,
    paddingVertical: 6,
  },
  comingSoonText: {
    fontSize: 12,
    fontWeight: '800',
  },
});
