import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useAppTheme } from '../theme/ThemeContext';

export default function ThemeToggle({ compact = false }) {
  const { theme, toggleTheme } = useAppTheme();
  const isDark = theme.mode === 'dark';

  return (
    <Pressable
      accessibilityLabel="Toggle light and dark theme"
      accessibilityRole="switch"
      accessibilityState={{ checked: isDark }}
      onPress={toggleTheme}
      style={[
        styles.toggle,
        {
          backgroundColor: theme.colors.primarySoft,
          borderColor: theme.colors.border,
        },
      ]}
    >
      <Text style={[styles.icon, { color: theme.colors.primary }]}>
        {isDark ? '☾' : '☀'}
      </Text>

      {!compact ? (
        <View>
          <Text style={[styles.label, { color: theme.colors.text }]}>
            {isDark ? 'Dark theme' : 'Light theme'}
          </Text>
          <Text style={[styles.hint, { color: theme.colors.textMuted }]}>
            Tap to switch
          </Text>
        </View>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  toggle: {
    alignItems: 'center',
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 8,
    minHeight: 42,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  icon: {
    fontSize: 18,
    fontWeight: '700',
  },
  label: {
    fontSize: 13,
    fontWeight: '700',
  },
  hint: {
    fontSize: 11,
    marginTop: 1,
  },
});
