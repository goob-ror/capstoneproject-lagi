// Centralized API client
// Wraps fetch and automatically handles 401 (token expired / invalid).
// All model files should use this instead of raw fetch().

import { dispatchSessionExpired } from './sessionExpiredEvent';

let sessionExpiredDispatched = false; // prevent duplicate dispatches in parallel requests

async function apiClient(url, options = {}) {
  // Attach auth token from localStorage if not already provided
  const token = localStorage.getItem('token');
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {}),
  };

  const response = await fetch(url, { ...options, headers });

  if (response.status === 401) {
    if (!sessionExpiredDispatched) {
      sessionExpiredDispatched = true;
      dispatchSessionExpired();
    }
    // Throw a typed error so callers can bail out cleanly
    const err = new Error('Sesi Anda telah berakhir. Silakan login kembali.');
    err.status = 401;
    throw err;
  }

  // Reset flag once a successful response comes through (e.g. after re-login)
  sessionExpiredDispatched = false;

  return response;
}

// Convenience helpers that mirror the fetch API surface
apiClient.get = (url, options = {}) =>
  apiClient(url, { ...options, method: 'GET' });

apiClient.post = (url, body, options = {}) =>
  apiClient(url, { ...options, method: 'POST', body: JSON.stringify(body) });

apiClient.put = (url, body, options = {}) =>
  apiClient(url, { ...options, method: 'PUT', body: JSON.stringify(body) });

apiClient.delete = (url, options = {}) =>
  apiClient(url, { ...options, method: 'DELETE' });

export default apiClient;
