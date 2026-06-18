import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import SearchPage from './pages/SearchPage';
import './css/index.css';

function App() {
  const [token, setToken] = useState(localStorage.getItem('jwt') || '');

  const handleLoginSuccess = (receivedToken) => {
    setToken(receivedToken);
  };

  const handleLogout = () => {
    localStorage.removeItem('jwt');
    localStorage.removeItem('user');
    setToken('');
  };

  return (
    <BrowserRouter>
      <div style={styles.appShell}>
        {token && (
          <header style={styles.navbar}>
            <span style={styles.logo}>Wolt Clone</span>
            <button onClick={handleLogout} style={styles.logoutBtn}>Log Out</button>
          </header>
        )}

        <main style={styles.mainContent}>
          <Routes>
            <Route 
              path="/login" 
              element={!token ? <LoginPage onLoginSuccess={handleLoginSuccess} /> : <Navigate to="/search" />} 
            />
            <Route 
              path="/register" 
              element={!token ? <RegisterPage onRegisterSuccess={() => {}} /> : <Navigate to="/search" />} 
            />
            <Route 
              path="/search" 
              element={token ? <SearchPage /> : <Navigate to="/login" />} 
            />
            <Route 
              path="*" 
              element={<Navigate to={token ? "/search" : "/login"} />} 
            />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}

const styles = {
  appShell: {
    display: 'flex',
    flexDirection: 'column',
    minHeight: '100vh',
  },
  navbar: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '12px 24px',
    backgroundColor: '#ffffff',
    borderBottom: '1px solid #e2e4e8',
    position: 'sticky',
    top: 0,
    zIndex: 1000,
  },
  logo: {
    fontSize: '20px',
    fontWeight: 'bold',
    color: '#009de0',
  },
  logoutBtn: {
    padding: '8px 16px',
    backgroundColor: '#f8f9fa',
    border: '1px solid #ced4da',
    borderRadius: '6px',
    cursor: 'pointer',
    fontWeight: '600',
  },
  mainContent: {
    flex: 1,
    width: '100%',
    boxSizing: 'border-box',
  },
};

export default App;