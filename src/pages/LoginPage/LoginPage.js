import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import LoginPresenter from './LoginPage-presenter';
import './LoginPage.css';

const LoginPage = () => {
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  const [presenter] = useState(() => new LoginPresenter({
    setLoading,
    setError: (msg) => setError(msg),
    clearError: () => setError(''),
    onLoginSuccess: () => navigate('/dashboard'),
    onPendingApproval: () => navigate('/waiting-approval'),
    navigateToRegister: () => navigate('/register')
  }));

  useEffect(() => {
    // Clear error after 5 seconds
    if (error) {
      const timer = setTimeout(() => setError(''), 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleBack = () => {
    window.history.back();
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    presenter.handleLogin(formData.username, formData.password);
  };

  return (
    <div className="login-container">
      <div className="login-row-one">
        <div className="return-button">
          <button type="button" aria-label="Go back" onClick={handleBack}>
            <svg width="13" height="21" viewBox="0 0 13 21" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path fillRule="evenodd" clipRule="evenodd" d="M10.3333 20.6667L0 10.3333L10.3333 1.90735e-06L12.9167 2.58334L5.16667 10.3333L12.9167 18.0833L10.3333 20.6667Z" fill="#22C55E"/>
            </svg>
          </button>
        </div>
        <div className="login-logo">
          <img src="/images/logo-withText.png" alt="logo" />
        </div>
      </div>
      
      <div className="login-row-two">
        <div className="login-title">
          <h1>Selamat Datang!</h1>
        </div>
        <div className="login-subtitle">
          <p>Login untuk mengakses akun Anda</p>
        </div>
      </div>
      
      <div className="login-row-three">
        <div className="login-form-wrapper">
          {error && (
            <div className={error.includes('⚠️') ? 'warning-message' : 'error-message'}>
              {error}
            </div>
          )}
          <form onSubmit={handleSubmit}>
            <div className="login-form-group">
              <label htmlFor="username">Username</label>
              <input 
                type="text" 
                id="username"
                name="username" 
                placeholder="Masukkan username Anda" 
                value={formData.username}
                onChange={handleChange}
                autoComplete="username"
                required 
              />
            </div>
            <div className="login-form-group password-group">
              <label htmlFor="password">Password</label>
              <div className="password-input-wrapper">
                <input 
                  type={showPassword ? "text" : "password"}
                  id="password"
                  name="password" 
                  placeholder="Masukkan password Anda" 
                  value={formData.password}
                  onChange={handleChange}
                  autoComplete="current-password"
                  required 
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="password-toggle"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  ) : (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  )}
                </button>
              </div>
              <button type="button" onClick={(e) => e.preventDefault()} className="forgot-password-link">
                Lupa password?
              </button>
            </div>
            <div className="login-button-wrapper">
              <button type="submit" className="login-button" disabled={loading}>
                {loading ? 'LOADING...' : 'LOGIN'}
              </button>
              <p className="register-text">
                Belum punya akun? <a href="/register" className="register-link">Register!</a>
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;