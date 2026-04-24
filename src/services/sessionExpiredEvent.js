// Centralized event bus for session expiry
// Any part of the app can dispatch SESSION_EXPIRED; App.js listens and handles cleanup.

export const SESSION_EXPIRED_EVENT = 'app:session-expired';

export function dispatchSessionExpired() {
  window.dispatchEvent(new CustomEvent(SESSION_EXPIRED_EVENT));
}
