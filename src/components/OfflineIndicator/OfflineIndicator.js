import { useState, useEffect } from 'react';

const OfflineIndicator = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (isOnline) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      backgroundColor: '#FFA500',
      color: '#FFFFFF',
      padding: '10px',
      textAlign: 'center',
      fontFamily: "'Montserrat', sans-serif",
      fontSize: '14px',
      fontWeight: '600',
      zIndex: 9999
    }}>
      ⚠️ Anda sedang offline. Beberapa fitur mungkin tidak tersedia.
    </div>
  );
};

export default OfflineIndicator;
