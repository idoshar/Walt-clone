import { createContext, useContext, useState } from 'react';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(localStorage.getItem('jwt') || '');
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem('user');

    if (!savedUser) {
      return null;
    }

    try {
      return JSON.parse(savedUser);
    } catch {
      return null;
    }
  });

  function saveUser(receivedUser) {
    localStorage.setItem('user', JSON.stringify(receivedUser));
    setUser(receivedUser);
  }

  function login(receivedToken, receivedUser) {
    localStorage.setItem('jwt', receivedToken);
    setToken(receivedToken);

    if (receivedUser) {
      saveUser(receivedUser);
    }
  }

  function updateUser(updatedUser) {
    if (!updatedUser) {
      return;
    }

    saveUser(updatedUser);
  }

  function logout() {
    localStorage.removeItem('jwt');
    localStorage.removeItem('user');
    localStorage.removeItem('userId');
    setToken('');
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ token, user, login, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}