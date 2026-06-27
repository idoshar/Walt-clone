import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import { useAppTheme } from '../theme/ThemeContext';
import AppButton from './AppButton';
import AppCard from './AppCard';

export default function AppState({
  type = 'empty',
  title,
  message,
  actionLabel,
  onAction,
}) {
  const { theme } = useAppTheme();
  const isLoading = type === 'loading';
  const isError = type === 'error';

  return (
    <AppCard style={styles.card}>
      {isLoading ? (
        <ActivityIndicator color={theme.colors.primary} size="large" />
      ) : null}

      <View style={styles.content}>
        <Text
          style={[
            styles.title,
            {
              color: isError ? theme.colors.danger : theme.colors.text,
            },
          ]}
        >
          {title}
        </Text>

        {message ? (
          <Text style={[styles.message, { color: theme.colors.textMuted }]}>
            {message}
          </Text>
        ) : null}
      </View>

      {actionLabel && onAction ? (
        <AppButton
          onPress={onAction}
          title={actionLabel}
          variant={isError ? 'primary' : 'secondary'}
        />
      ) : null}
    </AppCard>
  );
}

const styles = StyleSheet.create({
  card: {
    alignItems: 'center',
    gap: 14,
    padding: 24,
  },
  content: {
    alignItems: 'center',
    gap: 6,
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    textAlign: 'center',
  },
  message: {
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
  },
});
