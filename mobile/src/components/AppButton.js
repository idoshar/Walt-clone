import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
} from 'react-native';

import { useAppTheme } from '../theme/ThemeContext';

export default function AppButton({
  title,
  onPress,
  variant = 'primary',
  disabled = false,
  loading = false,
  style,
  textStyle,
  accessibilityLabel,
}) {
  const { theme } = useAppTheme();

  const isPrimary = variant === 'primary';
  const isSecondary = variant === 'secondary';

  const backgroundColor = isPrimary
    ? theme.colors.primary
    : isSecondary
      ? theme.colors.primarySoft
      : 'transparent';

  const textColor = isPrimary
    ? theme.colors.onPrimary
    : theme.colors.primary;

  return (
    <Pressable
      accessibilityLabel={accessibilityLabel || title}
      accessibilityRole="button"
      disabled={disabled || loading}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        {
          backgroundColor,
          borderColor: isSecondary ? theme.colors.primary : 'transparent',
          opacity: disabled || loading ? 0.55 : pressed ? 0.78 : 1,
        },
        variant === 'text' ? styles.textButton : null,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={textColor} />
      ) : (
        <Text
          style={[
            styles.text,
            {
              color: textColor,
              fontSize: theme.typography.button.fontSize,
            },
            textStyle,
          ]}
        >
          {title}
        </Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    borderRadius: 14,
    borderWidth: 1,
    justifyContent: 'center',
    minHeight: 50,
    paddingHorizontal: 18,
    paddingVertical: 12,
  },
  textButton: {
    alignSelf: 'flex-start',
    minHeight: 36,
    paddingHorizontal: 0,
    paddingVertical: 4,
  },
  text: {
    fontWeight: '700',
  },
});
