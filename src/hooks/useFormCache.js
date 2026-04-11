import { useEffect, useLayoutEffect, useRef, useCallback } from 'react';

/**
 * Read a single field from the cache synchronously.
 * Use inside useState(() => readCache(key, 'field', defaultValue))
 * so the cached value is the initial state — no effects, no race conditions.
 */
export const readCache = (cacheKey, field, defaultValue) => {
  try {
    const cached = localStorage.getItem(cacheKey);
    if (!cached) return defaultValue;
    const parsed = JSON.parse(cached);
    return parsed[field] !== undefined ? parsed[field] : defaultValue;
  } catch {
    return defaultValue;
  }
};

/**
 * Persists a plain state snapshot to localStorage after every render.
 * Skips the very first render to avoid overwriting the cache before
 * lazy initializers have applied it.
 *
 * Pair with readCache() lazy useState initializers.
 * Only active when NOT in edit mode.
 *
 * @param {string} cacheKey  - Unique localStorage key
 * @param {object} snapshot  - Plain object of current state values to persist
 * @param {boolean} isEdit   - Disables caching entirely when true
 */
const useFormCache = (cacheKey, snapshot, isEdit) => {
  // renderCount starts at 0; incremented synchronously before paint via useLayoutEffect
  const renderCount = useRef(0);

  useLayoutEffect(() => {
    renderCount.current += 1;
  });

  // Persist after every render — but skip render #1 (initial mount)
  useEffect(() => {
    if (isEdit || renderCount.current <= 1) return;
    try {
      localStorage.setItem(cacheKey, JSON.stringify(snapshot));
    } catch {
      // Ignore quota errors
    }
  });

  const clearCache = useCallback(() => {
    localStorage.removeItem(cacheKey);
  }, [cacheKey]);

  return { clearCache };
};

export default useFormCache;
