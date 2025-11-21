import React, { useState } from 'react';

const RegisterPage = () => {
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

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('Register attempt:', formData);
  };

  const handleBack = () => {
    window.history.back();
  };

  const styles = {
    container: {
      display: 'flex',
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      width: '900px',
      height: '500px',
      borderRadius: '25px',
      backgroundColor: '#FFFFFF'
    },
    imageContainer: {
      backgroundImage: 'url("/images/mothers-health.png")',
      backgroundPosition: '60% 50%',
      backgroundSize: 'cover',
      width: '400px',
      height: '100%',
      borderRadius: '25px 0 0 25px'
    },
    formContainer: {
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      width: '550px',
      height: '100%'
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
    logo: {
      width: '100%',
      margin: '0',
      padding: '0',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      textAlign: 'center'
    },
    form: {
      margin: '30px 20px 0 20px'
    },
    logoImg: {
      width: '70px',
      height: '74px',
      margin: '20px 0 0 0'
    },
    logoH1: {
      fontFamily: "'Montserrat', sans-serif",
      fontWeight: '700',
      fontSize: '18px',
      margin: '20px 0 0 0',
      color: '#515151'
    },
    logoP: {
      fontFamily: "'Istok Web', sans-serif",
      fontSize: '14px',
      fontWeight: '400',
      color: '#515151',
      marginBlock: '0'
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
    backButton: {
        padding: '20px'
    },
    buttonP: {
      fontFamily: "'Montserrat', sans-serif",
      fontStyle: 'normal',
      fontWeight: '500',
      color: '#515151',
      fontSize: '14px',
      margin: '14px 0 0 0'
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
      <div style={styles.imageContainer}>
        <button style={styles.backButton} type="button" aria-label="Go back" onClick={handleBack}>
          <svg width="13" height="21" viewBox="0 0 13 21" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path fillRule="evenodd" clipRule="evenodd" d="M10.3333 20.6667L0 10.3333L10.3333 1.90735e-06L12.9167 2.58334L5.16667 10.3333L12.9167 18.0833L10.3333 20.6667Z" fill="#22C55E"/>
          </svg>
        </button>
      </div>
      <div style={styles.formContainer}>
        <div style={styles.input}>
          <div style={styles.logo}>
            <img src="/images/logo-withText.png" alt="iBundaCare Logo" style={styles.logoImg} />
            <h1 style={styles.logoH1}>Selamat Datang!</h1>
            <p style={styles.logoP}>Buat akun untuk mulai mendata pasien di Puskesmas Palaran</p>
          </div>
          <form onSubmit={handleSubmit} style={styles.form}>
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
              <p style={styles.buttonP}>Sudah punya akun? <a className="register" href="/login" style={styles.register}>Login!</a></p>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;