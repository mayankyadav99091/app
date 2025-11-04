import { useState, useEffect } from 'react';
import '@/App.css';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from '@/pages/Login';
import Dashboard from '@/pages/Dashboard';
import Mess from '@/pages/Mess';
import Sports from '@/pages/Sports';
import LostFound from '@/pages/LostFound';
import Complaints from '@/pages/Complaints';
import Admin from '@/pages/Admin';
import { Toaster } from '@/components/ui/sonner';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const role = localStorage.getItem('role');
    if (token) {
      setIsAuthenticated(true);
      setIsAdmin(role === 'admin');
    }
  }, []);

  const handleLogin = (token, role) => {
    localStorage.setItem('token', token);
    localStorage.setItem('role', role);
    setIsAuthenticated(true);
    setIsAdmin(role === 'admin');
  };

  const handleLogout = () => {
    localStorage.clear();
    setIsAuthenticated(false);
    setIsAdmin(false);
  };

  return (
    <div className="App">
      <BrowserRouter>
        <Routes>
          <Route
            path="/"
            element={
              isAuthenticated ? (
                <Navigate to="/dashboard" replace />
              ) : (
                <Login onLogin={handleLogin} />
              )
            }
          />
          <Route
            path="/dashboard"
            element={
              isAuthenticated ? (
                <Dashboard onLogout={handleLogout} isAdmin={isAdmin} />
              ) : (
                <Navigate to="/" replace />
              )
            }
          />
          <Route
            path="/mess"
            element={
              isAuthenticated ? (
                <Mess onLogout={handleLogout} />
              ) : (
                <Navigate to="/" replace />
              )
            }
          />
          <Route
            path="/sports"
            element={
              isAuthenticated ? (
                <Sports onLogout={handleLogout} />
              ) : (
                <Navigate to="/" replace />
              )
            }
          />
          <Route
            path="/lost-found"
            element={
              isAuthenticated ? (
                <LostFound onLogout={handleLogout} />
              ) : (
                <Navigate to="/" replace />
              )
            }
          />
          <Route
            path="/complaints"
            element={
              isAuthenticated ? (
                <Complaints onLogout={handleLogout} />
              ) : (
                <Navigate to="/" replace />
              )
            }
          />
          <Route
            path="/admin"
            element={
              isAuthenticated && isAdmin ? (
                <Admin onLogout={handleLogout} />
              ) : (
                <Navigate to="/dashboard" replace />
              )
            }
          />
        </Routes>
      </BrowserRouter>
      <Toaster position="top-right" expand={true} richColors />
    </div>
  );
}

export default App;