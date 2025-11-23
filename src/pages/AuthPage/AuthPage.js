import React from 'react';

const AuthPage = () => {
  const styles = {
    container: {
      width: '100%',
      height: '100%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    },
    content: {
      width: '600px',
      height: '500px',
      backgroundColor: '#ffffff',
      borderRadius: '25px',
      padding: '10px 40px 20px 40px',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center'
    },
    logo: {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center'
    },
    logoH1: {
      fontFamily: "'Montserrat', sans-serif",
      fontWeight: '700',
      fontSize: '20px',
      margin: '20px 0 0 0',
      color: '#515151'
    },
    logoBackground: {
      backgroundColor: '#16A34A',
      width: '100px',
      height: '100px',
      borderRadius: '100%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    },
    messageInfo: {
      width: '400px',
      height: '100px',
      marginTop: '20px',
      textAlign: 'center',
      backgroundColor: '#F0FDF4',
      border: '1px solid #BBF7D0',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px',
      borderRadius: '8px'
    },
    messageInfoP: {
      fontFamily: "'Montserrat', sans-serif",
      fontWeight: '400',
      fontSize: '16px',
      color: '#15803D',
      margin: '0',
      lineHeight: '1.5'
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.content}>
        <div style={styles.logo}>
          <div style={styles.logoBackground}>
            <svg width="60" height="60" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M50 87.5C70.7107 87.5 87.5 70.7107 87.5 50C87.5 29.2893 70.7107 12.5 50 12.5C29.2893 12.5 12.5 29.2893 12.5 50C12.5 70.7107 29.2893 87.5 50 87.5Z" stroke="white" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M45.8333 33.3333V54.1667H66.6666" stroke="white" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <h1 style={styles.logoH1}>PENDING APPROVAL</h1>
        </div>
        <div style={styles.messageInfo}>
          <p style={styles.messageInfoP}>
            Akunmu sedang menunggu persetujuan dari staff mohon menunggu proses persetujuan atau beritahu langsung kepada kepala divisi Anda!
          </p>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;
