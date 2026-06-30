import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useAppTheme } from '../theme/ThemeContext';

export default function ThemeToggle({ compact = false }) {
  const { theme, toggleTheme } = useAppTheme();
  const isDark = theme.mode === 'dark';
  const nextThemeLabel = isDark ? 'Light' : 'Dark';
  const nextThemeMode = `${nextThemeLabel.toLowerCase()} mode`;

  return (
    <Pressable
      accessibilityLabel={`Switch to ${nextThemeMode}`}
      accessibilityRole="switch"
      accessibilityState={{ checked: isDark }}
      onPress={toggleTheme}
      style={[
        styles.toggle,
        compact ? styles.compactToggle : null,
        {
          backgroundColor: theme.colors.primarySoft,
          borderColor: theme.colors.border,
        },
      ]}
    >
      <Text style={styles.icon}>{isDark ? '☀️' : '🌙'}</Text>

      {!compact ? (
        <View>
          <Text style={[styles.label, { color: theme.colors.text }]}>
            {nextThemeLabel}
          </Text>
          <Text style={[styles.hint, { color: theme.colors.textMuted }]}>
            Switch to {nextThemeMode}
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
  compactToggle: {
    minHeight: 36,
    minWidth: 36,
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  icon: {
    fontSize: 18,
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
