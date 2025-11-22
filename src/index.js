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

// Register service worker for PWA functionality
serviceWorkerRegistration.register({
  onSuccess: () => console.log('PWA: Content is cached for offline use.'),
  onUpdate: (registration) => {
    console.log('PWA: New content is available; please refresh.');
    // Optionally show a notification to the user
    if (window.confirm('New version available! Refresh to update?')) {
      window.location.reload();
    }
  }
});