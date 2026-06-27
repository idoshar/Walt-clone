import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

import { getColors } from './colors';
import { spacing } from './spacing';
import { typography } from './typography';

const THEME_STORAGE_KEY = '@wolt_delivery_theme_mode';
const DEFAULT_THEME_MODE = 'light';

const ThemeContext = createContext(null);

function normalizeThemeMode(value) {
  return value === 'dark' ? 'dark' : 'light';
}

export function ThemeProvider({ children }) {
  const [themeMode, setThemeModeState] = useState(DEFAULT_THEME_MODE);
  const [isRestoringTheme, setIsRestoringTheme] = useState(true);

  useEffect(() => {
    async function restoreTheme() {
      try {
        const storedThemeMode = await AsyncStorage.getItem(THEME_STORAGE_KEY);

        if (storedThemeMode) {
          setThemeModeState(normalizeThemeMode(storedThemeMode));
        }
      } finally {
        setIsRestoringTheme(false);
      }
    }

    restoreTheme();
  }, []);

  const setThemeMode = useCallback(async (nextThemeMode) => {
    const normalizedThemeMode = normalizeThemeMode(nextThemeMode);

    setThemeModeState(normalizedThemeMode);

    try {
      await AsyncStorage.setItem(THEME_STORAGE_KEY, normalizedThemeMode);
    } catch {
      // The visual preference still applies for the current app session.
    }
  }, []);

  const toggleTheme = useCallback(() => {
    const nextThemeMode = themeMode === 'dark' ? 'light' : 'dark';

    return setThemeMode(nextThemeMode);
  }, [setThemeMode, themeMode]);

  const value = useMemo(
    () => ({
      themeMode,
      isRestoringTheme,
      setThemeMode,
      toggleTheme,
      theme: {
        mode: themeMode,
        colors: getColors(themeMode),
        spacing,
        typography,
      },
    }),
    [isRestoringTheme, setThemeMode, themeMode, toggleTheme]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useAppTheme() {
  const context = useContext(ThemeContext);

  if (!context) {
    throw new Error('useAppTheme must be used inside ThemeProvider.');
  }

  return context;
}
