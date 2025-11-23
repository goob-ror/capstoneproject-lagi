import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import LoginPage from './pages/LoginPage/LoginPage';
import RegisterPage from './pages/RegisterPage/RegisterPage';
import WaitingApprovalPage from './pages/AuthPage/AuthPage';
import Dashboard from './pages/Dashboard/Dashboard';
import OfflineIndicator from './components/OfflineIndicator/OfflineIndicator';
import AuthModel from './services/AuthModel';
import './App.css';

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const authModel = new AuthModel();
  return authModel.isAuthenticated() ? children : <Navigate to="/login" />;
};

// Layout wrapper to handle body classes
function AppLayout() {
  const location = useLocation();
  
  useEffect(() => {
    // Remove all body classes
    document.body.className = '';
    
    // Add appropriate class based on route
    if (location.pathname === '/dashboard') {
      document.body.classList.add('dashboard-page');
    } else {
      document.body.classList.add('login-page');
    }
  }, [location]);
  
  const isDashboard = location.pathname === '/dashboard';
  
  return (
    <div className={isDashboard ? 'App' : 'App centered'}>
      <OfflineIndicator />
      <Routes>
        <Route path="/" element={<Navigate to="/login" />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/waiting-approval" element={<WaitingApprovalPage />} />
        <Route 
          path="/dashboard" 
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          } 
        />
      </Routes>
    </div>
  );
}

function App() {
  return (
    <Router>
      <AppLayout />
    </Router>
  );
}

export default App;