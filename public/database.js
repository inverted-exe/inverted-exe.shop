// Database System using Firebase
// Initialize Firebase with your config

// STEP 1: Go to https://console.firebase.google.com/
// STEP 2: Create a new project or use existing one
// STEP 3: Enable Realtime Database
// STEP 4: Update the config below with your Firebase project credentials

const firebaseConfig = {
  apiKey: "AIzaSyDtmMeV16z7fpJxduvojxt88aJq2ySNTxw",
  authDomain: "inverted-exe-database.firebaseapp.com",
  databaseURL: "https://inverted-exe-database-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "inverted-exe-database",
  storageBucket: "inverted-exe-database.firebasestorage.app",
  messagingSenderId: "454354089986",
  appId: "1:454354089986:web:94033da6fb5b5d2bf98f1b",
  measurementId: "G-B9G52RV21Z"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.database();

// Database utility functions
const Database = {
  // Save shop items
  saveShop: async (items) => {
    try {
      await db.ref('content/shop').set(items);
      console.log('Shop data saved');
      return true;
    } catch (error) {
      console.error('Error saving shop:', error);
      return false;
    }
  },

  // Save archive items
  saveArchive: async (items) => {
    try {
      await db.ref('content/archive').set(items);
      console.log('Archive data saved');
      return true;
    } catch (error) {
      console.error('Error saving archive:', error);
      return false;
    }
  },

  // Save gallery items
  saveGallery: async (items) => {
    try {
      await db.ref('content/gallery').set(items);
      console.log('Gallery data saved');
      return true;
    } catch (error) {
      console.error('Error saving gallery:', error);
      return false;
    }
  },

  // Load shop items
  loadShop: (callback) => {
    db.ref('content/shop').on('value', (snapshot) => {
      const data = snapshot.val() || [];
      callback(data);
    });
  },

  // Load archive items
  loadArchive: (callback) => {
    db.ref('content/archive').on('value', (snapshot) => {
      const data = snapshot.val() || [];
      callback(data);
    });
  },

  // Load gallery items
  loadGallery: (callback) => {
    db.ref('content/gallery').on('value', (snapshot) => {
      const data = snapshot.val() || [];
      callback(data);
    });
  },

  // Load all content
  loadAll: (callback) => {
    db.ref('content').on('value', (snapshot) => {
      const data = snapshot.val() || {
        shop: [],
        archive: [],
        gallery: []
      };
      callback(data);
    });
  },

  // Sync local storage with Firebase (for offline support)
  syncToLocal: async () => {
    try {
      const snapshot = await db.ref('content').once('value');
      const data = snapshot.val();
      if (data) {
        localStorage.setItem('inverted_admin_data', JSON.stringify(data));
        console.log('Data synced to localStorage');
      }
    } catch (error) {
      console.error('Error syncing data:', error);
    }
  }
};
