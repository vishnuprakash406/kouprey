// Firebase Reviews Configuration
// Get your Firebase config from: https://console.firebase.google.com/
// 1. Create a new Firebase project
// 2. Enable Realtime Database
// 3. Copy your config below

// API endpoint configuration - uses relative path for Cloudflare Pages Functions
const API_BASE_URL = '';

const FIREBASE_CONFIG = {
  apiKey: localStorage.getItem('firebase_apiKey') || 'YOUR_API_KEY',
  authDomain: localStorage.getItem('firebase_authDomain') || 'your-project.firebaseapp.com',
  projectId: localStorage.getItem('firebase_projectId') || 'your-project-id',
  databaseURL: localStorage.getItem('firebase_databaseURL') || 'https://your-project-id.firebaseio.com',
  storageBucket: localStorage.getItem('firebase_storageBucket') || 'your-project.appspot.com',
  messagingSenderId: localStorage.getItem('firebase_messagingSenderId') || 'YOUR_SENDER_ID',
  appId: localStorage.getItem('firebase_appId') || 'YOUR_APP_ID'
};

let firebaseDb = null;
let firebaseReady = false;

// Initialize Firebase
try {
  if (typeof firebase !== 'undefined' && FIREBASE_CONFIG.projectId && !FIREBASE_CONFIG.projectId.includes('YOUR_')) {
    firebase.initializeApp(FIREBASE_CONFIG);
    firebaseDb = firebase.database();
    firebaseReady = true;
    console.log('Firebase initialized successfully');
  } else {
    console.log('Firebase not configured. Using API/localStorage fallback.');
  }
} catch (error) {
  console.log('Firebase initialization error:', error);
}

// Submit review to Firebase (primary), API (secondary), or localStorage (fallback)
async function submitReviewToCloud(productId, reviewData) {
  if (firebaseReady && firebaseDb) {
    try {
      const reviewKey = firebaseDb.ref(`reviews/${productId}`).push().key;
      await firebaseDb.ref(`reviews/${productId}/${reviewKey}`).set(reviewData);
      console.log('Review saved to Firebase');
      return true;
    } catch (error) {
      console.error('Firebase submission error:', error);
      // Fall through to API attempt
    }
  }

  // Try API (Cloudflare Workers or Node.js)
  try {
    const response = await fetch(`${API_BASE_URL}/api/reviews`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(reviewData),
    });
    
    if (response.ok) {
      console.log('Review saved via Cloudflare Workers API');
      return true;
    }
  } catch (apiError) {
    console.log('API submission failed, using localStorage fallback');
  }

  // Fallback to localStorage
  const REVIEWS_STORAGE_KEY = `kouprey_reviews_${productId}`;
  const existing = JSON.parse(localStorage.getItem(REVIEWS_STORAGE_KEY) || '[]');
  existing.push(reviewData);
  localStorage.setItem(REVIEWS_STORAGE_KEY, JSON.stringify(existing));
  console.log('Review saved to localStorage');
  return true;
}

// Load reviews from Firebase (primary), API (secondary), or localStorage (fallback)
async function loadReviewsFromCloud(productId) {
  if (firebaseReady && firebaseDb) {
    try {
      return await new Promise((resolve) => {
        firebaseDb.ref(`reviews/${productId}`).once('value', (snapshot) => {
          const data = snapshot.val();
          if (data) {
            const reviews = Object.values(data).sort((a, b) => 
              new Date(b.timestamp) - new Date(a.timestamp)
            );
            console.log('Reviews loaded from Firebase');
            resolve(reviews);
          } else {
            resolve([]);
          }
        });
      });
    } catch (error) {
      console.error('Firebase retrieval error:', error);
      // Fall through to API attempt
    }
  }

  // Try API (Cloudflare Workers or Node.js)
  try {
    const response = await fetch(`${API_BASE_URL}/api/reviews?productId=${productId}`);
    if (response.ok) {
      const reviews = await response.json();
      console.log('Reviews loaded from Cloudflare Workers API');
      return reviews || [];
    }
  } catch (apiError) {
    console.log('API retrieval failed, loading from localStorage');
  }

  // Fallback to localStorage
  const REVIEWS_STORAGE_KEY = `kouprey_reviews_${productId}`;
  const stored = localStorage.getItem(REVIEWS_STORAGE_KEY);
  if (stored) {
    const reviews = JSON.parse(stored).sort((a, b) => 
      new Date(b.timestamp) - new Date(a.timestamp)
    );
    console.log('Reviews loaded from localStorage');
    return reviews;
  }

  return [];
}

// Set Firebase credentials via console or form
window.setFirebaseConfig = function(config) {
  if (config.apiKey) localStorage.setItem('firebase_apiKey', config.apiKey);
  if (config.authDomain) localStorage.setItem('firebase_authDomain', config.authDomain);
  if (config.projectId) localStorage.setItem('firebase_projectId', config.projectId);
  if (config.databaseURL) localStorage.setItem('firebase_databaseURL', config.databaseURL);
  if (config.storageBucket) localStorage.setItem('firebase_storageBucket', config.storageBucket);
  if (config.messagingSenderId) localStorage.setItem('firebase_messagingSenderId', config.messagingSenderId);
  if (config.appId) localStorage.setItem('firebase_appId', config.appId);
  alert('Firebase config saved. Please refresh the page.');
};

// Expose functions to global scope
window.submitReviewToCloud = submitReviewToCloud;
window.loadReviewsFromCloud = loadReviewsFromCloud;

console.log('Firebase Reviews module loaded. To configure Firebase, run in console: setFirebaseConfig({apiKey: "...", authDomain: "...", ...})');
