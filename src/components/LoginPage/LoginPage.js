import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import LoginPresenter from '../../presenters/LoginPresenter';

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

  const styles = {
    container: {
      backgroundColor: '#FFFFFF',
      borderRadius: '25px',
      width: '500px',
      height: '450px',
      padding: '30px 30px 30px 30px',
      position: 'relative'
    },
    errorMessage: {
      backgroundColor: '#FEE2E2',
      border: '1px solid #FCA5A5',
      color: '#991B1B',
      padding: '10px',
      borderRadius: '6px',
      marginBottom: '15px',
      fontSize: '14px',
      fontFamily: "'Montserrat', sans-serif"
    },
    rowsOne: {
      width: '100%',
      display: 'flex'
    },
    logo: {
      width: '100%',
      marginLeft: '-21px',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center'
    },
    logoImg: {
      width: '76px',
      height: '74px'
    },
    rowsTwo: {
      width: '100%',
      display: 'flex',
      flexDirection: 'column',
      margin: '20px 0 0 0',
      padding: '0',
      textAlign: 'center'
    },
    title: {
      width: '100%',
      margin: '0',
      padding: '0'
    },
    titleH1: {
      fontFamily: "'Montserrat', sans-serif",
      fontStyle: 'normal',
      fontWeight: '700',
      fontSize: '24px',
      lineHeight: '36px',
      color: '#515151',
      margin: '0',
      padding: '0'
    },
    subTitle: {
      width: '100%',
      margin: '-5px 0 0 0',
      padding: '0'
    },
    subTitleP: {
      fontFamily: "'Istok Web', sans-serif",
      fontStyle: 'normal',
      fontWeight: '400',
      fontSize: '16px',
      lineHeight: '24px',
      color: '#515151',
      margin: '0',
      padding: '0'
    },
    rowsThree: {
      width: 'auto',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center'
    },
    label: {
      fontFamily: "'Montserrat', sans-serif",
      fontWeight: '600',
      color: '#515151',
      fontSize: '14px',
      lineHeight: '10px'
    },
    input: {
      width: '100%',
      display: 'flex',
      flexDirection: 'column'
    },
    inputField: {
      width: '29.5rem',
      height: '40px',
      borderRadius: '6px',
      border: '1px solid #D4D4D4',
      padding: '0 12px',
      fontFamily: "'Montserrat', sans-serif",
      fontStyle: 'normal',
      fontWeight: '400',
      fontSize: '14px',
      lineHeight: '24px',
      margin: '6px 0 0 0'
    },
    passwordLink: {
      fontFamily: "'Istok Web', sans-serif",
      fontStyle: 'normal',
      fontWeight: '400',
      fontSize: '12px',
      lineHeight: '18px',
      color: '#919191',
      textDecoration: 'none',
      margin: '0 0 0 0'
    },
    username: {
      margin: '0 0 15px 0'
    },
    password: {
      margin: '0 0 40px 0',
      position: 'relative'
    },
    passwordInputWrapper: {
      position: 'relative',
      display: 'flex',
      alignItems: 'center'
    },
    passwordToggle: {
      position: 'absolute',
      right: '12px',
      top: '50%',
      transform: 'translateY(-40%)',
      background: 'none',
      border: 'none',
      cursor: 'pointer',
      padding: '5px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: '#919191'
    },
    inputFieldWithIcon: {
      width: '29.5rem',
      height: '40px',
      borderRadius: '6px',
      border: '1px solid #D4D4D4',
      padding: '0 45px 0 12px',
      fontFamily: "'Montserrat', sans-serif",
      fontStyle: 'normal',
      fontWeight: '400',
      fontSize: '14px',
      lineHeight: '24px',
      color: '#515151',
      margin: '6px 0 0 0'
    },
    button: {
      width: '100%',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      margin: '0'
    },
    loginButton: {
      width: '250px',
      height: '35px',
      borderRadius: '10px',
      margin: '0 0 -10px 0',
      backgroundColor: '#22C55E',
      border: 'none',
      cursor: 'pointer',
      fontFamily: "'Istok Web', sans-serif",
      fontStyle: 'normal',
      fontWeight: '700',
      fontSize: '16px',
      lineHeight: '24px',
      color: '#FFFFFF'
    },
    buttonP: {
      fontFamily: "'Montserrat', sans-serif",
      fontStyle: 'normal',
      fontWeight: '500',
      color: '#515151',
      fontSize: '14px'
    },
    buttonBack: {
        padding: '20px',
        margin: '0 0 0 -20px'
    },
    register: {
      color: '#22C55E',
      textDecoration: 'none',
      fontFamily: "'Montserrat', sans-serif",
      fontWeight: '500'
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.rowsOne}>
        <div className="return-button">
          <button style={styles.buttonBack} type="button" aria-label="Go back" onClick={handleBack}>
            <svg width="13" height="21" viewBox="0 0 13 21" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path fillRule="evenodd" clipRule="evenodd" d="M10.3333 20.6667L0 10.3333L10.3333 1.90735e-06L12.9167 2.58334L5.16667 10.3333L12.9167 18.0833L10.3333 20.6667Z" fill="#22C55E"/>
            </svg>
          </button>
        </div>
        <div style={styles.logo}>
          <img src="/images/logo-withText.png" alt="logo" style={styles.logoImg} />
        </div>
      </div>
      
      <div style={styles.rowsTwo}>
        <div style={styles.title}>
          <h1 style={styles.titleH1}>Selamat Datang!</h1>
        </div>
        <div style={styles.subTitle}>
          <p style={styles.subTitleP}>Login untuk mengakses akun Anda</p>
        </div>
      </div>
      
      <div style={styles.rowsThree}>
        <div style={styles.input}>
          {error && <div style={styles.errorMessage}>{error}</div>}
          <form onSubmit={handleSubmit}>
            <div style={styles.username}>
              <label htmlFor="username" style={styles.label}>Username</label>
              <input 
                type="text" 
                id="username"
                name="username" 
                placeholder="Masukkan username Anda" 
                value={formData.username}
                onChange={handleChange}
                required 
                style={styles.inputField}
              />
            </div>
            <div style={styles.password}>
              <label htmlFor="password" style={styles.label}>Password</label>
              <div style={styles.passwordInputWrapper}>
                <input 
                  type={showPassword ? "text" : "password"}
                  id="password"
                  name="password" 
                  placeholder="Masukkan password Anda" 
                  value={formData.password}
                  onChange={handleChange}
                  required 
                  style={styles.inputFieldWithIcon}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={styles.passwordToggle}
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
              <a href="#" style={styles.passwordLink}>Lupa password?</a>
            </div>
            <div style={styles.button}>
              <button type="submit" style={styles.loginButton} disabled={loading}>
                {loading ? 'LOADING...' : 'LOGIN'}
              </button>
              <p style={styles.buttonP}>
                Belum punya akun? <a className="register" href="/register" style={styles.register}>Register!</a>
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;