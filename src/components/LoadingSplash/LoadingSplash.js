import React from 'react';
import './LoadingSplash.css';

const LoadingSplash = ({ message = 'Memproses...' }) => {
  return (
    <div className="loading-splash-overlay">
      <div className="loading-splash-content">
        <div className="loading-splash-spinner">
          <div className="spinner-ring"></div>
          <div className="spinner-ring"></div>
          <div className="spinner-ring"></div>
        </div>
        <h3 className="loading-splash-title">{message}</h3>
        <p className="loading-splash-subtitle">Mohon tunggu sebentar...</p>
      </div>
    </div>
  );
};

export default LoadingSplash;
