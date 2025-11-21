import React, { useState } from 'react';

const LoginPage = () => {
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  });

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
    console.log('Login attempt:', formData);
  };

  const styles = {
    container: {
      backgroundColor: '#FFFFFF',
      borderRadius: '25px',
      width: '500px',
      height: '450px',
      padding: '30px 30px 30px 30px'
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
      color: '#D4D4D4',
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
      margin: '0 0 40px 0'
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
              <input 
                type="password" 
                id="password"
                name="password" 
                placeholder="Masukkan password Anda" 
                value={formData.password}
                onChange={handleChange}
                required 
                style={styles.inputField}
              />
              <a href="#" style={styles.passwordLink}>Lupa password?</a>
            </div>
            <div style={styles.button}>
              <button type="submit" style={styles.loginButton}>LOGIN</button>
              <p style={styles.buttonP}>Belum punya akun? <a className="register" href="/register" style={styles.register}>Register!</a></p>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;