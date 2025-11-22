import { useNavigate } from 'react-router-dom';
import AuthModel from '../../models/AuthModel';

const Dashboard = () => {
  const navigate = useNavigate();
  const authModel = new AuthModel();
  const user = authModel.getUser();

  const handleLogout = () => {
    authModel.removeToken();
    authModel.removeUser();
    navigate('/login');
  };

  const styles = {
    container: {
      width: '100%',
      height: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#B6FF8C'
    },
    content: {
      backgroundColor: '#FFFFFF',
      borderRadius: '25px',
      padding: '40px',
      textAlign: 'center',
      minWidth: '500px'
    },
    title: {
      fontFamily: "'Montserrat', sans-serif",
      fontWeight: '700',
      fontSize: '28px',
      color: '#515151',
      marginBottom: '20px'
    },
    text: {
      fontFamily: "'Istok Web', sans-serif",
      fontSize: '16px',
      color: '#515151',
      marginBottom: '30px'
    },
    button: {
      backgroundColor: '#22C55E',
      color: '#FFFFFF',
      border: 'none',
      borderRadius: '10px',
      padding: '12px 30px',
      fontSize: '16px',
      fontFamily: "'Istok Web', sans-serif",
      fontWeight: '700',
      cursor: 'pointer'
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.content}>
        <h1 style={styles.title}>Dashboard</h1>
        <p style={styles.text}>
          Selamat datang, <strong>{user?.nama_lengkap || user?.username}</strong>!
        </p>
        <p style={styles.text}>
          Role: <strong>{user?.role}</strong>
        </p>
        <button style={styles.button} onClick={handleLogout}>
          Logout
        </button>
      </div>
    </div>
  );
};

export default Dashboard;
