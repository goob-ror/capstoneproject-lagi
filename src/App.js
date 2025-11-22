import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './components/LoginPage/LoginPage';
import RegisterPage from './components/RegisterPage/RegisterPage';
import WaitingApprovalPage from './components/AuthPage/AuthPage';
import Dashboard from './components/Dashboard/Dashboard';
import AuthModel from './models/AuthModel';
import './App.css';

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const authModel = new AuthModel();
  return authModel.isAuthenticated() ? children : <Navigate to="/login" />;
};

function App() {
  return (
    <Router>
      <div className="App">
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
    </Router>
  );
}

export default App;