import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import * as serviceWorkerRegistration from './serviceWorkerRegistration';

// IndexedDB will be initialized on-demand when needed (e.g., on login)

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// Register service worker for PWA functionality (automatic, silent)
serviceWorkerRegistration.register({
  onSuccess: () => console.log('[PWA] App ready for offline use'),
  onUpdate: () => console.log('[PWA] App updated automatically')
});