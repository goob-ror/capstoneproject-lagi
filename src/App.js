import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import LoginPage from './pages/LoginPage/LoginPage';
import RegisterPage from './pages/RegisterPage/RegisterPage';
import WaitingApprovalPage from './pages/AuthPage/AuthPage';
import Dashboard from './pages/Dashboard/Dashboard';
import DataIbu from './pages/DataIbu/DataIbu';
import TambahIbu from './pages/TambahIbu/TambahIbu';
import DetailIbu from './pages/DetailIbu/DetailIbu';
import KunjunganANC from './pages/KunjunganANC/KunjunganANC';
import TambahANC from './pages/TambahANC/TambahANC';
import Komplikasi from './pages/Komplikasi/Komplikasi';
import TambahKomplikasi from './pages/TambahKomplikasi/TambahKomplikasi';
import Rekapitulasi from './pages/Rekapitulasi/Rekapitulasi';
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
    const dashboardRoutes = ['/dashboard', '/data-ibu', '/detail-ibu', '/tambah-ibu', '/kunjungan-anc', '/tambah-anc', '/komplikasi', '/tambah-komplikasi', '/rekapitulasi'];
    if (dashboardRoutes.some(route => location.pathname.startsWith(route))) {
      document.body.classList.add('dashboard-page');
    } else {
      document.body.classList.add('login-page');
    }
  }, [location]);
  
  const isDashboard = ['/dashboard', '/data-ibu', '/detail-ibu', '/tambah-ibu', '/kunjungan-anc', '/tambah-anc', '/komplikasi', '/tambah-komplikasi', '/rekapitulasi'].some(route => location.pathname.startsWith(route));
  
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
          path="/rekapitulasi" 
          element={
            <ProtectedRoute>
              <Rekapitulasi />
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