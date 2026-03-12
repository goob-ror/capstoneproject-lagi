import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import React from 'react';
import LoginPage from './pages/LoginPage/LoginPage';
import RegisterPage from './pages/RegisterPage/RegisterPage';
import WaitingApprovalPage from './pages/AuthPage/AuthPage';
import Dashboard from './pages/Dashboard/Dashboard';
import DataIbu from './pages/DataIbu/DataIbu';
import TambahIbu from './pages/TambahIbu/TambahIbu';
import DetailIbu from './pages/DetailIbu/DetailIbu';
import KunjunganANC from './pages/KunjunganANC/KunjunganANC';
import TambahANC from './pages/TambahANC/TambahANC';
// eslint-disable-next-line no-unused-vars
import Persalinan from './pages/Persalinan/Persalinan';
// eslint-disable-next-line no-unused-vars
import TambahPersalinan from './pages/TambahPersalinan/TambahPersalinan';
import KunjunganNifas from './pages/KunjunganNifas/KunjunganNifas';
import TambahNifas from './pages/TambahNifas/TambahNifas';
import Komplikasi from './pages/Komplikasi/Komplikasi';
import TambahKomplikasi from './pages/TambahKomplikasi/TambahKomplikasi';
import Posyandu from './pages/Posyandu/Posyandu';
import Rekapitulasi from './pages/Rekapitulasi/Rekapitulasi';
import UserManagement from './pages/UserManagement/UserManagement';
import OfflineIndicator from './components/OfflineIndicator/OfflineIndicator';
import AuthModel from './services/AuthModel';
import './App.css';

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const [isChecking, setIsChecking] = React.useState(true);
  const [isAuthenticated, setIsAuthenticated] = React.useState(false);
  const authModel = React.useMemo(() => new AuthModel(), []);
  const location = useLocation();

  React.useEffect(() => {
    const checkAuth = async () => {
      try {
        // Quick check with localStorage
        const quickCheck = authModel.isAuthenticated();
        
        if (quickCheck) {
          // Verify token is valid (not just exists)
          const token = authModel.getToken();
          const user = authModel.getUser();
          
          if (token && user) {
            setIsAuthenticated(true);
          } else {
            // Token or user missing, clear everything
            authModel.removeToken();
            authModel.removeUser();
            setIsAuthenticated(false);
          }
        } else {
          // Try to restore from IndexedDB
          const sessionValid = await authModel.checkSessionValidity();
          setIsAuthenticated(sessionValid);
        }
      } catch (error) {
        console.error('Auth check error:', error);
        setIsAuthenticated(false);
      } finally {
        setIsChecking(false);
      }
    };
    
    checkAuth();
  }, [authModel, location.pathname]);

  // Show loading while checking authentication
  if (isChecking) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        fontFamily: 'Montserrat, sans-serif',
        backgroundColor: '#EAEAEA'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: '50px',
            height: '50px',
            border: '4px solid #E5E7EB',
            borderTopColor: '#22C55E',
            borderRadius: '50%',
            animation: 'spin 0.8s linear infinite',
            margin: '0 auto 20px'
          }}></div>
          <p style={{ color: '#6B7280', fontSize: '14px' }}>Memeriksa sesi...</p>
        </div>
      </div>
    );
  }

  // If not authenticated, redirect to login
  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return children;
};

// Public Route Component (redirects to dashboard if already logged in)
const PublicRoute = ({ children }) => {
  const authModel = React.useMemo(() => new AuthModel(), []);
  const isAuthenticated = authModel.isAuthenticated();

  return isAuthenticated ? <Navigate to="/dashboard" replace /> : children;
};

// Layout wrapper to handle body classes
function AppLayout() {
  const location = useLocation();

  useEffect(() => {
    // Remove all body classes
    document.body.className = '';

    // Add appropriate class based on route
    const dashboardRoutes = ['/dashboard', '/data-ibu', '/detail-ibu', '/tambah-ibu', '/kunjungan-anc', '/tambah-anc', '/persalinan', '/tambah-persalinan', '/kunjungan-nifas', '/tambah-nifas', '/komplikasi', '/tambah-komplikasi', '/posyandu', '/rekapitulasi', '/user-management'];
    if (dashboardRoutes.some(route => location.pathname.startsWith(route))) {
      document.body.classList.add('dashboard-page');
    } else {
      document.body.classList.add('login-page');
    }
  }, [location]);

  const isDashboard = ['/dashboard', '/data-ibu', '/detail-ibu', '/tambah-ibu', '/kunjungan-anc', '/tambah-anc', '/persalinan', '/tambah-persalinan', '/kunjungan-nifas', '/tambah-nifas', '/komplikasi', '/tambah-komplikasi', '/posyandu', '/rekapitulasi', '/user-management'].some(route => location.pathname.startsWith(route));

  return (
    <div className={isDashboard ? 'App' : 'App centered'}>
      <OfflineIndicator />
      <Routes>
        <Route path="/" element={<Navigate to="/login" />} />
        <Route 
          path="/login" 
          element={
            <PublicRoute>
              <LoginPage />
            </PublicRoute>
          } 
        />
        <Route 
          path="/register" 
          element={
            <PublicRoute>
              <RegisterPage />
            </PublicRoute>
          } 
        />
        <Route path="/waiting-approval" element={<WaitingApprovalPage />} />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/data-ibu"
          element={
            <ProtectedRoute>
              <DataIbu />
            </ProtectedRoute>
          }
        />
        <Route
          path="/tambah-ibu"
          element={
            <ProtectedRoute>
              <TambahIbu />
            </ProtectedRoute>
          }
        />
        <Route
          path="/detail-ibu/:id"
          element={
            <ProtectedRoute>
              <DetailIbu />
            </ProtectedRoute>
          }
        />
        <Route
          path="/kunjungan-anc"
          element={
            <ProtectedRoute>
              <KunjunganANC />
            </ProtectedRoute>
          }
        />
        <Route
          path="/tambah-anc"
          element={
            <ProtectedRoute>
              <TambahANC />
            </ProtectedRoute>
          }
        />
        <Route
          path="/persalinan"
          element={
            <ProtectedRoute>
              <Persalinan />
            </ProtectedRoute>
          }
        />
        <Route
          path="/tambah-persalinan"
          element={
            <ProtectedRoute>
              <TambahPersalinan />
            </ProtectedRoute>
          }
        />
        <Route
          path="/kunjungan-nifas"
          element={
            <ProtectedRoute>
              <KunjunganNifas />
            </ProtectedRoute>
          }
        />
        <Route
          path="/tambah-nifas"
          element={
            <ProtectedRoute>
              <TambahNifas />
            </ProtectedRoute>
          }
        />
        <Route
          path="/komplikasi"
          element={
            <ProtectedRoute>
              <Komplikasi />
            </ProtectedRoute>
          }
        />
        <Route
          path="/tambah-komplikasi"
          element={
            <ProtectedRoute>
              <TambahKomplikasi />
            </ProtectedRoute>
          }
        />
        <Route
          path="/posyandu"
          element={
            <ProtectedRoute>
              <Posyandu />
            </ProtectedRoute>
          }
        />
        <Route
          path="/rekapitulasi"
          element={
            <ProtectedRoute>
              <Rekapitulasi />
            </ProtectedRoute>
          }
        />
        <Route
          path="/user-management"
          element={
            <ProtectedRoute>
              <UserManagement />
            </ProtectedRoute>
          }
        />
        {/* Catch-all route - redirect unknown paths to login */}
        <Route path="*" element={<Navigate to="/login" replace />} />
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