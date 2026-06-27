import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useContext, useEffect, useMemo, useState } from 'react';

import {
  loginWithCredentials,
  registerUser,
} from '../api/auth';

const AUTH_STORAGE_KEY = '@wolt_delivery_auth_session';

const AuthContext = createContext(null);

function normalizeSession(loginResponse) {
  if (
    !loginResponse ||
    typeof loginResponse.token !== 'string' ||
    !loginResponse.token ||
    !loginResponse.user
  ) {
    throw new Error('The server returned an invalid login response.');
  }

  return {
    token: loginResponse.token,
    user: loginResponse.user,
  };
}

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [isRestoringSession, setIsRestoringSession] = useState(true);

  useEffect(() => {
    async function restoreSession() {
      try {
        const storedSession = await AsyncStorage.getItem(AUTH_STORAGE_KEY);

        if (!storedSession) {
          return;
        }

        const parsedSession = JSON.parse(storedSession);

        if (
          typeof parsedSession?.token === 'string' &&
          parsedSession.token &&
          parsedSession.user
        ) {
          setSession(parsedSession);
        }
      } catch {
        await AsyncStorage.removeItem(AUTH_STORAGE_KEY);
      } finally {
        setIsRestoringSession(false);
      }
    }

    restoreSession();
  }, []);

  const value = useMemo(
    () => ({
      token: session?.token || null,
      user: session?.user || null,
      isAuthenticated: Boolean(session?.token),
      isRestoringSession,

      async signIn(username, password) {
        const loginResponse = await loginWithCredentials(username, password);
        const nextSession = normalizeSession(loginResponse);

        await AsyncStorage.setItem(
          AUTH_STORAGE_KEY,
          JSON.stringify(nextSession)
        );

        setSession(nextSession);
      },

      async signUp(userData) {
        await registerUser(userData);

        const loginResponse = await loginWithCredentials(
          userData.username,
          userData.password
        );

        const nextSession = normalizeSession(loginResponse);

        await AsyncStorage.setItem(
          AUTH_STORAGE_KEY,
          JSON.stringify(nextSession)
        );

        setSession(nextSession);
      },

      async signOut() {
        await AsyncStorage.removeItem(AUTH_STORAGE_KEY);
        setSession(null);
      },
    }),
    [isRestoringSession, session]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used inside AuthProvider.');
  }

  return context;
}