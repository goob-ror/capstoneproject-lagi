// IndexedDB utility for session storage only

const DB_NAME = 'iBundaCareDB';
const DB_VERSION = 1;

// Store names - simplified to only session storage
export const STORES = {
  USER_SESSION: 'userSession'
};

// Initialize IndexedDB
export const initDB = () => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = event.target.result;

      // Create session store if it doesn't exist
      if (!db.objectStoreNames.contains(STORES.USER_SESSION)) {
        db.createObjectStore(STORES.USER_SESSION, {
          keyPath: 'id'
        });
      }
    };
  });
};

// Generic function to add data to a store
export const addData = async (storeName, data) => {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([storeName], 'readwrite');
    const store = transaction.objectStore(storeName);
    const request = store.add(data);

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

// Generic function to get data from a store
export const getData = async (storeName, key) => {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([storeName], 'readonly');
    const store = transaction.objectStore(storeName);
    const request = store.get(key);

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

// Generic function to get all data from a store
export const getAllData = async (storeName) => {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([storeName], 'readonly');
    const store = transaction.objectStore(storeName);
    const request = store.getAll();

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

// Generic function to update data in a store
export const updateData = async (storeName, data) => {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([storeName], 'readwrite');
    const store = transaction.objectStore(storeName);
    const request = store.put(data);

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

// Generic function to delete data from a store
export const deleteData = async (storeName, key) => {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([storeName], 'readwrite');
    const store = transaction.objectStore(storeName);
    const request = store.delete(key);

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

// Clear all data from a store
export const clearStore = async (storeName) => {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([storeName], 'readwrite');
    const store = transaction.objectStore(storeName);
    const request = store.clear();

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

// Session management functions
export const saveSession = async (sessionData) => {
  return updateData(STORES.USER_SESSION, {
    id: 'currentSession',
    ...sessionData,
    timestamp: Date.now()
  });
};

// Get session data
export const getSession = async () => {
  return getData(STORES.USER_SESSION, 'currentSession');
};

// Clear session (on logout)
export const clearSession = async () => {
  return deleteData(STORES.USER_SESSION, 'currentSession');
};
