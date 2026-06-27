import { DarkTheme, DefaultTheme } from '@react-navigation/native';

const palette = {
  woltBlue: '#00C2E0',
  woltBluePressed: '#00A9C4',
  woltBlueSoft: '#DDF8FD',
  ink: '#17212B',
  inkMuted: '#637381',
  line: '#DDE4E8',
  page: '#F7F9FA',
  white: '#FFFFFF',
  danger: '#C83E4D',
  dangerSoft: '#FCE8EB',
  success: '#1F8A5B',
  darkPage: '#11181F',
  darkSurface: '#1B2630',
  darkSurfaceRaised: '#24323E',
  darkText: '#F5F9FB',
  darkMuted: '#AEBCC6',
  darkLine: '#354451',
};

export const lightColors = {
  primary: palette.woltBlue,
  primaryPressed: palette.woltBluePressed,
  primarySoft: palette.woltBlueSoft,
  background: palette.page,
  surface: palette.white,
  surfaceRaised: palette.white,
  text: palette.ink,
  textMuted: palette.inkMuted,
  border: palette.line,
  danger: palette.danger,
  dangerSoft: palette.dangerSoft,
  success: palette.success,
  onPrimary: palette.white,
  shadow: '#1C2B36',
};

export const darkColors = {
  primary: '#4DD7ED',
  primaryPressed: '#28BDD5',
  primarySoft: '#163E47',
  background: palette.darkPage,
  surface: palette.darkSurface,
  surfaceRaised: palette.darkSurfaceRaised,
  text: palette.darkText,
  textMuted: palette.darkMuted,
  border: palette.darkLine,
  danger: '#FF8592',
  dangerSoft: '#4B252C',
  success: '#65D39A',
  onPrimary: '#102027',
  shadow: '#000000',
};

export function getColors(mode) {
  return mode === 'dark' ? darkColors : lightColors;
}

export function createNavigationTheme(mode) {
  const baseTheme = mode === 'dark' ? DarkTheme : DefaultTheme;
  const colors = getColors(mode);

  return {
    ...baseTheme,
    dark: mode === 'dark',
    colors: {
      ...baseTheme.colors,
      primary: colors.primary,
      background: colors.background,
      card: colors.surface,
      text: colors.text,
      border: colors.border,
      notification: colors.danger,
    },
    fonts: {
      ...baseTheme.fonts,
    },
  };
}
